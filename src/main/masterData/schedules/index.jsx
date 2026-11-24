import { useEffect, useState } from 'react';
import RefTemplate from '@/components/refTemplate/Main';
import { DropdownAPI } from '@/lib/DropdownAPI';
import { Helper } from '@/lib/Helper';

const dayOfWeekOptions = [
    { value: 1, label: 'Senin' },
    { value: 2, label: 'Selasa' },
    { value: 3, label: 'Rabu' },
    { value: 4, label: 'Kamis' },
    { value: 5, label: 'Jumat' },
    { value: 6, label: 'Sabtu' },
    { value: 7, label: 'Minggu' },
];

const dayNameMap = {
    1: 'Senin',
    2: 'Selasa',
    3: 'Rabu',
    4: 'Kamis',
    5: 'Jumat',
    6: 'Sabtu',
    7: 'Minggu',
};

const listAction = ['create', 'update', 'detail', 'active', 'delete'];

export default function Schedules() {
    const [listForm, setListForm] = useState([]);

    useEffect(() => {
        let active = true;

        const initListForm = async () => {
            const [listDoctors, listPolis] = await Promise.all([
                DropdownAPI.doctors(),
                DropdownAPI.polis(),
            ]);
            if (!active) return;

            setListForm([
                {
                    type: 'select',
                    name: 'doctor_id',
                    alias: 'Dokter',
                    required: true,
                    col: 12,
                    listData: listDoctors,
                },
                {
                    type: 'select',
                    name: 'poli_id',
                    alias: 'Poli',
                    required: true,
                    col: 12,
                    listData: listPolis,
                },
                {
                    type: 'select',
                    name: 'day_of_week',
                    alias: 'Hari Praktik',
                    required: true,
                    col: 12,
                    listData: dayOfWeekOptions,
                },
                {
                    type: 'number',
                    name: 'quota',
                    alias: 'Kuota Pasien',
                    maxLength: 4,
                    minNominal: 1,
                    defaultValue: 30,
                    required: true,
                    col: 12,
                },
                {
                    type: 'time',
                    name: 'start_time',
                    alias: 'Jam Mulai',
                    required: true,
                    col: 12,
                },
                {
                    type: 'time',
                    name: 'end_time',
                    alias: 'Jam Selesai',
                    required: true,
                    col: 12,
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
            refSubTitle="Schedules"
            refEndPointAll="/api/schedules"
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
                    title: 'Dokter',
                    render: (_, row) => row.doctor?.full_name || row.doctor_name || '-',
                },
                {
                    title: 'Poli',
                    render: (_, row) => row.poli?.name || row.poli_name || '-',
                },
                {
                    title: 'Hari',
                    dataIndex: 'day_of_week',
                    render: (val, row) => row.day_name || dayNameMap[val] || val || '-',
                    sorter: (a, b) => Number(a.day_of_week || 0) - Number(b.day_of_week || 0),
                },
                {
                    title: 'Jam Praktik',
                    render: (_, row) => {
                        const start = row.start_time ? Helper.formatTime(row.start_time, 'H:i') : '-';
                        const end = row.end_time ? Helper.formatTime(row.end_time, 'H:i') : '-';
                        return `${start} - ${end}`;
                    },
                },
                {
                    title: 'Kuota',
                    dataIndex: 'quota',
                    align: 'center',
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
