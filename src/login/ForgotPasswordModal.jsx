import { useState } from 'react';
import {
    ArrowRightOutlined,
    CheckOutlined,
    CloseOutlined,
    CopyOutlined,
    CustomerServiceOutlined,
    InfoCircleOutlined,
    MailOutlined,
    PhoneOutlined,
    SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Modal } from 'antd';

const ForgotPasswordModal = ({ open, onClose }) => {
    const [copiedKey, setCopiedKey] = useState(null);

    const adminEmail = 'ithelpdesk@simrs.co.id';
    const adminPhone = '(021) 500-456';
    const adminExt = 'Ext. 101 / 102';

    const handleCopy = (text, key) => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(text);
            setCopiedKey(key);
            setTimeout(() => {
                setCopiedKey((curr) => (curr === key ? null : curr));
            }, 2000);
        }
    };

    const mailtoUrl = `mailto:${adminEmail}?subject=${encodeURIComponent(
        '[SIMRS] Permohonan Reset Kata Sandi'
    )}&body=${encodeURIComponent(
        `Yth. Administrator SIMRS,\n\nSaya ingin mengajukan reset kata sandi untuk akun saya:\n\n- Nama Lengkap : \n- NIP / Username : \n- Unit Kerja / Poliklinik : \n- No. Handphone / Ext : \n\nMohon bantuannya untuk memproses reset kata sandi akun tersebut.\n\nTerima kasih.`
    )}`;

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            centered
            closeIcon={null}
            width={500}
            className="lv3-forgot-modal"
            destroyOnClose
        >
            <div className="lv3-fmodal-card">
                {/* Top Accent Stripe */}
                <div className="lv3-fmodal-stripe" />

                {/* Close Button */}
                <button
                    type="button"
                    className="lv3-fmodal-close"
                    onClick={onClose}
                    aria-label="Tutup modal"
                >
                    <CloseOutlined aria-hidden="true" />
                </button>

                {/* Header */}
                <div className="lv3-fmodal-header">
                    <div className="lv3-fmodal-icon-badge">
                        <CustomerServiceOutlined className="lv3-fmodal-icon" aria-hidden="true" />
                        <span className="lv3-fmodal-icon-sub">
                            <SafetyCertificateOutlined aria-hidden="true" />
                        </span>
                    </div>
                    <h3 className="lv3-fmodal-title">Bantuan Lupa Kata Sandi</h3>
                    <p className="lv3-fmodal-desc">
                        Demi menjaga keamanan akun, permohonan reset kata sandi dilakukan terpusat
                        melalui <strong>Administrator SIMRS</strong>.
                    </p>
                </div>

                {/* Step Guide */}
                <div className="lv3-fmodal-steps">
                    <div className="lv3-fmodal-step">
                        <span className="lv3-fmodal-step-idx">1</span>
                        <span className="lv3-fmodal-step-label">Siapkan Username</span>
                    </div>
                    <ArrowRightOutlined className="lv3-fmodal-step-arrow" aria-hidden="true" />
                    <div className="lv3-fmodal-step">
                        <span className="lv3-fmodal-step-idx">2</span>
                        <span className="lv3-fmodal-step-label">Hubungi Admin</span>
                    </div>
                    <ArrowRightOutlined className="lv3-fmodal-step-arrow" aria-hidden="true" />
                    <div className="lv3-fmodal-step">
                        <span className="lv3-fmodal-step-idx">3</span>
                        <span className="lv3-fmodal-step-label">Reset Akun</span>
                    </div>
                </div>

                {/* Contact Action Cards */}
                <div className="lv3-fmodal-contacts">
                    {/* Email Card */}
                    <div className="lv3-fmodal-card-item">
                        <div className="lv3-fmodal-card-top">
                            <div className="lv3-fmodal-channel-icon email">
                                <MailOutlined aria-hidden="true" />
                            </div>
                            <div className="lv3-fmodal-channel-info">
                                <span className="lv3-fmodal-channel-title">Email IT Helpdesk</span>
                                <span className="lv3-fmodal-channel-val">{adminEmail}</span>
                                <span className="lv3-fmodal-channel-sub">
                                    Estimasi respon 15–30 menit (jam kerja)
                                </span>
                            </div>
                        </div>
                        <div className="lv3-fmodal-card-actions">
                            <button
                                type="button"
                                className={`lv3-fmodal-btn-copy ${
                                    copiedKey === 'email' ? 'copied' : ''
                                }`}
                                onClick={() => handleCopy(adminEmail, 'email')}
                            >
                                {copiedKey === 'email' ? (
                                    <>
                                        <CheckOutlined aria-hidden="true" /> Tersalin
                                    </>
                                ) : (
                                    <>
                                        <CopyOutlined aria-hidden="true" /> Salin Email
                                    </>
                                )}
                            </button>
                            <a
                                href={mailtoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="lv3-fmodal-btn-link"
                            >
                                <MailOutlined aria-hidden="true" /> Buka Email
                            </a>
                        </div>
                    </div>

                    {/* Hotline Card */}
                    <div className="lv3-fmodal-card-item">
                        <div className="lv3-fmodal-card-top">
                            <div className="lv3-fmodal-channel-icon phone">
                                <PhoneOutlined aria-hidden="true" />
                            </div>
                            <div className="lv3-fmodal-channel-info">
                                <span className="lv3-fmodal-channel-title">
                                    Hotline / Telepon Internal
                                </span>
                                <span className="lv3-fmodal-channel-val">
                                    {adminPhone} <small>({adminExt})</small>
                                </span>
                                <span className="lv3-fmodal-channel-sub">
                                    Senin – Jumat: 08.00 – 17.00 WIB
                                </span>
                            </div>
                        </div>
                        <div className="lv3-fmodal-card-actions">
                            <button
                                type="button"
                                className={`lv3-fmodal-btn-copy ${
                                    copiedKey === 'phone' ? 'copied' : ''
                                }`}
                                onClick={() => handleCopy(`${adminPhone} ${adminExt}`, 'phone')}
                            >
                                {copiedKey === 'phone' ? (
                                    <>
                                        <CheckOutlined aria-hidden="true" /> Tersalin
                                    </>
                                ) : (
                                    <>
                                        <CopyOutlined aria-hidden="true" /> Salin Nomor
                                    </>
                                )}
                            </button>
                            <a
                                href={`tel:${adminPhone.replace(/[^0-9]/g, '')}`}
                                className="lv3-fmodal-btn-link"
                            >
                                <PhoneOutlined aria-hidden="true" /> Panggil
                            </a>
                        </div>
                    </div>
                </div>

                {/* Security Notice */}
                <div className="lv3-fmodal-notice">
                    <InfoCircleOutlined className="lv3-fmodal-notice-ico" aria-hidden="true" />
                    <span>
                        Petugas IT SIMRS <strong>tidak pernah meminta</strong> password atau data
                        rahasia Anda. Reset dilakukan langsung ke akun terdaftar.
                    </span>
                </div>

                {/* Footer */}
                <div className="lv3-fmodal-footer">
                    <button type="button" className="lv3-fmodal-btn-dismiss" onClick={onClose}>
                        Saya Mengerti
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ForgotPasswordModal;
