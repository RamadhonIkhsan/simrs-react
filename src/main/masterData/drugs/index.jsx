import RefTemplate from '@/components/refTemplate/Main';
import { Helper } from '@/lib/Helper';

const listForm = [
    {
        type: 'text',
        name: 'code',
        alias: 'Kode Obat',
        maxLength: 20,
        required: true,
        col: 12,
    },
    {
        type: 'text',
        name: 'name',
        alias: 'Nama Obat',
        maxLength: 150,
        required: true,
        col: 12,
    },
    {
        type: 'text',
        name: 'unit',
        alias: 'Satuan (tablet/strip/botol)',
        maxLength: 20,
        required: true,
        col: 12,
    },
    {
        type: 'money',
        name: 'price',
        alias: 'Harga Satuan (Rp)',
        maxLength: 20,
        required: true,
        col: 12,
    },
    {
        type: 'number',
        name: 'stock',
        alias: 'Stok Awal',
        maxLength: 10,
        minNominal: 0,
        defaultValue: 0,
        required: false,
        onEdit: 'disabled',
        col: 12,
    },
    {
        type: 'number',
        name: 'min_stock',
        alias: 'Stok Minimum',
        maxLength: 10,
        minNominal: 0,
        defaultValue: 0,
        required: true,
        col: 12,
    },
];

const listAction = ['create', 'update', 'detail', 'active', 'delete'];

export default function Drugs() {
    return (
        <RefTemplate
            refTitle="Master Data"
            refSubTitle="Drugs"
            refEndPointAll="/api/drugs"
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
                    title: 'Kode Obat',
                    dataIndex: 'code',
                    width: '120px',
                    sorter: (a, b) => String(a.code || '').localeCompare(String(b.code || '')),
                },
                {
                    title: 'Nama Obat',
                    dataIndex: 'name',
                    sorter: (a, b) => String(a.name || '').localeCompare(String(b.name || '')),
                },
                {
                    title: 'Satuan',
                    dataIndex: 'unit',
                    width: '100px',
                },
                {
                    title: 'Harga',
                    dataIndex: 'price',
                    render: (val) => `Rp ${Helper.numFormat(val || 0)}`,
                    sorter: (a, b) => Number(a.price || 0) - Number(b.price || 0),
                },
                {
                    title: 'Stok',
                    dataIndex: 'stock',
                    align: 'center',
                    render: (val, row) => {
                        const isLow = row.low_stock || Number(val || 0) <= Number(row.min_stock || 0);
                        return (
                            <span className={isLow ? 'text-danger fw-7' : ''}>
                                {Helper.numFormat(val || 0)}
                            </span>
                        );
                    },
                },
                {
                    title: 'Min. Stok',
                    dataIndex: 'min_stock',
                    align: 'center',
                    render: (val) => Helper.numFormat(val || 0),
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
