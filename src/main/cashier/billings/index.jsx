import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Card,
    Col,
    DatePicker,
    Descriptions,
    Empty,
    Modal,
    Radio,
    Row,
    Spin,
    Table,
    Tag,
} from 'antd';
import {
    ArrowLeftOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    CreditCardOutlined,
    DollarOutlined,
    ExclamationCircleOutlined,
    FileDoneOutlined,
    FileSearchOutlined,
    FileTextOutlined,
    PrinterOutlined,
    ReloadOutlined,
    SearchOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { API } from '@/lib/API';
import { Helper } from '@/lib/Helper';
import confirmStore from '@/store/confirmStore';
import notifStore from '@/store/notifStore';
import userStore from '@/store/userStore';

const itemTypeLabelMap = {
    REGISTRATION: { label: 'Pendaftaran Poli', color: 'blue' },
    PROCEDURE: { label: 'Tindakan Medis', color: 'cyan' },
    LAB: { label: 'Pemeriksaan Lab', color: 'purple' },
    DRUG: { label: 'Obat / Farmasi', color: 'green' },
    ADJUSTMENT: { label: 'Penyesuaian', color: 'orange' },
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

const renderBillStatusBadge = (status) => {
    if (!status) {
        return <span className="text-muted" style={{ fontSize: '12px' }}>Belum Ada Tagihan</span>;
    }
    const map = {
        DRAFT: { className: 'btn-light-warning', label: 'DRAFT' },
        ISSUED: { className: 'btn-light-primary', label: 'ISSUED' },
        CANCELLED: { className: 'btn-light-danger', label: 'CANCELLED' },
    };
    const cfg = map[status] || { className: 'btn-light-primary', label: status };
    return (
        <span
            className={`btn ${cfg.className} my-1 btn-sm`}
            style={{ cursor: 'default', height: '28px', padding: '0 12px' }}
        >
            {cfg.label}
        </span>
    );
};

const renderPaymentStatusBadge = (paymentStatus) => {
    if (!paymentStatus) return '-';
    const map = {
        UNPAID: { className: 'btn-light-danger', label: 'UNPAID (Belum Bayar)' },
        PARTIAL: { className: 'btn-light-warning', label: 'PARTIAL (Sebagian)' },
        PAID: { className: 'btn-light-success', label: 'PAID (Lunas)' },
    };
    const cfg = map[paymentStatus] || { className: 'btn-light-primary', label: paymentStatus };
    return (
        <span
            className={`btn ${cfg.className} my-1 btn-sm`}
            style={{ cursor: 'default', height: '28px', padding: '0 12px' }}
        >
            {cfg.label}
        </span>
    );
};

export default function CashierBillingsPage() {
    const { notifOpen } = notifStore();
    const { confirmOpen, confirmClose, setConfirmLoading } = confirmStore();
    const { dataUser } = userStore();

    const isAdminRole = useMemo(() => {
        if (!dataUser) return false;
        const roleId = Number(dataUser.role_id ?? dataUser.roles ?? 0);
        const roleCode = String(
            dataUser.role_code ?? dataUser.role_name ?? dataUser.role ?? ''
        ).toUpperCase();
        return roleId === 1 || roleCode === 'ADMIN' || roleCode.includes('ADMIN');
    }, [dataUser]);

    const [viewTab, setViewTab] = useState('queue');
    const [filterDate, setFilterDate] = useState(Helper.today());
    const [filterBillStatus, setFilterBillStatus] = useState('');
    const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
    const [searchText, setSearchText] = useState('');

    const [queueList, setQueueList] = useState([]);
    const [billsList, setBillsList] = useState([]);
    const [paymentsList, setPaymentsList] = useState([]);
    const [paymentsTotalSuccess, setPaymentsTotalSuccess] = useState(0);
    const [loadingList, setLoadingList] = useState(false);
    const [listError, setListError] = useState(null);
    const [actingRowId, setActingRowId] = useState(null);

    const [activeBill, setActiveBill] = useState(null);
    const [activeQueueMeta, setActiveQueueMeta] = useState(null);
    const [loadingBill, setLoadingBill] = useState(false);
    const [syncingDraft, setSyncingDraft] = useState(false);
    const [issuingBill, setIssuingBill] = useState(false);
    const [printingDocKey, setPrintingDocKey] = useState(null);

    const [payAmount, setPayAmount] = useState('');
    const [tenderedAmount, setTenderedAmount] = useState('');
    const [payMethod, setPayMethod] = useState('CASH');
    const [payReferenceNo, setPayReferenceNo] = useState('');
    const [currentIdempotencyKey, setCurrentIdempotencyKey] = useState(() =>
        `pay-${uuidv4()}`
    );
    const [submittingPayment, setSubmittingPayment] = useState(false);
    const [lastRecordedPayment, setLastRecordedPayment] = useState(null);

    const [cancelBillModalOpen, setCancelBillModalOpen] = useState(false);
    const [cancelBillReason, setCancelBillReason] = useState('');
    const [cancellingBill, setCancellingBill] = useState(false);

    const [voidPaymentModalOpen, setVoidPaymentModalOpen] = useState(false);
    const [voidTargetPayment, setVoidTargetPayment] = useState(null);
    const [voidPaymentReason, setVoidPaymentReason] = useState('');
    const [voidingPayment, setVoidingPayment] = useState(false);

    const [jsonPreviewModalOpen, setJsonPreviewModalOpen] = useState(false);
    const [jsonPreviewTitle, setJsonPreviewTitle] = useState('');
    const [jsonPreviewData, setJsonPreviewData] = useState(null);
    const [loadingJsonPreview, setLoadingJsonPreview] = useState(false);

    const fetchBillingQueue = useCallback(async (dateVal, queryVal) => {
        setLoadingList(true);
        setListError(null);
        const qParam = queryVal ? `&q=${encodeURIComponent(queryVal)}` : '';
        const res = await API.GET(
            `/api/billing/queue?date=${encodeURIComponent(dateVal)}${qParam}`
        );
        setLoadingList(false);

        if (res?.status === 200 && res?.result?.rc === 200) {
            setQueueList(Array.isArray(res.result.data) ? res.result.data : []);
        } else {
            setQueueList([]);
            setListError(
                extractApiError(
                    res,
                    'Gagal memuat antrean kasir. Pastikan akun memiliki Role CASHIER atau ADMIN.'
                )
            );
        }
    }, []);

    const fetchBillsDirectory = useCallback(async (dateVal, statusVal, payStatusVal, queryVal) => {
        setLoadingList(true);
        setListError(null);
        const params = new URLSearchParams();
        params.set('size', '100');
        if (dateVal) {
            params.set('date_from', dateVal);
            params.set('date_to', dateVal);
        }
        if (statusVal) params.set('status', statusVal);
        if (payStatusVal) params.set('payment_status', payStatusVal);
        if (queryVal) params.set('q', queryVal);

        const res = await API.GET(`/api/bills?${params.toString()}`);
        setLoadingList(false);

        if (res?.status === 200 && Array.isArray(res?.result?.data)) {
            setBillsList(res.result.data);
        } else {
            setBillsList([]);
            setListError(extractApiError(res, 'Gagal memuat daftar tagihan (Bills).'));
        }
    }, []);

    const fetchPaymentsHistory = useCallback(async (dateVal, queryVal) => {
        setLoadingList(true);
        setListError(null);
        const params = new URLSearchParams();
        params.set('size', '100');
        if (dateVal) {
            params.set('date_from', dateVal);
            params.set('date_to', dateVal);
        }
        if (queryVal) params.set('q', queryVal);

        const res = await API.GET(`/api/payments?${params.toString()}`);
        setLoadingList(false);

        const pagedData = res?.result?.data;
        if (res?.status === 200 && pagedData && Array.isArray(pagedData.data)) {
            setPaymentsList(pagedData.data);
            setPaymentsTotalSuccess(
                Number(pagedData.summary?.total_success_amount ?? 0)
            );
        } else {
            setPaymentsList([]);
            setPaymentsTotalSuccess(0);
            setListError(extractApiError(res, 'Gagal memuat riwayat transaksi pembayaran.'));
        }
    }, []);

    const refreshCurrentList = useCallback(() => {
        const trimmedQ = searchText.trim();
        if (viewTab === 'queue') {
            void fetchBillingQueue(filterDate, trimmedQ);
        } else if (viewTab === 'bills') {
            void fetchBillsDirectory(
                filterDate,
                filterBillStatus,
                filterPaymentStatus,
                trimmedQ
            );
        } else {
            void fetchPaymentsHistory(filterDate, trimmedQ);
        }
    }, [
        viewTab,
        filterDate,
        filterBillStatus,
        filterPaymentStatus,
        searchText,
        fetchBillingQueue,
        fetchBillsDirectory,
        fetchPaymentsHistory,
    ]);

    useEffect(() => {
        let active = true;
        Promise.resolve().then(() => {
            if (!active) return;
            refreshCurrentList();
        });
        return () => {
            active = false;
        };
    }, [refreshCurrentList]);

    const hydratePaymentFormFromBill = useCallback((billData) => {
        if (!billData) return;
        const out = Number(billData.outstanding ?? 0);
        setPayAmount(out > 0 ? String(out) : '');
        setTenderedAmount(out > 0 ? String(out) : '');
        setPayMethod('CASH');
        setPayReferenceNo('');
        setCurrentIdempotencyKey(`pay-${uuidv4()}`);
    }, []);

    const handleLoadBillDetail = useCallback(
        async (billId, queueMeta = null) => {
            setLoadingBill(true);
            const res = await API.GET(`/api/bills/${billId}`);
            setLoadingBill(false);

            if (res?.status === 200 && res?.result?.rc === 200 && res.result.data) {
                const billData = res.result.data;
                setActiveBill(billData);
                if (queueMeta) {
                    setActiveQueueMeta(queueMeta);
                }
                setLastRecordedPayment(null);
                hydratePaymentFormFromBill(billData);
            } else {
                notifOpen(
                    'Gagal Memuat Tagihan',
                    extractApiError(res, 'Rincian tagihan tidak dapat dimuat'),
                    'danger'
                );
            }
        },
        [notifOpen, hydratePaymentFormFromBill]
    );

    const handleCreateOrSyncDraftForVisit = async (visitId, queueRow = null) => {
        setActingRowId(visitId);
        const res = await API.POST(`/api/visits/${visitId}/bill`, {});
        setActingRowId(null);

        if (
            res?.status < 400 &&
            (res?.result?.rc === 200 || res?.result?.rc === 201) &&
            res.result.data
        ) {
            const billData = res.result.data;
            notifOpen(
                res.result.rc === 201 ? 'Draft Tagihan Dibuat' : 'Draft Tagihan Disinkronisasi',
                `No. Tagihan ${billData.bill_no} (${billData.status}) — Total: Rp ${Helper.numFormat(
                    billData.total_amount
                )}`
            );
            setActiveBill(billData);
            if (queueRow) {
                setActiveQueueMeta(queueRow);
            }
            setLastRecordedPayment(null);
            hydratePaymentFormFromBill(billData);
            refreshCurrentList();
        } else {
            notifOpen(
                'Gagal Membuat / Sinkronisasi Tagihan',
                extractApiError(res, 'Tidak dapat membuat atau menyinkronisasi draft tagihan'),
                'danger'
            );
        }
    };

    const handleOpenQueueItem = async (queueRow) => {
        if (queueRow.bill_id && queueRow.bill_status && queueRow.bill_status !== 'DRAFT') {
            await handleLoadBillDetail(queueRow.bill_id, queueRow);
            return;
        }
        await handleCreateOrSyncDraftForVisit(queueRow.visit_id, queueRow);
    };

    const handleResyncActiveDraft = async () => {
        const visitId = activeBill?.visit?.id;
        if (!visitId) return;

        setSyncingDraft(true);
        const res = await API.POST(`/api/visits/${visitId}/bill`, {});
        setSyncingDraft(false);

        if (
            res?.status < 400 &&
            (res?.result?.rc === 200 || res?.result?.rc === 201) &&
            res.result.data
        ) {
            const billData = res.result.data;
            setActiveBill(billData);
            hydratePaymentFormFromBill(billData);
            notifOpen(
                'Komponen Biaya Disinkronisasi',
                `Rincian item tagihan ${billData.bill_no} telah diperbarui dari data kunjungan terbaru.`
            );
            refreshCurrentList();
        } else {
            notifOpen(
                'Gagal Sinkronisasi Draft',
                extractApiError(res, 'Gagal menyinkronisasi ulang komponen tagihan'),
                'danger'
            );
        }
    };

    const handleIssueBill = () => {
        if (!activeBill?.id) return;

        if (activeQueueMeta?.pending_prescription) {
            notifOpen(
                'Resep Obat Belum Diserahkan',
                'Masih ada resep obat berstatus PENDING / PROCESSING pada kunjungan ini. Selesaikan penyerahan obat di Farmasi sebelum menerbitkan tagihan.',
                'warning'
            );
            return;
        }

        confirmOpen(
            'Terbitkan Tagihan (Issue Bill)',
            `Terbitkan tagihan ${activeBill.bill_no} sebesar Rp ${Helper.numFormat(
                activeBill.total_amount
            )}? Setelah berstatus ISSUED, item tagihan akan dikunci dan siap menerima pembayaran.`,
            async () => {
                setConfirmLoading(true);
                setIssuingBill(true);
                const res = await API.POST(`/api/bills/${activeBill.id}/issue`, {});
                setConfirmLoading(false);
                setIssuingBill(false);
                confirmClose();

                if (res?.status < 400 && res?.result?.rc === 200 && res.result.data) {
                    const issued = res.result.data;
                    setActiveBill(issued);
                    hydratePaymentFormFromBill(issued);
                    notifOpen(
                        'Tagihan Diterbitkan (ISSUED)',
                        `Tagihan ${issued.bill_no} berhasil diterbitkan dan siap dibayar.`
                    );
                    refreshCurrentList();
                } else {
                    notifOpen(
                        'Gagal Menerbitkan Tagihan',
                        extractApiError(
                            res,
                            'Tagihan tidak dapat diterbitkan. Pastikan tidak ada resep obat yang masih PENDING/PROCESSING.'
                        ),
                        'danger'
                    );
                }
            }
        );
    };

    const computedChangeAmount = useMemo(() => {
        const amt = parseFloat(payAmount || '0');
        const tend = parseFloat(tenderedAmount || '0');
        if (Number.isNaN(amt) || Number.isNaN(tend) || amt <= 0) return 0;
        return Math.max(0, tend - amt);
    }, [payAmount, tenderedAmount]);

    const handleRecordPayment = async () => {
        if (!activeBill?.id) return;

        const amt = parseFloat(payAmount);
        const tend = parseFloat(tenderedAmount || payAmount);
        const outstanding = Number(activeBill.outstanding ?? 0);

        if (Number.isNaN(amt) || amt <= 0) {
            notifOpen(
                'Validasi Pembayaran',
                'Masukkan nominal pembayaran (amount) yang valid dan lebih dari 0',
                'warning'
            );
            return;
        }

        if (amt > outstanding + 0.001) {
            notifOpen(
                'Melebihi Sisa Tagihan',
                `Nominal pembayaran (Rp ${Helper.numFormat(
                    amt
                )}) tidak boleh melebihi sisa tagihan (Rp ${Helper.numFormat(outstanding)}).`,
                'warning'
            );
            return;
        }

        if (payMethod === 'CASH' && !Number.isNaN(tend) && tend < amt) {
            notifOpen(
                'Uang Diterima Kurang',
                `Uang tunai diterima (Rp ${Helper.numFormat(
                    tend
                )}) kurang dari nominal pembayaran yang dicatat (Rp ${Helper.numFormat(amt)}).`,
                'warning'
            );
            return;
        }

        const payload = {
            amount: amt,
            method: payMethod,
            tendered_amount: Number.isNaN(tend) ? amt : tend,
        };
        if (String(payReferenceNo || '').trim() !== '') {
            payload.reference_no = String(payReferenceNo).trim();
        }

        setSubmittingPayment(true);
        const res = await API.POST(
            `/api/bills/${activeBill.id}/payments`,
            payload,
            'yii',
            {
                'Idempotency-Key': currentIdempotencyKey,
            }
        );
        setSubmittingPayment(false);

        if (
            res?.status < 400 &&
            (res?.result?.rc === 200 || res?.result?.rc === 201) &&
            res.result.data
        ) {
            const paymentData = res.result.data;
            const changeVal = Math.max(0, (Number.isNaN(tend) ? amt : tend) - amt);

            setLastRecordedPayment({
                ...paymentData,
                tendered_amount: Number.isNaN(tend) ? amt : tend,
                change_amount: changeVal,
            });

            notifOpen(
                'Pembayaran Berhasil Dicatat',
                `No. Pembayaran: ${paymentData.payment_no} — Dibayar: Rp ${Helper.numFormat(
                    paymentData.amount
                )} | Kembalian: Rp ${Helper.numFormat(changeVal)}`
            );

            await handleLoadBillDetail(activeBill.id, activeQueueMeta);
            setLastRecordedPayment({
                ...paymentData,
                tendered_amount: Number.isNaN(tend) ? amt : tend,
                change_amount: changeVal,
            });
            refreshCurrentList();
        } else {
            notifOpen(
                'Gagal Mencatat Pembayaran',
                extractApiError(res, 'Terjadi kesalahan saat menyimpan transaksi pembayaran'),
                'danger'
            );
        }
    };

    const handleOpenPrintHtmlWindow = async (type, id, autoPrint = true) => {
        if (!id) return;
        const docKey = `${type}-${id}`;
        setPrintingDocKey(docKey);

        const endpoint =
            type === 'invoice'
                ? `/api/bills/${id}/print-link`
                : `/api/payments/${id}/print-link`;

        const res = await API.POST(endpoint, {});
        setPrintingDocKey(null);

        if (res?.status === 200 && res?.result?.rc === 200 && res.result.data?.url) {
            const relativeUrl = res.result.data.url;
            const baseUrl = API.YiiUrl || 'http://localhost:8080';
            const fullUrl = `${baseUrl}${relativeUrl}${autoPrint ? '&autoprint=1' : ''}`;
            window.open(fullUrl, '_blank', 'noopener,noreferrer');
        } else {
            notifOpen(
                'Gagal Membuat Link Cetak',
                extractApiError(res, 'Tidak dapat membuat token cetak dokumen'),
                'danger'
            );
        }
    };

    const handleOpenJsonPreview = async (type, id) => {
        if (!id) return;
        setJsonPreviewModalOpen(true);
        setLoadingJsonPreview(true);
        setJsonPreviewData(null);
        setJsonPreviewTitle(
            type === 'invoice'
                ? 'Rincian Data Invoice Tagihan'
                : 'Rincian Data Struk Pembayaran (Receipt)'
        );

        const endpoint =
            type === 'invoice'
                ? `/api/bills/${id}/invoice`
                : `/api/payments/${id}/receipt`;

        const res = await API.GET(endpoint);
        setLoadingJsonPreview(false);

        if (res?.status === 200 && res?.result?.rc === 200 && res.result.data) {
            setJsonPreviewData({ type, payload: res.result.data });
        } else {
            setJsonPreviewModalOpen(false);
            notifOpen(
                'Gagal Memuat Data Dokumen',
                extractApiError(res, 'Data dokumen tidak dapat dimuat'),
                'danger'
            );
        }
    };

    const handleConfirmCancelBill = async () => {
        if (!activeBill?.id) return;
        const trimmed = String(cancelBillReason || '').trim();
        if (trimmed.length < 10) {
            notifOpen(
                'Validasi Pembatalan',
                'Alasan pembatalan tagihan wajib diisi minimal 10 karakter',
                'warning'
            );
            return;
        }

        setCancellingBill(true);
        const res = await API.POST(`/api/bills/${activeBill.id}/cancel`, {
            reason: trimmed,
        });
        setCancellingBill(false);

        if (res?.status < 400 && res?.result?.rc === 200 && res.result.data) {
            setActiveBill(res.result.data);
            setCancelBillModalOpen(false);
            setCancelBillReason('');
            notifOpen('Tagihan Dibatalkan', 'Draft tagihan berhasil dibatalkan.');
            refreshCurrentList();
        } else {
            notifOpen(
                'Gagal Membatalkan Tagihan',
                extractApiError(res, 'Draft tagihan tidak dapat dibatalkan'),
                'danger'
            );
        }
    };

    const handleConfirmVoidPayment = async () => {
        if (!voidTargetPayment?.id) return;
        const trimmed = String(voidPaymentReason || '').trim();
        if (trimmed.length < 10) {
            notifOpen(
                'Validasi Void Pembayaran',
                'Alasan void pembayaran wajib diisi minimal 10 karakter',
                'warning'
            );
            return;
        }

        setVoidingPayment(true);
        const res = await API.POST(`/api/payments/${voidTargetPayment.id}/void`, {
            reason: trimmed,
        });
        setVoidingPayment(false);

        if (res?.status < 400 && res?.result?.rc === 200) {
            notifOpen(
                'Pembayaran Dibatalkan (VOID)',
                `Pembayaran ${voidTargetPayment.payment_no} berhasil di-VOID.`
            );
            setVoidPaymentModalOpen(false);
            setVoidTargetPayment(null);
            setVoidPaymentReason('');
            if (activeBill?.id) {
                await handleLoadBillDetail(activeBill.id, activeQueueMeta);
            }
            refreshCurrentList();
        } else {
            notifOpen(
                'Gagal Void Pembayaran',
                extractApiError(res, 'Pembayaran tidak dapat di-void'),
                'danger'
            );
        }
    };

    const queueStats = useMemo(() => {
        const stats = {
            totalDone: queueList.length,
            noBill: 0,
            draft: 0,
            issued: 0,
            pendingRx: 0,
        };
        queueList.forEach((row) => {
            if (!row.bill_status) stats.noBill += 1;
            else if (row.bill_status === 'DRAFT') stats.draft += 1;
            else if (row.bill_status === 'ISSUED') stats.issued += 1;
            if (row.pending_prescription) stats.pendingRx += 1;
        });
        return stats;
    }, [queueList]);

    const filteredQueueList = useMemo(() => {
        return queueList.filter((item) => {
            if (filterBillStatus === 'NONE' && item.bill_status) return false;
            if (
                filterBillStatus &&
                filterBillStatus !== 'NONE' &&
                item.bill_status !== filterBillStatus
            ) {
                return false;
            }
            return true;
        });
    }, [queueList, filterBillStatus]);

    const queueColumns = [
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
            title: 'Status Resep Farmasi',
            dataIndex: 'pending_prescription',
            width: '195px',
            align: 'center',
            render: (hasPending) =>
                hasPending ? (
                    <Tag color="warning" icon={<ClockCircleOutlined />} style={{ margin: 0 }}>
                        Resep Belum Diserahkan
                    </Tag>
                ) : (
                    <Tag color="success" icon={<CheckCircleOutlined />} style={{ margin: 0 }}>
                        Siap Ditagihkan
                    </Tag>
                ),
        },
        {
            title: 'Status Tagihan',
            dataIndex: 'bill_status',
            width: '150px',
            align: 'center',
            render: (st) => renderBillStatusBadge(st),
        },
        {
            title: 'Aksi Kasir',
            key: 'actions',
            width: '250px',
            align: 'center',
            render: (_, row) => {
                const isActing = actingRowId === row.visit_id;
                return (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '6px',
                            flexWrap: 'wrap',
                        }}
                    >
                        {!row.bill_id && (
                            <button
                                type="button"
                                className="btn btn-primary btn-sm my-1"
                                disabled={isActing}
                                onClick={() => void handleOpenQueueItem(row)}
                            >
                                <DollarOutlined />
                                {isActing ? 'Memproses...' : 'Buat Draft Tagihan'}
                            </button>
                        )}

                        {row.bill_id && row.bill_status === 'DRAFT' && (
                            <button
                                type="button"
                                className="btn btn-primary btn-sm my-1"
                                disabled={isActing}
                                onClick={() => void handleOpenQueueItem(row)}
                            >
                                <SyncOutlined />
                                {isActing ? 'Sinkronisasi...' : 'Sinkron & Buka Draft'}
                            </button>
                        )}

                        {row.bill_id && row.bill_status !== 'DRAFT' && (
                            <button
                                type="button"
                                className="btn btn-light-primary btn-sm my-1"
                                disabled={isActing}
                                onClick={() => void handleLoadBillDetail(row.bill_id, row)}
                            >
                                <CreditCardOutlined />
                                Buka Tagihan &amp; Bayar
                            </button>
                        )}
                    </div>
                );
            },
        },
    ];

    const billsColumns = [
        {
            title: 'No. Tagihan (Invoice)',
            dataIndex: 'bill_no',
            width: '185px',
            render: (val, row) => (
                <div>
                    <div className="fw-7 text-primary">{val}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                        Kunjungan: {row.visit_no || '-'}
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
                    </div>
                </div>
            ),
        },
        {
            title: 'Status Bill',
            dataIndex: 'status',
            width: '125px',
            align: 'center',
            render: (st) => renderBillStatusBadge(st),
        },
        {
            title: 'Status Pembayaran',
            dataIndex: 'payment_status',
            width: '180px',
            align: 'center',
            render: (pst) => renderPaymentStatusBadge(pst),
        },
        {
            title: 'Total Tagihan',
            dataIndex: 'total_amount',
            width: '140px',
            align: 'right',
            render: (val) => <span className="fw-7">Rp {Helper.numFormat(val)}</span>,
        },
        {
            title: 'Sudah Dibayar',
            dataIndex: 'paid_amount',
            width: '140px',
            align: 'right',
            render: (val) => (
                <span className="text-success fw-7">Rp {Helper.numFormat(val)}</span>
            ),
        },
        {
            title: 'Sisa (Outstanding)',
            dataIndex: 'outstanding',
            width: '145px',
            align: 'right',
            render: (val) => (
                <span className={Number(val) > 0 ? 'text-danger fw-7' : 'text-muted'}>
                    Rp {Helper.numFormat(val)}
                </span>
            ),
        },
        {
            title: 'Aksi',
            key: 'act',
            width: '210px',
            align: 'center',
            render: (_, row) => (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                    <button
                        type="button"
                        className="btn btn-primary btn-sm my-1"
                        onClick={() => void handleLoadBillDetail(row.id)}
                    >
                        <FileSearchOutlined />
                        Detail / Bayar
                    </button>
                    {row.status === 'ISSUED' && (
                        <button
                            type="button"
                            className="btn btn-light-primary btn-sm my-1"
                            disabled={printingDocKey === `invoice-${row.id}`}
                            onClick={() =>
                                void handleOpenPrintHtmlWindow('invoice', row.id, true)
                            }
                            title="Cetak Invoice Tagihan"
                        >
                            <PrinterOutlined />
                            Invoice
                        </button>
                    )}
                </div>
            ),
        },
    ];

    const paymentsColumns = [
        {
            title: 'No. Pembayaran',
            dataIndex: 'payment_no',
            width: '185px',
            render: (val, row) => (
                <div>
                    <div className="fw-7 text-primary">{val}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                        {row.paid_at || '-'}
                    </div>
                </div>
            ),
        },
        {
            title: 'No. Tagihan & Pasien',
            key: 'patient',
            render: (_, row) => (
                <div>
                    <div style={{ fontWeight: 600 }}>
                        {row.patient?.full_name || '-'} ({row.patient?.medical_record_no || '-'})
                    </div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                        Invoice: <strong>{row.bill?.bill_no || '-'}</strong>
                    </div>
                </div>
            ),
        },
        {
            title: 'Metode',
            dataIndex: 'method',
            width: '100px',
            align: 'center',
            render: (m) => <Tag color="blue">{m || 'CASH'}</Tag>,
        },
        {
            title: 'Nominal Bayar',
            dataIndex: 'amount',
            width: '150px',
            align: 'right',
            render: (val) => <span className="fw-7">Rp {Helper.numFormat(val)}</span>,
        },
        {
            title: 'Kasir',
            key: 'cashier',
            width: '150px',
            render: (_, row) => row.cashier?.full_name || row.cashier?.username || '-',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            width: '110px',
            align: 'center',
            render: (st) => (
                <Tag color={st === 'SUCCESS' ? 'green' : 'red'} style={{ fontWeight: 600 }}>
                    {st}
                </Tag>
            ),
        },
        {
            title: 'Cetak Struk',
            key: 'act',
            width: '220px',
            align: 'center',
            render: (_, row) => (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                    {row.status === 'SUCCESS' && (
                        <>
                            <button
                                type="button"
                                className="btn btn-primary btn-sm my-1"
                                disabled={printingDocKey === `receipt-${row.id}`}
                                onClick={() =>
                                    void handleOpenPrintHtmlWindow('receipt', row.id, true)
                                }
                            >
                                <PrinterOutlined />
                                Cetak Struk
                            </button>
                            <button
                                type="button"
                                className="btn btn-light-primary btn-sm my-1"
                                onClick={() => void handleOpenJsonPreview('receipt', row.id)}
                                title="Lihat Data JSON Receipt"
                            >
                                <FileTextOutlined />
                            </button>
                        </>
                    )}
                    {row.bill_id && (
                        <button
                            type="button"
                            className="btn btn-light-primary btn-sm my-1"
                            onClick={() => void handleLoadBillDetail(row.bill_id)}
                            title="Buka Tagihan Terkait"
                        >
                            Tagihan
                        </button>
                    )}
                </div>
            ),
        },
    ];

    if (activeBill) {
        const isDraft = activeBill.status === 'DRAFT';
        const isIssued = activeBill.status === 'ISSUED';
        const isPaid = activeBill.payment_status === 'PAID';
        const outstanding = Number(activeBill.outstanding ?? 0);
        const subtotals = activeBill.subtotals || {};

        return (
            <>
                <div className="containers">
                    <div className="headContent" style={{ minHeight: '40px' }}>
                        <div className="containerTitle">
                            <div className="breadCrumb">
                                <div className="text">Kasir &amp; Pembayaran</div>
                                <div className="text">{activeBill.bill_no}</div>
                            </div>
                            <div className="title text-dark-grey left">
                                Rincian Tagihan Kunjungan, Pembayaran &amp; Cetak Struk
                            </div>
                        </div>

                        <div className="filter mb-3">
                            <button
                                type="button"
                                className="btn btn-light-primary"
                                onClick={() => {
                                    setActiveBill(null);
                                    setActiveQueueMeta(null);
                                    setLastRecordedPayment(null);
                                    refreshCurrentList();
                                }}
                            >
                                <ArrowLeftOutlined />
                                Kembali ke Antrean Kasir
                            </button>

                            {isIssued && (
                                <>
                                    <button
                                        type="button"
                                        className="btn btn-light-primary"
                                        onClick={() =>
                                            void handleOpenJsonPreview('invoice', activeBill.id)
                                        }
                                    >
                                        <FileTextOutlined />
                                        Ringkasan Invoice
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        disabled={printingDocKey === `invoice-${activeBill.id}`}
                                        onClick={() =>
                                            void handleOpenPrintHtmlWindow(
                                                'invoice',
                                                activeBill.id,
                                                true
                                            )
                                        }
                                    >
                                        <PrinterOutlined />
                                        {printingDocKey === `invoice-${activeBill.id}`
                                            ? 'Menyiapkan Cetak...'
                                            : 'Cetak Invoice (HTML)'}
                                    </button>
                                </>
                            )}

                            <button
                                type="button"
                                className="btn btn-circle btn-light-primary"
                                onClick={() =>
                                    void handleLoadBillDetail(activeBill.id, activeQueueMeta)
                                }
                                aria-label="Muat ulang rincian tagihan"
                                title="Muat ulang rincian tagihan"
                            >
                                <ReloadOutlined />
                            </button>
                        </div>
                    </div>

                    <Spin spinning={loadingBill}>
                        <Card
                            size="small"
                            style={{
                                borderRadius: '16px',
                                marginBottom: '16px',
                                border: '1px solid var(--primary-light)',
                            }}
                        >
                            <Row gutter={[16, 12]} align="middle">
                                <Col xs={24} md={7}>
                                    <div className="text-muted" style={{ fontSize: '11px' }}>
                                        Nomor Tagihan / Invoice
                                    </div>
                                    <div className="fw-7 text-primary" style={{ fontSize: '18px' }}>
                                        {activeBill.bill_no}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: '12px' }}>
                                        Kunjungan: <strong>{activeBill.visit?.visit_no || '-'}</strong>{' '}
                                        ({activeBill.visit?.visit_date || '-'})
                                    </div>
                                </Col>

                                <Col xs={12} sm={8} md={6}>
                                    <div className="text-muted" style={{ fontSize: '11px' }}>
                                        Identitas Pasien
                                    </div>
                                    <div className="fw-7" style={{ fontSize: '15px' }}>
                                        {activeBill.patient?.full_name || '-'}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: '12px' }}>
                                        No. RM:{' '}
                                        <strong className="text-primary">
                                            {activeBill.patient?.medical_record_no || '-'}
                                        </strong>
                                    </div>
                                </Col>

                                <Col xs={12} sm={8} md={5}>
                                    <div className="text-muted" style={{ fontSize: '11px' }}>
                                        Poliklinik &amp; Dokter
                                    </div>
                                    <div className="fw-7" style={{ fontSize: '13px' }}>
                                        {activeBill.visit?.poli?.name || '-'}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: '12px' }}>
                                        {activeBill.visit?.doctor?.full_name || '-'}
                                    </div>
                                </Col>

                                <Col xs={24} sm={8} md={6}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'flex-end',
                                            gap: '10px',
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        <div>
                                            <div
                                                className="text-muted"
                                                style={{ fontSize: '11px', textAlign: 'right' }}
                                            >
                                                Status Tagihan
                                            </div>
                                            {renderBillStatusBadge(activeBill.status)}
                                        </div>
                                        <div>
                                            <div
                                                className="text-muted"
                                                style={{ fontSize: '11px', textAlign: 'right' }}
                                            >
                                                Status Pembayaran
                                            </div>
                                            {renderPaymentStatusBadge(activeBill.payment_status)}
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </Card>

                        {activeQueueMeta?.pending_prescription && isDraft && (
                            <Alert
                                type="warning"
                                showIcon
                                icon={<ExclamationCircleOutlined />}
                                style={{ marginBottom: '16px', borderRadius: '12px' }}
                                message="Perhatian: Masih Ada Resep Obat yang Belum Diserahkan (PENDING / PROCESSING)"
                                description="Tagihan ini masih berstatus DRAFT. Pastikan petugas Farmasi sudah menyerahkan obat (DISPENSED) lalu klik 'Sinkronisasi Ulang Komponen Biaya' sebelum menerbitkan tagihan (Issue Bill)."
                            />
                        )}

                        <Row gutter={[12, 12]} style={{ marginBottom: '16px' }}>
                            <Col xs={12} sm={6}>
                                <Card size="small" style={{ borderRadius: '14px' }}>
                                    <div className="text-muted" style={{ fontSize: '12px' }}>
                                        Total Tagihan
                                    </div>
                                    <div className="fw-7 text-primary" style={{ fontSize: '20px' }}>
                                        Rp {Helper.numFormat(activeBill.total_amount)}
                                    </div>
                                </Card>
                            </Col>
                            <Col xs={12} sm={6}>
                                <Card size="small" style={{ borderRadius: '14px' }}>
                                    <div className="text-muted" style={{ fontSize: '12px' }}>
                                        Total Terbayar
                                    </div>
                                    <div className="fw-7 text-success" style={{ fontSize: '20px' }}>
                                        Rp {Helper.numFormat(activeBill.paid_amount)}
                                    </div>
                                </Card>
                            </Col>
                            <Col xs={12} sm={6}>
                                <Card size="small" style={{ borderRadius: '14px' }}>
                                    <div className="text-muted" style={{ fontSize: '12px' }}>
                                        Sisa Tagihan (Outstanding)
                                    </div>
                                    <div
                                        className={`fw-7 ${
                                            outstanding > 0 ? 'text-danger' : 'text-success'
                                        }`}
                                        style={{ fontSize: '20px' }}
                                    >
                                        Rp {Helper.numFormat(outstanding)}
                                    </div>
                                </Card>
                            </Col>
                            <Col xs={12} sm={6}>
                                <Card
                                    size="small"
                                    style={{
                                        borderRadius: '14px',
                                        background: 'var(--primary-light)',
                                    }}
                                >
                                    <div className="text-muted" style={{ fontSize: '12px' }}>
                                        Tindakan Status Tagihan
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '6px',
                                            marginTop: '4px',
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        {isDraft && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="btn btn-light-primary btn-sm"
                                                    disabled={syncingDraft || issuingBill}
                                                    onClick={() => void handleResyncActiveDraft()}
                                                    title="Kumpulkan ulang biaya Pendaftaran, Tindakan, Lab, dan Obat DISPENSED"
                                                >
                                                    <SyncOutlined spin={syncingDraft} />
                                                    Sinkron Ulang
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-primary btn-sm"
                                                    disabled={syncingDraft || issuingBill}
                                                    onClick={handleIssueBill}
                                                >
                                                    <FileDoneOutlined />
                                                    {issuingBill
                                                        ? 'Menerbitkan...'
                                                        : 'Terbitkan (Issue)'}
                                                </button>
                                                {isAdminRole && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-light-danger btn-sm"
                                                        onClick={() => {
                                                            setCancelBillReason('');
                                                            setCancelBillModalOpen(true);
                                                        }}
                                                    >
                                                        Batalkan
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {isIssued && (
                                            <span
                                                className="fw-7 text-primary"
                                                style={{ fontSize: '13px' }}
                                            >
                                                Diterbitkan: {activeBill.issued_at || '-'}
                                            </span>
                                        )}
                                    </div>
                                </Card>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]}>
                            <Col xs={24} lg={14}>
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
                                                Komponen Biaya Kunjungan (Bill Items —{' '}
                                                {activeBill.items?.length || 0} item)
                                            </span>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                <Tag color="blue">
                                                    Pendaftaran: Rp{' '}
                                                    {Helper.numFormat(subtotals.REGISTRATION || 0)}
                                                </Tag>
                                                <Tag color="cyan">
                                                    Tindakan: Rp{' '}
                                                    {Helper.numFormat(subtotals.PROCEDURE || 0)}
                                                </Tag>
                                                <Tag color="purple">
                                                    Lab: Rp {Helper.numFormat(subtotals.LAB || 0)}
                                                </Tag>
                                                <Tag color="green">
                                                    Obat: Rp {Helper.numFormat(subtotals.DRUG || 0)}
                                                </Tag>
                                            </div>
                                        </div>
                                    }
                                    style={{ borderRadius: '14px', marginBottom: '16px' }}
                                >
                                    {!Array.isArray(activeBill.items) ||
                                    activeBill.items.length === 0 ? (
                                        <Empty
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                            description="Belum ada item biaya pada tagihan ini."
                                        />
                                    ) : (
                                        <Table
                                            size="small"
                                            pagination={false}
                                            rowKey="id"
                                            dataSource={activeBill.items}
                                            columns={[
                                                {
                                                    title: 'Kategori',
                                                    dataIndex: 'item_type',
                                                    width: '150px',
                                                    render: (type) => {
                                                        const cfg = itemTypeLabelMap[type] || {
                                                            label: type,
                                                            color: 'default',
                                                        };
                                                        return (
                                                            <Tag color={cfg.color}>{cfg.label}</Tag>
                                                        );
                                                    },
                                                },
                                                {
                                                    title: 'Deskripsi Layanan / Item',
                                                    dataIndex: 'description',
                                                    render: (val) => (
                                                        <span style={{ fontWeight: 600 }}>
                                                            {val || '-'}
                                                        </span>
                                                    ),
                                                },
                                                {
                                                    title: 'Harga Satuan',
                                                    dataIndex: 'unit_price',
                                                    width: '130px',
                                                    align: 'right',
                                                    render: (val) => `Rp ${Helper.numFormat(val)}`,
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
                                                    width: '135px',
                                                    align: 'right',
                                                    render: (val) => (
                                                        <span className="fw-7">
                                                            Rp {Helper.numFormat(val)}
                                                        </span>
                                                    ),
                                                },
                                            ]}
                                        />
                                    )}
                                </Card>

                                <Card
                                    size="small"
                                    title={`Riwayat Pembayaran Tagihan Ini (${
                                        activeBill.payments?.length || 0
                                    })`}
                                    style={{ borderRadius: '14px' }}
                                >
                                    {!Array.isArray(activeBill.payments) ||
                                    activeBill.payments.length === 0 ? (
                                        <Empty
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                            description="Belum ada pembayaran yang tercatat untuk tagihan ini."
                                        />
                                    ) : (
                                        <Table
                                            size="small"
                                            pagination={false}
                                            rowKey="id"
                                            dataSource={activeBill.payments}
                                            columns={[
                                                {
                                                    title: 'No. Pembayaran',
                                                    dataIndex: 'payment_no',
                                                    render: (val, row) => (
                                                        <div>
                                                            <div className="fw-7 text-primary">
                                                                {val}
                                                            </div>
                                                            <div
                                                                className="text-muted"
                                                                style={{ fontSize: '11px' }}
                                                            >
                                                                {row.paid_at || '-'}
                                                            </div>
                                                        </div>
                                                    ),
                                                },
                                                {
                                                    title: 'Metode',
                                                    dataIndex: 'method',
                                                    width: '90px',
                                                    align: 'center',
                                                    render: (m) => <Tag color="blue">{m}</Tag>,
                                                },
                                                {
                                                    title: 'Nominal',
                                                    dataIndex: 'amount',
                                                    width: '135px',
                                                    align: 'right',
                                                    render: (val) => (
                                                        <span className="fw-7">
                                                            Rp {Helper.numFormat(val)}
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
                                                                st === 'SUCCESS' ? 'green' : 'red'
                                                            }
                                                        >
                                                            {st}
                                                        </Tag>
                                                    ),
                                                },
                                                {
                                                    title: 'Struk (Receipt)',
                                                    key: 'act',
                                                    width: '215px',
                                                    align: 'center',
                                                    render: (_, row) => (
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                justifyContent: 'center',
                                                                gap: '6px',
                                                            }}
                                                        >
                                                            {row.status === 'SUCCESS' && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-primary btn-sm"
                                                                        style={{
                                                                            height: '28px',
                                                                            padding: '0 10px',
                                                                        }}
                                                                        disabled={
                                                                            printingDocKey ===
                                                                            `receipt-${row.id}`
                                                                        }
                                                                        onClick={() =>
                                                                            void handleOpenPrintHtmlWindow(
                                                                                'receipt',
                                                                                row.id,
                                                                                true
                                                                            )
                                                                        }
                                                                    >
                                                                        <PrinterOutlined />
                                                                        Cetak Struk
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-light-primary btn-sm"
                                                                        style={{
                                                                            height: '28px',
                                                                            padding: '0 8px',
                                                                        }}
                                                                        onClick={() =>
                                                                            void handleOpenJsonPreview(
                                                                                'receipt',
                                                                                row.id
                                                                            )
                                                                        }
                                                                        title="Pratinjau Data Struk"
                                                                    >
                                                                        <FileTextOutlined />
                                                                    </button>
                                                                    {isAdminRole && (
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-light-danger btn-sm"
                                                                            style={{
                                                                                height: '28px',
                                                                                padding: '0 8px',
                                                                            }}
                                                                            onClick={() => {
                                                                                setVoidTargetPayment(
                                                                                    row
                                                                                );
                                                                                setVoidPaymentReason(
                                                                                    ''
                                                                                );
                                                                                setVoidPaymentModalOpen(
                                                                                    true
                                                                                );
                                                                            }}
                                                                        >
                                                                            Void
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    ),
                                                },
                                            ]}
                                        />
                                    )}
                                </Card>
                            </Col>

                            <Col xs={24} lg={10}>
                                <Card
                                    size="small"
                                    title={
                                        <span>
                                            <CreditCardOutlined className="text-primary me-2" />
                                            Loket Pencatatan Pembayaran Kasir
                                        </span>
                                    }
                                    style={{ borderRadius: '14px' }}
                                >
                                    {lastRecordedPayment && (
                                        <Alert
                                            type="success"
                                            showIcon
                                            style={{ marginBottom: '14px', borderRadius: '12px' }}
                                            message={`Pembayaran Tercatat: ${lastRecordedPayment.payment_no}`}
                                            description={
                                                <div style={{ marginTop: '6px' }}>
                                                    <div>
                                                        Dibayar:{' '}
                                                        <strong>
                                                            Rp{' '}
                                                            {Helper.numFormat(
                                                                lastRecordedPayment.amount
                                                            )}
                                                        </strong>{' '}
                                                        | Diterima: Rp{' '}
                                                        {Helper.numFormat(
                                                            lastRecordedPayment.tendered_amount
                                                        )}
                                                    </div>
                                                    <div
                                                        className="fw-7 text-primary"
                                                        style={{
                                                            fontSize: '15px',
                                                            margin: '4px 0 8px',
                                                        }}
                                                    >
                                                        Uang Kembalian: Rp{' '}
                                                        {Helper.numFormat(
                                                            lastRecordedPayment.change_amount
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() =>
                                                            void handleOpenPrintHtmlWindow(
                                                                'receipt',
                                                                lastRecordedPayment.id,
                                                                true
                                                            )
                                                        }
                                                    >
                                                        <PrinterOutlined />
                                                        Cetak Struk Pembayaran Ini
                                                    </button>
                                                </div>
                                            }
                                        />
                                    )}

                                    {isDraft ? (
                                        <Alert
                                            type="info"
                                            showIcon
                                            message="Tagihan Masih Berstatus DRAFT"
                                            description={
                                                <div>
                                                    <p style={{ marginBottom: '10px' }}>
                                                        Periksa kelengkapan item biaya di sebelah
                                                        kiri. Klik tombol{' '}
                                                        <strong>Terbitkan (Issue)</strong> terlebih
                                                        dahulu untuk mengunci item tagihan dan
                                                        membuka form pembayaran.
                                                    </p>
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary btn-sm"
                                                        disabled={issuingBill}
                                                        onClick={handleIssueBill}
                                                    >
                                                        <FileDoneOutlined />
                                                        Terbitkan Tagihan Sekarang
                                                    </button>
                                                </div>
                                            }
                                        />
                                    ) : isPaid ? (
                                        <Alert
                                            type="success"
                                            showIcon
                                            icon={<CheckCircleOutlined />}
                                            message="Tagihan Sudah Lunas (PAID)"
                                            description={
                                                <div style={{ marginTop: '8px' }}>
                                                    <p style={{ marginBottom: '10px' }}>
                                                        Seluruh tagihan kunjungan ini telah
                                                        dilunasi. Anda dapat mencetak Invoice
                                                        maupun Struk Pembayaran dari daftar di
                                                        samping.
                                                    </p>
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() =>
                                                            void handleOpenPrintHtmlWindow(
                                                                'invoice',
                                                                activeBill.id,
                                                                true
                                                            )
                                                        }
                                                    >
                                                        <PrinterOutlined />
                                                        Cetak Rincian Invoice (HTML)
                                                    </button>
                                                </div>
                                            }
                                        />
                                    ) : activeBill.status === 'CANCELLED' ? (
                                        <Alert
                                            type="error"
                                            showIcon
                                            message="Tagihan Dibatalkan (CANCELLED)"
                                            description="Tagihan ini telah dibatalkan dan tidak dapat menerima pembayaran."
                                        />
                                    ) : (
                                        <div>
                                            <div style={{ marginBottom: '12px' }}>
                                                <label
                                                    htmlFor="pay_method"
                                                    style={{
                                                        display: 'block',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        marginBottom: '4px',
                                                    }}
                                                >
                                                    Metode Pembayaran
                                                </label>
                                                <select
                                                    id="pay_method"
                                                    className="form-control"
                                                    value={payMethod}
                                                    onChange={(e) => setPayMethod(e.target.value)}
                                                >
                                                    <option value="CASH">CASH (Tunai)</option>
                                                </select>
                                            </div>

                                            <div style={{ marginBottom: '12px' }}>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        marginBottom: '4px',
                                                    }}
                                                >
                                                    <label
                                                        htmlFor="pay_amount"
                                                        style={{
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        Nominal Pembayaran (Amount) *
                                                    </label>
                                                    <button
                                                        type="button"
                                                        className="btn btn-light-primary btn-sm"
                                                        style={{
                                                            height: '22px',
                                                            padding: '0 8px',
                                                            fontSize: '11px',
                                                        }}
                                                        onClick={() => {
                                                            setPayAmount(String(outstanding));
                                                            if (
                                                                !tenderedAmount ||
                                                                parseFloat(tenderedAmount) <
                                                                    outstanding
                                                            ) {
                                                                setTenderedAmount(
                                                                    String(outstanding)
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        Bayar Penuh (Rp{' '}
                                                        {Helper.numFormat(outstanding)})
                                                    </button>
                                                </div>
                                                <input
                                                    id="pay_amount"
                                                    type="number"
                                                    min={1}
                                                    max={outstanding}
                                                    className="form-control"
                                                    placeholder="Nominal yang dibayarkan..."
                                                    value={payAmount}
                                                    onChange={(e) => setPayAmount(e.target.value)}
                                                />
                                            </div>

                                            <div style={{ marginBottom: '12px' }}>
                                                <label
                                                    htmlFor="tendered_amount"
                                                    style={{
                                                        display: 'block',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        marginBottom: '4px',
                                                    }}
                                                >
                                                    Uang Tunai Diterima (Tendered Amount) *
                                                </label>
                                                <input
                                                    id="tendered_amount"
                                                    type="number"
                                                    min={0}
                                                    className="form-control"
                                                    placeholder="Nominal uang yang diserahkan pasien..."
                                                    value={tenderedAmount}
                                                    onChange={(e) =>
                                                        setTenderedAmount(e.target.value)
                                                    }
                                                />
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        gap: '6px',
                                                        marginTop: '6px',
                                                        flexWrap: 'wrap',
                                                    }}
                                                >
                                                    {[
                                                        outstanding,
                                                        Math.ceil(outstanding / 50000) * 50000,
                                                        Math.ceil(outstanding / 100000) * 100000,
                                                    ]
                                                        .filter(
                                                            (v, idx, arr) =>
                                                                v > 0 && arr.indexOf(v) === idx
                                                        )
                                                        .map((preset) => (
                                                            <button
                                                                key={preset}
                                                                type="button"
                                                                className="btn btn-light-primary btn-sm"
                                                                style={{
                                                                    height: '24px',
                                                                    padding: '0 8px',
                                                                    fontSize: '11px',
                                                                }}
                                                                onClick={() =>
                                                                    setTenderedAmount(
                                                                        String(preset)
                                                                    )
                                                                }
                                                            >
                                                                Rp {Helper.numFormat(preset)}
                                                            </button>
                                                        ))}
                                                </div>
                                            </div>

                                            <Card
                                                size="small"
                                                style={{
                                                    borderRadius: '12px',
                                                    background: 'var(--primary-light)',
                                                    marginBottom: '12px',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <span
                                                        className="fw-7"
                                                        style={{ fontSize: '13px' }}
                                                    >
                                                        Estimasi Kembalian (Change):
                                                    </span>
                                                    <span
                                                        className="fw-7 text-primary"
                                                        style={{ fontSize: '18px' }}
                                                    >
                                                        Rp {Helper.numFormat(computedChangeAmount)}
                                                    </span>
                                                </div>
                                            </Card>

                                            <div style={{ marginBottom: '12px' }}>
                                                <label
                                                    htmlFor="pay_ref_no"
                                                    style={{
                                                        display: 'block',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        marginBottom: '4px',
                                                    }}
                                                >
                                                    Catatan / No. Referensi (Opsional)
                                                </label>
                                                <input
                                                    id="pay_ref_no"
                                                    type="text"
                                                    maxLength={60}
                                                    className="form-control"
                                                    placeholder="Catatan pembayaran..."
                                                    value={payReferenceNo}
                                                    onChange={(e) =>
                                                        setPayReferenceNo(e.target.value)
                                                    }
                                                />
                                            </div>

                                            <div
                                                className="text-muted"
                                                style={{
                                                    fontSize: '11px',
                                                    marginBottom: '12px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                }}
                                            >
                                                <span>Idempotency-Key: {currentIdempotencyKey}</span>
                                                <button
                                                    type="button"
                                                    style={{
                                                        border: 'none',
                                                        background: 'transparent',
                                                        color: 'var(--primary-dark)',
                                                        cursor: 'pointer',
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                    }}
                                                    onClick={() =>
                                                        setCurrentIdempotencyKey(`pay-${uuidv4()}`)
                                                    }
                                                >
                                                    Reset Key
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                style={{ width: '100%' }}
                                                disabled={submittingPayment}
                                                onClick={() => void handleRecordPayment()}
                                            >
                                                <CheckCircleOutlined />
                                                {submittingPayment
                                                    ? 'Memproses Pembayaran...'
                                                    : 'Catat Pembayaran Tunai'}
                                            </button>
                                        </div>
                                    )}
                                </Card>
                            </Col>
                        </Row>
                    </Spin>
                </div>

                <Modal
                    centered
                    open={cancelBillModalOpen}
                    onCancel={() => setCancelBillModalOpen(false)}
                    title="Batalkan Draft Tagihan (ADMIN)"
                    footer={null}
                    width="460px"
                >
                    <div style={{ paddingTop: '8px' }}>
                        <label
                            htmlFor="cancel_bill_reason"
                            style={{
                                display: 'block',
                                fontSize: '12px',
                                fontWeight: 600,
                                marginBottom: '4px',
                            }}
                        >
                            Alasan Pembatalan Tagihan (Minimal 10 Karakter) *
                        </label>
                        <textarea
                            id="cancel_bill_reason"
                            rows={3}
                            className="form-control"
                            style={{ minHeight: '80px', borderRadius: '12px' }}
                            placeholder="Tuliskan alasan pembatalan draft tagihan..."
                            value={cancelBillReason}
                            onChange={(e) => setCancelBillReason(e.target.value)}
                        />
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '8px',
                                marginTop: '14px',
                            }}
                        >
                            <button
                                type="button"
                                className="btn btn-light-primary btn-sm"
                                onClick={() => setCancelBillModalOpen(false)}
                            >
                                Tutup
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                disabled={cancellingBill}
                                onClick={() => void handleConfirmCancelBill()}
                            >
                                <CloseCircleOutlined />
                                {cancellingBill ? 'Memproses...' : 'Konfirmasi Batalkan'}
                            </button>
                        </div>
                    </div>
                </Modal>

                <Modal
                    centered
                    open={voidPaymentModalOpen}
                    onCancel={() => setVoidPaymentModalOpen(false)}
                    title={`Batalkan (VOID) Pembayaran ${voidTargetPayment?.payment_no || ''}`}
                    footer={null}
                    width="480px"
                >
                    <div style={{ paddingTop: '8px' }}>
                        <label
                            htmlFor="void_pay_reason"
                            style={{
                                display: 'block',
                                fontSize: '12px',
                                fontWeight: 600,
                                marginBottom: '4px',
                            }}
                        >
                            Alasan VOID Pembayaran (Minimal 10 Karakter) *
                        </label>
                        <textarea
                            id="void_pay_reason"
                            rows={3}
                            className="form-control"
                            style={{ minHeight: '80px', borderRadius: '12px' }}
                            placeholder="Tuliskan alasan pembatalan pembayaran..."
                            value={voidPaymentReason}
                            onChange={(e) => setVoidPaymentReason(e.target.value)}
                        />
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '8px',
                                marginTop: '14px',
                            }}
                        >
                            <button
                                type="button"
                                className="btn btn-light-primary btn-sm"
                                onClick={() => setVoidPaymentModalOpen(false)}
                            >
                                Tutup
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                disabled={voidingPayment}
                                onClick={() => void handleConfirmVoidPayment()}
                            >
                                <CloseCircleOutlined />
                                {voidingPayment ? 'Memproses...' : 'Konfirmasi VOID'}
                            </button>
                        </div>
                    </div>
                </Modal>

                <Modal
                    centered
                    open={jsonPreviewModalOpen}
                    onCancel={() => setJsonPreviewModalOpen(false)}
                    title={jsonPreviewTitle}
                    footer={null}
                    width="640px"
                >
                    <Spin spinning={loadingJsonPreview}>
                        {jsonPreviewData?.payload ? (
                            <div style={{ paddingTop: '8px' }}>
                                <Descriptions
                                    bordered
                                    size="small"
                                    column={1}
                                    style={{ marginBottom: '14px' }}
                                >
                                    <Descriptions.Item label="Rumah Sakit">
                                        {jsonPreviewData.payload.hospital?.name || '-'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Pasien">
                                        {jsonPreviewData.payload.patient?.full_name || '-'} (No. RM:{' '}
                                        {jsonPreviewData.payload.patient?.medical_record_no || '-'})
                                    </Descriptions.Item>
                                    {jsonPreviewData.type === 'receipt' ? (
                                        <>
                                            <Descriptions.Item label="No. Kuitansi / Struk">
                                                {jsonPreviewData.payload.header?.payment_no || '-'}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Nominal Dibayar">
                                                <strong>
                                                    Rp{' '}
                                                    {Helper.numFormat(
                                                        jsonPreviewData.payload.payment?.amount || 0
                                                    )}
                                                </strong>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Terbilang">
                                                {jsonPreviewData.payload.payment
                                                    ?.amount_terbilang || '-'}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Status Tagihan">
                                                {jsonPreviewData.payload.bill_summary
                                                    ?.status_label || '-'}
                                            </Descriptions.Item>
                                        </>
                                    ) : (
                                        <>
                                            <Descriptions.Item label="No. Invoice">
                                                {jsonPreviewData.payload.header?.bill_no || '-'}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Total Tagihan">
                                                <strong>
                                                    Rp{' '}
                                                    {Helper.numFormat(
                                                        jsonPreviewData.payload.summary
                                                            ?.total_amount || 0
                                                    )}
                                                </strong>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Terbilang">
                                                {jsonPreviewData.payload.summary?.total_terbilang ||
                                                    '-'}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Status">
                                                {jsonPreviewData.payload.summary?.status_label ||
                                                    '-'}
                                            </Descriptions.Item>
                                        </>
                                    )}
                                </Descriptions>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        onClick={() => {
                                            const docId =
                                                jsonPreviewData.type === 'invoice'
                                                    ? jsonPreviewData.payload.header?.bill_id
                                                    : jsonPreviewData.payload.header?.payment_id;
                                            void handleOpenPrintHtmlWindow(
                                                jsonPreviewData.type,
                                                docId,
                                                true
                                            );
                                        }}
                                    >
                                        <PrinterOutlined />
                                        Buka Halaman Cetak HTML
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <Empty description="Data dokumen tidak tersedia" />
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
                        <div className="text">Kasir</div>
                        <div className="text">Tagihan &amp; Pembayaran</div>
                    </div>
                    <div className="title text-dark-grey left">
                        Loket Kasir, Penerbitan Tagihan &amp; Cetak Struk
                    </div>
                </div>

                <div className="filter mb-3">
                    <Radio.Group
                        value={viewTab}
                        onChange={(e) => setViewTab(e.target.value)}
                        buttonStyle="solid"
                    >
                        <Radio.Button value="queue">Antrean Kasir (DONE)</Radio.Button>
                        <Radio.Button value="bills">Daftar Tagihan</Radio.Button>
                        <Radio.Button value="payments">Riwayat Pembayaran</Radio.Button>
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

                    {viewTab !== 'payments' && (
                        <select
                            aria-label="Filter Status Tagihan"
                            className="form-control"
                            style={{ width: '165px', height: '38px', padding: '0 14px' }}
                            value={filterBillStatus}
                            onChange={(e) => setFilterBillStatus(e.target.value)}
                        >
                            <option value="">Semua Status Bill</option>
                            {viewTab === 'queue' && (
                                <option value="NONE">Belum Ada Tagihan</option>
                            )}
                            <option value="DRAFT">DRAFT</option>
                            <option value="ISSUED">ISSUED</option>
                            {viewTab === 'bills' && (
                                <option value="CANCELLED">CANCELLED</option>
                            )}
                        </select>
                    )}

                    {viewTab === 'bills' && (
                        <select
                            aria-label="Filter Status Pembayaran"
                            className="form-control"
                            style={{ width: '165px', height: '38px', padding: '0 14px' }}
                            value={filterPaymentStatus}
                            onChange={(e) => setFilterPaymentStatus(e.target.value)}
                        >
                            <option value="">Semua Status Bayar</option>
                            <option value="UNPAID">UNPAID (Belum Bayar)</option>
                            <option value="PARTIAL">PARTIAL (Sebagian)</option>
                            <option value="PAID">PAID (Lunas)</option>
                        </select>
                    )}

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
                            placeholder="Cari Pasien / No. RM / Invoice..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>

                    <button
                        type="button"
                        className="btn btn-circle btn-light-primary"
                        onClick={refreshCurrentList}
                        aria-label="Muat ulang data kasir"
                        title="Muat ulang data kasir"
                    >
                        <ReloadOutlined />
                    </button>
                </div>
            </div>

            {viewTab === 'queue' ? (
                <Row gutter={[12, 12]} style={{ marginBottom: '16px' }}>
                    <Col xs={12} sm={6}>
                        <Card size="small" style={{ borderRadius: '14px' }}>
                            <div className="text-muted" style={{ fontSize: '12px' }}>
                                Kunjungan Selesai ({filterDate})
                            </div>
                            <div className="fs-5 fw-7 text-primary" style={{ fontSize: '20px' }}>
                                {queueStats.totalDone}
                            </div>
                        </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                        <Card size="small" style={{ borderRadius: '14px' }}>
                            <div className="text-muted" style={{ fontSize: '12px' }}>
                                Belum Ada Draft Tagihan
                            </div>
                            <div className="fs-5 fw-7 text-warning" style={{ fontSize: '20px' }}>
                                {queueStats.noBill}
                            </div>
                        </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                        <Card size="small" style={{ borderRadius: '14px' }}>
                            <div className="text-muted" style={{ fontSize: '12px' }}>
                                Tagihan Berstatus DRAFT
                            </div>
                            <div className="fs-5 fw-7 text-info" style={{ fontSize: '20px' }}>
                                {queueStats.draft}
                            </div>
                        </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                        <Card size="small" style={{ borderRadius: '14px' }}>
                            <div className="text-muted" style={{ fontSize: '12px' }}>
                                Tagihan Diterbitkan (ISSUED)
                            </div>
                            <div className="fs-5 fw-7 text-success" style={{ fontSize: '20px' }}>
                                {queueStats.issued}
                            </div>
                        </Card>
                    </Col>
                </Row>
            ) : viewTab === 'payments' ? (
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
                        }}
                    >
                        <span className="fw-7 text-primary">
                            Total Penerimaan Pembayaran Tunai (SUCCESS) pada {filterDate}:
                        </span>
                        <span className="fw-7 text-primary" style={{ fontSize: '18px' }}>
                            Rp {Helper.numFormat(paymentsTotalSuccess)}
                        </span>
                    </div>
                </Card>
            ) : null}

            {listError && (
                <Alert
                    type="error"
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                    style={{ marginBottom: '16px', borderRadius: '12px' }}
                    message="Tidak Dapat Memuat Data Kasir"
                    description={listError}
                />
            )}

            <div className="bodyContent">
                <div className="card-table" style={{ minHeight: '220px', padding: '12px' }}>
                    {viewTab === 'queue' && (
                        <Table
                            loading={loadingList}
                            rowKey="visit_id"
                            columns={queueColumns}
                            dataSource={filteredQueueList}
                            pagination={{
                                pageSize: 15,
                                showSizeChanger: true,
                                showTotal: (total) => `Total ${total} kunjungan selesai`,
                            }}
                            locale={{
                                emptyText: (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description={`Belum ada kunjungan berstatus DONE pada tanggal ${filterDate}.`}
                                    />
                                ),
                            }}
                        />
                    )}

                    {viewTab === 'bills' && (
                        <Table
                            loading={loadingList}
                            rowKey="id"
                            columns={billsColumns}
                            dataSource={billsList}
                            pagination={{
                                pageSize: 15,
                                showSizeChanger: true,
                                showTotal: (total) => `Total ${total} tagihan`,
                            }}
                            locale={{
                                emptyText: (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description="Tidak ada data tagihan yang ditemukan."
                                    />
                                ),
                            }}
                        />
                    )}

                    {viewTab === 'payments' && (
                        <Table
                            loading={loadingList}
                            rowKey="id"
                            columns={paymentsColumns}
                            dataSource={paymentsList}
                            pagination={{
                                pageSize: 15,
                                showSizeChanger: true,
                                showTotal: (total) => `Total ${total} transaksi pembayaran`,
                            }}
                            locale={{
                                emptyText: (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description="Belum ada transaksi pembayaran pada tanggal tersebut."
                                    />
                                ),
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
