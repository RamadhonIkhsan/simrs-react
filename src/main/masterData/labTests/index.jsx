import RefTemplate from '@/components/refTemplate/Main';
import { Helper } from '@/lib/Helper';

const listForm = [
    {
        type: 'text',
        name: 'code',
        alias: 'Kode Pemeriksaan Lab',
        maxLength: 20,
        required: true,
        col: 24,
    },
    {
        type: 'text',
        name: 'name',
        alias: 'Nama Pemeriksaan Lab',
        maxLength: 150,
        required: true,
        col: 24,
    },
    {
        type: 'text',
        name: 'unit',
        alias: 'Satuan (mis. mg/dL, g/dL)',
        maxLength: 20,
        required: false,
        col: 24,
    },
    {
        type: 'text',
        name: 'ref_range',
        alias: 'Nilai Rujukan Normal',
        maxLength: 60,
        required: false,
        col: 24,
    },
    {
        type: 'money',
        name: 'tariff',
        alias: 'Tarif Pemeriksaan (Rp)',
        maxLength: 20,
        required: true,
        col: 24,
    },
];

const listAction = ['create', 'update', 'detail', 'active', 'delete'];

export default function LabTests() {
    return (
        <RefTemplate
            refTitle="Master Data"
            refSubTitle="Lab Tests"
            refEndPointAll="/api/lab-tests"
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
                    title: 'Kode Lab',
                    dataIndex: 'code',
                    width: '120px',
                    sorter: (a, b) => String(a.code || '').localeCompare(String(b.code || '')),
                },
                {
                    title: 'Nama Pemeriksaan',
                    dataIndex: 'name',
                    sorter: (a, b) => String(a.name || '').localeCompare(String(b.name || '')),
                },
                {
                    title: 'Satuan',
                    dataIndex: 'unit',
                    render: (val) => val || '-',
                },
                {
                    title: 'Nilai Rujukan',
                    dataIndex: 'ref_range',
                    render: (val) => val || '-',
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
