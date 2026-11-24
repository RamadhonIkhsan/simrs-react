import RefTemplate from '@/components/refTemplate/Main';
import { Helper } from '@/lib/Helper';

const listForm = [
    {
        type: 'text',
        name: 'code',
        alias: 'Kode Poli',
        maxLength: 10,
        required: true,
        col: 24,
    },
    {
        type: 'text',
        name: 'name',
        alias: 'Nama Poli',
        maxLength: 80,
        required: true,
        col: 24,
    },
    {
        type: 'money',
        name: 'registration_fee',
        alias: 'Biaya Pendaftaran (Rp)',
        maxLength: 20,
        required: true,
        col: 24,
    },
];

const listAction = ['create', 'update', 'detail', 'active', 'delete'];

export default function Polis() {
    return (
        <RefTemplate
            refTitle="Master Data"
            refSubTitle="Polis"
            refEndPointAll="/api/polis"
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
                    title: 'Kode Poli',
                    dataIndex: 'code',
                    width: '120px',
                    sorter: (a, b) => String(a.code || '').localeCompare(String(b.code || '')),
                },
                {
                    title: 'Nama Poli',
                    dataIndex: 'name',
                    sorter: (a, b) => String(a.name || '').localeCompare(String(b.name || '')),
                },
                {
                    title: 'Biaya Pendaftaran',
                    dataIndex: 'registration_fee',
                    render: (val) => `Rp ${Helper.numFormat(val || 0)}`,
                    sorter: (a, b) => Number(a.registration_fee || 0) - Number(b.registration_fee || 0),
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
