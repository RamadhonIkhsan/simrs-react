import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert,
    Card,
    Col,
    DatePicker,
    Empty,
    Progress,
    Row,
    Spin,
    Table,
    Tabs,
    Tag,
} from 'antd';
import {
    ArrowRightOutlined,
    BankOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    CreditCardOutlined,
    DollarOutlined,
    FileSearchOutlined,
    HeartOutlined,
    MedicineBoxOutlined,
    ReloadOutlined,
    SearchOutlined,
    SolutionOutlined,
    TeamOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { API } from '@/lib/API';
import { DropdownAPI } from '@/lib/DropdownAPI';
import { Helper } from '@/lib/Helper';
import userStore from '@/store/userStore';

const { RangePicker } = DatePicker;

const getCurrentMonthBounds = () => {
    const start = dayjs().startOf('month').format('YYYY-MM-DD');
    const end = dayjs().endOf('month').format('YYYY-MM-DD');
    return { start, end };
};

const renderVisitStatusBadge = (status) => {
    const map = {
        WAITING: { className: 'btn-light-warning', label: 'WAITING' },
        CALLED: { className: 'btn-light-info', label: 'CALLED' },
        EXAMINING: { className: 'btn-light-primary', label: 'EXAMINING' },
        DONE: { className: 'btn-light-success', label: 'DONE' },
        CANCELLED: { className: 'btn-light-danger', label: 'CANCELLED' },
    };
    const cfg = map[status] || { className: 'btn-light-primary', label: status || '-' };
    return (
        <span
            className={`btn ${cfg.className} my-1 btn-sm`}
            style={{ cursor: 'default', height: '26px', padding: '0 10px' }}
        >
            {cfg.label}
        </span>
    );
};

const renderPaymentStatusTag = (rawStatus) => {
    const normalized = String(rawStatus || '').toUpperCase();
    if (normalized === 'PAID' || normalized === 'LUNAS') {
        return <Tag color="green">LUNAS (PAID)</Tag>;
    }
    if (normalized === 'PARTIAL' || normalized === 'DIBAYAR_SEBAGIAN') {
        return <Tag color="gold">SEBAGIAN (PARTIAL)</Tag>;
    }
    return <Tag color="red">BELUM BAYAR (UNPAID)</Tag>;
};

export default function Dashboard() {
    const navigate = useNavigate();
    const { dataUser } = userStore();

    const initialBounds = useMemo(() => getCurrentMonthBounds(), []);
    const [startDate, setStartDate] = useState(initialBounds.start);
    const [endDate, setEndDate] = useState(initialBounds.end);
    const [selectedPoliId, setSelectedPoliId] = useState('');

    const [polisOptions, setPolisOptions] = useState([]);
    const [doctorsOptions, setDoctorsOptions] = useState([]);

    const [summaryData, setSummaryData] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [summaryError, setSummaryError] = useState(null);
    const [isAdminForbidden, setIsAdminForbidden] = useState(false);

    const [activeDrillTab, setActiveDrillTab] = useState('visits');
    const [drillSearch, setDrillSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [drillDoctorId, setDrillDoctorId] = useState('');
    const [drillPaymentStatus, setDrillPaymentStatus] = useState('');
    const [drillPage, setDrillPage] = useState(1);
    const [drillLimit, setDrillLimit] = useState(10);

    const [drillRows, setDrillRows] = useState([]);
    const [drillTotal, setDrillTotal] = useState(0);
    const [loadingDrill, setLoadingDrill] = useState(false);

    const searchTimerRef = useRef(null);

    const handleSearchInputChange = (e) => {
        const val = e.target.value;
        setDrillSearch(val);
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }
        searchTimerRef.current = setTimeout(() => {
            setDrillPage(1);
            setDebouncedSearch(val.trim());
        }, 350);
    };

    useEffect(() => {
        let active = true;
        const loadDropdowns = async () => {
            const [pList, dList] = await Promise.all([
                DropdownAPI.polis(),
                DropdownAPI.doctors(),
            ]);
            if (!active) return;
            setPolisOptions(pList);
            setDoctorsOptions(dList);
        };
        void loadDropdowns();
        return () => {
            active = false;
        };
    }, []);

    const fetchDashboardSummary = useCallback(async () => {
        setLoadingSummary(true);
        setSummaryError(null);
        setIsAdminForbidden(false);

        const params = new URLSearchParams();
        if (startDate) params.set('start_date', startDate);
        if (endDate) params.set('end_date', endDate);
        if (selectedPoliId) params.set('poli_id', selectedPoliId);

        const res = await API.GET(`/api/dashboard/summary?${params.toString()}`, null, 'node');
        setLoadingSummary(false);

        if (res?.status === 200 && res?.result?.rc === 200 && res.result.data) {
            setSummaryData(res.result.data);
        } else if (res?.status === 403 || res?.result?.rc === 403) {
            setIsAdminForbidden(true);
            setSummaryData(null);
        } else {
            setSummaryData(null);
            setSummaryError(
                res?.result?.rm ||
                    res?.result?.message ||
                    'Gagal memuat ringkasan metrik dari Node Service (/api/dashboard/summary).'
            );
        }
    }, [startDate, endDate, selectedPoliId]);

    const fetchDrilldownData = useCallback(async () => {
        if (isAdminForbidden) return;

        setLoadingDrill(true);
        const params = new URLSearchParams();
        if (startDate) params.set('start_date', startDate);
        if (endDate) params.set('end_date', endDate);
        if (selectedPoliId) params.set('poli_id', selectedPoliId);
        if (debouncedSearch) params.set('search', debouncedSearch);
        params.set('page', String(drillPage));
        params.set('limit', String(drillLimit));

        if (
            (activeDrillTab === 'visits' || activeDrillTab === 'actions') &&
            drillDoctorId
        ) {
            params.set('dokter_id', drillDoctorId);
        }

        if (activeDrillTab === 'payments' && drillPaymentStatus) {
            params.set('payment_status', drillPaymentStatus);
        }

        const endpointMap = {
            visits: '/api/dashboard/details/visits',
            actions: '/api/dashboard/details/actions',
            payments: '/api/dashboard/details/payments',
            medicines: '/api/dashboard/details/medicines',
        };

        const targetEndpoint = endpointMap[activeDrillTab] || endpointMap.visits;
        const res = await API.GET(`${targetEndpoint}?${params.toString()}`, null, 'node');
        setLoadingDrill(false);

        if (res?.status === 200 && res?.result?.rc === 200) {
            setDrillRows(Array.isArray(res.result.data) ? res.result.data : []);
            setDrillTotal(Number(res.result.meta?.total_data ?? 0));
        } else {
            setDrillRows([]);
            setDrillTotal(0);
        }
    }, [
        isAdminForbidden,
        startDate,
        endDate,
        selectedPoliId,
        debouncedSearch,
        drillPage,
        drillLimit,
        activeDrillTab,
        drillDoctorId,
        drillPaymentStatus,
    ]);

    useEffect(() => {
        let active = true;
        Promise.resolve().then(() => {
            if (!active) return;
            void fetchDashboardSummary();
        });
        return () => {
            active = false;
        };
    }, [fetchDashboardSummary]);

    useEffect(() => {
        let active = true;
        Promise.resolve().then(() => {
            if (!active) return;
            void fetchDrilldownData();
        });
        return () => {
            active = false;
        };
    }, [fetchDrilldownData]);

    const handleRefreshAll = () => {
        void fetchDashboardSummary();
        void fetchDrilldownData();
    };

    const handleQuickPeriod = (mode) => {
        if (mode === 'today') {
            const t = Helper.today();
            setStartDate(t);
            setEndDate(t);
        } else if (mode === '7days') {
            setStartDate(dayjs().subtract(6, 'day').format('YYYY-MM-DD'));
            setEndDate(Helper.today());
        } else if (mode === 'month') {
            const b = getCurrentMonthBounds();
            setStartDate(b.start);
            setEndDate(b.end);
        }
        setDrillPage(1);
    };

    const kunjungan = summaryData?.kunjungan || {
        total_visits: 0,
        completed: 0,
        waiting: 0,
        examining: 0,
        cancelled: 0,
    };

    const pendapatan = summaryData?.pendapatan || {
        total_billed: 0,
        total_paid: 0,
        total_unpaid: 0,
    };

    const tindakanMedis = summaryData?.tindakan_medis || {
        total_procedures_count: 0,
        total_procedures_qty: 0,
        total_procedures_amount: 0,
    };

    const kunjunganPerPoli = useMemo(
        () =>
            Array.isArray(summaryData?.kunjungan_per_poli)
                ? summaryData.kunjungan_per_poli
                : [],
        [summaryData]
    );

    const distribusiPembayaran = Array.isArray(summaryData?.distribusi_status_pembayaran)
        ? summaryData.distribusi_status_pembayaran
        : [];

    const penggunaanObat = Array.isArray(summaryData?.penggunaan_obat)
        ? summaryData.penggunaan_obat
        : [];

    const maxPoliVisits = useMemo(() => {
        const maxVal = Math.max(...kunjunganPerPoli.map((p) => Number(p.total_visits || 0)), 0);
        return maxVal > 0 ? maxVal : 1;
    }, [kunjunganPerPoli]);

    const paidCollectionRatio = useMemo(() => {
        const billed = Number(pendapatan.total_billed || 0);
        const paid = Number(pendapatan.total_paid || 0);
        if (billed <= 0) return 0;
        return Math.min(100, Math.round((paid / billed) * 100));
    }, [pendapatan.total_billed, pendapatan.total_paid]);

    const visitCompletionRatio = useMemo(() => {
        const total = Number(kunjungan.total_visits || 0);
        const done = Number(kunjungan.completed || 0);
        if (total <= 0) return 0;
        return Math.min(100, Math.round((done / total) * 100));
    }, [kunjungan.total_visits, kunjungan.completed]);

    const visitsColumns = [
        {
            title: 'No. Kunjungan & Tanggal',
            key: 'visit',
            width: '175px',
            render: (_, row) => (
                <div>
                    <div className="fw-7 text-primary">{row.visit_no || '-'}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                        {row.visit_date
                            ? dayjs(row.visit_date).format('DD MMM YYYY')
                            : '-'}{' '}
                        • Antrean #{row.queue_no}
                    </div>
                </div>
            ),
        },
        {
            title: 'Pasien',
            key: 'patient',
            render: (_, row) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{row.patient_name || '-'}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                        No. RM: <strong>{row.medical_record_no || '-'}</strong>
                        {row.gender ? ` (${row.gender})` : ''}
                        {row.patient_phone ? ` • ${row.patient_phone}` : ''}
                    </div>
                </div>
            ),
        },
        {
            title: 'Poliklinik',
            dataIndex: 'poli_name',
            width: '165px',
            render: (val, row) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{val || '-'}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                        Daftar: Rp {Helper.numFormat(row.registration_fee || 0)}
                    </div>
                </div>
            ),
        },
        {
            title: 'Dokter Pemeriksa',
            key: 'doctor',
            render: (_, row) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{row.doctor_name || '-'}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                        {row.doctor_specialty || ''}
                    </div>
                </div>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            width: '125px',
            align: 'center',
            render: (st) => renderVisitStatusBadge(st),
        },
    ];

    const actionsColumns = [
        {
            title: 'Waktu & Kunjungan',
            key: 'visit',
            width: '175px',
            render: (_, row) => (
                <div>
                    <div className="fw-7 text-primary">{row.visit_no || '-'}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                        {row.visit_date
                            ? dayjs(row.visit_date).format('DD MMM YYYY')
                            : '-'}
                    </div>
                </div>
            ),
        },
        {
            title: 'Tindakan Medis',
            key: 'procedure',
            render: (_, row) => (
                <div>
                    <div className="fw-7">
                        {row.procedure_code ? `[${row.procedure_code}] ` : ''}
                        {row.procedure_name || '-'}
                    </div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                        Poli: {row.poli_name || '-'}
                    </div>
                </div>
            ),
        },
        {
            title: 'Pasien',
            key: 'patient',
            render: (_, row) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{row.patient_name || '-'}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                        No. RM: {row.medical_record_no || '-'}
                    </div>
                </div>
            ),
        },
        {
            title: 'Dokter Pelaksana',
            dataIndex: 'doctor_name',
            render: (val, row) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{val || '-'}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                        {row.doctor_specialty || ''}
                    </div>
                </div>
            ),
        },
        {
            title: 'Qty',
            dataIndex: 'qty',
            width: '65px',
            align: 'center',
        },
        {
            title: 'Tarif Satuan',
            dataIndex: 'unit_tariff',
            width: '130px',
            align: 'right',
            render: (val) => `Rp ${Helper.numFormat(val || 0)}`,
        },
        {
            title: 'Subtotal',
            dataIndex: 'subtotal',
            width: '140px',
            align: 'right',
            render: (val) => <span className="fw-7">Rp {Helper.numFormat(val || 0)}</span>,
        },
    ];

    const paymentsColumns = [
        {
            title: 'No. Tagihan (Invoice)',
            key: 'bill',
            width: '185px',
            render: (_, row) => (
                <div>
                    <div className="fw-7 text-primary">{row.bill_no || '-'}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                        Kunjungan: {row.visit_no || '-'} (
                        {row.visit_date
                            ? dayjs(row.visit_date).format('DD MMM YYYY')
                            : '-'}
                        )
                    </div>
                </div>
            ),
        },
        {
            title: 'Pasien & Poliklinik',
            key: 'patient',
            render: (_, row) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{row.patient_name || '-'}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                        No. RM: <strong>{row.medical_record_no || '-'}</strong> •{' '}
                        {row.poli_name || '-'}
                    </div>
                </div>
            ),
        },
        {
            title: 'Status Tagihan',
            dataIndex: 'bill_status',
            width: '120px',
            align: 'center',
            render: (st) => (
                <Tag color={st === 'ISSUED' ? 'blue' : 'gold'} style={{ fontWeight: 600 }}>
                    {st || '-'}
                </Tag>
            ),
        },
        {
            title: 'Status Bayar',
            key: 'pay_status',
            width: '165px',
            align: 'center',
            render: (_, row) =>
                renderPaymentStatusTag(row.raw_payment_status || row.payment_status),
        },
        {
            title: 'Total Tagihan',
            dataIndex: 'total_amount',
            width: '140px',
            align: 'right',
            render: (val) => <span className="fw-7">Rp {Helper.numFormat(val || 0)}</span>,
        },
        {
            title: 'Terbayar',
            dataIndex: 'paid_amount',
            width: '140px',
            align: 'right',
            render: (val) => (
                <span className="text-success fw-7">Rp {Helper.numFormat(val || 0)}</span>
            ),
        },
        {
            title: 'Sisa Piutang',
            dataIndex: 'unpaid_amount',
            width: '140px',
            align: 'right',
            render: (val) => (
                <span className={Number(val) > 0 ? 'text-danger fw-7' : 'text-muted'}>
                    Rp {Helper.numFormat(val || 0)}
                </span>
            ),
        },
    ];

    const medicinesColumns = [
        {
            title: 'Kode & Nama Obat',
            key: 'drug',
            render: (_, row) => (
                <div>
                    <div className="fw-7">
                        {row.drug_code ? `[${row.drug_code}] ` : ''}
                        {row.drug_name || '-'}
                    </div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                        Satuan: {row.unit || '-'}
                    </div>
                </div>
            ),
        },
        {
            title: 'Jumlah Kunjungan',
            dataIndex: 'total_visits_count',
            width: '145px',
            align: 'center',
            render: (val) => `${val || 0} kunjungan`,
        },
        {
            title: 'Total Keluar (Qty)',
            dataIndex: 'total_dispensed',
            width: '150px',
            align: 'center',
            render: (val, row) => (
                <span className="fw-7 text-primary">
                    {Helper.numFormat(val || 0)} {row.unit || ''}
                </span>
            ),
        },
        {
            title: 'Stok Saat Ini',
            dataIndex: 'current_stock',
            width: '130px',
            align: 'center',
            render: (val) => Helper.numFormat(val || 0),
        },
        {
            title: 'Estimasi Nilai Nominal',
            dataIndex: 'estimated_value',
            width: '175px',
            align: 'right',
            render: (val) => <span className="fw-7">Rp {Helper.numFormat(val || 0)}</span>,
        },
    ];

    if (isAdminForbidden) {
        return (
            <div className="containers">
                <div className="headContent" style={{ minHeight: '40px' }}>
                    <div className="containerTitle">
                        <div className="breadCrumb">
                            <div className="text">SIMRS</div>
                            <div className="text">Beranda Operasional</div>
                        </div>
                        <div className="title text-dark-grey left">
                            Selamat Datang, {dataUser?.full_name || dataUser?.username || 'Petugas'}
                        </div>
                    </div>
                </div>

                <Card
                    style={{
                        borderRadius: '18px',
                        background: 'var(--bg-gradient-primary)',
                        color: '#ffffff',
                        marginBottom: '20px',
                        border: 'none',
                    }}
                >
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} md={16}>
                            <div style={{ fontSize: '13px', opacity: 0.85, marginBottom: '4px' }}>
                                Sistem Informasi Manajemen Rumah Sakit • {Helper.today()}
                            </div>
                            <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>
                                Panel Akses Cepat Operasional Layanan
                            </div>
                            <div style={{ fontSize: '13px', opacity: 0.9 }}>
                                Gunakan pintasan modul di bawah ini untuk menjalankan operasional
                                pendaftaran, pemeriksaan medis (EMR), atau transaksi kasir sesuai hak
                                akses peran Anda.
                            </div>
                        </Col>
                    </Row>
                </Card>

                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                        <Card
                            hoverable
                            style={{ borderRadius: '16px', height: '100%' }}
                            onClick={() => navigate('/main/registration/visits')}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <div>
                                    <div className="text-muted" style={{ fontSize: '12px' }}>
                                        Tahap 1 • Pendaftaran
                                    </div>
                                    <div className="fw-7 text-primary" style={{ fontSize: '17px' }}>
                                        Kunjungan &amp; Antrean
                                    </div>
                                </div>
                                <CalendarOutlined
                                    className="text-primary"
                                    style={{ fontSize: '26px' }}
                                />
                            </div>
                            <div
                                className="text-muted"
                                style={{ fontSize: '12px', marginTop: '10px' }}
                            >
                                Registrasi pasien baru/lama, cek kuota jadwal dokter, dan kelola
                                panggilan antrean poliklinik.
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} sm={8}>
                        <Card
                            hoverable
                            style={{ borderRadius: '16px', height: '100%' }}
                            onClick={() => navigate('/main/doctor/examinations')}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <div>
                                    <div className="text-muted" style={{ fontSize: '12px' }}>
                                        Tahap 2 • Klinik &amp; Dokter
                                    </div>
                                    <div className="fw-7 text-primary" style={{ fontSize: '17px' }}>
                                        Pemeriksaan Medis (EMR)
                                    </div>
                                </div>
                                <FileSearchOutlined
                                    className="text-primary"
                                    style={{ fontSize: '26px' }}
                                />
                            </div>
                            <div
                                className="text-muted"
                                style={{ fontSize: '12px', marginTop: '10px' }}
                            >
                                Antrean pasien dokter, input tanda vital, catatan SOAP, diagnosa
                                ICD-10, dan tindakan medis.
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} sm={8}>
                        <Card
                            hoverable
                            style={{ borderRadius: '16px', height: '100%' }}
                            onClick={() => navigate('/main/cashier/billings')}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <div>
                                    <div className="text-muted" style={{ fontSize: '12px' }}>
                                        Tahap 3 • Billing &amp; Kasir
                                    </div>
                                    <div className="fw-7 text-primary" style={{ fontSize: '17px' }}>
                                        Kasir &amp; Pembayaran
                                    </div>
                                </div>
                                <CreditCardOutlined
                                    className="text-primary"
                                    style={{ fontSize: '26px' }}
                                />
                            </div>
                            <div
                                className="text-muted"
                                style={{ fontSize: '12px', marginTop: '10px' }}
                            >
                                Sinkronisasi draft tagihan kunjungan, penerbitan invoice, pencatatan
                                pembayaran tunai, dan cetak struk.
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }

    return (
        <div className="containers">
            <div className="headContent" style={{ minHeight: '40px' }}>
                <div className="containerTitle">
                    <div className="breadCrumb">
                        <div className="text">SIMRS</div>
                        <div className="text">Dashboard Eksekutif &amp; Operasional</div>
                    </div>
                    <div className="title text-dark-grey left">
                        Ringkasan Operasional, Kunjungan &amp; Pendapatan Rumah Sakit
                    </div>
                </div>

                <div className="filter mb-3">
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                            type="button"
                            className={`btn btn-sm ${
                                startDate === Helper.today() && endDate === Helper.today()
                                    ? 'btn-primary'
                                    : 'btn-light-primary'
                            }`}
                            onClick={() => handleQuickPeriod('today')}
                        >
                            Hari Ini
                        </button>
                        <button
                            type="button"
                            className="btn btn-light-primary btn-sm"
                            onClick={() => handleQuickPeriod('7days')}
                        >
                            7 Hari
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm ${
                                startDate === initialBounds.start && endDate === initialBounds.end
                                    ? 'btn-primary'
                                    : 'btn-light-primary'
                            }`}
                            onClick={() => handleQuickPeriod('month')}
                        >
                            Bulan Ini
                        </button>
                    </div>

                    <RangePicker
                        allowClear={false}
                        format="DD MMM YYYY"
                        style={{ height: '38px', borderRadius: '15px' }}
                        value={[
                            startDate ? dayjs(startDate, 'YYYY-MM-DD') : dayjs().startOf('month'),
                            endDate ? dayjs(endDate, 'YYYY-MM-DD') : dayjs().endOf('month'),
                        ]}
                        onChange={(dates) => {
                            if (dates && dates[0] && dates[1]) {
                                setStartDate(dates[0].format('YYYY-MM-DD'));
                                setEndDate(dates[1].format('YYYY-MM-DD'));
                                setDrillPage(1);
                            }
                        }}
                    />

                    <select
                        aria-label="Filter Poliklinik Dashboard"
                        className="form-control"
                        style={{ width: '185px', height: '38px', padding: '0 14px' }}
                        value={selectedPoliId}
                        onChange={(e) => {
                            setSelectedPoliId(e.target.value);
                            setDrillPage(1);
                        }}
                    >
                        <option value="">Semua Poliklinik</option>
                        {polisOptions.map((p) => (
                            <option key={p.value} value={p.value}>
                                {p.label}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        className="btn btn-circle btn-light-primary"
                        onClick={handleRefreshAll}
                        aria-label="Muat ulang data dashboard"
                        title="Muat ulang data dashboard"
                    >
                        <ReloadOutlined />
                    </button>
                </div>
            </div>

            {summaryError && (
                <Alert
                    type="error"
                    showIcon
                    style={{ marginBottom: '16px', borderRadius: '14px' }}
                    message="Gagal Memuat Ringkasan Dashboard"
                    description={summaryError}
                />
            )}

            <Spin spinning={loadingSummary}>
                <Row gutter={[14, 14]} style={{ marginBottom: '18px' }}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card
                            size="small"
                            style={{
                                borderRadius: '16px',
                                background: 'var(--bg-gradient-primary)',
                                color: '#ffffff',
                                border: 'none',
                                height: '100%',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: '12px', opacity: 0.85 }}>
                                        Total Kunjungan Pasien
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '28px',
                                            fontWeight: 700,
                                            lineHeight: 1.2,
                                            marginTop: '4px',
                                        }}
                                    >
                                        {Helper.numFormat(kunjungan.total_visits)}
                                    </div>
                                </div>
                                <span
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        background: 'rgba(255,255,255,0.16)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px',
                                    }}
                                >
                                    <TeamOutlined />
                                </span>
                            </div>

                            <div
                                style={{
                                    marginTop: '14px',
                                    paddingTop: '10px',
                                    borderTop: '1px solid rgba(255,255,255,0.18)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '12px',
                                    flexWrap: 'wrap',
                                    gap: '6px',
                                }}
                            >
                                <span>
                                    Selesai: <strong>{kunjungan.completed}</strong> (
                                    {visitCompletionRatio}%)
                                </span>
                                <span>
                                    Diperiksa: <strong>{kunjungan.examining}</strong>
                                </span>
                                <span>
                                    Tunggu: <strong>{kunjungan.waiting}</strong>
                                </span>
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                        <Card
                            size="small"
                            style={{
                                borderRadius: '16px',
                                border: '1px solid var(--primary-light)',
                                height: '100%',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                }}
                            >
                                <div>
                                    <div className="text-muted" style={{ fontSize: '12px' }}>
                                        Pendapatan Terbayar (Realisasi)
                                    </div>
                                    <div
                                        className="fw-7 text-success"
                                        style={{
                                            fontSize: '23px',
                                            lineHeight: 1.25,
                                            marginTop: '4px',
                                        }}
                                    >
                                        Rp {Helper.numFormat(pendapatan.total_paid)}
                                    </div>
                                </div>
                                <span
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        background: 'var(--success-light)',
                                        color: 'var(--success)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px',
                                    }}
                                >
                                    <DollarOutlined />
                                </span>
                            </div>

                            <div
                                style={{
                                    marginTop: '14px',
                                    paddingTop: '10px',
                                    borderTop: '1px dashed var(--primary-light)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '12px',
                                }}
                            >
                                <span className="text-muted">Total Ditagihkan:</span>
                                <span className="fw-7 text-primary">
                                    Rp {Helper.numFormat(pendapatan.total_billed)}
                                </span>
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                        <Card
                            size="small"
                            style={{
                                borderRadius: '16px',
                                border: '1px solid var(--primary-light)',
                                height: '100%',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                }}
                            >
                                <div>
                                    <div className="text-muted" style={{ fontSize: '12px' }}>
                                        Piutang / Belum Terbayar
                                    </div>
                                    <div
                                        className={`fw-7 ${
                                            Number(pendapatan.total_unpaid) > 0
                                                ? 'text-danger'
                                                : 'text-primary'
                                        }`}
                                        style={{
                                            fontSize: '23px',
                                            lineHeight: 1.25,
                                            marginTop: '4px',
                                        }}
                                    >
                                        Rp {Helper.numFormat(pendapatan.total_unpaid)}
                                    </div>
                                </div>
                                <span
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        background: 'var(--danger-light)',
                                        color: 'var(--danger)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px',
                                    }}
                                >
                                    <CreditCardOutlined />
                                </span>
                            </div>

                            <div
                                style={{
                                    marginTop: '14px',
                                    paddingTop: '10px',
                                    borderTop: '1px dashed var(--primary-light)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '12px',
                                }}
                            >
                                <span className="text-muted">Rasio Pelunasan:</span>
                                <span className="fw-7 text-primary">{paidCollectionRatio}% Lunas</span>
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                        <Card
                            size="small"
                            style={{
                                borderRadius: '16px',
                                border: '1px solid var(--primary-light)',
                                height: '100%',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                }}
                            >
                                <div>
                                    <div className="text-muted" style={{ fontSize: '12px' }}>
                                        Tindakan Medis Dilakukan
                                    </div>
                                    <div
                                        className="fw-7 text-primary"
                                        style={{
                                            fontSize: '24px',
                                            lineHeight: 1.25,
                                            marginTop: '4px',
                                        }}
                                    >
                                        {Helper.numFormat(tindakanMedis.total_procedures_qty)}{' '}
                                        <span
                                            className="text-muted"
                                            style={{ fontSize: '13px', fontWeight: 500 }}
                                        >
                                            tindakan
                                        </span>
                                    </div>
                                </div>
                                <span
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        background: 'var(--primary-light)',
                                        color: 'var(--primary-dark)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px',
                                    }}
                                >
                                    <HeartOutlined />
                                </span>
                            </div>

                            <div
                                style={{
                                    marginTop: '14px',
                                    paddingTop: '10px',
                                    borderTop: '1px dashed var(--primary-light)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '12px',
                                }}
                            >
                                <span className="text-muted">Nilai Tindakan:</span>
                                <span className="fw-7 text-primary">
                                    Rp {Helper.numFormat(tindakanMedis.total_procedures_amount)}
                                </span>
                            </div>
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]} style={{ marginBottom: '18px' }}>
                    <Col xs={24} lg={10}>
                        <Card
                            size="small"
                            title={
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <span>
                                        <BankOutlined className="text-primary me-2" />
                                        Distribusi Kunjungan per Poliklinik
                                    </span>
                                    <span className="text-muted" style={{ fontSize: '12px' }}>
                                        {kunjunganPerPoli.length} Poli
                                    </span>
                                </div>
                            }
                            style={{ borderRadius: '16px', height: '100%' }}
                        >
                            {kunjunganPerPoli.length === 0 ? (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="Belum ada data kunjungan poliklinik pada periode ini."
                                />
                            ) : (
                                <div
                                    style={{
                                        maxHeight: '260px',
                                        overflowY: 'auto',
                                        paddingRight: '4px',
                                    }}
                                >
                                    {kunjunganPerPoli.map((item) => {
                                        const count = Number(item.total_visits || 0);
                                        const pct = Math.round((count / maxPoliVisits) * 100);
                                        const isSelected =
                                            String(selectedPoliId) === String(item.poli_id);

                                        return (
                                            <div
                                                key={item.poli_id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => {
                                                    setSelectedPoliId(
                                                        isSelected ? '' : String(item.poli_id)
                                                    );
                                                    setDrillPage(1);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        setSelectedPoliId(
                                                            isSelected ? '' : String(item.poli_id)
                                                        );
                                                        setDrillPage(1);
                                                    }
                                                }}
                                                style={{
                                                    padding: '8px 10px',
                                                    borderRadius: '10px',
                                                    marginBottom: '6px',
                                                    cursor: 'pointer',
                                                    background: isSelected
                                                        ? 'var(--primary-light)'
                                                        : 'transparent',
                                                }}
                                                title="Klik untuk memfilter dashboard berdasarkan poliklinik ini"
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        fontSize: '13px',
                                                        marginBottom: '2px',
                                                    }}
                                                >
                                                    <span style={{ fontWeight: 600 }}>
                                                        {item.poli_name}
                                                    </span>
                                                    <span className="fw-7 text-primary">
                                                        {Helper.numFormat(count)} kunjungan
                                                    </span>
                                                </div>
                                                <Progress
                                                    percent={pct}
                                                    showInfo={false}
                                                    size="small"
                                                    strokeColor="#084368"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    </Col>

                    <Col xs={24} lg={7}>
                        <Card
                            size="small"
                            title={
                                <span>
                                    <CalendarOutlined className="text-primary me-2" />
                                    Rincian Status Kunjungan
                                </span>
                            }
                            style={{ borderRadius: '16px', height: '100%' }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px',
                                    padding: '4px 0',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px 12px',
                                        borderRadius: '12px',
                                        background: 'var(--success-light)',
                                    }}
                                >
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>
                                        <CheckCircleOutlined className="text-success me-2" />
                                        Selesai Diperiksa (DONE)
                                    </span>
                                    <span className="fw-7 text-success" style={{ fontSize: '16px' }}>
                                        {Helper.numFormat(kunjungan.completed)}
                                    </span>
                                </div>

                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px 12px',
                                        borderRadius: '12px',
                                        background: 'var(--primary-light)',
                                    }}
                                >
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>
                                        <SolutionOutlined className="text-primary me-2" />
                                        Sedang Diperiksa (EXAMINING)
                                    </span>
                                    <span className="fw-7 text-primary" style={{ fontSize: '16px' }}>
                                        {Helper.numFormat(kunjungan.examining)}
                                    </span>
                                </div>

                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px 12px',
                                        borderRadius: '12px',
                                        background: 'var(--warning-light)',
                                    }}
                                >
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>
                                        <ClockCircleOutlined className="text-warning me-2" />
                                        Menunggu Antrean (WAITING)
                                    </span>
                                    <span className="fw-7 text-warning" style={{ fontSize: '16px' }}>
                                        {Helper.numFormat(kunjungan.waiting)}
                                    </span>
                                </div>

                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px 12px',
                                        borderRadius: '12px',
                                        background: 'var(--danger-light)',
                                    }}
                                >
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>
                                        <CloseCircleOutlined className="text-danger me-2" />
                                        Dibatalkan (CANCELLED)
                                    </span>
                                    <span className="fw-7 text-danger" style={{ fontSize: '16px' }}>
                                        {Helper.numFormat(kunjungan.cancelled)}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} lg={7}>
                        <Card
                            size="small"
                            title={
                                <span>
                                    <CreditCardOutlined className="text-primary me-2" />
                                    Distribusi Status Pembayaran
                                </span>
                            }
                            style={{ borderRadius: '16px', height: '100%' }}
                        >
                            {distribusiPembayaran.length === 0 ? (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="Belum ada tagihan pada periode ini."
                                />
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {distribusiPembayaran.map((dist) => {
                                        const raw = String(
                                            dist.raw_status || dist.status || ''
                                        ).toUpperCase();
                                        const isPaid = raw === 'PAID' || raw === 'LUNAS';
                                        const isPartial =
                                            raw === 'PARTIAL' || raw === 'DIBAYAR_SEBAGIAN';

                                        const label = isPaid
                                            ? 'Lunas (PAID)'
                                            : isPartial
                                              ? 'Dibayar Sebagian (PARTIAL)'
                                              : 'Belum Dibayar (UNPAID)';
                                        const bg = isPaid
                                            ? 'var(--success-light)'
                                            : isPartial
                                              ? 'var(--warning-light)'
                                              : 'var(--danger-light)';
                                        const textClass = isPaid
                                            ? 'text-success'
                                            : isPartial
                                              ? 'text-warning'
                                              : 'text-danger';

                                        return (
                                            <div
                                                key={dist.status}
                                                style={{
                                                    padding: '10px 12px',
                                                    borderRadius: '12px',
                                                    background: bg,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        marginBottom: '4px',
                                                    }}
                                                >
                                                    <span className={`fw-7 ${textClass}`}>
                                                        {label}
                                                    </span>
                                                    <Tag color={isPaid ? 'green' : isPartial ? 'gold' : 'red'}>
                                                        {dist.count} Tagihan
                                                    </Tag>
                                                </div>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        fontSize: '12px',
                                                    }}
                                                >
                                                    <span className="text-muted">
                                                        Nilai: Rp {Helper.numFormat(dist.total_amount)}
                                                    </span>
                                                    <span className="fw-7">
                                                        Terbayar: Rp{' '}
                                                        {Helper.numFormat(dist.paid_amount)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div
                                style={{
                                    marginTop: '14px',
                                    paddingTop: '10px',
                                    borderTop: '1px dashed var(--primary-light)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    gap: '6px',
                                    flexWrap: 'wrap',
                                }}
                            >
                                <button
                                    type="button"
                                    className="btn btn-light-primary btn-sm"
                                    onClick={() => navigate('/main/registration/visits')}
                                >
                                    Loket Antrean <ArrowRightOutlined />
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-light-primary btn-sm"
                                    onClick={() => navigate('/main/cashier/billings')}
                                >
                                    Loket Kasir <ArrowRightOutlined />
                                </button>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Spin>

            <Card
                size="small"
                style={{ borderRadius: '16px' }}
                title={
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '10px',
                            padding: '4px 0',
                        }}
                    >
                        <span>
                            Laporan Rincian Operasional (Drill-Down Data:{' '}
                            <strong>{startDate}</strong> s/d <strong>{endDate}</strong>)
                        </span>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {(activeDrillTab === 'visits' || activeDrillTab === 'actions') && (
                                <select
                                    aria-label="Filter Dokter Drilldown"
                                    className="form-control"
                                    style={{ width: '180px', height: '34px', padding: '0 12px' }}
                                    value={drillDoctorId}
                                    onChange={(e) => {
                                        setDrillDoctorId(e.target.value);
                                        setDrillPage(1);
                                    }}
                                >
                                    <option value="">Semua Dokter</option>
                                    {doctorsOptions.map((d) => (
                                        <option key={d.value} value={d.value}>
                                            {d.label}
                                        </option>
                                    ))}
                                </select>
                            )}

                            {activeDrillTab === 'payments' && (
                                <select
                                    aria-label="Filter Status Pembayaran Drilldown"
                                    className="form-control"
                                    style={{ width: '175px', height: '34px', padding: '0 12px' }}
                                    value={drillPaymentStatus}
                                    onChange={(e) => {
                                        setDrillPaymentStatus(e.target.value);
                                        setDrillPage(1);
                                    }}
                                >
                                    <option value="">Semua Status Bayar</option>
                                    <option value="lunas">Lunas (PAID)</option>
                                    <option value="dibayar_sebagian">
                                        Dibayar Sebagian (PARTIAL)
                                    </option>
                                    <option value="belum_dibayar">Belum Dibayar (UNPAID)</option>
                                </select>
                            )}

                            <div style={{ position: 'relative' }}>
                                <SearchOutlined
                                    className="icon-search text-muted"
                                    style={{ top: '9px' }}
                                />
                                <input
                                    type="text"
                                    className="form-control"
                                    style={{
                                        paddingLeft: '34px',
                                        height: '34px',
                                        width: '220px',
                                        borderRadius: '14px',
                                    }}
                                    placeholder="Cari di rincian tabel..."
                                    value={drillSearch}
                                    onChange={handleSearchInputChange}
                                />
                            </div>
                        </div>
                    </div>
                }
            >
                <Tabs
                    activeKey={activeDrillTab}
                    onChange={(key) => {
                        setActiveDrillTab(key);
                        setDrillPage(1);
                    }}
                    items={[
                        {
                            key: 'visits',
                            label: (
                                <span>
                                    <TeamOutlined /> Rincian Kunjungan Pasien
                                </span>
                            ),
                            children: (
                                <Table
                                    size="small"
                                    loading={loadingDrill}
                                    rowKey="id"
                                    columns={visitsColumns}
                                    dataSource={drillRows}
                                    pagination={{
                                        current: drillPage,
                                        pageSize: drillLimit,
                                        total: drillTotal,
                                        showSizeChanger: true,
                                        showTotal: (tot) => `Total ${tot} kunjungan`,
                                        onChange: (p, l) => {
                                            setDrillPage(p);
                                            setDrillLimit(l);
                                        },
                                    }}
                                    locale={{
                                        emptyText: (
                                            <Empty
                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                description="Tidak ada data kunjungan pada filter periode ini."
                                            />
                                        ),
                                    }}
                                />
                            ),
                        },
                        {
                            key: 'actions',
                            label: (
                                <span>
                                    <HeartOutlined /> Rincian Tindakan Medis
                                </span>
                            ),
                            children: (
                                <Table
                                    size="small"
                                    loading={loadingDrill}
                                    rowKey="id"
                                    columns={actionsColumns}
                                    dataSource={drillRows}
                                    pagination={{
                                        current: drillPage,
                                        pageSize: drillLimit,
                                        total: drillTotal,
                                        showSizeChanger: true,
                                        showTotal: (tot) => `Total ${tot} tindakan medis`,
                                        onChange: (p, l) => {
                                            setDrillPage(p);
                                            setDrillLimit(l);
                                        },
                                    }}
                                    locale={{
                                        emptyText: (
                                            <Empty
                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                description="Tidak ada data tindakan medis pada filter periode ini."
                                            />
                                        ),
                                    }}
                                />
                            ),
                        },
                        {
                            key: 'payments',
                            label: (
                                <span>
                                    <CreditCardOutlined /> Rincian Tagihan &amp; Pembayaran
                                </span>
                            ),
                            children: (
                                <Table
                                    size="small"
                                    loading={loadingDrill}
                                    rowKey="id"
                                    columns={paymentsColumns}
                                    dataSource={drillRows}
                                    pagination={{
                                        current: drillPage,
                                        pageSize: drillLimit,
                                        total: drillTotal,
                                        showSizeChanger: true,
                                        showTotal: (tot) => `Total ${tot} tagihan`,
                                        onChange: (p, l) => {
                                            setDrillPage(p);
                                            setDrillLimit(l);
                                        },
                                    }}
                                    locale={{
                                        emptyText: (
                                            <Empty
                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                description="Tidak ada data tagihan pada filter periode ini."
                                            />
                                        ),
                                    }}
                                />
                            ),
                        },
                        ...(penggunaanObat.length > 0
                            ? [
                                  {
                                      key: 'medicines',
                                      label: (
                                          <span>
                                              <MedicineBoxOutlined /> Rekap Penggunaan Obat
                                          </span>
                                      ),
                                      children: (
                                          <Table
                                              size="small"
                                              loading={loadingDrill}
                                              rowKey="drug_id"
                                              columns={medicinesColumns}
                                              dataSource={drillRows}
                                              pagination={{
                                                  current: drillPage,
                                                  pageSize: drillLimit,
                                                  total: drillTotal,
                                                  showSizeChanger: true,
                                                  showTotal: (tot) => `Total ${tot} item obat`,
                                                  onChange: (p, l) => {
                                                      setDrillPage(p);
                                                      setDrillLimit(l);
                                                  },
                                              }}
                                          />
                                      ),
                                  },
                              ]
                            : []),
                    ]}
                />
            </Card>
        </div>
    );
}
