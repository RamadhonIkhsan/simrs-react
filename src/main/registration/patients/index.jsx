import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
    CalendarOutlined,
    CheckCircleOutlined,
    ContainerOutlined,
    DeleteOutlined,
    EditOutlined,
    ExclamationCircleOutlined,
    HistoryOutlined,
    PlusCircleOutlined,
    ReloadOutlined,
    SearchOutlined,
    SettingOutlined,
    UserAddOutlined,
} from '@ant-design/icons';
import { Alert, Col, Dropdown, Empty, Modal, Row, Spin, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import DTAntServerSide from '@/components/util/DTAntServerSide';
import Input from '@/components/util/Input';
import ModalForm from '@/components/util/ModalForm';
import SearchInput from '@/components/util/SearchInput';
import { API } from '@/lib/API';
import { Helper } from '@/lib/Helper';
import confirmStore from '@/store/confirmStore';
import modalStore from '@/store/modal';
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

const visitStatusBadge = (status) => {
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

export default function PatientsPage() {
    const navigate = useNavigate();
    const { notifOpen } = notifStore();
    const { confirmOpen, confirmClose, setConfirmLoading } = confirmStore();
    const {
        modalOpen,
        modalClose,
        FormId,
        modalStat,
        setModalLoading,
        modalDetail,
        setModalDetail,
    } = modalStore();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        getValues,
        control,
        formState: { errors },
    } = useForm();

    const [searchText, setSearchText] = useState('');
    const [filterGender, setFilterGender] = useState('');
    const [filterBloodType, setFilterBloodType] = useState('');
    const [triggerTable, setTriggerTable] = useState(0);

    const [dupChecking, setDupChecking] = useState(false);
    const [dupChecked, setDupChecked] = useState(false);
    const [dupResults, setDupResults] = useState([]);

    const [visitsModalOpen, setVisitsModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientVisits, setPatientVisits] = useState([]);
    const [loadingVisits, setLoadingVisits] = useState(false);

    const watchedGender = useWatch({ control, name: 'gender' });
    const watchedBirthDate = useWatch({ control, name: 'birth_date' });
    const watchedBloodType = useWatch({ control, name: 'blood_type' });

    const searchTimeoutRef = useRef(null);
    const handleSearch = (event) => {
        const val = event.target.value;
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            setSearchText(val);
        }, 400);
    };

    const refreshTable = () => {
        setTriggerTable((prev) => prev + 1);
    };

    const loadPatientById = useCallback(
        async (id) => {
            const response = await API.GET(`/api/patients/${id}`);
            if (response?.status >= 400 || response?.result?.rc >= 400) {
                modalClose();
                notifOpen(
                    'Gagal',
                    response?.result?.rm || 'Gagal memuat detail pasien',
                    'danger'
                );
                return;
            }
            const data = response?.result?.data || {};
            reset({
                medical_record_no: data.medical_record_no || '',
                nik: data.nik || '',
                full_name: data.full_name || '',
                gender: data.gender || undefined,
                birth_date: data.birth_date || undefined,
                birth_place: data.birth_place || '',
                phone: data.phone || '',
                blood_type: data.blood_type || undefined,
                address: data.address || '',
            });
            setModalLoading(false);
        },
        [modalClose, notifOpen, reset, setModalLoading]
    );

    useEffect(() => {
        if (!modalStat) return;
        let active = true;

        Promise.resolve().then(() => {
            if (!active) return;
            setDupResults([]);
            setDupChecked(false);

            if (FormId === 'new') {
                reset({
                    nik: '',
                    full_name: '',
                    gender: undefined,
                    birth_date: undefined,
                    birth_place: '',
                    phone: '',
                    blood_type: undefined,
                    address: '',
                });
                setModalLoading(false);
            } else if (FormId != null) {
                void loadPatientById(FormId);
            }
        });

        return () => {
            active = false;
        };
    }, [modalStat, FormId, reset, setModalLoading, loadPatientById]);

    const handleCheckDuplicate = async () => {
        const rawNik = String(getValues('nik') || '').trim();
        const rawName = String(getValues('full_name') || '').trim();
        const rawBirthDate = getValues('birth_date');
        const rawPhone = String(getValues('phone') || '').trim();

        const formattedBirthDate = rawBirthDate
            ? dayjs(rawBirthDate).format('YYYY-MM-DD')
            : '';

        if (!rawNik && (!rawName || !formattedBirthDate)) {
            notifOpen(
                'Perhatian',
                'Isi NIK (16 digit) atau kombinasi Nama Lengkap + Tanggal Lahir untuk cek duplikat',
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

    const onSubmitPatient = async (formData) => {
        const isEdit = FormId !== 'new' && FormId != null;
        setModalLoading(true);

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

        const response = isEdit
            ? await API.PUT(`/api/patients/${FormId}`, payload)
            : await API.POST('/api/patients', payload);

        setModalLoading(false);

        const isSuccess =
            response?.status < 400 &&
            (response?.result?.rc === 200 || response?.result?.rc === 201);

        if (isSuccess) {
            const savedPatient = response?.result?.data;
            modalClose();
            notifOpen(
                'Berhasil',
                isEdit
                    ? 'Data pasien berhasil diperbarui'
                    : `Pasien terdaftar dengan No. RM: ${savedPatient?.medical_record_no || '-'}`
            );
            refreshTable();
        } else {
            let errMsg = response?.result?.rm || 'Gagal menyimpan data pasien';
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

    const handleDeletePatient = (row) => {
        confirmOpen(
            'Hapus Data Pasien',
            `Yakin ingin menghapus pasien ${row.full_name} (${row.medical_record_no})?`,
            async () => {
                setConfirmLoading(true);
                const response = await API.DELETE(`/api/patients/${row.id}`);
                setConfirmLoading(false);
                confirmClose();

                if (response?.status < 400 && response?.result?.rc === 200) {
                    notifOpen('Berhasil', 'Data pasien berhasil dihapus');
                    refreshTable();
                } else {
                    notifOpen(
                        'Gagal',
                        response?.result?.rm || 'Data pasien tidak dapat dihapus',
                        'danger'
                    );
                }
            }
        );
    };

    const handleOpenVisitsHistory = async (patient) => {
        setSelectedPatient(patient);
        setVisitsModalOpen(true);
        setLoadingVisits(true);
        setPatientVisits([]);

        const response = await API.GET(`/api/patients/${patient.id}/visits?size=50`);
        setLoadingVisits(false);

        if (response?.status === 200) {
            const list = Array.isArray(response?.result?.data) ? response.result.data : [];
            setPatientVisits(list);
        } else {
            notifOpen(
                'Gagal',
                response?.result?.rm || 'Gagal memuat riwayat kunjungan pasien',
                'danger'
            );
        }
    };

    const goToRegisterVisit = (patient) => {
        navigate(
            `/main/registration/visits?patient_id=${patient.id}&mr=${encodeURIComponent(
                patient.medical_record_no || ''
            )}&name=${encodeURIComponent(patient.full_name || '')}`
        );
    };

    const columns = [
        {
            title: 'No',
            key: 'no',
            width: '55px',
            align: 'center',
        },
        {
            title: 'No. RM',
            dataIndex: 'medical_record_no',
            width: '130px',
            render: (val) => <span className="fw-7 text-primary">{val || '-'}</span>,
        },
        {
            title: 'NIK',
            dataIndex: 'nik',
            width: '155px',
            render: (val) => val || <span className="text-muted">-</span>,
        },
        {
            title: 'Nama Pasien',
            dataIndex: 'full_name',
            render: (val, row) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{val || '-'}</div>
                    {row.address ? (
                        <div className="text-muted" style={{ fontSize: '11px' }}>
                            {Helper.limitString(row.address, 45)}
                        </div>
                    ) : null}
                </div>
            ),
        },
        {
            title: 'L/P',
            dataIndex: 'gender',
            width: '70px',
            align: 'center',
            render: (val) => (
                <Tag color={val === 'L' ? 'blue' : 'magenta'} style={{ margin: 0 }}>
                    {val || '-'}
                </Tag>
            ),
        },
        {
            title: 'Tgl. Lahir / Usia',
            dataIndex: 'birth_date',
            width: '165px',
            render: (val, row) => (
                <div>
                    <div>{val ? Helper.formatDate(val, 'd-mm-Y') : '-'}</div>
                    {row.age !== null && row.age !== undefined ? (
                        <div className="text-muted" style={{ fontSize: '11px' }}>
                            {row.age} tahun
                        </div>
                    ) : null}
                </div>
            ),
        },
        {
            title: 'Gol. Darah',
            dataIndex: 'blood_type',
            width: '95px',
            align: 'center',
            render: (val) => val || '-',
        },
        {
            title: 'Telepon',
            dataIndex: 'phone',
            width: '135px',
            render: (val) => val || '-',
        },
        {
            title: 'Aksi Cepat',
            key: 'quick_visit',
            width: '165px',
            align: 'center',
            render: (_, row) => (
                <button
                    type="button"
                    className="btn btn-light-primary btn-sm my-1"
                    onClick={() => goToRegisterVisit(row)}
                    title="Daftarkan Kunjungan Poliklinik"
                >
                    <CalendarOutlined />
                    Daftar Kunjungan
                </button>
            ),
        },
        {
            title: '',
            key: 'act',
            width: '55px',
            align: 'center',
            render: (_, row) => {
                const items = [
                    {
                        key: 'visit',
                        label: (
                            <button
                                type="button"
                                onClick={() => goToRegisterVisit(row)}
                                className="dropdown-item w-full"
                            >
                                <CalendarOutlined className="text-primary me-2" />
                                Buat Kunjungan Baru
                            </button>
                        ),
                    },
                    {
                        key: 'history',
                        label: (
                            <button
                                type="button"
                                onClick={() => void handleOpenVisitsHistory(row)}
                                className="dropdown-item w-full"
                            >
                                <HistoryOutlined className="text-muted me-2" />
                                Riwayat Kunjungan
                            </button>
                        ),
                    },
                    {
                        key: 'detail',
                        label: (
                            <button
                                type="button"
                                onClick={() => {
                                    modalOpen(row.id);
                                    setModalDetail(true);
                                }}
                                className="dropdown-item w-full"
                            >
                                <ContainerOutlined className="text-muted me-2" />
                                Detail Pasien
                            </button>
                        ),
                    },
                    {
                        key: 'edit',
                        label: (
                            <button
                                type="button"
                                onClick={() => {
                                    setModalDetail(false);
                                    modalOpen(row.id);
                                }}
                                className="dropdown-item w-full"
                            >
                                <EditOutlined className="text-muted me-2" />
                                Ubah Data Pasien
                            </button>
                        ),
                    },
                    {
                        key: 'delete',
                        label: (
                            <button
                                type="button"
                                onClick={() => handleDeletePatient(row)}
                                className="dropdown-item w-full"
                            >
                                <DeleteOutlined className="text-danger me-2" />
                                Hapus Pasien
                            </button>
                        ),
                    },
                ];

                return (
                    <Dropdown trigger={['click']} placement="bottomRight" arrow menu={{ items }}>
                        <button
                            type="button"
                            className="btn btn-circle btn-light-primary my-1 btn-sm"
                            aria-label={`Opsi untuk pasien ${row.full_name}`}
                        >
                            <SettingOutlined />
                        </button>
                    </Dropdown>
                );
            },
        },
    ];

    return (
        <>
            <div className="containers">
                <div className="headContent" style={{ minHeight: '40px' }}>
                    <div className="containerTitle">
                        <div className="breadCrumb">
                            <div className="text">Pendaftaran</div>
                            <div className="text">Data Pasien</div>
                        </div>
                        <div className="title text-dark-grey left">
                            Registrasi &amp; Direktori Pasien
                        </div>
                    </div>

                    <div className="filter mb-3">
                        <select
                            aria-label="Filter Jenis Kelamin"
                            className="form-control"
                            style={{ width: '150px', height: '38px', padding: '0 14px' }}
                            value={filterGender}
                            onChange={(e) => {
                                setFilterGender(e.target.value);
                                refreshTable();
                            }}
                        >
                            <option value="">Semua Gender</option>
                            <option value="L">Laki-laki (L)</option>
                            <option value="P">Perempuan (P)</option>
                        </select>

                        <select
                            aria-label="Filter Golongan Darah"
                            className="form-control"
                            style={{ width: '145px', height: '38px', padding: '0 14px' }}
                            value={filterBloodType}
                            onChange={(e) => {
                                setFilterBloodType(e.target.value);
                                refreshTable();
                            }}
                        >
                            <option value="">Semua Gol. Darah</option>
                            {bloodTypeOptions.map((b) => (
                                <option key={b.value} value={b.value}>
                                    Gol. {b.label}
                                </option>
                            ))}
                        </select>

                        <SearchInput handleSearch={handleSearch} />

                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                                setModalDetail(false);
                                modalOpen('new');
                            }}
                        >
                            <UserAddOutlined />
                            Pasien Baru
                        </button>

                        <button
                            type="button"
                            className="btn btn-light-primary"
                            onClick={() => navigate('/main/registration/visits')}
                        >
                            <PlusCircleOutlined />
                            Loket Antrean
                        </button>

                        <button
                            type="button"
                            className="btn btn-circle btn-light-primary"
                            onClick={refreshTable}
                            aria-label="Muat ulang data pasien"
                        >
                            <ReloadOutlined />
                        </button>
                    </div>
                </div>

                <div className="bodyContent">
                    <div className="card-table" style={{ minHeight: '200px' }}>
                        <DTAntServerSide
                            searchText={searchText}
                            filter={{
                                gender: filterGender,
                                blood_type: filterBloodType,
                            }}
                            endPoint="/api/patients"
                            triger={triggerTable}
                            columnTable={columns}
                            keyTable="id"
                        />
                    </div>
                </div>
            </div>

            <ModalForm
                size="680px"
                title="Data Pasien"
                subTitle={
                    modalDetail
                        ? 'Detail Identitas Rekam Medis Pasien'
                        : FormId !== 'new'
                          ? 'Perbarui Identitas Pasien'
                          : 'Registrasi Pasien Baru (No. RM Otomatis)'
                }
                action={
                    modalDetail ? null : (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                width: '100%',
                            }}
                        >
                            <button
                                type="button"
                                className="btn btn-light-primary btn-sm"
                                onClick={() => void handleCheckDuplicate()}
                                disabled={dupChecking}
                            >
                                <SearchOutlined />
                                {dupChecking ? 'Memeriksa...' : 'Cek Duplikat Pasien'}
                            </button>

                            <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={handleSubmit(onSubmitPatient)}
                            >
                                Simpan Data Pasien
                            </button>
                        </div>
                    )
                }
            >
                <form onSubmit={handleSubmit(onSubmitPatient)}>
                    <Row gutter={16}>
                        {FormId !== 'new' && (
                            <Col xs={24} sm={12}>
                                <Input.Text
                                    title="Nomor Rekam Medis (No. RM)"
                                    name="medical_record_no"
                                    setReadonly={true}
                                    required={false}
                                    register={register}
                                    error={errors}
                                />
                            </Col>
                        )}

                        <Col xs={24} sm={FormId !== 'new' ? 12 : 12}>
                            <Input.Number
                                title="NIK (16 Digit - Opsional)"
                                name="nik"
                                maxlength={16}
                                minlength={16}
                                setReadonly={modalDetail}
                                required={false}
                                register={register}
                                error={errors}
                            />
                        </Col>

                        <Col xs={24} sm={FormId !== 'new' ? 24 : 12}>
                            <Input.Text
                                title="Nama Lengkap Pasien"
                                name="full_name"
                                maxlength={120}
                                setReadonly={modalDetail}
                                required={true}
                                register={register}
                                error={errors}
                            />
                        </Col>

                        <Col xs={24} sm={12}>
                            <Input.Select
                                title="Jenis Kelamin"
                                name="gender"
                                required={true}
                                register={register}
                                error={errors}
                                setReadonly={modalDetail}
                                options={genderOptions}
                                val={watchedGender}
                                placeholder="Pilih Jenis Kelamin"
                                setValue={setValue}
                            />
                        </Col>

                        <Col xs={24} sm={12}>
                            <Input.Date
                                title="Tanggal Lahir"
                                name="birth_date"
                                setValue={setValue}
                                setReadonly={modalDetail}
                                required={true}
                                value={watchedBirthDate}
                                maxDate={Helper.today()}
                                register={register}
                                error={errors}
                            />
                        </Col>

                        <Col xs={24} sm={12}>
                            <Input.Text
                                title="Tempat Lahir"
                                name="birth_place"
                                maxlength={80}
                                setReadonly={modalDetail}
                                required={false}
                                register={register}
                                error={errors}
                            />
                        </Col>

                        <Col xs={24} sm={12}>
                            <Input.Number
                                title="No. Telepon / HP"
                                name="phone"
                                maxlength={20}
                                setReadonly={modalDetail}
                                required={false}
                                register={register}
                                error={errors}
                            />
                        </Col>

                        <Col xs={24} sm={12}>
                            <Input.Select
                                title="Golongan Darah (Opsional)"
                                name="blood_type"
                                required={false}
                                register={register}
                                error={errors}
                                setReadonly={modalDetail}
                                options={bloodTypeOptions}
                                val={watchedBloodType}
                                placeholder="Pilih Golongan Darah"
                                setValue={setValue}
                            />
                        </Col>

                        <Col xs={24}>
                            <Input.Textarea
                                title="Alamat Lengkap"
                                name="address"
                                maxlength={500}
                                setReadonly={modalDetail}
                                required={false}
                                register={register}
                                error={errors}
                                rows={3}
                            />
                        </Col>
                    </Row>

                    {dupChecked && (
                        <div style={{ marginTop: '8px' }}>
                            {dupResults.length === 0 ? (
                                <Alert
                                    type="success"
                                    showIcon
                                    icon={<CheckCircleOutlined />}
                                    message="Tidak ditemukan duplikasi pasien dengan NIK atau Nama + Tanggal Lahir tersebut."
                                />
                            ) : (
                                <Alert
                                    type="warning"
                                    showIcon
                                    icon={<ExclamationCircleOutlined />}
                                    message={`Ditemukan ${dupResults.length} data pasien yang mirip / identik:`}
                                    description={
                                        <div style={{ marginTop: '8px' }}>
                                            {dupResults.map((p) => (
                                                <div
                                                    key={p.id}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '6px 0',
                                                        borderBottom:
                                                            '1px dashed rgba(0, 0, 0, 0.1)',
                                                    }}
                                                >
                                                    <div>
                                                        <strong>{p.medical_record_no}</strong> -{' '}
                                                        {p.full_name} (Lahir: {p.birth_date || '-'}
                                                        , Telp: {p.phone || '-'})
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="btn btn-light-primary btn-sm"
                                                        onClick={() => {
                                                            modalClose();
                                                            goToRegisterVisit(p);
                                                        }}
                                                    >
                                                        Gunakan Pasien Ini
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    }
                                />
                            )}
                        </div>
                    )}
                </form>
            </ModalForm>

            <Modal
                centered
                open={visitsModalOpen}
                onCancel={() => setVisitsModalOpen(false)}
                footer={null}
                width="760px"
                title={
                    selectedPatient
                        ? `Riwayat Kunjungan - ${selectedPatient.full_name} (${selectedPatient.medical_record_no})`
                        : 'Riwayat Kunjungan Pasien'
                }
            >
                <Spin spinning={loadingVisits}>
                    {patientVisits.length === 0 && !loadingVisits ? (
                        <Empty description="Pasien ini belum memiliki riwayat kunjungan" />
                    ) : (
                        <Table
                            size="small"
                            rowKey="id"
                            pagination={{ pageSize: 5 }}
                            dataSource={patientVisits}
                            columns={[
                                {
                                    title: 'No. Kunjungan',
                                    dataIndex: 'visit_no',
                                    render: (val) => <span className="fw-7">{val}</span>,
                                },
                                {
                                    title: 'Tanggal',
                                    dataIndex: 'visit_date',
                                    render: (val) => (val ? Helper.formatDate(val, 'd-mm-Y') : '-'),
                                },
                                {
                                    title: 'Antrean',
                                    dataIndex: 'queue_no',
                                    align: 'center',
                                    render: (val) => <span className="fw-7">#{val}</span>,
                                },
                                {
                                    title: 'Poli',
                                    render: (_, r) => r.poli?.name || '-',
                                },
                                {
                                    title: 'Dokter',
                                    render: (_, r) => r.doctor?.full_name || '-',
                                },
                                {
                                    title: 'Biaya Daftar',
                                    dataIndex: 'registration_fee',
                                    render: (val) => `Rp ${Helper.numFormat(val || 0)}`,
                                },
                                {
                                    title: 'Status',
                                    dataIndex: 'status',
                                    align: 'center',
                                    render: (st) => visitStatusBadge(st),
                                },
                            ]}
                        />
                    )}
                </Spin>
            </Modal>
        </>
    );
}
