import { useEffect } from 'react';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    InfoCircleOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import { Modal } from 'antd';
import notifStore from '@/store/notifStore';

export default function ModalNotif() {
    const { notifStat, notifType, title, subTitle, notifClose } = notifStore();

    const type = notifType ? notifType : 'success';

    const renderIcon = () => {
        const iconStyle = { fontSize: '35px', marginRight: '12px', marginTop: '4px' };
        if (type === 'info') {
            return <InfoCircleOutlined style={iconStyle} className={`me-3 mt-1 text-${type}`} />;
        }
        if (type === 'warning') {
            return <WarningOutlined style={iconStyle} className={`me-3 mt-1 text-${type}`} />;
        }
        if (type === 'danger') {
            return <CloseCircleOutlined style={iconStyle} className={`me-3 mt-1 text-${type}`} />;
        }
        return <CheckCircleOutlined style={iconStyle} className={`me-3 mt-1 text-${type}`} />;
    };

    useEffect(() => {
        if (notifStat === true) {
            const timer = setTimeout(notifClose, 2000);
            return () => clearTimeout(timer);
        }
    }, [notifStat, notifClose]);

    return (
        <Modal
            centered
            closeIcon={false}
            open={notifStat}
            onCancel={notifClose}
            footer={null}
            width="300px"
            zIndex={10000}
        >
            <div className={`card wave wave-animate-slow wave-${type}`} style={{ padding: '5px' }}>
                <div className="content-notif">
                    <div className="card-body py-5 px-4" style={{ padding: '20px' }}>
                        <div className="d-flex align-items-center p-1">
                            <div className="d-flex flex-column">
                                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                    <div>{renderIcon()}</div>
                                    <div>
                                        <div
                                            className={`fs-6 fw-bold text-uppercase text-${type}`}
                                            style={{ fontWeight: 700, textTransform: 'uppercase' }}
                                        >
                                            {title}
                                        </div>
                                        <div
                                            className="fs-7 fw-normal text-muted"
                                            style={{ fontSize: '13px' }}
                                        >
                                            {subTitle}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
