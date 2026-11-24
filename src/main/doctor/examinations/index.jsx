import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Card,
    Col,
    DatePicker,
    Descriptions,
    Empty,
    InputNumber,
    Modal,
    Radio,
    Row,
    Select,
    Spin,
    Table,
    Tabs,
    Tag,
} from 'antd';
import {
    ArrowLeftOutlined,
    AuditOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    EditOutlined,
    ExclamationCircleOutlined,
    FileDoneOutlined,
    FileSearchOutlined,
    HeartOutlined,
    HistoryOutlined,
    MedicineBoxOutlined,
    NotificationOutlined,
    PlayCircleOutlined,
    PlusCircleOutlined,
    ProfileOutlined,
    ReloadOutlined,
    RollbackOutlined,
    SaveOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { API } from '@/lib/API';
import { DropdownAPI } from '@/lib/DropdownAPI';
import { Helper } from '@/lib/Helper';
import confirmStore from '@/store/confirmStore';
import notifStore from '@/store/notifStore';

const emptyVitalSigns = {
    systolic: '',
    diastolic: '',
    pulse: '',
    resp_rate: '',
    temperature: '',
    spo2: '',
    weight_kg: '',
    height_cm: '',
};

const emptySoap = {
    complaint: '',
    anamnesis: '',
    physical_exam: '',
    plan_notes: '',
};

const extractApiError = (response, defaultMsg) => {
    let errMsg = response?.result?.rm || response?.result?.message || defaultMsg;
    const errData = response?.result?.data;
    if (errData && typeof errData === 'object' && !Array.isArray(errData)) {
        const firstKey = Object.keys(errData)[0];
        const firstVal = Array.isArray(errData[firstKey])
            ? errData[firstKey][0]
            : errData[firstKey];
        if (firstVal) {
            errMsg = `${errMsg}: ${firstVal}`;
        }
    }
    return errMsg;
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
            style={{ cursor: 'default', height: '28px', padding: '0 12px' }}
        >
            {cfg.label}
        </span>
    );
};

const renderExamStatusBadge = (status) => {
    if (!status) {
        return <span className="text-muted" style={{ fontSize: '12px' }}>Belum Dimulai</span>;
    }
    const isFinal = status === 'FINAL';
    return (
        <Tag color={isFinal ? 'green' : 'gold'} style={{ margin: 0, fontWeight: 600 }}>
            {status}
        </Tag>
    );
};

export default function DoctorExaminationsPage() {
    const { notifOpen } = notifStore();
    const { confirmOpen, confirmClose, setConfirmLoading } = confirmStore();

    const [queueViewMode, setQueueViewMode] = useState('waiting');
    const [filterDate, setFilterDate] = useState(Helper.today());
    const [filterStatus, setFilterStatus] = useState('');
    const [searchText, setSearchText] = useState('');

    const [waitingList, setWaitingList] = useState([]);
    const [allVisitsList, setAllVisitsList] = useState([]);
    const [loadingQueue, setLoadingQueue] = useState(false);
    const [queueError, setQueueError] = useState(null);
    const [actingVisitId, setActingVisitId] = useState(null);

    const [activeExam, setActiveExam] = useState(null);
    const [loadingExam, setLoadingExam] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);
    const [finalizingExam, setFinalizingExam] = useState(false);
    const [finishingVisit, setFinishingVisit] = useState(false);

    const [vitalForm, setVitalForm] = useState(emptyVitalSigns);
    const [soapForm, setSoapForm] = useState(emptySoap);
    const [diagnosesList, setDiagnosesList] = useState([]);

    const [icdOptions, setIcdOptions] = useState([]);
    const [icdSearching, setIcdSearching] = useState(false);
    const [selectedIcdOption, setSelectedIcdOption] = useState(null);
    const [newDiagType, setNewDiagType] = useState('PRIMARY');
    const [newDiagNotes, setNewDiagNotes] = useState('');

    const [procedureOptions, setProcedureOptions] = useState([]);
    const [visitProceduresData, setVisitProceduresData] = useState({
        items: [],
        summary: { active_count: 0, total_qty: 0, total_tariff: 0 },
    });
    const [loadingProcedures, setLoadingProcedures] = useState(false);
    const [selectedProcId, setSelectedProcId] = useState(undefined);
    const [selectedProcQty, setSelectedProcQty] = useState(1);
    const [stagedProcedures, setStagedProcedures] = useState([]);
    const [doneProcedureReason, setDoneProcedureReason] = useState('');
    const [submittingProcedures, setSubmittingProcedures] = useState(false);

    const [voidModalOpen, setVoidModalOpen] = useState(false);
    const [voidTargetItem, setVoidTargetItem] = useState(null);
    const [voidReason, setVoidReason] = useState('');
    const [voidSubmitting, setVoidSubmitting] = useState(false);

    const [isRevisingMode, setIsRevisingMode] = useState(false);
    const [revisionReason, setRevisionReason] = useState('');
    const [submittingRevision, setSubmittingRevision] = useState(false);

    const [revisionsList, setRevisionsList] = useState([]);
    const [loadingRevisions, setLoadingRevisions] = useState(false);
    const [revisionDetailModal, setRevisionDetailModal] = useState(false);
    const [selectedRevisionDetail, setSelectedRevisionDetail] = useState(null);
    const [loadingRevisionDetail, setLoadingRevisionDetail] = useState(false);

    const [medicalHistoryList, setMedicalHistoryList] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const icdSearchTimerRef = useRef(null);

    const hydrateExamForm = useCallback((examData) => {
        if (!examData) return;
        const vs = examData.vital_sign || {};
        setVitalForm({
            systolic: vs.systolic ?? '',
            diastolic: vs.diastolic ?? '',
            pulse: vs.pulse ?? '',
            resp_rate: vs.resp_rate ?? '',
            temperature: vs.temperature ?? '',
            spo2: vs.spo2 ?? '',
            weight_kg: vs.weight_kg ?? '',
            height_cm: vs.height_cm ?? '',
        });

        setSoapForm({
            complaint: examData.complaint || '',
            anamnesis: examData.anamnesis || '',
            physical_exam: examData.physical_exam || '',
            plan_notes: examData.plan_notes || '',
        });

        const diags = Array.isArray(examData.diagnoses)
            ? examData.diagnoses.map((d) => ({
                  icd10_code: d.icd10_code,
                  icd10_name: d.icd10_name || '',
                  type: d.type || 'SECONDARY',
                  notes: d.notes || '',
              }))
            : [];
        setDiagnosesList(diags);

        const hasPrimary = diags.some((d) => d.type === 'PRIMARY');
        setNewDiagType(hasPrimary ? 'SECONDARY' : 'PRIMARY');
    }, []);

    const fetchWaitingQueue = useCallback(async (dateVal) => {
        setLoadingQueue(true);
        setQueueError(null);
        const res = await API.GET(
            `/api/examinations/waiting?date=${encodeURIComponent(dateVal)}`
        );
        setLoadingQueue(false);

        if (res?.status === 200 && res?.result?.rc === 200) {
            setWaitingList(Array.isArray(res.result.data) ? res.result.data : []);
        } else {
            setWaitingList([]);
            setQueueError(
                extractApiError(
                    res,
                    'Gagal memuat daftar antrean pemeriksaan dokter. Pastikan akun yang login memiliki Role DOCTOR.'
                )
            );
        }
    }, []);

    const fetchAllDoctorVisits = useCallback(async (dateVal) => {
        setLoadingQueue(true);
        setQueueError(null);
        const res = await API.GET(
            `/api/visits?visit_date=${encodeURIComponent(dateVal)}&size=100`
        );
        setLoadingQueue(false);

        if (res?.status === 200 && Array.isArray(res?.result?.data)) {
            setAllVisitsList(res.result.data);
        } else {
            setAllVisitsList([]);
            setQueueError(
                extractApiError(res, 'Gagal memuat riwayat kunjungan dokter pada tanggal ini.')
            );
        }
    }, []);

    const refreshQueue = useCallback(() => {
        if (queueViewMode === 'waiting') {
            void fetchWaitingQueue(filterDate);
        } else {
            void fetchAllDoctorVisits(filterDate);
        }
    }, [queueViewMode, filterDate, fetchWaitingQueue, fetchAllDoctorVisits]);

    useEffect(() => {
        let active = true;
        Promise.resolve().then(() => {
            if (!active) return;
            refreshQueue();
        });
        return () => {
            active = false;
        };
    }, [refreshQueue]);

    useEffect(() => {
        let active = true;
        const loadMasterProcedures = async () => {
            const list = await DropdownAPI.procedures();
            if (!active) return;
            setProcedureOptions(list);
        };
        void loadMasterProcedures();
        return () => {
            active = false;
        };
    }, []);

    const fetchVisitProcedures = useCallback(async (visitId) => {
        if (!visitId) return;
        setLoadingProcedures(true);
        const res = await API.GET(`/api/visits/${visitId}/procedures?include_voided=true`);
        setLoadingProcedures(false);

        if (res?.status === 200 && res?.result?.rc === 200 && res.result.data) {
            setVisitProceduresData({
                items: Array.isArray(res.result.data.items) ? res.result.data.items : [],
                summary: res.result.data.summary || {
                    active_count: 0,
                    total_qty: 0,
                    total_tariff: 0,
                },
            });
        }
    }, []);

    const fetchPatientMedicalHistory = useCallback(async (patientId) => {
        if (!patientId) return;
        setLoadingHistory(true);
        const res = await API.GET(`/api/patients/${patientId}/medical-records?size=20`);
        setLoadingHistory(false);

        if (res?.status === 200 && Array.isArray(res?.result?.data)) {
            setMedicalHistoryList(res.result.data);
        } else {
            setMedicalHistoryList([]);
        }
    }, []);

    const fetchExamRevisions = useCallback(async (examId) => {
        if (!examId) return;
        setLoadingRevisions(true);
        const res = await API.GET(`/api/examinations/${examId}/revisions`);
        setLoadingRevisions(false);

        if (res?.status === 200 && res?.result?.rc === 200) {
            setRevisionsList(Array.isArray(res.result.data) ? res.result.data : []);
        } else {
            setRevisionsList([]);
        }
    }, []);

    const openWorkspaceWithExamData = useCallback(
        (examData) => {
            setActiveExam(examData);
            setIsRevisingMode(false);
            setRevisionReason('');
            setStagedProcedures([]);
            setDoneProcedureReason('');
            setSelectedProcId(undefined);
            setSelectedProcQty(1);
            hydrateExamForm(examData);

            if (examData?.visit_id) {
                void fetchVisitProcedures(examData.visit_id);
            }
            if (examData?.patient?.id) {
                void fetchPatientMedicalHistory(examData.patient.id);
            }
            if (examData?.id) {
                void fetchExamRevisions(examData.id);
            }
        },
        [hydrateExamForm, fetchVisitProcedures, fetchPatientMedicalHistory, fetchExamRevisions]
    );

    const handleLoadExaminationById = useCallback(
        async (examId) => {
            setLoadingExam(true);
            const res = await API.GET(`/api/examinations/${examId}`);
            setLoadingExam(false);

            if (res?.status === 200 && res?.result?.rc === 200 && res.result.data) {
                openWorkspaceWithExamData(res.result.data);
            } else {
                notifOpen(
                    'Gagal Memuat Pemeriksaan',
                    extractApiError(res, 'Data pemeriksaan tidak dapat dimuat'),
                    'danger'
                );
            }
        },
        [notifOpen, openWorkspaceWithExamData]
    );

    const handleStartOrContinueExamination = async (visitId, existingExamId = null) => {
        if (existingExamId) {
            await handleLoadExaminationById(existingExamId);
            return;
        }

        setActingVisitId(visitId);
        const res = await API.POST(`/api/visits/${visitId}/examination/start`, {});
        setActingVisitId(null);

        if (res?.status < 400 && res?.result?.rc === 200 && res.result.data) {
            const examData = res.result.data;
            notifOpen(
                'Pemeriksaan Dimulai',
                `Kunjungan ${examData.visit?.visit_no || ''} berstatus EXAMINING (Examination #${
                    examData.id
                } - ${examData.status})`
            );
            openWorkspaceWithExamData(examData);
            refreshQueue();
        } else {
            notifOpen(
                'Gagal Memulai Pemeriksaan',
                extractApiError(res, 'Tidak dapat memulai pemeriksaan untuk kunjungan ini'),
                'danger'
            );
        }
    };

    const handleCallOrRevertPatient = async (visitId, targetStatus) => {
        setActingVisitId(visitId);
        const res = await API.PUT(`/api/visits/${visitId}/status`, { status: targetStatus });
        setActingVisitId(null);

        if (res?.status < 400 && res?.result?.rc === 200) {
            const updated = res.result.data;
            notifOpen(
                'Status Antrean Diperbarui',
                `Antrean #${updated?.queue_no || ''} (${
                    updated?.patient?.full_name || ''
                }) -> ${targetStatus}`
            );
            refreshQueue();
        } else {
            notifOpen(
                'Gagal Mengubah Status',
                extractApiError(res, 'Gagal memperbarui status panggilan pasien'),
                'danger'
            );
        }
    };

    const handleIcdSearch = (keyword) => {
        if (icdSearchTimerRef.current) {
            clearTimeout(icdSearchTimerRef.current);
        }
        const trimmed = String(keyword || '').trim();
        if (trimmed.length < 2) {
            setIcdOptions([]);
            return;
        }
        icdSearchTimerRef.current = setTimeout(async () => {
            setIcdSearching(true);
            const list = await DropdownAPI.diagnose(trimmed);
            setIcdSearching(false);
            setIcdOptions(list);
        }, 300);
    };

    const handleAddDiagnosisToList = () => {
        if (!selectedIcdOption?.code) {
            notifOpen('Validasi Diagnosa', 'Pilih kode ICD-10 terlebih dahulu', 'warning');
            return;
        }

        const code = String(selectedIcdOption.code).toUpperCase().trim();
        if (diagnosesList.some((d) => d.icd10_code === code)) {
            notifOpen(
                'Diagnosa Duplikat',
                `Kode ICD-10 ${code} sudah ada dalam daftar diagnosa pemeriksaan ini`,
                'warning'
            );
            return;
        }

        let updatedList = [...diagnosesList];
        if (newDiagType === 'PRIMARY') {
            updatedList = updatedList.map((d) =>
                d.type === 'PRIMARY' ? { ...d, type: 'SECONDARY' } : d
            );
        }

        updatedList.push({
            icd10_code: code,
            icd10_name: selectedIcdOption.name || '',
            type: newDiagType,
            notes: String(newDiagNotes || '').trim(),
        });

        setDiagnosesList(updatedList);
        setSelectedIcdOption(null);
        setNewDiagNotes('');
        setNewDiagType('SECONDARY');
    };

    const handleSetPrimaryDiagnosis = (targetCode) => {
        setDiagnosesList((prev) =>
            prev.map((d) => ({
                ...d,
                type: d.icd10_code === targetCode ? 'PRIMARY' : 'SECONDARY',
            }))
        );
    };

    const handleRemoveDiagnosis = (targetCode) => {
        setDiagnosesList((prev) => {
            const next = prev.filter((d) => d.icd10_code !== targetCode);
            const stillHasPrimary = next.some((d) => d.type === 'PRIMARY');
            if (!stillHasPrimary) {
                setNewDiagType('PRIMARY');
            }
            return next;
        });
    };

    const buildClinicalPayload = () => {
        const parseNum = (val, isFloat = false) => {
            if (val === '' || val === null || val === undefined) return null;
            const parsed = isFloat ? parseFloat(val) : parseInt(val, 10);
            return Number.isNaN(parsed) ? null : parsed;
        };

        return {
            complaint: String(soapForm.complaint || '').trim() || null,
            anamnesis: String(soapForm.anamnesis || '').trim() || null,
            physical_exam: String(soapForm.physical_exam || '').trim() || null,
            plan_notes: String(soapForm.plan_notes || '').trim() || null,
            vital_sign: {
                systolic: parseNum(vitalForm.systolic, false),
                diastolic: parseNum(vitalForm.diastolic, false),
                pulse: parseNum(vitalForm.pulse, false),
                resp_rate: parseNum(vitalForm.resp_rate, false),
                temperature: parseNum(vitalForm.temperature, true),
                spo2: parseNum(vitalForm.spo2, false),
                weight_kg: parseNum(vitalForm.weight_kg, true),
                height_cm: parseNum(vitalForm.height_cm, true),
            },
            diagnoses: diagnosesList.map((d) => ({
                icd10_code: d.icd10_code,
                type: d.type,
                notes: d.notes ? String(d.notes).trim() : null,
            })),
        };
    };

    const validateLocalVitalSigns = (vs) => {
        if (vs.systolic !== null && vs.diastolic !== null && vs.diastolic >= vs.systolic) {
            notifOpen(
                'Validasi Tanda Vital',
                'Tekanan darah diastolik harus lebih kecil dari tekanan darah sistolik',
                'warning'
            );
            return false;
        }
        return true;
    };

    const handleSaveDraftExamination = async (silent = false) => {
        if (!activeExam?.id) return null;

        const payload = buildClinicalPayload();
        if (!validateLocalVitalSigns(payload.vital_sign)) {
            return null;
        }

        setSavingDraft(true);
        const res = await API.PUT(`/api/examinations/${activeExam.id}`, payload);
        setSavingDraft(false);

        if (res?.status < 400 && res?.result?.rc === 200 && res.result.data) {
            setActiveExam(res.result.data);
            hydrateExamForm(res.result.data);
            if (!silent) {
                notifOpen(
                    'Draft Tersimpan',
                    'Data tanda vital, SOAP, dan diagnosa ICD-10 berhasil disimpan.'
                );
            }
            return res.result.data;
        }

        notifOpen(
            'Gagal Menyimpan Pemeriksaan',
            extractApiError(res, 'Terjadi kesalahan saat menyimpan data pemeriksaan'),
            'danger'
        );
        return null;
    };

    const handleFinalizeExamination = async () => {
        if (!activeExam?.id) return;

        const payload = buildClinicalPayload();
        if (!validateLocalVitalSigns(payload.vital_sign)) {
            return;
        }

        if (!payload.complaint) {
            notifOpen(
                'Syarat Finalisasi Belum Lengkap',
                'Keluhan Utama (Chief Complaint) pada SOAP wajib diisi sebelum finalisasi.',
                'warning'
            );
            return;
        }

        const hasAnyVital = Object.values(payload.vital_sign).some(
            (v) => v !== null && v !== ''
        );
        if (!hasAnyVital) {
            notifOpen(
                'Syarat Finalisasi Belum Lengkap',
                'Minimal satu pengukuran Tanda Vital wajib diisi sebelum finalisasi.',
                'warning'
            );
            return;
        }

        const primaryCount = payload.diagnoses.filter((d) => d.type === 'PRIMARY').length;
        if (primaryCount !== 1) {
            notifOpen(
                'Syarat Finalisasi Belum Lengkap',
                'Pemeriksaan wajib memiliki tepat 1 diagnosa utama (PRIMARY) ICD-10 sebelum finalisasi.',
                'warning'
            );
            return;
        }

        confirmOpen(
            'Finalisasi Pemeriksaan Medis (EMR)',
            'Pastikan Tanda Vital, SOAP, dan Diagnosa ICD-10 sudah benar. Setelah berstatus FINAL, perubahan hanya dapat dilakukan melalui mekanisme Revisi Terkendali. Lanjutkan finalisasi?',
            async () => {
                setConfirmLoading(true);
                setFinalizingExam(true);

                const savedDraft = await handleSaveDraftExamination(true);
                if (!savedDraft) {
                    setConfirmLoading(false);
                    setFinalizingExam(false);
                    confirmClose();
                    return;
                }

                const res = await API.POST(
                    `/api/examinations/${activeExam.id}/finalize`,
                    {}
                );
                setConfirmLoading(false);
                setFinalizingExam(false);
                confirmClose();

                if (res?.status < 400 && res?.result?.rc === 200 && res.result.data) {
                    setActiveExam(res.result.data);
                    hydrateExamForm(res.result.data);
                    notifOpen(
                        'Pemeriksaan Difinalisasi (FINAL)',
                        'Status Examination telah berubah menjadi FINAL. Anda kini dapat menyelesaikan kunjungan pasien.'
                    );
                    refreshQueue();
                } else {
                    notifOpen(
                        'Gagal Finalisasi Pemeriksaan',
                        extractApiError(res, 'Pemeriksaan belum memenuhi syarat finalisasi'),
                        'danger'
                    );
                }
            }
        );
    };

    const handleSubmitRevision = async () => {
        if (!activeExam?.id) return;
        const trimmedReason = String(revisionReason || '').trim();
        if (trimmedReason.length < 10) {
            notifOpen(
                'Validasi Revisi',
                'Alasan revisi (reason) wajib diisi minimal 10 karakter',
                'warning'
            );
            return;
        }

        const payload = {
            ...buildClinicalPayload(),
            version: Number(activeExam.version),
            reason: trimmedReason,
        };

        if (!validateLocalVitalSigns(payload.vital_sign)) {
            return;
        }

        setSubmittingRevision(true);
        const res = await API.POST(`/api/examinations/${activeExam.id}/revise`, payload);
        setSubmittingRevision(false);

        if (res?.status < 400 && res?.result?.rc === 200 && res.result.data) {
            const updated = res.result.data;
            setActiveExam(updated);
            hydrateExamForm(updated);
            setIsRevisingMode(false);
            setRevisionReason('');
            notifOpen(
                'Revisi Pemeriksaan Tersimpan',
                `Rekam medis berhasil direvisi ke Versi v${updated.version}.`
            );
            void fetchExamRevisions(updated.id);
        } else {
            notifOpen(
                'Gagal Menyimpan Revisi',
                extractApiError(res, 'Gagal merevisi data pemeriksaan'),
                'danger'
            );
        }
    };

    const handleViewRevisionSnapshot = async (versionNo) => {
        if (!activeExam?.id) return;
        setRevisionDetailModal(true);
        setLoadingRevisionDetail(true);
        setSelectedRevisionDetail(null);

        const res = await API.GET(
            `/api/examinations/${activeExam.id}/revisions/${versionNo}`
        );
        setLoadingRevisionDetail(false);

        if (res?.status === 200 && res?.result?.rc === 200 && res.result.data) {
            setSelectedRevisionDetail(res.result.data);
        } else {
            setRevisionDetailModal(false);
            notifOpen(
                'Gagal Memuat Snapshot',
                extractApiError(res, 'Tidak dapat memuat detail snapshot revisi'),
                'danger'
            );
        }
    };

    const handleStageProcedureItem = () => {
        if (!selectedProcId) {
            notifOpen('Validasi Tindakan', 'Pilih tindakan medis terlebih dahulu', 'warning');
            return;
        }
        const qty = Number(selectedProcQty || 1);
        if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
            notifOpen('Validasi Jumlah', 'Jumlah tindakan (qty) harus antara 1 - 99', 'warning');
            return;
        }

        const procObj = procedureOptions.find((p) => Number(p.value) === Number(selectedProcId));
        if (!procObj) return;

        setStagedProcedures((prev) => {
            const existingIdx = prev.findIndex(
                (item) => Number(item.procedure_id) === Number(procObj.value)
            );
            if (existingIdx >= 0) {
                const next = [...prev];
                const combinedQty = Math.min(99, next[existingIdx].qty + qty);
                next[existingIdx] = {
                    ...next[existingIdx],
                    qty: combinedQty,
                    subtotal: combinedQty * Number(procObj.tariff || 0),
                };
                return next;
            }
            return [
                ...prev,
                {
                    procedure_id: Number(procObj.value),
                    code: procObj.code,
                    name: procObj.label,
                    tariff: Number(procObj.tariff || 0),
                    qty,
                    subtotal: qty * Number(procObj.tariff || 0),
                },
            ];
        });

        setSelectedProcId(undefined);
        setSelectedProcQty(1);
    };

    const handleSaveProceduresToVisit = async () => {
        const visitId = activeExam?.visit_id;
        if (!visitId) return;

        let itemsToSend = stagedProcedures.map((s) => ({
            procedure_id: Number(s.procedure_id),
            qty: Number(s.qty),
        }));

        if (itemsToSend.length === 0 && selectedProcId) {
            itemsToSend = [
                {
                    procedure_id: Number(selectedProcId),
                    qty: Number(selectedProcQty || 1),
                },
            ];
        }

        if (itemsToSend.length === 0) {
            notifOpen(
                'Validasi Tindakan',
                'Pilih atau tambahkan minimal 1 tindakan medis untuk disimpan',
                'warning'
            );
            return;
        }

        const isVisitDone = activeExam?.visit?.status === 'DONE';
        const trimmedReason = String(doneProcedureReason || '').trim();
        if (isVisitDone && trimmedReason.length < 10) {
            notifOpen(
                'Alasan Penambahan Wajib Diisi',
                'Untuk kunjungan yang sudah berstatus DONE, isi alasan penambahan tindakan minimal 10 karakter.',
                'warning'
            );
            return;
        }

        const payload = { items: itemsToSend };
        if (trimmedReason) {
            payload.reason = trimmedReason;
        }

        setSubmittingProcedures(true);
        const res = await API.POST(`/api/visits/${visitId}/procedures`, payload);
        setSubmittingProcedures(false);

        if (res?.status < 400 && res?.result?.rc === 200) {
            notifOpen(
                'Tindakan Medis Tersimpan',
                `${itemsToSend.length} item tindakan medis berhasil dicatat pada kunjungan.`
            );
            setStagedProcedures([]);
            setSelectedProcId(undefined);
            setSelectedProcQty(1);
            setDoneProcedureReason('');
            void fetchVisitProcedures(visitId);
        } else {
            notifOpen(
                'Gagal Menyimpan Tindakan',
                extractApiError(res, 'Tidak dapat menyimpan tindakan medis kunjungan'),
                'danger'
            );
        }
    };

    const handleConfirmVoidProcedure = async () => {
        const visitId = activeExam?.visit_id;
        if (!visitId || !voidTargetItem?.id) return;

        const trimmed = String(voidReason || '').trim();
        if (trimmed.length < 10) {
            notifOpen(
                'Validasi Pembatalan',
                'Alasan pembatalan tindakan (void reason) wajib diisi minimal 10 karakter',
                'warning'
            );
            return;
        }

        setVoidSubmitting(true);
        const res = await API.POST(
            `/api/visits/${visitId}/procedures/${voidTargetItem.id}/void`,
            { reason: trimmed }
        );
        setVoidSubmitting(false);

        if (res?.status < 400 && res?.result?.rc === 200) {
            notifOpen('Tindakan Dibatalkan', 'Tindakan medis berhasil di-VOID.');
            setVoidModalOpen(false);
            setVoidTargetItem(null);
            setVoidReason('');
            void fetchVisitProcedures(visitId);
        } else {
            notifOpen(
                'Gagal Membatalkan Tindakan',
                extractApiError(res, 'Tindakan medis gagal dibatalkan'),
                'danger'
            );
        }
    };

    const handleFinishVisit = () => {
        const visitId = activeExam?.visit_id;
        if (!visitId) return;

        if (activeExam?.status !== 'FINAL') {
            notifOpen(
                'Pemeriksaan Belum Final',
                'Harap lakukan Finalisasi Pemeriksaan (status FINAL) terlebih dahulu sebelum menyelesaikan kunjungan.',
                'warning'
            );
            return;
        }

        confirmOpen(
            'Selesaikan Kunjungan Pasien (DONE)',
            `Selesaikan kunjungan ${activeExam.visit?.visit_no || ''} untuk pasien ${
                activeExam.patient?.full_name || ''
            }? Status kunjungan akan berubah dari EXAMINING menjadi DONE.`,
            async () => {
                setConfirmLoading(true);
                setFinishingVisit(true);
                const res = await API.POST(`/api/visits/${visitId}/finish`, {});
                setConfirmLoading(false);
                setFinishingVisit(false);
                confirmClose();

                if (res?.status < 400 && res?.result?.rc === 200) {
                    const finishedVisit = res.result.data;
                    notifOpen(
                        'Kunjungan Selesai (DONE)',
                        `Kunjungan ${finishedVisit?.visit_no || ''} telah selesai diperiksa.`
                    );
                    setActiveExam((prev) =>
                        prev
                            ? {
                                  ...prev,
                                  visit: {
                                      ...(prev.visit || {}),
                                      status: 'DONE',
                                  },
                              }
                            : null
                    );
                    refreshQueue();
                } else {
                    notifOpen(
                        'Gagal Menyelesaikan Kunjungan',
                        extractApiError(res, 'Tidak dapat menyelesaikan kunjungan ini'),
                        'danger'
                    );
                }
            }
        );
    };

    const bmiInfo = useMemo(() => {
        const w = parseFloat(vitalForm.weight_kg);
        const hCm = parseFloat(vitalForm.height_cm);
        if (!w || !hCm || w <= 0 || hCm <= 0) return null;
        const hM = hCm / 100;
        const bmi = w / (hM * hM);
        let category = 'Normal';
        let color = 'green';
        if (bmi < 18.5) {
            category = 'Underweight';
            color = 'orange';
        } else if (bmi >= 25 && bmi < 30) {
            category = 'Overweight';
            color = 'gold';
        } else if (bmi >= 30) {
            category = 'Obesitas';
            color = 'red';
        }
        return { value: bmi.toFixed(1), category, color };
    }, [vitalForm.weight_kg, vitalForm.height_cm]);

    const filteredQueueRows = useMemo(() => {
        const source =
            queueViewMode === 'waiting'
                ? waitingList
                : allVisitsList.map((v) => ({
                      visit_id: v.id,
                      visit_no: v.visit_no,
                      queue_no: v.queue_no,
                      status: v.status,
                      patient: v.patient,
                      poli: v.poli,
                      has_examination: Boolean(v.examination_id),
                      examination_id: v.examination_id || null,
                      examination_status: v.examination_status || null,
                  }));

        return source.filter((item) => {
            if (filterStatus && item.status !== filterStatus) {
                return false;
            }
            if (searchText.trim() !== '') {
                const q = searchText.toLowerCase().trim();
                const matchName = String(item.patient?.full_name || '')
                    .toLowerCase()
                    .includes(q);
                const matchMr = String(item.patient?.medical_record_no || '')
                    .toLowerCase()
                    .includes(q);
                const matchVisitNo = String(item.visit_no || '')
                    .toLowerCase()
                    .includes(q);
                return matchName || matchMr || matchVisitNo;
            }
            return true;
        });
    }, [queueViewMode, waitingList, allVisitsList, filterStatus, searchText]);

    const queueStats = useMemo(() => {
        const counts = { WAITING: 0, CALLED: 0, EXAMINING: 0, total: waitingList.length };
        waitingList.forEach((item) => {
            if (counts[item.status] !== undefined) {
                counts[item.status] += 1;
            }
        });
        return counts;
    }, [waitingList]);

    const isExamFinal = activeExam?.status === 'FINAL';
    const isVisitDone = activeExam?.visit?.status === 'DONE';
    const canEditClinical = !isExamFinal || isRevisingMode;

    const primaryDiagnosisObj = useMemo(
        () => diagnosesList.find((d) => d.type === 'PRIMARY') || null,
        [diagnosesList]
    );

    const hasAnyVitalFilled = useMemo(
        () =>
            Object.values(vitalForm).some(
                (v) => v !== '' && v !== null && v !== undefined
            ),
        [vitalForm]
    );

    const queueColumns = [
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
            width: '165px',
            render: (val) => <span className="fw-7">{val || '-'}</span>,
        },
        {
            title: 'Pasien',
            key: 'patient',
            render: (_, row) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{row.patient?.full_name || '-'}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                        No. RM: <strong>{row.patient?.medical_record_no || '-'}</strong>
                        {row.patient?.gender ? ` • ${row.patient.gender}` : ''}
                        {row.patient?.age !== null && row.patient?.age !== undefined
                            ? ` • ${row.patient.age} thn`
                            : ''}
                    </div>
                </div>
            ),
        },
        {
            title: 'Poliklinik',
            key: 'poli',
            width: '180px',
            render: (_, row) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{row.poli?.name || '-'}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                        Kode: {row.poli?.code || '-'}
                    </div>
                </div>
            ),
        },
        {
            title: 'Status Kunjungan',
            dataIndex: 'status',
            width: '140px',
            align: 'center',
            render: (st) => renderVisitStatusBadge(st),
        },
        {
            title: 'Status EMR',
            dataIndex: 'examination_status',
            width: '130px',
            align: 'center',
            render: (st) => renderExamStatusBadge(st),
        },
        {
            title: 'Tindakan Dokter',
            key: 'actions',
            width: '280px',
            align: 'center',
            render: (_, row) => {
                const isActing = actingVisitId === row.visit_id;

                return (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '6px',
                            flexWrap: 'wrap',
                        }}
                    >
                        {row.status === 'WAITING' && (
                            <button
                                type="button"
                                className="btn btn-light-info btn-sm my-1"
                                disabled={isActing}
                                onClick={() =>
                                    void handleCallOrRevertPatient(row.visit_id, 'CALLED')
                                }
                                title="Panggil pasien ke ruang periksa"
                            >
                                <NotificationOutlined />
                                Panggil
                            </button>
                        )}

                        {row.status === 'CALLED' && (
                            <button
                                type="button"
                                className="btn btn-light-warning btn-sm my-1"
                                disabled={isActing}
                                onClick={() =>
                                    void handleCallOrRevertPatient(row.visit_id, 'WAITING')
                                }
                                title="Kembalikan ke status WAITING"
                            >
                                <RollbackOutlined />
                                Tunda
                            </button>
                        )}

                        {(row.status === 'WAITING' ||
                            row.status === 'CALLED' ||
                            row.status === 'EXAMINING') && (
                            <button
                                type="button"
                                className="btn btn-primary btn-sm my-1"
                                disabled={isActing}
                                onClick={() =>
                                    void handleStartOrContinueExamination(
                                        row.visit_id,
                                        row.examination_id
                                    )
                                }
                            >
                                <PlayCircleOutlined />
                                {isActing
                                    ? 'Memproses...'
                                    : row.has_examination || row.status === 'EXAMINING'
                                      ? 'Lanjutkan EMR'
                                      : 'Mulai Periksa'}
                            </button>
                        )}

                        {row.status === 'DONE' && (
                            <button
                                type="button"
                                className="btn btn-light-primary btn-sm my-1"
                                disabled={isActing}
                                onClick={() =>
                                    void handleStartOrContinueExamination(
                                        row.visit_id,
                                        row.examination_id
                                    )
                                }
                            >
                                <FileSearchOutlined />
                                Buka Rekam Medis
                            </button>
                        )}
                    </div>
                );
            },
        },
    ];

    if (activeExam) {
        return (
            <>
                <div className="containers">
                    <div className="headContent" style={{ minHeight: '40px' }}>
                        <div className="containerTitle">
                            <div className="breadCrumb">
                                <div className="text">Pemeriksaan Medis (EMR)</div>
                                <div className="text">{activeExam.visit?.visit_no || '-'}</div>
                            </div>
                            <div className="title text-dark-grey left">
                                Lembar Pemeriksaan Dokter &amp; Rekam Medis Elektronik
                            </div>
                        </div>

                        <div className="filter mb-3">
                            <button
                                type="button"
                                className="btn btn-light-primary"
                                onClick={() => {
                                    setActiveExam(null);
                                    refreshQueue();
                                }}
                            >
                                <ArrowLeftOutlined />
                                Kembali ke Antrean Pasien
                            </button>

                            <button
                                type="button"
                                className="btn btn-circle btn-light-primary"
                                onClick={() => void handleLoadExaminationById(activeExam.id)}
                                aria-label="Muat ulang data pemeriksaan"
                                title="Muat ulang data pemeriksaan"
                            >
                                <ReloadOutlined />
                            </button>
                        </div>
                    </div>

                    <Spin spinning={loadingExam}>
                        <Card
                            size="small"
                            style={{
                                borderRadius: '16px',
                                marginBottom: '16px',
                                border: '1px solid var(--primary-light)',
                            }}
                        >
                            <Row gutter={[16, 12]} align="middle">
                                <Col xs={24} md={8}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span
                                            className="btn btn-primary fw-7"
                                            style={{
                                                cursor: 'default',
                                                height: '44px',
                                                minWidth: '54px',
                                                fontSize: '16px',
                                            }}
                                        >
                                            #{activeExam.visit?.queue_no || '-'}
                                        </span>
                                        <div>
                                            <div className="fw-7" style={{ fontSize: '16px' }}>
                                                {activeExam.patient?.full_name || '-'}
                                            </div>
                                            <div className="text-muted" style={{ fontSize: '12px' }}>
                                                No. RM:{' '}
                                                <strong className="text-primary">
                                                    {activeExam.patient?.medical_record_no || '-'}
                                                </strong>{' '}
                                                •{' '}
                                                {activeExam.patient?.gender === 'L'
                                                    ? 'Laki-laki'
                                                    : activeExam.patient?.gender === 'P'
                                                      ? 'Perempuan'
                                                      : '-'}{' '}
                                                •{' '}
                                                {activeExam.patient?.age !== null &&
                                                activeExam.patient?.age !== undefined
                                                    ? `${activeExam.patient.age} thn`
                                                    : '-'}
                                            </div>
                                        </div>
                                    </div>
                                </Col>

                                <Col xs={12} sm={8} md={5}>
                                    <div className="text-muted" style={{ fontSize: '11px' }}>
                                        Kunjungan &amp; Poliklinik
                                    </div>
                                    <div className="fw-7" style={{ fontSize: '13px' }}>
                                        {activeExam.visit?.visit_no || '-'}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: '12px' }}>
                                        {activeExam.visit?.poli?.name || '-'} (
                                        {activeExam.visit?.visit_date || '-'})
                                    </div>
                                </Col>

                                <Col xs={12} sm={8} md={5}>
                                    <div className="text-muted" style={{ fontSize: '11px' }}>
                                        Dokter Pemeriksa
                                    </div>
                                    <div className="fw-7" style={{ fontSize: '13px' }}>
                                        {activeExam.doctor?.full_name || '-'}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: '12px' }}>
                                        {activeExam.doctor?.specialty || 'Dokter'}
                                    </div>
                                </Col>

                                <Col xs={24} sm={8} md={6}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'flex-end',
                                            alignItems: 'center',
                                            gap: '8px',
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        <div>
                                            <div
                                                className="text-muted"
                                                style={{ fontSize: '11px', textAlign: 'right' }}
                                            >
                                                Status Kunjungan
                                            </div>
                                            {renderVisitStatusBadge(activeExam.visit?.status)}
                                        </div>
                                        <div>
                                            <div
                                                className="text-muted"
                                                style={{ fontSize: '11px', textAlign: 'right' }}
                                            >
                                                Status EMR (v{activeExam.version || 1})
                                            </div>
                                            <span
                                                className={`btn ${
                                                    isExamFinal
                                                        ? 'btn-light-success'
                                                        : 'btn-light-warning'
                                                } my-1 btn-sm fw-7`}
                                                style={{ cursor: 'default', height: '28px' }}
                                            >
                                                {activeExam.status}
                                            </span>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </Card>

                        <Card
                            size="small"
                            style={{
                                borderRadius: '14px',
                                marginBottom: '16px',
                                background: 'var(--primary-light)',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '12px',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                                    <span className="fw-7 text-primary" style={{ fontSize: '13px' }}>
                                        Kelengkapan Finalisasi EMR:
                                    </span>
                                    <Tag color={hasAnyVitalFilled ? 'green' : 'orange'}>
                                        1. Tanda Vital: {hasAnyVitalFilled ? 'Terisi' : 'Belum Diisi'}
                                    </Tag>
                                    <Tag
                                        color={
                                            String(soapForm.complaint || '').trim()
                                                ? 'green'
                                                : 'orange'
                                        }
                                    >
                                        2. Keluhan Utama (SOAP):{' '}
                                        {String(soapForm.complaint || '').trim()
                                            ? 'Terisi'
                                            : 'Wajib Diisi'}
                                    </Tag>
                                    <Tag color={primaryDiagnosisObj ? 'green' : 'orange'}>
                                        3. Diagnosa PRIMARY:{' '}
                                        {primaryDiagnosisObj
                                            ? `${primaryDiagnosisObj.icd10_code}`
                                            : 'Wajib 1 PRIMARY'}
                                    </Tag>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {!isExamFinal && (
                                        <>
                                            <button
                                                type="button"
                                                className="btn btn-light-primary btn-sm"
                                                disabled={savingDraft || finalizingExam}
                                                onClick={() => void handleSaveDraftExamination(false)}
                                            >
                                                <SaveOutlined />
                                                {savingDraft ? 'Menyimpan...' : 'Simpan Draft EMR'}
                                            </button>

                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm"
                                                disabled={savingDraft || finalizingExam}
                                                onClick={() => void handleFinalizeExamination()}
                                            >
                                                <FileDoneOutlined />
                                                {finalizingExam
                                                    ? 'Memfinalisasi...'
                                                    : 'Finalisasi Pemeriksaan (FINAL)'}
                                            </button>
                                        </>
                                    )}

                                    {isExamFinal &&
                                        !isRevisingMode &&
                                        activeExam.visit?.status !== 'CANCELLED' && (
                                            <button
                                                type="button"
                                                className="btn btn-light-warning btn-sm"
                                                onClick={() => {
                                                    setIsRevisingMode(true);
                                                    setRevisionReason('');
                                                }}
                                            >
                                                <EditOutlined />
                                                Revisi Pemeriksaan (v{activeExam.version})
                                            </button>
                                        )}

                                    {isExamFinal && activeExam.visit?.status === 'EXAMINING' && (
                                        <button
                                            type="button"
                                            className="btn btn-primary btn-sm"
                                            disabled={finishingVisit}
                                            onClick={handleFinishVisit}
                                        >
                                            <CheckCircleOutlined />
                                            {finishingVisit
                                                ? 'Menyelesaikan...'
                                                : 'Selesaikan Kunjungan (DONE)'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {isRevisingMode && (
                            <Alert
                                type="warning"
                                showIcon
                                style={{ marginBottom: '16px', borderRadius: '12px' }}
                                message={`Mode Revisi Terkendali (Pemeriksaan FINAL Versi v${activeExam.version})`}
                                description={
                                    <div style={{ marginTop: '8px' }}>
                                        <div style={{ marginBottom: '8px', fontSize: '12px' }}>
                                            Setiap perubahan pada pemeriksaan yang sudah FINAL akan
                                            menyimpan snapshot versi sebelumnya ke riwayat revisi dan
                                            menaikkan nomor versi pemeriksaan.
                                        </div>
                                        <Row gutter={12} align="middle">
                                            <Col xs={24} md={16}>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Tuliskan alasan revisi klinis (minimal 10 karakter)..."
                                                    value={revisionReason}
                                                    onChange={(e) => setRevisionReason(e.target.value)}
                                                />
                                            </Col>
                                            <Col xs={24} md={8}>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        gap: '8px',
                                                        marginTop: '4px',
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary btn-sm"
                                                        disabled={submittingRevision}
                                                        onClick={() => void handleSubmitRevision()}
                                                    >
                                                        <SaveOutlined />
                                                        {submittingRevision
                                                            ? 'Menyimpan...'
                                                            : 'Simpan Revisi'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-light-danger btn-sm"
                                                        disabled={submittingRevision}
                                                        onClick={() => {
                                                            setIsRevisingMode(false);
                                                            hydrateExamForm(activeExam);
                                                        }}
                                                    >
                                                        Batal
                                                    </button>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>
                                }
                            />
                        )}

                        <Tabs
                            defaultActiveKey="clinical"
                            items={[
                                {
                                    key: 'clinical',
                                    label: (
                                        <span>
                                            <HeartOutlined /> 1. Tanda Vital, SOAP &amp; Diagnosa ICD-10
                                        </span>
                                    ),
                                    children: (
                                        <Row gutter={[16, 16]}>
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
                                                                <HeartOutlined className="text-danger me-2" />
                                                                Tanda Vital (Vital Signs)
                                                            </span>
                                                            {bmiInfo && (
                                                                <Tag color={bmiInfo.color}>
                                                                    IMT: {bmiInfo.value} (
                                                                    {bmiInfo.category})
                                                                </Tag>
                                                            )}
                                                        </div>
                                                    }
                                                    style={{ borderRadius: '14px', height: '100%' }}
                                                >
                                                    <Row gutter={[12, 12]}>
                                                        <Col xs={12}>
                                                            <label
                                                                htmlFor="vs_systolic"
                                                                style={{
                                                                    display: 'block',
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                    marginBottom: '4px',
                                                                }}
                                                            >
                                                                Sistolik (mmHg) [30-300]
                                                            </label>
                                                            <input
                                                                id="vs_systolic"
                                                                type="number"
                                                                min={30}
                                                                max={300}
                                                                disabled={!canEditClinical}
                                                                className="form-control"
                                                                placeholder="Contoh: 120"
                                                                value={vitalForm.systolic}
                                                                onChange={(e) =>
                                                                    setVitalForm((prev) => ({
                                                                        ...prev,
                                                                        systolic: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                        </Col>

                                                        <Col xs={12}>
                                                            <label
                                                                htmlFor="vs_diastolic"
                                                                style={{
                                                                    display: 'block',
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                    marginBottom: '4px',
                                                                }}
                                                            >
                                                                Diastolik (mmHg) [20-200]
                                                            </label>
                                                            <input
                                                                id="vs_diastolic"
                                                                type="number"
                                                                min={20}
                                                                max={200}
                                                                disabled={!canEditClinical}
                                                                className="form-control"
                                                                placeholder="Contoh: 80"
                                                                value={vitalForm.diastolic}
                                                                onChange={(e) =>
                                                                    setVitalForm((prev) => ({
                                                                        ...prev,
                                                                        diastolic: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                        </Col>

                                                        <Col xs={12}>
                                                            <label
                                                                htmlFor="vs_temperature"
                                                                style={{
                                                                    display: 'block',
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                    marginBottom: '4px',
                                                                }}
                                                            >
                                                                Suhu Tubuh (°C) [25-45]
                                                            </label>
                                                            <input
                                                                id="vs_temperature"
                                                                type="number"
                                                                step="0.1"
                                                                min={25}
                                                                max={45}
                                                                disabled={!canEditClinical}
                                                                className="form-control"
                                                                placeholder="Contoh: 36.8"
                                                                value={vitalForm.temperature}
                                                                onChange={(e) =>
                                                                    setVitalForm((prev) => ({
                                                                        ...prev,
                                                                        temperature: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                        </Col>

                                                        <Col xs={12}>
                                                            <label
                                                                htmlFor="vs_pulse"
                                                                style={{
                                                                    display: 'block',
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                    marginBottom: '4px',
                                                                }}
                                                            >
                                                                Nadi (x/menit) [20-300]
                                                            </label>
                                                            <input
                                                                id="vs_pulse"
                                                                type="number"
                                                                min={20}
                                                                max={300}
                                                                disabled={!canEditClinical}
                                                                className="form-control"
                                                                placeholder="Contoh: 82"
                                                                value={vitalForm.pulse}
                                                                onChange={(e) =>
                                                                    setVitalForm((prev) => ({
                                                                        ...prev,
                                                                        pulse: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                        </Col>

                                                        <Col xs={12}>
                                                            <label
                                                                htmlFor="vs_resp_rate"
                                                                style={{
                                                                    display: 'block',
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                    marginBottom: '4px',
                                                                }}
                                                            >
                                                                Frekuensi Napas / RR (x/mnt)
                                                            </label>
                                                            <input
                                                                id="vs_resp_rate"
                                                                type="number"
                                                                min={5}
                                                                max={80}
                                                                disabled={!canEditClinical}
                                                                className="form-control"
                                                                placeholder="Contoh: 18"
                                                                value={vitalForm.resp_rate}
                                                                onChange={(e) =>
                                                                    setVitalForm((prev) => ({
                                                                        ...prev,
                                                                        resp_rate: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                        </Col>

                                                        <Col xs={12}>
                                                            <label
                                                                htmlFor="vs_spo2"
                                                                style={{
                                                                    display: 'block',
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                    marginBottom: '4px',
                                                                }}
                                                            >
                                                                Saturasi O2 / SpO2 (%)
                                                            </label>
                                                            <input
                                                                id="vs_spo2"
                                                                type="number"
                                                                min={0}
                                                                max={100}
                                                                disabled={!canEditClinical}
                                                                className="form-control"
                                                                placeholder="Contoh: 98"
                                                                value={vitalForm.spo2}
                                                                onChange={(e) =>
                                                                    setVitalForm((prev) => ({
                                                                        ...prev,
                                                                        spo2: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                        </Col>

                                                        <Col xs={12}>
                                                            <label
                                                                htmlFor="vs_weight"
                                                                style={{
                                                                    display: 'block',
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                    marginBottom: '4px',
                                                                }}
                                                            >
                                                                Berat Badan / BB (kg)
                                                            </label>
                                                            <input
                                                                id="vs_weight"
                                                                type="number"
                                                                step="0.1"
                                                                min={0.5}
                                                                max={500}
                                                                disabled={!canEditClinical}
                                                                className="form-control"
                                                                placeholder="Contoh: 65.5"
                                                                value={vitalForm.weight_kg}
                                                                onChange={(e) =>
                                                                    setVitalForm((prev) => ({
                                                                        ...prev,
                                                                        weight_kg: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                        </Col>

                                                        <Col xs={12}>
                                                            <label
                                                                htmlFor="vs_height"
                                                                style={{
                                                                    display: 'block',
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                    marginBottom: '4px',
                                                                }}
                                                            >
                                                                Tinggi Badan / TB (cm)
                                                            </label>
                                                            <input
                                                                id="vs_height"
                                                                type="number"
                                                                step="0.1"
                                                                min={10}
                                                                max={250}
                                                                disabled={!canEditClinical}
                                                                className="form-control"
                                                                placeholder="Contoh: 170"
                                                                value={vitalForm.height_cm}
                                                                onChange={(e) =>
                                                                    setVitalForm((prev) => ({
                                                                        ...prev,
                                                                        height_cm: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                        </Col>
                                                    </Row>
                                                </Card>
                                            </Col>

                                            <Col xs={24} lg={14}>
                                                <Card
                                                    size="small"
                                                    title={
                                                        <span>
                                                            <ProfileOutlined className="text-primary me-2" />
                                                            Catatan Klinis SOAP (Subjective, Objective, Plan)
                                                        </span>
                                                    }
                                                    style={{ borderRadius: '14px', height: '100%' }}
                                                >
                                                    <Row gutter={[12, 12]}>
                                                        <Col xs={24}>
                                                            <label
                                                                htmlFor="soap_complaint"
                                                                style={{
                                                                    display: 'block',
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                    marginBottom: '4px',
                                                                }}
                                                            >
                                                                Keluhan Utama / Chief Complaint (S){' '}
                                                                <span className="text-danger">*</span>
                                                            </label>
                                                            <textarea
                                                                id="soap_complaint"
                                                                rows={2}
                                                                disabled={!canEditClinical}
                                                                className="form-control"
                                                                style={{
                                                                    minHeight: '64px',
                                                                    borderRadius: '12px',
                                                                    padding: '10px 14px',
                                                                }}
                                                                placeholder="Keluhan utama pasien saat datang..."
                                                                value={soapForm.complaint}
                                                                onChange={(e) =>
                                                                    setSoapForm((prev) => ({
                                                                        ...prev,
                                                                        complaint: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                        </Col>

                                                        <Col xs={24}>
                                                            <label
                                                                htmlFor="soap_anamnesis"
                                                                style={{
                                                                    display: 'block',
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                    marginBottom: '4px',
                                                                }}
                                                            >
                                                                Riwayat Penyakit &amp; Anamnesis (S)
                                                            </label>
                                                            <textarea
                                                                id="soap_anamnesis"
                                                                rows={2}
                                                                disabled={!canEditClinical}
                                                                className="form-control"
                                                                style={{
                                                                    minHeight: '68px',
                                                                    borderRadius: '12px',
                                                                    padding: '10px 14px',
                                                                }}
                                                                placeholder="Riwayat perjalanan penyakit sekarang, alergi, riwayat pengobatan..."
                                                                value={soapForm.anamnesis}
                                                                onChange={(e) =>
                                                                    setSoapForm((prev) => ({
                                                                        ...prev,
                                                                        anamnesis: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                        </Col>

                                                        <Col xs={24} md={12}>
                                                            <label
                                                                htmlFor="soap_physical"
                                                                style={{
                                                                    display: 'block',
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                    marginBottom: '4px',
                                                                }}
                                                            >
                                                                Pemeriksaan Fisik / Objective (O)
                                                            </label>
                                                            <textarea
                                                                id="soap_physical"
                                                                rows={3}
                                                                disabled={!canEditClinical}
                                                                className="form-control"
                                                                style={{
                                                                    minHeight: '84px',
                                                                    borderRadius: '12px',
                                                                    padding: '10px 14px',
                                                                }}
                                                                placeholder="Temuan pemeriksaan fisik kepala, thoraks, abdomen, ekstremitas..."
                                                                value={soapForm.physical_exam}
                                                                onChange={(e) =>
                                                                    setSoapForm((prev) => ({
                                                                        ...prev,
                                                                        physical_exam: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                        </Col>

                                                        <Col xs={24} md={12}>
                                                            <label
                                                                htmlFor="soap_plan"
                                                                style={{
                                                                    display: 'block',
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                    marginBottom: '4px',
                                                                }}
                                                            >
                                                                Rencana Terapi &amp; Edukasi / Plan (P)
                                                            </label>
                                                            <textarea
                                                                id="soap_plan"
                                                                rows={3}
                                                                disabled={!canEditClinical}
                                                                className="form-control"
                                                                style={{
                                                                    minHeight: '84px',
                                                                    borderRadius: '12px',
                                                                    padding: '10px 14px',
                                                                }}
                                                                placeholder="Rencana tata laksana medis, terapi obat, edukasi, anjuran kontrol..."
                                                                value={soapForm.plan_notes}
                                                                onChange={(e) =>
                                                                    setSoapForm((prev) => ({
                                                                        ...prev,
                                                                        plan_notes: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                        </Col>
                                                    </Row>
                                                </Card>
                                            </Col>

                                            <Col xs={24}>
                                                <Card
                                                    size="small"
                                                    title={
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                flexWrap: 'wrap',
                                                                gap: '8px',
                                                            }}
                                                        >
                                                            <span>
                                                                <AuditOutlined className="text-primary me-2" />
                                                                Assessment / Diagnosa Medis (ICD-10)
                                                            </span>
                                                            <span
                                                                className="text-muted"
                                                                style={{ fontSize: '12px' }}
                                                            >
                                                                Wajib terdapat tepat 1 diagnosa{' '}
                                                                <strong>PRIMARY</strong> dan sisanya{' '}
                                                                <strong>SECONDARY</strong>
                                                            </span>
                                                        </div>
                                                    }
                                                    style={{ borderRadius: '14px' }}
                                                >
                                                    {canEditClinical && (
                                                        <Row
                                                            gutter={[10, 10]}
                                                            align="middle"
                                                            style={{ marginBottom: '14px' }}
                                                        >
                                                            <Col xs={24} md={10}>
                                                                <Select
                                                                    showSearch
                                                                    allowClear
                                                                    style={{ width: '100%' }}
                                                                    placeholder="Ketik min. 2 huruf kode atau nama ICD-10 (mis: J06, A09, I10)..."
                                                                    filterOption={false}
                                                                    loading={icdSearching}
                                                                    value={selectedIcdOption?.value}
                                                                    onSearch={handleIcdSearch}
                                                                    onChange={(_, opt) =>
                                                                        setSelectedIcdOption(
                                                                            opt || null
                                                                        )
                                                                    }
                                                                    options={icdOptions}
                                                                    notFoundContent={
                                                                        icdSearching ? (
                                                                            <Spin size="small" />
                                                                        ) : (
                                                                            'Ketik minimal 2 karakter untuk mencari ICD-10'
                                                                        )
                                                                    }
                                                                />
                                                            </Col>

                                                            <Col xs={12} md={4}>
                                                                <Select
                                                                    style={{ width: '100%' }}
                                                                    value={newDiagType}
                                                                    onChange={(val) =>
                                                                        setNewDiagType(val)
                                                                    }
                                                                    options={[
                                                                        {
                                                                            value: 'PRIMARY',
                                                                            label: 'PRIMARY (Utama)',
                                                                        },
                                                                        {
                                                                            value: 'SECONDARY',
                                                                            label: 'SECONDARY (Sekunder)',
                                                                        },
                                                                    ]}
                                                                />
                                                            </Col>

                                                            <Col xs={12} md={6}>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    style={{ height: '34px' }}
                                                                    placeholder="Catatan diagnosa (opsional)..."
                                                                    value={newDiagNotes}
                                                                    onChange={(e) =>
                                                                        setNewDiagNotes(e.target.value)
                                                                    }
                                                                />
                                                            </Col>

                                                            <Col xs={24} md={4}>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-primary btn-sm"
                                                                    style={{ width: '100%' }}
                                                                    onClick={handleAddDiagnosisToList}
                                                                >
                                                                    <PlusCircleOutlined />
                                                                    Tambah ICD-10
                                                                </button>
                                                            </Col>
                                                        </Row>
                                                    )}

                                                    {diagnosesList.length === 0 ? (
                                                        <Empty
                                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                            description="Belum ada diagnosa ICD-10 yang ditambahkan. Cari dan tambahkan minimal 1 diagnosa PRIMARY."
                                                        />
                                                    ) : (
                                                        <Table
                                                            size="small"
                                                            pagination={false}
                                                            rowKey="icd10_code"
                                                            dataSource={diagnosesList}
                                                            columns={[
                                                                {
                                                                    title: 'Kode ICD-10',
                                                                    dataIndex: 'icd10_code',
                                                                    width: '120px',
                                                                    render: (val) => (
                                                                        <span className="fw-7 text-primary">
                                                                            {val}
                                                                        </span>
                                                                    ),
                                                                },
                                                                {
                                                                    title: 'Nama Diagnosa',
                                                                    dataIndex: 'icd10_name',
                                                                    render: (val) => val || '-',
                                                                },
                                                                {
                                                                    title: 'Tipe',
                                                                    dataIndex: 'type',
                                                                    width: '140px',
                                                                    align: 'center',
                                                                    render: (val) => (
                                                                        <Tag
                                                                            color={
                                                                                val === 'PRIMARY'
                                                                                    ? 'blue'
                                                                                    : 'default'
                                                                            }
                                                                            style={{ fontWeight: 600 }}
                                                                        >
                                                                            {val}
                                                                        </Tag>
                                                                    ),
                                                                },
                                                                {
                                                                    title: 'Catatan',
                                                                    dataIndex: 'notes',
                                                                    render: (val, row) =>
                                                                        canEditClinical ? (
                                                                            <input
                                                                                type="text"
                                                                                className="form-control"
                                                                                style={{
                                                                                    height: '30px',
                                                                                    fontSize: '12px',
                                                                                }}
                                                                                placeholder="Catatan..."
                                                                                value={val || ''}
                                                                                onChange={(e) => {
                                                                                    const txt =
                                                                                        e.target.value;
                                                                                    setDiagnosesList(
                                                                                        (prev) =>
                                                                                            prev.map(
                                                                                                (d) =>
                                                                                                    d.icd10_code ===
                                                                                                    row.icd10_code
                                                                                                        ? {
                                                                                                              ...d,
                                                                                                              notes: txt,
                                                                                                          }
                                                                                                        : d
                                                                                            )
                                                                                    );
                                                                                }}
                                                                            />
                                                                        ) : (
                                                                            val || '-'
                                                                        ),
                                                                },
                                                                ...(canEditClinical
                                                                    ? [
                                                                          {
                                                                              title: 'Aksi',
                                                                              key: 'act',
                                                                              width: '190px',
                                                                              align: 'center',
                                                                              render: (_, row) => (
                                                                                  <div
                                                                                      style={{
                                                                                          display:
                                                                                              'flex',
                                                                                          justifyContent:
                                                                                              'center',
                                                                                          gap: '6px',
                                                                                      }}
                                                                                  >
                                                                                      {row.type !==
                                                                                          'PRIMARY' && (
                                                                                          <button
                                                                                              type="button"
                                                                                              className="btn btn-light-primary btn-sm"
                                                                                              style={{
                                                                                                  height: '26px',
                                                                                                  padding:
                                                                                                      '0 8px',
                                                                                              }}
                                                                                              onClick={() =>
                                                                                                  handleSetPrimaryDiagnosis(
                                                                                                      row.icd10_code
                                                                                                  )
                                                                                              }
                                                                                          >
                                                                                              Jadikan PRIMARY
                                                                                          </button>
                                                                                      )}
                                                                                      <button
                                                                                          type="button"
                                                                                          className="btn btn-light-danger btn-sm"
                                                                                          style={{
                                                                                              height: '26px',
                                                                                              padding:
                                                                                                  '0 8px',
                                                                                          }}
                                                                                          onClick={() =>
                                                                                              handleRemoveDiagnosis(
                                                                                                  row.icd10_code
                                                                                              )
                                                                                          }
                                                                                      >
                                                                                          Hapus
                                                                                      </button>
                                                                                  </div>
                                                                              ),
                                                                          },
                                                                      ]
                                                                    : []),
                                                            ]}
                                                        />
                                                    )}
                                                </Card>
                                            </Col>
                                        </Row>
                                    ),
                                },
                                {
                                    key: 'procedures',
                                    label: (
                                        <span>
                                            <MedicineBoxOutlined /> 2. Tindakan Medis Kunjungan (
                                            {visitProceduresData.summary?.active_count || 0})
                                        </span>
                                    ),
                                    children: (
                                        <Row gutter={[16, 16]}>
                                            <Col xs={24} lg={10}>
                                                <Card
                                                    size="small"
                                                    title="Input Tindakan Medis Baru"
                                                    style={{ borderRadius: '14px' }}
                                                >
                                                    <div style={{ marginBottom: '12px' }}>
                                                        <label
                                                            htmlFor="proc_select"
                                                            style={{
                                                                display: 'block',
                                                                fontSize: '12px',
                                                                fontWeight: 600,
                                                                marginBottom: '4px',
                                                            }}
                                                        >
                                                            Pilih Tindakan Medis Aktif
                                                        </label>
                                                        <Select
                                                            id="proc_select"
                                                            showSearch
                                                            allowClear
                                                            style={{ width: '100%' }}
                                                            placeholder="Cari atau pilih tindakan medis..."
                                                            optionFilterProp="label"
                                                            value={selectedProcId}
                                                            onChange={(val) => setSelectedProcId(val)}
                                                            options={procedureOptions.map((p) => ({
                                                                value: p.value,
                                                                label: `${p.code ? `[${p.code}] ` : ''}${
                                                                    p.label
                                                                } — Rp ${Helper.numFormat(
                                                                    p.tariff || 0
                                                                )}`,
                                                            }))}
                                                        />
                                                    </div>

                                                    <Row gutter={12} align="bottom">
                                                        <Col xs={10}>
                                                            <label
                                                                htmlFor="proc_qty"
                                                                style={{
                                                                    display: 'block',
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                    marginBottom: '4px',
                                                                }}
                                                            >
                                                                Jumlah (Qty) [1-99]
                                                            </label>
                                                            <InputNumber
                                                                id="proc_qty"
                                                                min={1}
                                                                max={99}
                                                                style={{ width: '100%' }}
                                                                value={selectedProcQty}
                                                                onChange={(val) =>
                                                                    setSelectedProcQty(val || 1)
                                                                }
                                                            />
                                                        </Col>
                                                        <Col xs={14}>
                                                            <button
                                                                type="button"
                                                                className="btn btn-light-primary btn-sm"
                                                                style={{ width: '100%', height: '32px' }}
                                                                onClick={handleStageProcedureItem}
                                                            >
                                                                <PlusCircleOutlined />
                                                                Tambah ke Daftar Input
                                                            </button>
                                                        </Col>
                                                    </Row>

                                                    {stagedProcedures.length > 0 && (
                                                        <div style={{ marginTop: '16px' }}>
                                                            <div
                                                                className="fw-7"
                                                                style={{
                                                                    fontSize: '12px',
                                                                    marginBottom: '6px',
                                                                }}
                                                            >
                                                                Daftar Tindakan Siap Disimpan:
                                                            </div>
                                                            <Table
                                                                size="small"
                                                                pagination={false}
                                                                rowKey="procedure_id"
                                                                dataSource={stagedProcedures}
                                                                columns={[
                                                                    {
                                                                        title: 'Tindakan',
                                                                        dataIndex: 'name',
                                                                        render: (val, row) => (
                                                                            <div>
                                                                                <div className="fw-7">
                                                                                    {val}
                                                                                </div>
                                                                                <div
                                                                                    className="text-muted"
                                                                                    style={{
                                                                                        fontSize:
                                                                                            '11px',
                                                                                    }}
                                                                                >
                                                                                    @ Rp{' '}
                                                                                    {Helper.numFormat(
                                                                                        row.tariff
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ),
                                                                    },
                                                                    {
                                                                        title: 'Qty',
                                                                        dataIndex: 'qty',
                                                                        width: '55px',
                                                                        align: 'center',
                                                                    },
                                                                    {
                                                                        title: 'Subtotal',
                                                                        dataIndex: 'subtotal',
                                                                        width: '110px',
                                                                        align: 'right',
                                                                        render: (val) =>
                                                                            `Rp ${Helper.numFormat(
                                                                                val
                                                                            )}`,
                                                                    },
                                                                    {
                                                                        title: '',
                                                                        key: 'rm',
                                                                        width: '45px',
                                                                        render: (_, row) => (
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-light-danger btn-sm"
                                                                                style={{
                                                                                    height: '24px',
                                                                                    padding: '0 6px',
                                                                                }}
                                                                                onClick={() =>
                                                                                    setStagedProcedures(
                                                                                        (prev) =>
                                                                                            prev.filter(
                                                                                                (i) =>
                                                                                                    i.procedure_id !==
                                                                                                    row.procedure_id
                                                                                            )
                                                                                    )
                                                                                }
                                                                            >
                                                                                ×
                                                                            </button>
                                                                        ),
                                                                    },
                                                                ]}
                                                            />
                                                        </div>
                                                    )}

                                                    {isVisitDone && (
                                                        <div style={{ marginTop: '12px' }}>
                                                            <label
                                                                htmlFor="done_proc_reason"
                                                                style={{
                                                                    display: 'block',
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                    marginBottom: '4px',
                                                                }}
                                                            >
                                                                Alasan Penambahan pada Kunjungan DONE *
                                                            </label>
                                                            <input
                                                                id="done_proc_reason"
                                                                type="text"
                                                                className="form-control"
                                                                placeholder="Minimal 10 karakter..."
                                                                value={doneProcedureReason}
                                                                onChange={(e) =>
                                                                    setDoneProcedureReason(
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    )}

                                                    <div style={{ marginTop: '16px' }}>
                                                        <button
                                                            type="button"
                                                            className="btn btn-primary"
                                                            style={{ width: '100%' }}
                                                            disabled={submittingProcedures}
                                                            onClick={() =>
                                                                void handleSaveProceduresToVisit()
                                                            }
                                                        >
                                                            <SaveOutlined />
                                                            {submittingProcedures
                                                                ? 'Menyimpan Tindakan...'
                                                                : 'Simpan Tindakan Kunjungan'}
                                                        </button>
                                                    </div>
                                                </Card>
                                            </Col>

                                            <Col xs={24} lg={14}>
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
                                                                Daftar Tindakan Medis Tercatat
                                                            </span>
                                                            <span className="fw-7 text-primary">
                                                                Total Aktif: Rp{' '}
                                                                {Helper.numFormat(
                                                                    visitProceduresData.summary
                                                                        ?.total_tariff || 0
                                                                )}
                                                            </span>
                                                        </div>
                                                    }
                                                    style={{ borderRadius: '14px' }}
                                                >
                                                    <Spin spinning={loadingProcedures}>
                                                        {visitProceduresData.items.length === 0 ? (
                                                            <Empty
                                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                                description="Belum ada tindakan medis yang dicatat pada kunjungan ini."
                                                            />
                                                        ) : (
                                                            <Table
                                                                size="small"
                                                                pagination={false}
                                                                rowKey="id"
                                                                dataSource={visitProceduresData.items}
                                                                columns={[
                                                                    {
                                                                        title: 'Kode & Nama Tindakan',
                                                                        key: 'proc',
                                                                        render: (_, row) => (
                                                                            <div>
                                                                                <div className="fw-7">
                                                                                    {row.procedure
                                                                                        ?.code
                                                                                        ? `[${row.procedure.code}] `
                                                                                        : ''}
                                                                                    {row.procedure
                                                                                        ?.name || '-'}
                                                                                </div>
                                                                                <div
                                                                                    className="text-muted"
                                                                                    style={{
                                                                                        fontSize:
                                                                                            '11px',
                                                                                    }}
                                                                                >
                                                                                    Waktu:{' '}
                                                                                    {row.performed_at ||
                                                                                        '-'}
                                                                                </div>
                                                                                {row.void_reason && (
                                                                                    <div
                                                                                        className="text-danger"
                                                                                        style={{
                                                                                            fontSize:
                                                                                                '11px',
                                                                                        }}
                                                                                    >
                                                                                        Alasan Void:{' '}
                                                                                        {row.void_reason}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ),
                                                                    },
                                                                    {
                                                                        title: 'Tarif Satuan',
                                                                        dataIndex: 'unit_tariff',
                                                                        width: '120px',
                                                                        align: 'right',
                                                                        render: (val) =>
                                                                            `Rp ${Helper.numFormat(
                                                                                val
                                                                            )}`,
                                                                    },
                                                                    {
                                                                        title: 'Qty',
                                                                        dataIndex: 'qty',
                                                                        width: '60px',
                                                                        align: 'center',
                                                                    },
                                                                    {
                                                                        title: 'Subtotal',
                                                                        dataIndex: 'subtotal',
                                                                        width: '125px',
                                                                        align: 'right',
                                                                        render: (val) => (
                                                                            <span className="fw-7">
                                                                                Rp{' '}
                                                                                {Helper.numFormat(val)}
                                                                            </span>
                                                                        ),
                                                                    },
                                                                    {
                                                                        title: 'Status',
                                                                        dataIndex: 'status',
                                                                        width: '95px',
                                                                        align: 'center',
                                                                        render: (st) => (
                                                                            <Tag
                                                                                color={
                                                                                    st === 'ACTIVE'
                                                                                        ? 'green'
                                                                                        : 'red'
                                                                                }
                                                                            >
                                                                                {st}
                                                                            </Tag>
                                                                        ),
                                                                    },
                                                                    {
                                                                        title: '',
                                                                        key: 'act',
                                                                        width: '80px',
                                                                        align: 'center',
                                                                        render: (_, row) =>
                                                                            row.status ===
                                                                            'ACTIVE' ? (
                                                                                <button
                                                                                    type="button"
                                                                                    className="btn btn-light-danger btn-sm"
                                                                                    style={{
                                                                                        height: '26px',
                                                                                        padding:
                                                                                            '0 8px',
                                                                                    }}
                                                                                    onClick={() => {
                                                                                        setVoidTargetItem(
                                                                                            row
                                                                                        );
                                                                                        setVoidReason(
                                                                                            ''
                                                                                        );
                                                                                        setVoidModalOpen(
                                                                                            true
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    Void
                                                                                </button>
                                                                            ) : null,
                                                                    },
                                                                ]}
                                                            />
                                                        )}
                                                    </Spin>
                                                </Card>
                                            </Col>
                                        </Row>
                                    ),
                                },
                                {
                                    key: 'history',
                                    label: (
                                        <span>
                                            <HistoryOutlined /> 3. Riwayat Rekam Medis Pasien (
                                            {medicalHistoryList.length})
                                        </span>
                                    ),
                                    children: (
                                        <Card
                                            size="small"
                                            title={`Riwayat Pemeriksaan Medis (FINAL) — ${
                                                activeExam.patient?.full_name || ''
                                            }`}
                                            style={{ borderRadius: '14px' }}
                                        >
                                            <Spin spinning={loadingHistory}>
                                                {medicalHistoryList.length === 0 ? (
                                                    <Empty
                                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                        description="Pasien belum memiliki riwayat pemeriksaan berstatus FINAL sebelumnya."
                                                    />
                                                ) : (
                                                    <Table
                                                        size="small"
                                                        pagination={false}
                                                        rowKey="examination_id"
                                                        dataSource={medicalHistoryList}
                                                        columns={[
                                                            {
                                                                title: 'Tanggal & No. Kunjungan',
                                                                key: 'visit',
                                                                width: '180px',
                                                                render: (_, row) => (
                                                                    <div>
                                                                        <div className="fw-7">
                                                                            {row.visit_no || '-'}
                                                                        </div>
                                                                        <div
                                                                            className="text-muted"
                                                                            style={{ fontSize: '11px' }}
                                                                        >
                                                                            {row.visit_date || '-'} •{' '}
                                                                            {row.poli?.name || '-'}
                                                                        </div>
                                                                    </div>
                                                                ),
                                                            },
                                                            {
                                                                title: 'Dokter',
                                                                key: 'doc',
                                                                width: '180px',
                                                                render: (_, row) => (
                                                                    <div>
                                                                        <div style={{ fontWeight: 600 }}>
                                                                            {row.doctor?.full_name ||
                                                                                '-'}
                                                                        </div>
                                                                        <div
                                                                            className="text-muted"
                                                                            style={{ fontSize: '11px' }}
                                                                        >
                                                                            {row.doctor?.specialty ||
                                                                                ''}
                                                                        </div>
                                                                    </div>
                                                                ),
                                                            },
                                                            {
                                                                title: 'Keluhan Utama',
                                                                dataIndex: 'complaint',
                                                                render: (val) => val || '-',
                                                            },
                                                            {
                                                                title: 'Diagnosa Utama (PRIMARY)',
                                                                key: 'diag',
                                                                render: (_, row) =>
                                                                    row.primary_diagnosis ? (
                                                                        <div>
                                                                            <Tag color="blue">
                                                                                {
                                                                                    row
                                                                                        .primary_diagnosis
                                                                                        .icd10_code
                                                                                }
                                                                            </Tag>
                                                                            <span>
                                                                                {
                                                                                    row
                                                                                        .primary_diagnosis
                                                                                        .icd10_name
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        '-'
                                                                    ),
                                                            },
                                                            {
                                                                title: 'Tanda Vital',
                                                                key: 'vs',
                                                                width: '200px',
                                                                render: (_, row) => {
                                                                    const vs = row.vital_sign;
                                                                    if (!vs) return '-';
                                                                    const parts = [];
                                                                    if (
                                                                        vs.systolic &&
                                                                        vs.diastolic
                                                                    ) {
                                                                        parts.push(
                                                                            `TD: ${vs.systolic}/${vs.diastolic}`
                                                                        );
                                                                    }
                                                                    if (vs.temperature) {
                                                                        parts.push(
                                                                            `S: ${vs.temperature}°C`
                                                                        );
                                                                    }
                                                                    if (vs.pulse) {
                                                                        parts.push(`N: ${vs.pulse}`);
                                                                    }
                                                                    return (
                                                                        <span
                                                                            style={{ fontSize: '12px' }}
                                                                        >
                                                                            {parts.join(' • ') || '-'}
                                                                        </span>
                                                                    );
                                                                },
                                                            },
                                                        ]}
                                                    />
                                                )}
                                            </Spin>
                                        </Card>
                                    ),
                                },
                                {
                                    key: 'revisions',
                                    label: (
                                        <span>
                                            <EditOutlined /> 4. Riwayat Revisi EMR (
                                            {revisionsList.length})
                                        </span>
                                    ),
                                    children: (
                                        <Card
                                            size="small"
                                            title={`Log Revisi Pemeriksaan (Versi Aktif: v${
                                                activeExam.version || 1
                                            })`}
                                            style={{ borderRadius: '14px' }}
                                        >
                                            <Spin spinning={loadingRevisions}>
                                                {revisionsList.length === 0 ? (
                                                    <Empty
                                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                        description="Belum ada riwayat revisi pada pemeriksaan ini."
                                                    />
                                                ) : (
                                                    <Table
                                                        size="small"
                                                        pagination={false}
                                                        rowKey="id"
                                                        dataSource={revisionsList}
                                                        columns={[
                                                            {
                                                                title: 'Versi Lama',
                                                                dataIndex: 'version',
                                                                width: '110px',
                                                                align: 'center',
                                                                render: (v) => (
                                                                    <Tag color="purple">Versi v{v}</Tag>
                                                                ),
                                                            },
                                                            {
                                                                title: 'Alasan Revisi',
                                                                dataIndex: 'reason',
                                                            },
                                                            {
                                                                title: 'Waktu Perubahan',
                                                                dataIndex: 'changed_at',
                                                                width: '180px',
                                                            },
                                                            {
                                                                title: 'Snapshot',
                                                                key: 'snap',
                                                                width: '140px',
                                                                align: 'center',
                                                                render: (_, row) => (
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-light-primary btn-sm"
                                                                        onClick={() =>
                                                                            void handleViewRevisionSnapshot(
                                                                                row.version
                                                                            )
                                                                        }
                                                                    >
                                                                        Lihat Snapshot
                                                                    </button>
                                                                ),
                                                            },
                                                        ]}
                                                    />
                                                )}
                                            </Spin>
                                        </Card>
                                    ),
                                },
                            ]}
                        />
                    </Spin>
                </div>

                <Modal
                    centered
                    open={voidModalOpen}
                    onCancel={() => setVoidModalOpen(false)}
                    title="Batalkan (VOID) Tindakan Medis"
                    footer={null}
                    width="480px"
                >
                    <div style={{ paddingTop: '8px' }}>
                        <p style={{ fontSize: '13px', marginBottom: '10px' }}>
                            Anda akan membatalkan tindakan{' '}
                            <strong>{voidTargetItem?.procedure?.name || '-'}</strong>. Tindakan yang
                            di-VOID tidak akan masuk ke perhitungan tagihan kasir.
                        </p>
                        <label
                            htmlFor="void_proc_reason"
                            style={{
                                display: 'block',
                                fontSize: '12px',
                                fontWeight: 600,
                                marginBottom: '4px',
                            }}
                        >
                            Alasan Pembatalan (Minimal 10 Karakter) *
                        </label>
                        <textarea
                            id="void_proc_reason"
                            rows={3}
                            className="form-control"
                            style={{ minHeight: '80px', borderRadius: '12px' }}
                            placeholder="Tuliskan alasan pembatalan tindakan medis..."
                            value={voidReason}
                            onChange={(e) => setVoidReason(e.target.value)}
                        />
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '8px',
                                marginTop: '16px',
                            }}
                        >
                            <button
                                type="button"
                                className="btn btn-light-primary btn-sm"
                                onClick={() => setVoidModalOpen(false)}
                            >
                                Tutup
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                disabled={voidSubmitting}
                                onClick={() => void handleConfirmVoidProcedure()}
                            >
                                <CloseCircleOutlined />
                                {voidSubmitting ? 'Memproses...' : 'Konfirmasi VOID'}
                            </button>
                        </div>
                    </div>
                </Modal>

                <Modal
                    centered
                    open={revisionDetailModal}
                    onCancel={() => setRevisionDetailModal(false)}
                    title={`Snapshot Rekam Medis Versi v${selectedRevisionDetail?.version || ''}`}
                    footer={null}
                    width="640px"
                >
                    <Spin spinning={loadingRevisionDetail}>
                        {selectedRevisionDetail?.snapshot ? (
                            <div style={{ paddingTop: '8px' }}>
                                <Descriptions
                                    bordered
                                    size="small"
                                    column={1}
                                    style={{ marginBottom: '12px' }}
                                >
                                    <Descriptions.Item label="Alasan Revisi">
                                        {selectedRevisionDetail.reason || '-'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Waktu Revisi">
                                        {selectedRevisionDetail.changed_at || '-'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Keluhan Utama">
                                        {selectedRevisionDetail.snapshot.examination?.complaint ||
                                            '-'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Anamnesis">
                                        {selectedRevisionDetail.snapshot.examination?.anamnesis ||
                                            '-'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Pemeriksaan Fisik">
                                        {selectedRevisionDetail.snapshot.examination
                                            ?.physical_exam || '-'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Plan / Terapi">
                                        {selectedRevisionDetail.snapshot.examination?.plan_notes ||
                                            '-'}
                                    </Descriptions.Item>
                                </Descriptions>
                            </div>
                        ) : (
                            <Empty description="Snapshot tidak tersedia" />
                        )}
                    </Spin>
                </Modal>
            </>
        );
    }

    return (
        <div className="containers">
            <div className="headContent" style={{ minHeight: '40px' }}>
                <div className="containerTitle">
                    <div className="breadCrumb">
                        <div className="text">Dokter</div>
                        <div className="text">Pemeriksaan Medis (EMR)</div>
                    </div>
                    <div className="title text-dark-grey left">
                        Antrean Pasien &amp; Pemeriksaan Dokter (EMR)
                    </div>
                </div>

                <div className="filter mb-3">
                    <Radio.Group
                        value={queueViewMode}
                        onChange={(e) => setQueueViewMode(e.target.value)}
                        buttonStyle="solid"
                    >
                        <Radio.Button value="waiting">Antrean Aktif</Radio.Button>
                        <Radio.Button value="all">Semua Kunjungan</Radio.Button>
                    </Radio.Group>

                    <DatePicker
                        allowClear={false}
                        value={filterDate ? dayjs(filterDate, 'YYYY-MM-DD') : dayjs()}
                        format="DD MMM YYYY"
                        onChange={(d) => {
                            const str = d ? d.format('YYYY-MM-DD') : Helper.today();
                            setFilterDate(str);
                        }}
                        style={{ height: '38px', borderRadius: '15px' }}
                    />

                    <select
                        aria-label="Filter Status Antrean Dokter"
                        className="form-control"
                        style={{ width: '165px', height: '38px', padding: '0 14px' }}
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">Semua Status</option>
                        <option value="WAITING">WAITING (Menunggu)</option>
                        <option value="CALLED">CALLED (Dipanggil)</option>
                        <option value="EXAMINING">EXAMINING (Diperiksa)</option>
                        {queueViewMode === 'all' && <option value="DONE">DONE (Selesai)</option>}
                    </select>

                    <div style={{ position: 'relative' }}>
                        <SearchOutlined className="icon-search text-muted" />
                        <input
                            type="text"
                            className="form-control"
                            style={{
                                paddingLeft: '34px',
                                height: '38px',
                                width: '210px',
                                borderRadius: '15px',
                            }}
                            placeholder="Cari Pasien / No. RM..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>

                    <button
                        type="button"
                        className="btn btn-circle btn-light-primary"
                        onClick={refreshQueue}
                        aria-label="Muat ulang daftar antrean dokter"
                        title="Muat ulang daftar antrean"
                    >
                        <ReloadOutlined />
                    </button>
                </div>
            </div>

            <Row gutter={[12, 12]} style={{ marginBottom: '16px' }}>
                <Col xs={12} sm={6}>
                    <Card size="small" style={{ borderRadius: '14px' }}>
                        <div className="text-muted" style={{ fontSize: '12px' }}>
                            Total Antrean Aktif ({filterDate})
                        </div>
                        <div className="fs-5 fw-7 text-primary" style={{ fontSize: '20px' }}>
                            {queueStats.total}
                        </div>
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" style={{ borderRadius: '14px' }}>
                        <div className="text-muted" style={{ fontSize: '12px' }}>
                            Menunggu (WAITING)
                        </div>
                        <div className="fs-5 fw-7 text-warning" style={{ fontSize: '20px' }}>
                            {queueStats.WAITING}
                        </div>
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" style={{ borderRadius: '14px' }}>
                        <div className="text-muted" style={{ fontSize: '12px' }}>
                            Dipanggil (CALLED)
                        </div>
                        <div className="fs-5 fw-7 text-info" style={{ fontSize: '20px' }}>
                            {queueStats.CALLED}
                        </div>
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" style={{ borderRadius: '14px' }}>
                        <div className="text-muted" style={{ fontSize: '12px' }}>
                            Sedang Diperiksa (EXAMINING)
                        </div>
                        <div className="fs-5 fw-7 text-primary" style={{ fontSize: '20px' }}>
                            {queueStats.EXAMINING}
                        </div>
                    </Card>
                </Col>
            </Row>

            {queueError && (
                <Alert
                    type="error"
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                    style={{ marginBottom: '16px', borderRadius: '12px' }}
                    message="Tidak Dapat Memuat Antrean Dokter"
                    description={queueError}
                />
            )}

            <div className="bodyContent">
                <div className="card-table" style={{ minHeight: '220px', padding: '12px' }}>
                    <Table
                        loading={loadingQueue}
                        rowKey="visit_id"
                        columns={queueColumns}
                        dataSource={filteredQueueRows}
                        pagination={{
                            pageSize: 15,
                            showSizeChanger: true,
                            showTotal: (total) => `Total ${total} kunjungan`,
                        }}
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                        queueViewMode === 'waiting'
                                            ? `Tidak ada antrean pasien aktif untuk dokter ini pada tanggal ${filterDate}.`
                                            : `Tidak ada data kunjungan untuk dokter ini pada tanggal ${filterDate}.`
                                    }
                                />
                            ),
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
