import RefTemplate from '@/components/refTemplate/Main';

const listForm = [
    {
        type: 'text',
        name: 'code',
        alias: 'Kode ICD-10',
        maxLength: 10,
        required: true,
        onEdit: 'readonly',
        col: 24,
    },
    {
        type: 'text',
        name: 'name',
        alias: 'Nama Diagnosa (ICD-10)',
        maxLength: 255,
        required: true,
        col: 24,
    },
];

const listAction = ['create', 'update', 'detail', 'delete'];

export default function Diagnose() {
    return (
        <RefTemplate
            refTitle="Master Data"
            refSubTitle="Diagnosa (ICD-10)"
            refEndPointAll="/api/icd10"
            listAction={listAction}
            primaryKey="code"
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
                    title: 'Kode ICD-10',
                    dataIndex: 'code',
                    width: '150px',
                    sorter: (a, b) => String(a.code || '').localeCompare(String(b.code || '')),
                },
                {
                    title: 'Nama Diagnosa',
                    dataIndex: 'name',
                    sorter: (a, b) => String(a.name || '').localeCompare(String(b.name || '')),
                },
            ]}
            listForm={listForm}
        />
    );
}
