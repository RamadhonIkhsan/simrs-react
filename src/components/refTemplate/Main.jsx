import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
    CheckOutlined,
    CloseOutlined,
    ContainerOutlined,
    DeleteOutlined,
    EditOutlined,
    FieldTimeOutlined,
    FileProtectOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import { Dropdown, Spin } from 'antd';
import Form from '@/components/refTemplate/Form';
import ToolBar from '@/components/refTemplate/ToolBar';
import DTAnt from '@/components/util/DTAnt';
import DTAntServerSide from '@/components/util/DTAntServerSide';
import Input from '@/components/util/Input';
import SearchInput from '@/components/util/SearchInput';
import { API } from '@/lib/API';
import { DropdownAPI } from '@/lib/DropdownAPI';
import { ROLE } from '@/lib/Helper';
import confirmStore from '@/store/confirmStore';
import modalStore from '@/store/modal';
import notifStore from '@/store/notifStore';
import userStore from '@/store/userStore';

const RefTemplate = ({
    refTitle,
    refSubTitle,
    refEndPointAll,
    columnTableRef = [],
    primaryKey = 'id',
    listForm = [],
    listAction = [],
    sizeModal,
    serverSide = false,
    typeRef,
    initCompanyBranch,
    Initfilter = {},
}) => {
    const formRef = useRef(null);
    const {
        register,
        setValue,
        getValues,
        control,
        formState: { errors },
    } = useForm();

    const { dataUser: storeUser } = userStore();
    const dataUser =
        storeUser ||
        (typeof window !== 'undefined'
            ? JSON.parse(localStorage.getItem('user') || localStorage.getItem('dataUser') || '{}')
            : {});

    const userId =
        typeof window !== 'undefined' ? Number(localStorage.getItem('userId')) : null;

    const { notifOpen } = notifStore();
    const { confirmOpen, confirmClose, setConfirmLoading } = confirmStore();
    const {
        modalOpen,
        modalClose,
        FormId,
        modalStat,
        setModalLoading,
        setModalDetail,
        actionType,
    } = modalStore();

    const [Data, setData] = useState([]);
    const [searchText, setSearchText] = useState(null);
    const [loadingTable, setLoadingTable] = useState(!serverSide);
    const [trigerGetData, setTrigerGetData] = useState(0);
    const [filter, setFilter] = useState(Initfilter);

    const roleId = dataUser?.roleId || dataUser?.role_id || '';
    const companyId = dataUser?.companyId || '';
    const branchId = dataUser?.branchId || '';

    const [dropdownData, setDropdownData] = useState({
        branch: [],
        company: [],
    });
    const [dropdownLoading, setDropdownLoading] = useState({
        branch: false,
        company: false,
    });

    const filterPerusahaanWatch = useWatch({ control, name: 'filterPerusahaan' });
    const filterCabangWatch = useWatch({ control, name: 'filterCabang' });

    // CRUD
    const deleteData = async (id) => {
        confirmOpen('Hapus Data', 'Yakin Hapus Data Ini', async () => {
            setConfirmLoading(true);
            const response = await API.DELETE(`${refEndPointAll}/${id}`);
            if (response?.status === 200) {
                notifOpen('Berhasil', 'berhasil hapus data');
                await getData();
                setConfirmLoading(false);
                confirmClose();
            } else {
                setConfirmLoading(false);
                notifOpen(
                    'Gagal',
                    response?.result?.rm || response?.result?.message || 'Gagal hapus data',
                    'danger'
                );
                confirmClose();
            }
        });
    };

    const activeData = async (id, active) => {
        const titleActive = active ? 'Nonaktifkan' : 'Aktifkan';

        confirmOpen(`${titleActive} Data`, `Yakin ${titleActive} Data Ini`, async () => {
            setConfirmLoading(true);

            const response = await API.POST(`${refEndPointAll}`, {
                [primaryKey]: id,
                isActive: !active,
                is_active: !active,
            });

            if (response?.status === 200) {
                notifOpen('Berhasil', `berhasil ${titleActive} data`);
                await getData();
                setConfirmLoading(false);
                confirmClose();
            } else {
                setConfirmLoading(false);
                notifOpen(
                    'Gagal',
                    response?.result?.rm || response?.result?.message || 'Terjadi kesalahan',
                    'danger'
                );
                confirmClose();
            }
        });
    };

    const getData = async () => {
        if (serverSide) {
            setTrigerGetData((prev) => prev + 1);
        } else {
            setData([]);
            setLoadingTable(true);

            const cleanFilter = filter
                ? Object.fromEntries(
                      Object.entries(filter).filter(
                          ([, v]) => v !== undefined && v !== null && v !== ''
                      )
                  )
                : {};
            const setFilterQuery =
                Object.keys(cleanFilter).length > 0
                    ? '?' + new URLSearchParams(cleanFilter).toString()
                    : '';

            const response = await API.GET(`${refEndPointAll}${setFilterQuery}`);

            if (response?.status !== 200) {
                notifOpen(
                    'Gagal',
                    response?.result?.rm || response?.result?.message || 'Gagal memuat data',
                    'danger'
                );
            }
            setData(response?.result || {});
            setLoadingTable(false);
        }
    };

    const getDataById = async () => {
        let url = `${refEndPointAll}/${FormId}`;
        if (actionType === 'history_approval') url += '/historyApproval';
        const response = await API.GET(url);

        if (response?.status === 500) {
            modalClose();
            return notifOpen('Gagal', 'Terjadi kesalahan', 'danger');
        }

        const rawResult = response?.result;
        const data =
            rawResult?.data && typeof rawResult.data === 'object' && !Array.isArray(rawResult.data)
                ? rawResult.data
                : rawResult || {};

        for (const v of listForm) {
            const value = data?.[v.name];
            if (formRef.current) {
                await formRef.current.setFormValue(v.name, value);
            }
        }

        setModalLoading(false);
    };

    const storeData = async (formData) => {
        const isEdit = FormId !== 'new' && FormId != null;
        if (isEdit) {
            formData[primaryKey] = FormId;
        }
        setModalLoading(true);

        let response;
        if (typeRef === 'KARYAWAN' && API.POST_KARYAWAN) {
            response = await API.POST_KARYAWAN(`${refEndPointAll}`, formData);
        } else if (typeRef === 'SSO' && API.POST_SSO) {
            response = await API.POST_SSO(`${refEndPointAll}`, formData);
        } else if (typeRef === 'kartu') {
            formData.isActive = true;
            response = await API.POST(`${refEndPointAll}`, formData);
        } else if (typeRef === 'REST' && isEdit) {
            response = await API.PUT(`${refEndPointAll}/${FormId}`, formData);
        } else {
            response = await API.POST(`${refEndPointAll}`, formData);
        }

        const isSuccess =
            response?.status === 200 ||
            response?.status === 201 ||
            response?.result?.rc === 200 ||
            response?.result?.rc === 201;

        if (isSuccess && response?.status < 400) {
            modalClose();
            notifOpen('Berhasil', 'berhasil Simpan data');
            await getData();
        } else {
            notifOpen(
                'Gagal',
                response?.result?.rm || response?.result?.message || 'Gagal menyimpan data',
                'danger'
            );
        }

        setModalLoading(false);
    };

    const approveRejectData = async () => {
        setModalLoading(true);
        const formData = [];
        const response = await API.POST(`${refEndPointAll}/${actionType}/${FormId}`, formData);
        if (response?.status === 200) {
            modalClose();
            notifOpen('Berhasil', 'berhasil Approve data');
            await getData();
        } else {
            const msg =
                response?.result?.rm || response?.result?.message || 'Terjadi kesalahan';
            notifOpen('Gagal', msg, 'danger');
        }
        setModalLoading(false);
    };

    const detailData = (id) => {
        modalOpen(id);
        setModalDetail(true);
    };

    // Search
    const searchTimeoutRef = useRef(null);
    const handleSearch = (event) => {
        const val = event.target.value;
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            setSearchText(val);
        }, 500);
    };

    const rawList = Array.isArray(Data?.data)
        ? Data.data
        : Array.isArray(Data?.data?.items)
          ? Data.data.items
          : Array.isArray(Data)
            ? Data
            : [];

    const filteredData = rawList.filter((item) => {
        if (!searchText) return true;
        return Object.values(item || {}).some((value) =>
            value?.toString().toLowerCase().includes(searchText.toLowerCase())
        );
    });

    const tableColumn = useMemo(() => {
        const column = [...columnTableRef];

        const action = {
            render: (_, row) => {
                const isWaitingApproval = row.statusApproval
                    ? row.statusApproval === 'WAITING'
                    : false;
                const items = [];

                if (listAction.includes('detail')) {
                    items.push({
                        key: '7',
                        label: (
                            <button
                                type="button"
                                onClick={() => detailData(row[primaryKey])}
                                className="dropdown-item w-full"
                            >
                                <ContainerOutlined className="text-muted me-2" />
                                Detail
                            </button>
                        ),
                    });
                }

                if (listAction.includes('update') && !isWaitingApproval) {
                    items.push({
                        key: '1',
                        label: (
                            <button
                                type="button"
                                onClick={() => modalOpen(row[primaryKey])}
                                className="dropdown-item w-full"
                            >
                                <EditOutlined className="text-muted me-2" />
                                Ubah
                            </button>
                        ),
                    });
                }

                if (listAction.includes('delete')) {
                    items.push({
                        key: '2',
                        label: (
                            <button
                                type="button"
                                onClick={() => deleteData(row[primaryKey])}
                                className="dropdown-item w-full"
                            >
                                <DeleteOutlined className="text-muted me-2" />
                                Hapus
                            </button>
                        ),
                    });
                }

                if (listAction.includes('approval')) {
                    items.push({
                        key: '3',
                        label: (
                            <button
                                type="button"
                                onClick={() => modalOpen(row[primaryKey], 'approval')}
                                className="dropdown-item w-full"
                            >
                                <FileProtectOutlined className="text-muted me-2" /> Approval
                            </button>
                        ),
                    });
                }

                if (listAction.includes('active')) {
                    const isActiveRow = row.isActive ?? row.is_active;
                    items.push({
                        key: '6',
                        label: isActiveRow ? (
                            <button
                                type="button"
                                onClick={() => activeData(row[primaryKey], isActiveRow)}
                                className="dropdown-item"
                            >
                                <CloseOutlined className="text-muted me-2" />
                                Nonaktifkan
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => activeData(row[primaryKey], isActiveRow)}
                                className="dropdown-item"
                            >
                                <CheckOutlined className="text-muted me-2" />
                                Aktifkan
                            </button>
                        ),
                    });
                }

                if (listAction.includes('history_approval')) {
                    items.push({
                        key: '8',
                        label: (
                            <button
                                type="button"
                                onClick={() => modalOpen(row[primaryKey], 'history_approval')}
                                className="dropdown-item w-full"
                            >
                                <FieldTimeOutlined className="text-muted me-2" /> Riwayat Pengajuan
                            </button>
                        ),
                    });
                }

                const allowedActions = ['update', 'active', 'detail', 'approval', 'delete'];
                const hasAction = allowedActions.some((act) => listAction.includes(act));

                return (
                    refEndPointAll !== '/cuti-karyawan' &&
                    hasAction && (
                        <Dropdown
                            trigger={['click']}
                            placement="bottomLeft"
                            arrow
                            menu={{ items }}
                        >
                            <button
                                type="button"
                                className="btn btn-circle btn-light-primary my-1 btn-sm"
                                data-bs-toggle="dropdown"
                            >
                                <SettingOutlined />
                            </button>
                        </Dropdown>
                    )
                );
            },
            dataIndex: 'act',
            key: 'act',
            width: '40px',
        };

        column.push(action);
        return column;
    }, [columnTableRef, listAction, primaryKey, refEndPointAll]); // eslint-disable-line react-hooks/exhaustive-deps

    const actExportExcel = () => {
        if (!filteredData[0]) {
            notifOpen('Data tidak tersedia', 'Data di table minimal 1 baris', 'warning');
        }
    };

    const actExportWord = () => {};
    const actExportPDF = () => {};

    const setCompanyAndBranch = async () => {
        if (roleId == ROLE.SUPER_ADMIN) return;
        if (!userId) return;
        const userRes = await API.GET('/ref/user/' + userId);
        const user = userRes?.result;
        formRef.current?.initCompanyBranch(user?.companyId, user?.branchId);
    };

    const getCompany = async () => {
        if (!listAction.includes('filterCompany') || !DropdownAPI.perusahaan) return;
        setDropdownLoading({
            branch: true,
            company: true,
        });

        const listCompany = await DropdownAPI.perusahaan();

        setDropdownData((prev) => ({
            ...prev,
            company: listCompany,
        }));

        setDropdownLoading({
            branch: false,
            company: false,
        });
    };

    const getBranch = async () => {
        if (!listAction.includes('filterBranch') || !DropdownAPI.refBranchByCompanyId) return;
        setDropdownLoading({
            branch: true,
            company: false,
        });

        setValue('filterCabang', null);

        const filterPerusahaan = filterPerusahaanWatch ? getValues('filterPerusahaan') : '';

        let listBranch = [];
        if (roleId == ROLE.SUPER_ADMIN && filterPerusahaan) {
            listBranch = await DropdownAPI.refBranchByCompanyId(filterPerusahaan);
        } else if (roleId != ROLE.SUPER_ADMIN && companyId) {
            listBranch = await DropdownAPI.refBranchByCompanyId(Number(companyId));
        }

        setDropdownData((prev) => ({
            ...prev,
            branch: listBranch,
        }));

        setDropdownLoading({
            branch: false,
            company: false,
        });
    };

    useEffect(() => {
        let active = true;
        Promise.resolve().then(() => {
            if (!active) return;
            void getCompany();
            if (!serverSide) {
                void getData();
            }
        });
        return () => {
            active = false;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!listAction.includes('filterCompany') && !listAction.includes('filterBranch')) return;
        let active = true;
        Promise.resolve().then(() => {
            if (!active) return;
            void getBranch();

            const filterPerusahaan = filterPerusahaanWatch ? getValues('filterPerusahaan') : '';

            setFilter((prev) => ({
                ...prev,
                companyId:
                    filterPerusahaan ||
                    (roleId && roleId != ROLE.SUPER_ADMIN ? companyId || '' : ''),
            }));
            setTrigerGetData((prev) => prev + 1);
        });
        return () => {
            active = false;
        };
    }, [filterPerusahaanWatch]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!listAction.includes('filterBranch')) return;
        let active = true;
        Promise.resolve().then(() => {
            if (!active) return;
            const filterCabang = filterCabangWatch ? getValues('filterCabang') : '';

            setFilter((prev) => ({
                ...prev,
                branchId:
                    roleId && roleId == ROLE.ADMIN_CABANG ? branchId : filterCabang || '',
            }));
            setTrigerGetData((prev) => prev + 1);
        });
        return () => {
            active = false;
        };
    }, [filterCabangWatch]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        formRef.current?.resetForm();

        if (FormId === 'new') {
            if (initCompanyBranch) {
                void setCompanyAndBranch();
            }
            setModalLoading(false);
        }

        if (FormId !== 'new' && FormId != null) {
            void getDataById();
        }
    }, [modalStat]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <>
            <div className="containers">
                <div className="headContent" style={{ minHeight: '40px' }}>
                    <div className="containerTitle">
                        <div className="breadCrumb">
                            <div className="text">{refTitle}</div>
                            <div className="text">{refSubTitle}</div>
                        </div>
                        <div className="title text-dark-grey left">{refSubTitle}</div>
                    </div>
                    <div className="filter mb-3">
                        {listAction.includes('filterCompany') && roleId == ROLE.SUPER_ADMIN && (
                            <div style={{ width: '280px' }}>
                                <Input.Select
                                    title="Filter Perusahaan"
                                    name="filterPerusahaan"
                                    register={register}
                                    error={errors}
                                    loading={dropdownLoading?.company}
                                    options={dropdownData?.company}
                                    val={getValues('filterPerusahaan')}
                                    placeholder="Filter Perusahaan"
                                    setValue={setValue}
                                />
                            </div>
                        )}

                        {listAction.includes('filterBranch') && (
                            <div style={{ width: '280px', height: '7px' }}>
                                <Spin spinning={dropdownLoading.branch}>
                                    <Input.Select
                                        title="Filter Cabang"
                                        name="filterCabang"
                                        error={errors}
                                        register={register}
                                        setValue={setValue}
                                        loading={dropdownLoading?.branch}
                                        placeholder="Filter Cabang"
                                        options={dropdownData?.branch}
                                        val={getValues('filterCabang')}
                                    />
                                </Spin>
                            </div>
                        )}
                        <SearchInput handleSearch={handleSearch} />
                        <ToolBar
                            getData={getData}
                            listAction={listAction}
                            actExportExcel={actExportExcel}
                            actExportWord={actExportWord}
                            actExportPDF={actExportPDF}
                        />
                    </div>
                </div>

                <div className="bodyContent">
                    <div className="card-table" style={{ minHeight: '200px' }}>
                        {tableColumn ? (
                            serverSide ? (
                                <DTAntServerSide
                                    searchText={searchText}
                                    filter={filter}
                                    endPoint={refEndPointAll}
                                    triger={trigerGetData}
                                    columnTable={tableColumn}
                                    loadingTable={loadingTable}
                                    keyTable={primaryKey}
                                />
                            ) : (
                                <DTAnt
                                    columnTable={tableColumn}
                                    data={filteredData}
                                    rowKey={primaryKey}
                                    loadingTable={loadingTable}
                                />
                            )
                        ) : (
                            'loading'
                        )}
                    </div>
                </div>
            </div>

            <Form
                sizeModal={sizeModal}
                setTitle={refSubTitle}
                storeData={storeData}
                approveRejectData={approveRejectData}
                listForm={listForm}
                initCompanyBranch={initCompanyBranch}
                ref={formRef}
            />
        </>
    );
};

export default React.memo(RefTemplate);
