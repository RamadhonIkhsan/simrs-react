import { CloseOutlined } from '@ant-design/icons';
import { Modal, Spin } from 'antd';
import modalStore from '@/store/modal';

export default function ModalForm({ size, title, subTitle, children, action }) {
    const { modalStat, modalClose, modalLoading } = modalStore();

    return (
        <Modal
            centered
            closeIcon={false}
            open={modalStat}
            onCancel={modalClose}
            width={size ? size : '520px'}
            footer={null}
        >
            <Spin spinning={modalLoading}>
                <div className="btn btn-circle btn-light-primary zn-close" onClick={modalClose}>
                    <CloseOutlined />
                </div>
                <div className="px-6 py-4 cardDark" style={{ padding: '24px' }}>
                    <div className="fs-6 fw-normal text-primary" style={{ fontWeight: 600 }}>
                        {title}
                    </div>
                    <div className="fs-7 fw-light text-muted" style={{ fontSize: '12px' }}>
                        {subTitle}
                    </div>
                    <div className="separator my-3" style={{ margin: '16px 0' }} />
                    <div className="my-4">{children}</div>
                </div>

                <div
                    className="card-footer text-right py-3 px-5 zn-bg-modal"
                    style={{ textAlign: 'right' }}
                >
                    {action}
                </div>
            </Spin>
        </Modal>
    );
}
