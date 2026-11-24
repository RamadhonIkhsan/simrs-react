import { useEffect, useState } from 'react';
import RefTemplate from '@/components/refTemplate/Main';
import { DropdownAPI } from '@/lib/DropdownAPI';
// import { Helper } from '@/lib/Helper';

export default function Users() {
    const [listForm, setListForm] = useState([]);
    const [rolesMap, setRolesMap] = useState({});

    useEffect(() => {
        let active = true;

        const initListForm = async () => {
            const listRoles = await DropdownAPI.roles();
            if (!active) return;

            const roleLookup = {};
            listRoles.forEach((r) => {
                roleLookup[r.value] = r.label;
            });
            setRolesMap(roleLookup);

            setListForm([
                {
                    type: 'text',
                    name: 'full_name',
                    alias: 'Nama Lengkap',
                    maxLength: 150,
                    required: true,
                    col: 24,
                },
                {
                    type: 'username',
                    name: 'username',
                    alias: 'Username',
                    maxLength: 100,
                    required: true,
                    col: 24,
                },
                {
                    type: 'email',
                    name: 'email',
                    alias: 'Email',
                    maxLength: 150,
                    required: true,
                    col: 24,
                },
                {
                    type: 'select',
                    name: 'role_id',
                    alias: 'Role',
                    required: true,
                    col: 24,
                    listData: listRoles,
                },
            ]);
        };

        void initListForm();
        return () => {
            active = false;
        };
    }, []);

    const listAction = ['create', 'update', 'detail', 'active', 'delete'];

    return (
        <RefTemplate
            refTitle="Master Data"
            refSubTitle="Users"
            refEndPointAll="/api/users"
            listAction={listAction}
            primaryKey="id"
            serverSide={false}
            columnTableRef={[
                {
                    title: 'No',
                    key: 'no',
                    width: '60px',
                    align: 'center',
                    render: (_text, _record, index) => index + 1,
                },
                {
                    title: 'Username',
                    dataIndex: 'username',
                    sorter: (a, b) => String(a.username || '').localeCompare(String(b.username || '')),
                },
                {
                    title: 'Nama Lengkap',
                    dataIndex: 'full_name',
                    render: (_, row) => row.full_name || row.fullname || row.name || '-',
                    sorter: (a, b) =>
                        String(a.full_name || a.name || '').localeCompare(
                            String(b.full_name || b.name || '')
                        ),
                },
                {
                    title: 'Email',
                    dataIndex: 'email',
                    render: (val) => val || '-',
                },
                {
                    title: 'Role',
                    dataIndex: 'role_name',
                    render: (_, row) =>
                        row.role_name ||
                        row.role?.name ||
                        row.role?.nm ||
                        rolesMap[row.role_id] ||
                        (row.role_id ? `Role #${row.role_id}` : '-'),
                },
                {
                    title: 'Status',
                    width: '120px',
                    render: (_, row) => {
                        const isActive =
                            row.is_active !== undefined ? Boolean(row.is_active) : Boolean(row.isActive ?? true);
                        return isActive ? (
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
                        );
                    },
                },
            ]}
            listForm={listForm}
        />
    );
}
