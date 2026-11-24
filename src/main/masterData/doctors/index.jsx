import { useEffect, useState } from 'react';
import RefTemplate from '@/components/refTemplate/Main';
import { DropdownAPI } from '@/lib/DropdownAPI';
import { Helper } from '@/lib/Helper';

const listAction = ['create', 'update', 'detail', 'active', 'delete'];

export default function Doctors() {
    const [listForm, setListForm] = useState([]);

    useEffect(() => {
        let active = true;

        const initListForm = async () => {
            const listDoctorUsers = await DropdownAPI.doctorUsers();
            if (!active) return;

            setListForm([
                {
                    type: 'text',
                    name: 'full_name',
                    alias: 'Nama Lengkap',
                    maxLength: 120,
                    required: true,
                    col: 24,
                },
                {
                    type: 'text',
                    name: 'str_no',
                    alias: 'Nomor STR',
                    maxLength: 30,
                    required: true,
                    col: 12,
                },
                {
                    type: 'text',
                    name: 'nip',
                    alias: 'NIP',
                    maxLength: 30,
                    required: false,
                    col: 12,
                },
                {
                    type: 'text',
                    name: 'specialty',
                    alias: 'Spesialisasi',
                    maxLength: 80,
                    required: false,
                    col: 12,
                },
                {
                    type: 'number',
                    name: 'phone',
                    alias: 'No. Telepon',
                    maxLength: 20,
                    required: false,
                    col: 12,
                },
                {
                    type: 'select',
                    name: 'user_id',
                    alias: 'Akun User Dokter (Opsional)',
                    required: false,
                    col: 24,
                    listData: listDoctorUsers,
                },
            ]);
        };

        void initListForm();
        return () => {
            active = false;
        };
    }, []);

    return (
        <RefTemplate
            refTitle="Master Data"
            refSubTitle="Doctors"
            refEndPointAll="/api/doctors"
            listAction={listAction}
            primaryKey="id"
            serverSide={true}
            columnTableRef={[
                {
                    title: 'No',
                    key: 'no',
                    width: '60px',
                    align: 'center',
                    render: (_text, _record, index) => index + 1,
                },
                {
                    title: 'Nama Dokter',
                    dataIndex: 'full_name',
                    sorter: (a, b) =>
                        String(a.full_name || '').localeCompare(String(b.full_name || '')),
                },
                {
                    title: 'No. STR',
                    dataIndex: 'str_no',
                },
                {
                    title: 'NIP',
                    dataIndex: 'nip',
                    render: (val) => val || '-',
                },
                {
                    title: 'Spesialisasi',
                    dataIndex: 'specialty',
                    render: (val) => val || '-',
                },
                {
                    title: 'Telepon',
                    dataIndex: 'phone',
                    render: (val) => val || '-',
                },
                {
                    title: 'Akun Login',
                    render: (_, row) => row.user?.username || '-',
                },
                {
                    title: 'Update Terakhir',
                    render: (_, row) => {
                        const dt = row.updated_at || row.created_at;
                        return dt ? Helper.formatDate(dt, 'd-M-Y H:i:s') : '-';
                    },
                },
                {
                    title: 'Status',
                    width: '120px',
                    render: (_, row) =>
                        row.is_active ? (
                            <span
                                className="btn btn-light-success my-1 mx-1 btn-sm"
                                style={{ cursor: 'inherit', height: '30px' }}
                            >
                                Aktif
                            </span>
                        ) : (
                            <span
                                className="btn btn-light-danger my-1 mx-1 btn-sm"
                                style={{ cursor: 'inherit', height: '30px' }}
                            >
                                Tidak Aktif
                            </span>
                        ),
                },
            ]}
            listForm={listForm}
        />
    );
}
