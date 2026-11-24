import { Modal, Spin } from 'antd';
import confirmStore from '@/store/confirmStore';

export default function ModalConfirm() {
    const { confirmStat, confirmClose, confirmAct, title, subTitle, confirmLoading } =
        confirmStore();

    return (
        <Modal
            centered
            closeIcon={false}
            open={confirmStat}
            onCancel={confirmClose}
            footer={null}
            width="300px"
        >
            <Spin spinning={confirmLoading}>
                <div
                    className="card wave wave-animate-slow wave-danger"
                    style={{ padding: '5px' }}
                >
                    <div className="content-notif">
                        <div className="card-body py-3 px-4" style={{ padding: '16px 20px' }}>
                            <div className="d-flex align-items-center p-1">
                                <div className="d-flex flex-column">
                                    <div
                                        className="fs-6 fw-normal text-danger"
                                        style={{ fontWeight: 600 }}
                                    >
                                        {title}
                                    </div>
                                    <div
                                        className="fs-7 fw-normal text-muted"
                                        style={{ fontSize: '13px', marginTop: '4px' }}
                                    >
                                        {subTitle}
                                    </div>

                                    <div
                                        className="mt-4"
                                        style={{ display: 'flex', gap: '8px', marginTop: '16px' }}
                                    >
                                        <button
                                            type="button"
                                            onClick={confirmAct}
                                            className="btn btn-danger btn-sm font-weight-bold me-2"
                                        >
                                            Ya
                                        </button>
                                        <button
                                            type="button"
                                            onClick={confirmClose}
                                            className="btn btn-light-danger btn-sm border-0 font-weight-bold me-2"
                                        >
                                            Tidak
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Spin>
        </Modal>
    );
}
