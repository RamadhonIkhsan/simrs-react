import {
    FileExcelOutlined,
    FileOutlined,
    FilePdfFilled,
    FileWordOutlined,
    PlusCircleOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import { Dropdown } from 'antd';
import modalStore from '@/store/modal';

export default function ToolBar({
    getData,
    listAction = [],
    actExportExcel,
    actExportWord,
    actExportPDF,
}) {
    const { modalOpen } = modalStore();
    const items = [];

    if (listAction.includes('exportExcel')) {
        items.push({
            key: '1',
            label: (
                <button type="button" onClick={() => actExportExcel()} className="dropdown-item">
                    <FileExcelOutlined className="text-success fs-6 me-2" /> Excel
                </button>
            ),
        });
    }

    if (listAction.includes('exportWord')) {
        items.push({
            key: '2',
            label: (
                <button type="button" onClick={() => actExportWord()} className="dropdown-item">
                    <FileWordOutlined className="text-primary fs-6 me-2" /> Word
                </button>
            ),
        });
    }

    if (listAction.includes('exportPDF')) {
        items.push({
            key: '3',
            label: (
                <button type="button" onClick={() => actExportPDF()} className="dropdown-item">
                    <FilePdfFilled className="text-danger fs-6 me-2" /> PDF
                </button>
            ),
        });
    }

    return (
        <>
            {listAction && listAction.includes('create') ? (
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => modalOpen('new')}
                >
                    <PlusCircleOutlined />
                    Tambah
                </button>
            ) : (
                ''
            )}

            {listAction &&
            (listAction.includes('exportExcel') ||
                listAction.includes('exportWord') ||
                listAction.includes('exportPDF')) ? (
                <Dropdown
                    trigger={['click']}
                    placement="bottomLeft"
                    className="me-2"
                    arrow
                    menu={{ items }}
                >
                    <button
                        type="button"
                        className="btn btn-light-primary my-1"
                        data-bs-toggle="dropdown"
                    >
                        <FileOutlined />
                        Export
                    </button>
                </Dropdown>
            ) : (
                ''
            )}

            <button
                type="button"
                className="btn btn-circle btn-light-primary"
                onClick={() => getData()}
            >
                <ReloadOutlined />
            </button>
        </>
    );
}
