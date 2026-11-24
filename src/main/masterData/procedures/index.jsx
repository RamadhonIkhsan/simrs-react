import RefTemplate from '@/components/refTemplate/Main';
import { Helper } from '@/lib/Helper';

const listForm = [
    {
        type: 'text',
        name: 'code',
        alias: 'Kode Tindakan',
        maxLength: 20,
        required: true,
        col: 24,
    },
    {
        type: 'text',
        name: 'name',
        alias: 'Nama Tindakan Medis',
        maxLength: 150,
        required: true,
        col: 24,
    },
    {
        type: 'money',
        name: 'tariff',
        alias: 'Tarif Tindakan (Rp)',
        maxLength: 20,
        required: true,
        col: 24,
    },
];

const listAction = ['create', 'update', 'detail', 'active', 'delete'];

export default function Procedures() {
    return (
        <RefTemplate
            refTitle="Master Data"
            refSubTitle="Procedures"
            refEndPointAll="/api/procedures"
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
                    title: 'Kode Tindakan',
                    dataIndex: 'code',
                    width: '140px',
                    sorter: (a, b) => String(a.code || '').localeCompare(String(b.code || '')),
                },
                {
                    title: 'Nama Tindakan',
                    dataIndex: 'name',
                    sorter: (a, b) => String(a.name || '').localeCompare(String(b.name || '')),
                },
                {
                    title: 'Tarif',
                    dataIndex: 'tariff',
                    render: (val) => `Rp ${Helper.numFormat(val || 0)}`,
                    sorter: (a, b) => Number(a.tariff || 0) - Number(b.tariff || 0),
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
