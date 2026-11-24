import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    CalendarOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ContainerOutlined,
    ExclamationCircleOutlined,
    NotificationOutlined,
    PlusCircleOutlined,
    ReloadOutlined,
    RollbackOutlined,
    SearchOutlined,
    SettingOutlined,
    TeamOutlined,
    UserAddOutlined,
} from '@ant-design/icons';
import {
    Alert,
    Card,
    Col,
    DatePicker,
    Descriptions,
    Dropdown,
    Empty,
    Modal,
    Radio,
    Row,
    Select,
    Spin,
    Tag,
} from 'antd';
import dayjs from 'dayjs';
import DTAntServerSide from '@/components/util/DTAntServerSide';
import Input from '@/components/util/Input';
import SearchInput from '@/components/util/SearchInput';
import { API } from '@/lib/API';
import { DropdownAPI } from '@/lib/DropdownAPI';
import { Helper } from '@/lib/Helper';
import notifStore from '@/store/notifStore';

const genderOptions = [
    { value: 'L', label: 'Laki-laki (L)' },
    { value: 'P', label: 'Perempuan (P)' },
];

const bloodTypeOptions = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' },
];

const statusFilterOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'WAITING', label: 'WAITING (Menunggu)' },
    { value: 'CALLED', label: 'CALLED (Dipanggil)' },
    { value: 'EXAMINING', label: 'EXAMINING (Diperiksa)' },
    { value: 'DONE', label: 'DONE (Selesai)' },
    { value: 'CANCELLED', label: 'CANCELLED (Batal)' },
];

const renderStatusBadge = (status) => {
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
            style={{ cursor: 'default', height: '28px', padding: '0 12px' }}
        >
            {cfg.label}
        </span>
    );
};

export default function VisitsRegistrationPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { notifOpen } = notifStore();

    const [polisList, setPolisList] = useState([]);
    const [filterDate, setFilterDate] = useState(Helper.today());
    const [filterPoliId, setFilterPoliId] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [searchText, setSearchText] = useState('');
    const [triggerTable, setTriggerTable] = useState(0);

    const [queueOverview, setQueueOverview] = useState(null);
    const [loadingQueueOverview, setLoadingQueueOverview] = useState(false);

    const [regModalOpen, setRegModalOpen] = useState(false);
    const [regSubmitting, setRegSubmitting] = useState(false);
    const [patientMode, setPatientMode] = useState('existing');

    const [patientSearchLoading, setPatientSearchLoading] = useState(false);
    const [patientOptions, setPatientOptions] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);

    const [regVisitDate, setRegVisitDate] = useState(Helper.today());
    const [regPoliId, setRegPoliId] = useState(undefined);
    const [availableSchedules, setAvailableSchedules] = useState([]);
    const [loadingSchedules, setLoadingSchedules] = useState(false);
    const [selectedDoctorId, setSelectedDoctorId] = useState(undefined);

    const [dupChecking, setDupChecking] = useState(false);
    const [dupChecked, setDupChecked] = useState(false);
    const [dupResults, setDupResults] = useState([]);

    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailVisit, setDetailVisit] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelTargetVisit, setCancelTargetVisit] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelSubmitting, setCancelSubmitting] = useState(false);

    const [statusUpdatingId, setStatusUpdatingId] = useState(null);

    const {
        register,
        handleSubmit,
        reset: resetNewPatientForm,
        setValue: setNewPatientValue,
        getValues: getNewPatientValues,
        control: newPatientControl,
        formState: { errors: newPatientErrors },
    } = useForm();

    const watchedGender = useWatch({ control: newPatientControl, name: 'gender' });
    const watchedBirthDate = useWatch({ control: newPatientControl, name: 'birth_date' });
    const watchedBloodType = useWatch({ control: newPatientControl, name: 'blood_type' });

    const searchTimeoutRef = useRef(null);
    const patientSearchTimerRef = useRef(null);

    const handleSearch = (event) => {
        const val = event.target.value;
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            setSearchText(val);
        }, 400);
    };

    const loadQueueOverview = useCallback(async (dateVal, poliVal) => {
        if (!dateVal || dateVal === 'all') {
            setQueueOverview(null);
            return;
        }
        setLoadingQueueOverview(true);
        const poliQuery = poliVal ? `&poli_id=${encodeURIComponent(poliVal)}` : '';
        const response = await API.GET(
            `/api/queues?date=${encodeURIComponent(dateVal)}${poliQuery}`
        );
        setLoadingQueueOverview(false);

        if (response?.status === 200 && response?.result?.rc === 200) {
            setQueueOverview(response.result.data || null);
        }
    }, []);

    const refreshAll = useCallback(() => {
        setTriggerTable((prev) => prev + 1);
        void loadQueueOverview(filterDate, filterPoliId);
    }, [filterDate, filterPoliId, loadQueueOverview]);

    useEffect(() => {
        let active = true;
        const initPolis = async () => {
            const list = await DropdownAPI.polis();
            if (!active) return;
            setPolisList(list);
        };
        void initPolis();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;
        Promise.resolve().then(() => {
            if (!active) return;
            void loadQueueOverview(filterDate, filterPoliId);
        });
        return () => {
            active = false;
        };
    }, [filterDate, filterPoliId, loadQueueOverview]);

    const searchPatientsApi = useCallback(async (keyword = '') => {
        setPatientSearchLoading(true);
        const q = String(keyword || '').trim();
        const url = q
            ? `/api/patients?search=${encodeURIComponent(q)}&size=15`
            : '/api/patients?size=15';
        const response = await API.GET(url);
        setPatientSearchLoading(false);

        if (response?.status === 200 && Array.isArray(response?.result?.data)) {
            const mapped = response.result.data.map((p) => ({
                value: p.id,
                label: `${p.medical_record_no} - ${p.full_name}${p.nik ? ` (NIK: ${p.nik})` : ''}`,
                patient: p,
            }));
            setPatientOptions(mapped);
        }
    }, []);

    const handlePatientSelectSearch = (val) => {
        if (patientSearchTimerRef.current) {
            clearTimeout(patientSearchTimerRef.current);
        }
        patientSearchTimerRef.current = setTimeout(() => {
            void searchPatientsApi(val);
        }, 350);
    };

    const fetchAvailableSchedules = useCallback(
        async (poliId, dateStr) => {
            if (!poliId || !dateStr) {
                setAvailableSchedules([]);
                setSelectedDoctorId(undefined);
                return;
            }

            setLoadingSchedules(true);
            const response = await API.GET(
                `/api/schedules/available?poli_id=${encodeURIComponent(
                    poliId
                )}&date=${encodeURIComponent(dateStr)}`
            );
            setLoadingSchedules(false);

            if (response?.status === 200 && response?.result?.rc === 200) {
                const list = Array.isArray(response.result.data) ? response.result.data : [];
                setAvailableSchedules(list);

                const firstAvailable = list.find((s) => Number(s.remaining ?? s.quota) > 0);
                setSelectedDoctorId(firstAvailable ? firstAvailable.doctor_id : undefined);
            } else {
                setAvailableSchedules([]);
                setSelectedDoctorId(undefined);
                notifOpen(
                    'Gagal Memuat Jadwal',
                    response?.result?.rm || 'Tidak dapat memuat jadwal dokter tersedia',
                    'danger'
                );
            }
        },
        [notifOpen]
    );

    useEffect(() => {
        let active = true;
        Promise.resolve().then(() => {
            if (!active) return;
            if (regModalOpen && regPoliId && regVisitDate) {
                void fetchAvailableSchedules(regPoliId, regVisitDate);
            } else if (!regPoliId) {
                setAvailableSchedules([]);
                setSelectedDoctorId(undefined);
            }
        });
        return () => {
            active = false;
        };
    }, [regModalOpen, regPoliId, regVisitDate, fetchAvailableSchedules]);

    const openRegistrationModal = useCallback(
        async (preselectedPatient = null) => {
            setPatientMode('existing');
            setDupChecked(false);
            setDupResults([]);
            setRegVisitDate(filterDate && filterDate !== 'all' ? filterDate : Helper.today());
            setRegPoliId(filterPoliId ? Number(filterPoliId) : undefined);
            setSelectedDoctorId(undefined);
            resetNewPatientForm({
                nik: '',
                full_name: '',
                gender: undefined,
                birth_date: undefined,
                birth_place: '',
                phone: '',
                blood_type: undefined,
                address: '',
            });

            if (preselectedPatient) {
                setSelectedPatient(preselectedPatient);
                setPatientOptions([
                    {
                        value: preselectedPatient.id,
                        label: `${preselectedPatient.medical_record_no || ''} - ${
                            preselectedPatient.full_name || ''
                        }`,
                        patient: preselectedPatient,
                    },
                ]);
            } else {
                setSelectedPatient(null);
                void searchPatientsApi('');
            }

            setRegModalOpen(true);
        },
        [filterDate, filterPoliId, resetNewPatientForm, searchPatientsApi]
    );

    useEffect(() => {
        const paramPatientId = searchParams.get('patient_id');
        if (!paramPatientId) return;

        const paramMr = searchParams.get('mr') || '';
        const paramName = searchParams.get('name') || '';

        const loadAndOpen = async () => {
            const res = await API.GET(`/api/patients/${paramPatientId}`);
            const patientObj =
                res?.status === 200 && res?.result?.data
                    ? res.result.data
                    : {
                          id: Number(paramPatientId),
                          medical_record_no: paramMr,
                          full_name: paramName,
                      };
            setSearchParams({}, { replace: true });
            void openRegistrationModal(patientObj);
        };

        void loadAndOpen();
    }, [searchParams, setSearchParams, openRegistrationModal]);

    const handleCheckDuplicateInline = async () => {
        const rawNik = String(getNewPatientValues('nik') || '').trim();
        const rawName = String(getNewPatientValues('full_name') || '').trim();
        const rawBirthDate = getNewPatientValues('birth_date');
        const rawPhone = String(getNewPatientValues('phone') || '').trim();
        const formattedBirthDate = rawBirthDate
            ? dayjs(rawBirthDate).format('YYYY-MM-DD')
            : '';

        if (!rawNik && (!rawName || !formattedBirthDate)) {
            notifOpen(
                'Perhatian',
                'Isi NIK atau kombinasi Nama Lengkap + Tanggal Lahir untuk cek duplikat',
                'warning'
            );
            return;
        }

        setDupChecking(true);
        setDupChecked(false);

        const payload = {};
        if (rawNik) payload.nik = rawNik;
        if (rawName) payload.full_name = rawName;
        if (formattedBirthDate) payload.birth_date = formattedBirthDate;
        if (rawPhone) payload.phone = rawPhone;

        const response = await API.POST('/api/patients/check-duplicate', payload);
        setDupChecking(false);

        if (response?.status === 200 && response?.result?.rc === 200) {
            const matches = Array.isArray(response.result.data) ? response.result.data : [];
            setDupResults(matches);
            setDupChecked(true);
        } else {
            notifOpen(
                'Gagal Cek Duplikat',
                response?.result?.rm || 'Gagal memeriksa duplikasi pasien',
                'danger'
            );
        }
    };

    const handleCreateAndSelectNewPatient = async (formData) => {
        setRegSubmitting(true);
        const payload = {
            nik: formData.nik ? String(formData.nik).trim() : null,
            full_name: formData.full_name ? String(formData.full_name).trim() : '',
            gender: formData.gender || null,
            birth_date: formData.birth_date
                ? dayjs(formData.birth_date).format('YYYY-MM-DD')
                : null,
            birth_place: formData.birth_place ? String(formData.birth_place).trim() : null,
            phone: formData.phone ? String(formData.phone).trim() : null,
            blood_type: formData.blood_type || null,
            address: formData.address ? String(formData.address).trim() : null,
        };

        const response = await API.POST('/api/patients', payload);
        setRegSubmitting(false);

        if (
            response?.status < 400 &&
            (response?.result?.rc === 200 || response?.result?.rc === 201)
        ) {
            const created = response.result.data;
            notifOpen(
                'Pasien Baru Terdaftar',
                `No. RM: ${created.medical_record_no} - ${created.full_name}`
            );
            setSelectedPatient(created);
            setPatientOptions((prev) => [
                {
                    value: created.id,
                    label: `${created.medical_record_no} - ${created.full_name}`,
                    patient: created,
                },
                ...prev,
            ]);
            setPatientMode('existing');
        } else {
            let errMsg = response?.result?.rm || 'Gagal mendaftarkan pasien baru';
            const errData = response?.result?.data;
            if (errData && typeof errData === 'object' && !Array.isArray(errData)) {
                const firstKey = Object.keys(errData)[0];
                const firstVal = Array.isArray(errData[firstKey])
                    ? errData[firstKey][0]
                    : errData[firstKey];
                if (firstVal) errMsg = `${errMsg}: ${firstVal}`;
            }
            notifOpen('Gagal', errMsg, 'danger');
        }
    };

    const handleSubmitVisitRegistration = async () => {
        if (!selectedPatient?.id) {
            notifOpen('Validasi', 'Pilih pasien terlebih dahulu', 'warning');
            return;
        }
        if (!regPoliId) {
            notifOpen('Validasi', 'Pilih poliklinik tujuan terlebih dahulu', 'warning');
            return;
        }
        if (!selectedDoctorId) {
            notifOpen('Validasi', 'Pilih dokter praktik yang tersedia', 'warning');
            return;
        }
        if (!regVisitDate) {
            notifOpen('Validasi', 'Tanggal kunjungan wajib diisi', 'warning');
            return;
        }

        setRegSubmitting(true);
        const payload = {
            patient_id: Number(selectedPatient.id),
            poli_id: Number(regPoliId),
            doctor_id: Number(selectedDoctorId),
            visit_date: regVisitDate,
        };

        const response = await API.POST('/api/visits', payload);
        setRegSubmitting(false);

        if (
            response?.status < 400 &&
            (response?.result?.rc === 200 || response?.result?.rc === 201)
        ) {
            const visitData = response.result.data;
            setRegModalOpen(false);
            notifOpen(
                'Kunjungan Terdaftar',
                `No. Antrean #${visitData?.queue_no} (${visitData?.visit_no}) - Status: ${visitData?.status}`
            );
            if (filterDate !== regVisitDate) {
                setFilterDate(regVisitDate);
            }
            refreshAll();
        } else {
            let errMsg = response?.result?.rm || 'Gagal mendaftarkan kunjungan';
            const errData = response?.result?.data;
            if (errData && typeof errData === 'object' && !Array.isArray(errData)) {
                const firstKey = Object.keys(errData)[0];
                const firstVal = Array.isArray(errData[firstKey])
                    ? errData[firstKey][0]
                    : errData[firstKey];
                if (firstVal) errMsg = `${errMsg}: ${firstVal}`;
            }
            notifOpen('Gagal Registrasi Kunjungan', errMsg, 'danger');
        }
    };

    const handleUpdateVisitStatus = async (visitId, targetStatus, reasonText = '') => {
        setStatusUpdatingId(visitId);
        const payload = { status: targetStatus };
        if (reasonText) {
            payload.reason = reasonText;
        }

        const response = await API.PUT(`/api/visits/${visitId}/status`, payload);
        setStatusUpdatingId(null);

        if (response?.status < 400 && response?.result?.rc === 200) {
            const updated = response.result.data;
            notifOpen(
                'Status Antrean Diperbarui',
                `Antrean #${updated?.queue_no || ''} (${
                    updated?.patient?.full_name || ''
                }) -> ${targetStatus}`
            );
            refreshAll();
            return true;
        }

        let errMsg = response?.result?.rm || 'Gagal mengubah status kunjungan';
        const errData = response?.result?.data;
        if (errData && typeof errData === 'object' && !Array.isArray(errData)) {
            const firstKey = Object.keys(errData)[0];
            const firstVal = Array.isArray(errData[firstKey])
                ? errData[firstKey][0]
                : errData[firstKey];
            if (firstVal) errMsg = `${errMsg}: ${firstVal}`;
        }
        notifOpen('Gagal', errMsg, 'danger');
        return false;
    };

    const handleConfirmCancelVisit = async () => {
        const trimmed = String(cancelReason || '').trim();
        if (trimmed.length < 5) {
            notifOpen(
                'Validasi',
                'Alasan pembatalan wajib diisi minimal 5 karakter',
                'warning'
            );
            return;
        }
        if (!cancelTargetVisit) return;

        setCancelSubmitting(true);
        const ok = await handleUpdateVisitStatus(
            cancelTargetVisit.id,
            'CANCELLED',
            trimmed
        );
        setCancelSubmitting(false);

        if (ok) {
            setCancelModalOpen(false);
            setCancelTargetVisit(null);
            setCancelReason('');
        }
    };

    const handleViewVisitDetail = async (visitId) => {
        setDetailModalOpen(true);
        setLoadingDetail(true);
        setDetailVisit(null);

        const response = await API.GET(`/api/visits/${visitId}`);
        setLoadingDetail(false);

        if (response?.status === 200 && response?.result?.rc === 200) {
            setDetailVisit(response.result.data);
        } else {
            setDetailModalOpen(false);
            notifOpen(
                'Gagal',
                response?.result?.rm || 'Gagal memuat detail kunjungan',
                'danger'
            );
        }
    };

    const selectedPoliObj = polisList.find((p) => Number(p.value) === Number(regPoliId));

    const columns = [
        {
            title: 'Antrean',
            dataIndex: 'queue_no',
            width: '90px',
            align: 'center',
            render: (val) => (
                <span
                    className="btn btn-light-primary btn-sm fw-7"
                    style={{ cursor: 'default', minWidth: '48px' }}
                >
                    #{val}
                </span>
            ),
        },
        {
            title: 'No. Kunjungan',
            dataIndex: 'visit_no',
            width: '155px',
            render: (val, row) => (
                <div>
                    <div className="fw-7">{val}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                        {row.visit_date ? Helper.formatDate(row.visit_date, 'd-mm-Y') : '-'}
                    </div>
                </div>
            ),
        },
        {
            title: 'Pasien',
            key: 'patient',
            render: (_, row) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{row.patient?.full_name || '-'}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                        No. RM: <strong>{row.patient?.medical_record_no || '-'}</strong>
                        {row.patient?.age !== null && row.patient?.age !== undefined
                            ? ` (${row.patient.age} thn)`
                            : ''}
                    </div>
                </div>
            ),
        },
        {
            title: 'Poliklinik',
            key: 'poli',
            render: (_, row) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{row.poli?.name || '-'}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                        Biaya: Rp {Helper.numFormat(row.registration_fee || 0)}
                    </div>
                </div>
            ),
        },
        {
            title: 'Dokter & Jadwal',
            key: 'doctor',
            render: (_, row) => {
                const start = row.schedule?.start_time
                    ? Helper.formatTime(row.schedule.start_time, 'H:i')
                    : '';
                const end = row.schedule?.end_time
                    ? Helper.formatTime(row.schedule.end_time, 'H:i')
                    : '';
                return (
                    <div>
                        <div style={{ fontWeight: 600 }}>{row.doctor?.full_name || '-'}</div>
                        <div className="text-muted" style={{ fontSize: '11px' }}>
                            {row.doctor?.specialty ? `${row.doctor.specialty} ` : ''}
                            {start && end ? `(${start} - ${end})` : ''}
                        </div>
                    </div>
                );
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            width: '125px',
            align: 'center',
            render: (st) => renderStatusBadge(st),
        },
        {
            title: 'Panggil Antrean',
            key: 'call_action',
            width: '175px',
            align: 'center',
            render: (_, row) => {
                const isUpdating = statusUpdatingId === row.id;
                if (row.status === 'WAITING') {
                    return (
                        <button
                            type="button"
                            className="btn btn-primary btn-sm my-1"
                            disabled={isUpdating}
                            onClick={() => void handleUpdateVisitStatus(row.id, 'CALLED')}
                        >
                            <NotificationOutlined />
                            {isUpdating ? 'Memproses...' : 'Panggil Pasien'}
                        </button>
                    );
                }
                if (row.status === 'CALLED') {
                    return (
                        <button
                            type="button"
                            className="btn btn-light-warning btn-sm my-1"
                            disabled={isUpdating}
                            onClick={() => void handleUpdateVisitStatus(row.id, 'WAITING')}
                            title="Kembalikan ke status Menunggu (WAITING)"
                        >
                            <RollbackOutlined />
                            {isUpdating ? 'Memproses...' : 'Kembalikan'}
                        </button>
                    );
                }
                return <span className="text-muted" style={{ fontSize: '12px' }}>-</span>;
            },
        },
        {
            title: '',
            key: 'act',
            width: '55px',
            align: 'center',
            render: (_, row) => {
                const canCall = row.status === 'WAITING';
                const canRevertWaiting = row.status === 'CALLED';
                const canCancel = row.status === 'WAITING' || row.status === 'CALLED';

                const items = [
                    {
                        key: 'detail',
                        label: (
                            <button
                                type="button"
                                onClick={() => void handleViewVisitDetail(row.id)}
                                className="dropdown-item w-full"
                            >
                                <ContainerOutlined className="text-muted me-2" />
                                Detail Kunjungan
                            </button>
                        ),
                    },
                ];

                if (canCall) {
                    items.push({
                        key: 'call',
                        label: (
                            <button
                                type="button"
                                onClick={() => void handleUpdateVisitStatus(row.id, 'CALLED')}
                                className="dropdown-item w-full"
                            >
                                <NotificationOutlined className="text-primary me-2" />
                                Panggil ke Ruang Tunggu (CALLED)
                            </button>
                        ),
                    });
                }

                if (canRevertWaiting) {
                    items.push({
                        key: 'waiting',
                        label: (
                            <button
                                type="button"
                                onClick={() => void handleUpdateVisitStatus(row.id, 'WAITING')}
                                className="dropdown-item w-full"
                            >
                                <RollbackOutlined className="text-warning me-2" />
                                Kembalikan ke Antrean (WAITING)
                            </button>
                        ),
                    });
                }

                if (canCancel) {
                    items.push({
                        key: 'cancel',
                        label: (
                            <button
                                type="button"
                                onClick={() => {
                                    setCancelTargetVisit(row);
                                    setCancelReason('');
                                    setCancelModalOpen(true);
                                }}
                                className="dropdown-item w-full"
                            >
                                <CloseCircleOutlined className="text-danger me-2" />
                                Batalkan Kunjungan (CANCELLED)
                            </button>
                        ),
                    });
                }

                return (
                    <Dropdown trigger={['click']} placement="bottomRight" arrow menu={{ items }}>
                        <button
                            type="button"
                            className="btn btn-circle btn-light-primary my-1 btn-sm"
                            aria-label={`Opsi untuk kunjungan ${row.visit_no}`}
                        >
                            <SettingOutlined />
                        </button>
                    </Dropdown>
                );
            },
        },
    ];

    const summary = queueOverview?.summary || {
        WAITING: 0,
        CALLED: 0,
        EXAMINING: 0,
        DONE: 0,
        total: 0,
    };

    return (
        <>
            <div className="containers">
                <div className="headContent" style={{ minHeight: '40px' }}>
                    <div className="containerTitle">
                        <div className="breadCrumb">
                            <div className="text">Pendaftaran</div>
                            <div className="text">Kunjungan &amp; Antrean</div>
                        </div>
                        <div className="title text-dark-grey left">
                            Loket Pendaftaran &amp; Antrean Poliklinik
                        </div>
                    </div>

                    <div className="filter mb-3">
                        <DatePicker
                            allowClear={false}
                            value={filterDate ? dayjs(filterDate, 'YYYY-MM-DD') : dayjs()}
                            format="DD MMM YYYY"
                            onChange={(d) => {
                                const str = d ? d.format('YYYY-MM-DD') : Helper.today();
                                setFilterDate(str);
                                setTriggerTable((prev) => prev + 1);
                            }}
                            style={{ height: '38px', borderRadius: '15px' }}
                        />

                        <select
                            aria-label="Filter Poliklinik"
                            className="form-control"
                            style={{ width: '175px', height: '38px', padding: '0 14px' }}
                            value={filterPoliId}
                            onChange={(e) => {
                                setFilterPoliId(e.target.value);
                                setTriggerTable((prev) => prev + 1);
                            }}
                        >
                            <option value="">Semua Poliklinik</option>
                            {polisList.map((p) => (
                                <option key={p.value} value={p.value}>
                                    {p.label}
                                </option>
                            ))}
                        </select>

                        <select
                            aria-label="Filter Status Kunjungan"
                            className="form-control"
                            style={{ width: '175px', height: '38px', padding: '0 14px' }}
                            value={filterStatus}
                            onChange={(e) => {
                                setFilterStatus(e.target.value);
                                setTriggerTable((prev) => prev + 1);
                            }}
                        >
                            {statusFilterOptions.map((st) => (
                                <option key={st.value} value={st.value}>
                                    {st.label}
                                </option>
                            ))}
                        </select>

                        <SearchInput handleSearch={handleSearch} />

                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => void openRegistrationModal(null)}
                        >
                            <PlusCircleOutlined />
                            Daftar Kunjungan
                        </button>

                        <button
                            type="button"
                            className="btn btn-light-primary"
                            onClick={() => navigate('/main/registration/patients')}
                        >
                            <TeamOutlined />
                            Data Pasien
                        </button>

                        <button
                            type="button"
                            className="btn btn-circle btn-light-primary"
                            onClick={refreshAll}
                            aria-label="Muat ulang daftar kunjungan"
                        >
                            <ReloadOutlined />
                        </button>
                    </div>
                </div>

                <Spin spinning={loadingQueueOverview}>
                    <Row gutter={[12, 12]} style={{ marginBottom: '16px' }}>
                        <Col xs={12} sm={8} md={4}>
                            <Card size="small" style={{ borderRadius: '14px' }}>
                                <div className="text-muted" style={{ fontSize: '12px' }}>
                                    Total Antrean
                                </div>
                                <div className="fs-5 fw-7 text-primary" style={{ fontSize: '20px' }}>
                                    {summary.total || 0}
                                </div>
                            </Card>
                        </Col>
                        <Col xs={12} sm={8} md={4}>
                            <Card size="small" style={{ borderRadius: '14px' }}>
                                <div className="text-muted" style={{ fontSize: '12px' }}>
                                    Menunggu (WAITING)
                                </div>
                                <div className="fs-5 fw-7 text-warning" style={{ fontSize: '20px' }}>
                                    {summary.WAITING || 0}
                                </div>
                            </Card>
                        </Col>
                        <Col xs={12} sm={8} md={4}>
                            <Card size="small" style={{ borderRadius: '14px' }}>
                                <div className="text-muted" style={{ fontSize: '12px' }}>
                                    Dipanggil (CALLED)
                                </div>
                                <div className="fs-5 fw-7 text-info" style={{ fontSize: '20px' }}>
                                    {summary.CALLED || 0}
                                </div>
                            </Card>
                        </Col>
                        <Col xs={12} sm={8} md={4}>
                            <Card size="small" style={{ borderRadius: '14px' }}>
                                <div className="text-muted" style={{ fontSize: '12px' }}>
                                    Diperiksa (EXAMINING)
                                </div>
                                <div className="fs-5 fw-7 text-primary" style={{ fontSize: '20px' }}>
                                    {summary.EXAMINING || 0}
                                </div>
                            </Card>
                        </Col>
                        <Col xs={12} sm={8} md={4}>
                            <Card size="small" style={{ borderRadius: '14px' }}>
                                <div className="text-muted" style={{ fontSize: '12px' }}>
                                    Selesai (DONE)
                                </div>
                                <div className="fs-5 fw-7 text-success" style={{ fontSize: '20px' }}>
                                    {summary.DONE || 0}
                                </div>
                            </Card>
                        </Col>
                        <Col xs={12} sm={8} md={4}>
                            <Card size="small" style={{ borderRadius: '14px' }}>
                                <div className="text-muted" style={{ fontSize: '12px' }}>
                                    Antrean Berikutnya
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <span className="fw-7" style={{ fontSize: '16px' }}>
                                        {queueOverview?.next
                                            ? `#${queueOverview.next.queue_no} (${Helper.limitString(
                                                  queueOverview.next.patient?.full_name || '',
                                                  12
                                              )})`
                                            : '-'}
                                    </span>
                                    {queueOverview?.next ? (
                                        <button
                                            type="button"
                                            className="btn btn-primary btn-sm"
                                            style={{ height: '26px', padding: '0 10px' }}
                                            onClick={() =>
                                                void handleUpdateVisitStatus(
                                                    queueOverview.next.visit_id,
                                                    'CALLED'
                                                )
                                            }
                                        >
                                            Panggil
                                        </button>
                                    ) : null}
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </Spin>

                <div className="bodyContent">
                    <div className="card-table" style={{ minHeight: '200px' }}>
                        <DTAntServerSide
                            searchText={searchText}
                            filter={{
                                visit_date: filterDate,
                                poli_id: filterPoliId,
                                status: filterStatus,
                            }}
                            endPoint="/api/visits"
                            triger={triggerTable}
                            columnTable={columns}
                            keyTable="id"
                        />
                    </div>
                </div>
            </div>

            <Modal
                centered
                open={regModalOpen}
                onCancel={() => setRegModalOpen(false)}
                width="760px"
                footer={null}
                title="Registrasi Kunjungan & Antrean Poliklinik"
            >
                <Spin spinning={regSubmitting}>
                    <div style={{ paddingTop: '8px' }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '14px',
                                flexWrap: 'wrap',
                                gap: '8px',
                            }}
                        >
                            <div className="fw-7 text-primary">
                                1. Identitas Pasien
                            </div>
                            <Radio.Group
                                value={patientMode}
                                onChange={(e) => setPatientMode(e.target.value)}
                                buttonStyle="solid"
                                size="small"
                            >
                                <Radio.Button value="existing">
                                    <SearchOutlined /> Cari Pasien Terdaftar
                                </Radio.Button>
                                <Radio.Button value="new">
                                    <UserAddOutlined /> Registrasi Pasien Baru
                                </Radio.Button>
                            </Radio.Group>
                        </div>

                        {patientMode === 'existing' ? (
                            <div style={{ marginBottom: '18px' }}>
                                <Select
                                    showSearch
                                    allowClear
                                    size="large"
                                    style={{ width: '100%' }}
                                    placeholder="Ketik Nama Pasien, No. RM, atau NIK..."
                                    filterOption={false}
                                    loading={patientSearchLoading}
                                    value={selectedPatient?.id}
                                    onSearch={handlePatientSelectSearch}
                                    onChange={(val, option) => {
                                        setSelectedPatient(option?.patient || null);
                                    }}
                                    options={patientOptions}
                                    notFoundContent={
                                        patientSearchLoading ? (
                                            <Spin size="small" />
                                        ) : (
                                            <Empty
                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                description="Pasien tidak ditemukan"
                                            />
                                        )
                                    }
                                />

                                {selectedPatient && (
                                    <Card
                                        size="small"
                                        style={{
                                            marginTop: '10px',
                                            borderRadius: '12px',
                                            background: 'var(--primary-light)',
                                        }}
                                    >
                                        <Row gutter={12} align="middle">
                                            <Col xs={24} sm={8}>
                                                <div className="text-muted" style={{ fontSize: '11px' }}>
                                                    No. Rekam Medis
                                                </div>
                                                <div className="fw-7 text-primary">
                                                    {selectedPatient.medical_record_no || '-'}
                                                </div>
                                            </Col>
                                            <Col xs={24} sm={10}>
                                                <div className="text-muted" style={{ fontSize: '11px' }}>
                                                    Nama Pasien
                                                </div>
                                                <div className="fw-7">
                                                    {selectedPatient.full_name || '-'}
                                                </div>
                                            </Col>
                                            <Col xs={24} sm={6}>
                                                <div className="text-muted" style={{ fontSize: '11px' }}>
                                                    Tgl. Lahir / Telp
                                                </div>
                                                <div style={{ fontSize: '12px' }}>
                                                    {selectedPatient.birth_date || '-'} /{' '}
                                                    {selectedPatient.phone || '-'}
                                                </div>
                                            </Col>
                                        </Row>
                                    </Card>
                                )}
                            </div>
                        ) : (
                            <Card
                                size="small"
                                style={{
                                    marginBottom: '18px',
                                    borderRadius: '14px',
                                    border: '1px solid var(--primary-light)',
                                }}
                            >
                                <form onSubmit={handleSubmit(handleCreateAndSelectNewPatient)}>
                                    <Row gutter={12}>
                                        <Col xs={24} sm={12}>
                                            <Input.Number
                                                title="NIK (16 Digit - Opsional)"
                                                name="nik"
                                                maxlength={16}
                                                minlength={16}
                                                required={false}
                                                register={register}
                                                error={newPatientErrors}
                                            />
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <Input.Text
                                                title="Nama Lengkap Pasien"
                                                name="full_name"
                                                maxlength={120}
                                                required={true}
                                                register={register}
                                                error={newPatientErrors}
                                            />
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <Input.Select
                                                title="Jenis Kelamin"
                                                name="gender"
                                                required={true}
                                                register={register}
                                                error={newPatientErrors}
                                                options={genderOptions}
                                                val={watchedGender}
                                                placeholder="Pilih Gender"
                                                setValue={setNewPatientValue}
                                            />
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <Input.Date
                                                title="Tanggal Lahir"
                                                name="birth_date"
                                                setValue={setNewPatientValue}
                                                required={true}
                                                value={watchedBirthDate}
                                                maxDate={Helper.today()}
                                                register={register}
                                                error={newPatientErrors}
                                            />
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <Input.Select
                                                title="Gol. Darah"
                                                name="blood_type"
                                                required={false}
                                                register={register}
                                                error={newPatientErrors}
                                                options={bloodTypeOptions}
                                                val={watchedBloodType}
                                                placeholder="Gol. Darah"
                                                setValue={setNewPatientValue}
                                            />
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <Input.Text
                                                title="Tempat Lahir"
                                                name="birth_place"
                                                maxlength={80}
                                                required={false}
                                                register={register}
                                                error={newPatientErrors}
                                            />
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <Input.Number
                                                title="No. Telepon"
                                                name="phone"
                                                maxlength={20}
                                                required={false}
                                                register={register}
                                                error={newPatientErrors}
                                            />
                                        </Col>
                                        <Col xs={24}>
                                            <Input.Text
                                                title="Alamat"
                                                name="address"
                                                maxlength={250}
                                                required={false}
                                                register={register}
                                                error={newPatientErrors}
                                            />
                                        </Col>
                                    </Row>

                                    {dupChecked && (
                                        <div style={{ marginBottom: '12px' }}>
                                            {dupResults.length === 0 ? (
                                                <Alert
                                                    type="success"
                                                    showIcon
                                                    icon={<CheckCircleOutlined />}
                                                    message="Tidak ada duplikat pasien ditemukan."
                                                />
                                            ) : (
                                                <Alert
                                                    type="warning"
                                                    showIcon
                                                    icon={<ExclamationCircleOutlined />}
                                                    message={`Ditemukan ${dupResults.length} pasien terdaftar yang cocok:`}
                                                    description={
                                                        <div style={{ marginTop: '6px' }}>
                                                            {dupResults.map((p) => (
                                                                <div
                                                                    key={p.id}
                                                                    style={{
                                                                        display: 'flex',
                                                                        justifyContent:
                                                                            'space-between',
                                                                        alignItems: 'center',
                                                                        padding: '4px 0',
                                                                    }}
                                                                >
                                                                    <span>
                                                                        <strong>
                                                                            {p.medical_record_no}
                                                                        </strong>{' '}
                                                                        - {p.full_name} (
                                                                        {p.birth_date})
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-light-primary btn-sm"
                                                                        onClick={() => {
                                                                            setSelectedPatient(p);
                                                                            setPatientOptions(
                                                                                (prev) => [
                                                                                    {
                                                                                        value: p.id,
                                                                                        label: `${p.medical_record_no} - ${p.full_name}`,
                                                                                        patient: p,
                                                                                    },
                                                                                    ...prev,
                                                                                ]
                                                                            );
                                                                            setPatientMode(
                                                                                'existing'
                                                                            );
                                                                        }}
                                                                    >
                                                                        Pilih Pasien Ini
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    }
                                                />
                                            )}
                                        </div>
                                    )}

                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            gap: '8px',
                                        }}
                                    >
                                        <button
                                            type="button"
                                            className="btn btn-light-primary btn-sm"
                                            onClick={() => void handleCheckDuplicateInline()}
                                            disabled={dupChecking}
                                        >
                                            <SearchOutlined />
                                            {dupChecking ? 'Memeriksa...' : 'Cek Duplikat'}
                                        </button>
                                        <button type="submit" className="btn btn-primary btn-sm">
                                            <UserAddOutlined />
                                            Simpan &amp; Gunakan Pasien Baru
                                        </button>
                                    </div>
                                </form>
                            </Card>
                        )}

                        <div className="separator my-3" style={{ margin: '14px 0' }} />

                        <div className="fw-7 text-primary" style={{ marginBottom: '12px' }}>
                            2. Pilih Tanggal, Poliklinik &amp; Jadwal Dokter Tersedia
                        </div>

                        <Row gutter={16} style={{ marginBottom: '14px' }}>
                            <Col xs={24} sm={10}>
                                <label
                                    htmlFor="reg_visit_date"
                                    style={{
                                        display: 'block',
                                        fontSize: '12px',
                                        marginBottom: '4px',
                                        fontWeight: 600,
                                    }}
                                >
                                    Tanggal Kunjungan (Maks. H+7) *
                                </label>
                                <DatePicker
                                    id="reg_visit_date"
                                    allowClear={false}
                                    style={{ width: '100%', height: '42px', borderRadius: '10px' }}
                                    value={regVisitDate ? dayjs(regVisitDate, 'YYYY-MM-DD') : null}
                                    format="DD MMM YYYY"
                                    disabledDate={(current) => {
                                        if (!current) return false;
                                        const start = dayjs().startOf('day');
                                        const end = dayjs().add(7, 'day').endOf('day');
                                        return current < start || current > end;
                                    }}
                                    onChange={(d) => {
                                        setRegVisitDate(
                                            d ? d.format('YYYY-MM-DD') : Helper.today()
                                        );
                                    }}
                                />
                            </Col>

                            <Col xs={24} sm={14}>
                                <label
                                    htmlFor="reg_poli_select"
                                    style={{
                                        display: 'block',
                                        fontSize: '12px',
                                        marginBottom: '4px',
                                        fontWeight: 600,
                                    }}
                                >
                                    Poliklinik Tujuan *
                                </label>
                                <Select
                                    id="reg_poli_select"
                                    showSearch
                                    style={{ width: '100%', height: '42px' }}
                                    placeholder="Pilih Poliklinik..."
                                    value={regPoliId}
                                    optionFilterProp="label"
                                    onChange={(val) => setRegPoliId(val)}
                                    options={polisList.map((p) => ({
                                        value: p.value,
                                        label: `${p.label} (Biaya Daftar: Rp ${Helper.numFormat(
                                            p.registration_fee || 0
                                        )})`,
                                    }))}
                                />
                            </Col>
                        </Row>

                        <div style={{ marginBottom: '16px' }}>
                            <div
                                style={{
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    marginBottom: '8px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <span>Jadwal Dokter &amp; Sisa Kuota pada {regVisitDate} *</span>
                                {selectedPoliObj ? (
                                    <span className="text-primary">
                                        Tarif Pendaftaran: Rp{' '}
                                        {Helper.numFormat(selectedPoliObj.registration_fee || 0)}
                                    </span>
                                ) : null}
                            </div>

                            {!regPoliId ? (
                                <Alert
                                    type="info"
                                    showIcon
                                    message="Pilih Poliklinik terlebih dahulu untuk melihat jadwal dokter dan sisa kuota."
                                />
                            ) : loadingSchedules ? (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    <Spin tip="Memeriksa jadwal dokter tersedia..." />
                                </div>
                            ) : availableSchedules.length === 0 ? (
                                <Alert
                                    type="warning"
                                    showIcon
                                    message="Tidak ada dokter yang memiliki jadwal praktik aktif pada poli dan tanggal tersebut."
                                />
                            ) : (
                                <Row gutter={[12, 12]}>
                                    {availableSchedules.map((sch) => {
                                        const isFull = Number(sch.remaining) <= 0;
                                        const isSelected =
                                            Number(selectedDoctorId) === Number(sch.doctor_id);
                                        const start = sch.start_time
                                            ? Helper.formatTime(sch.start_time, 'H:i')
                                            : '-';
                                        const end = sch.end_time
                                            ? Helper.formatTime(sch.end_time, 'H:i')
                                            : '-';

                                        return (
                                            <Col xs={24} sm={12} key={sch.schedule_id}>
                                                <div
                                                    role="button"
                                                    tabIndex={isFull ? -1 : 0}
                                                    onClick={() => {
                                                        if (!isFull) {
                                                            setSelectedDoctorId(sch.doctor_id);
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (
                                                            !isFull &&
                                                            (e.key === 'Enter' || e.key === ' ')
                                                        ) {
                                                            e.preventDefault();
                                                            setSelectedDoctorId(sch.doctor_id);
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '12px 14px',
                                                        borderRadius: '12px',
                                                        border: isSelected
                                                            ? '2px solid var(--primary-dark)'
                                                            : '1px solid #e1e3ea',
                                                        background: isFull
                                                            ? '#f9fafb'
                                                            : isSelected
                                                              ? 'var(--primary-light)'
                                                              : 'var(--white)',
                                                        cursor: isFull ? 'not-allowed' : 'pointer',
                                                        opacity: isFull ? 0.6 : 1,
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
                                                            <div className="fw-7">
                                                                {sch.doctor_name}
                                                            </div>
                                                            <div
                                                                className="text-muted"
                                                                style={{ fontSize: '12px' }}
                                                            >
                                                                {sch.specialty || 'Dokter Umum'}
                                                            </div>
                                                        </div>
                                                        <Tag
                                                            color={
                                                                isFull
                                                                    ? 'red'
                                                                    : sch.remaining <= 3
                                                                      ? 'orange'
                                                                      : 'green'
                                                            }
                                                        >
                                                            {isFull
                                                                ? 'Kuota Penuh'
                                                                : `Sisa: ${sch.remaining}/${sch.quota}`}
                                                        </Tag>
                                                    </div>
                                                    <div
                                                        style={{
                                                            marginTop: '8px',
                                                            fontSize: '12px',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                        }}
                                                    >
                                                        <span>
                                                            Jam: <strong>{start} - {end}</strong>
                                                        </span>
                                                        <span>Terisi: {sch.booked || 0}</span>
                                                    </div>
                                                </div>
                                            </Col>
                                        );
                                    })}
                                </Row>
                            )}
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '10px',
                                marginTop: '20px',
                            }}
                        >
                            <button
                                type="button"
                                className="btn btn-light-danger"
                                onClick={() => setRegModalOpen(false)}
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                disabled={
                                    !selectedPatient?.id ||
                                    !regPoliId ||
                                    !selectedDoctorId ||
                                    regSubmitting
                                }
                                onClick={() => void handleSubmitVisitRegistration()}
                            >
                                <CalendarOutlined />
                                Buat Kunjungan &amp; Ambil Antrean
                            </button>
                        </div>
                    </div>
                </Spin>
            </Modal>

            <Modal
                centered
                open={detailModalOpen}
                onCancel={() => setDetailModalOpen(false)}
                footer={null}
                width="600px"
                title="Detail Kunjungan & Antrean"
            >
                <Spin spinning={loadingDetail}>
                    {detailVisit ? (
                        <Descriptions bordered column={1} size="small">
                            <Descriptions.Item label="No. Kunjungan">
                                <strong>{detailVisit.visit_no}</strong>
                            </Descriptions.Item>
                            <Descriptions.Item label="Nomor Antrean">
                                <strong>#{detailVisit.queue_no}</strong>
                            </Descriptions.Item>
                            <Descriptions.Item label="Status">
                                {renderStatusBadge(detailVisit.status)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tanggal Kunjungan">
                                {detailVisit.visit_date
                                    ? Helper.formatDate(detailVisit.visit_date, 'd-M-Y')
                                    : '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Pasien">
                                <strong>{detailVisit.patient?.full_name || '-'}</strong> (No. RM:{' '}
                                {detailVisit.patient?.medical_record_no || '-'}, Usia:{' '}
                                {detailVisit.patient?.age ?? '-'} thn)
                            </Descriptions.Item>
                            <Descriptions.Item label="Poliklinik">
                                {detailVisit.poli?.name || '-'} ({detailVisit.poli?.code || '-'})
                            </Descriptions.Item>
                            <Descriptions.Item label="Dokter Pemeriksa">
                                {detailVisit.doctor?.full_name || '-'}
                                {detailVisit.doctor?.specialty
                                    ? ` - ${detailVisit.doctor.specialty}`
                                    : ''}
                            </Descriptions.Item>
                            <Descriptions.Item label="Biaya Pendaftaran (Snapshot)">
                                Rp {Helper.numFormat(detailVisit.registration_fee || 0)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Waktu Pendaftaran">
                                {detailVisit.created_at
                                    ? Helper.formatDate(detailVisit.created_at, 'd-M-Y H:i:s')
                                    : '-'}
                            </Descriptions.Item>
                        </Descriptions>
                    ) : null}
                </Spin>
            </Modal>

            <Modal
                centered
                open={cancelModalOpen}
                onCancel={() => setCancelModalOpen(false)}
                footer={null}
                width="460px"
                title="Batalkan Kunjungan Antrean"
            >
                <Spin spinning={cancelSubmitting}>
                    {cancelTargetVisit && (
                        <div>
                            <Alert
                                type="warning"
                                showIcon
                                style={{ marginBottom: '14px' }}
                                message={`Batalkan kunjungan ${cancelTargetVisit.visit_no} (Antrean #${cancelTargetVisit.queue_no} - ${cancelTargetVisit.patient?.full_name})?`}
                            />
                            <div style={{ marginBottom: '16px' }}>
                                <label
                                    htmlFor="cancel_visit_reason"
                                    style={{
                                        display: 'block',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        marginBottom: '6px',
                                    }}
                                >
                                    Alasan Pembatalan (Minimal 5 Karakter) *
                                </label>
                                <textarea
                                    id="cancel_visit_reason"
                                    className="form-control"
                                    style={{ minHeight: '90px', borderRadius: '12px' }}
                                    placeholder="Tuliskan alasan pembatalan kunjungan..."
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                />
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '8px',
                                }}
                            >
                                <button
                                    type="button"
                                    className="btn btn-light-primary btn-sm"
                                    onClick={() => setCancelModalOpen(false)}
                                >
                                    Tutup
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => void handleConfirmCancelVisit()}
                                >
                                    Konfirmasi Batalkan
                                </button>
                            </div>
                        </div>
                    )}
                </Spin>
            </Modal>
        </>
    );
}
