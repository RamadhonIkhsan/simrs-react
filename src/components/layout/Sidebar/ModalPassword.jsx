import { forwardRef, useImperativeHandle, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { BlockOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Col, Modal, Row, Spin, message } from 'antd';
import Input from '@/components/util/Input';
import { API } from '@/lib/API';
import userStore from '@/store/userStore';

const PasswordStrength = ({ value = '' }) => {
    const val = String(value || '');
    const checks = {
        length: val.length >= 8,
        number: /[0-9]/.test(val),
        symbol: /[!@#$%^&*(),.?":{}|<>]/.test(val),
        uppercase: /[A-Z]/.test(val),
    };

    let strength = 0;
    if (val.length > 0) {
        if (checks.length) strength += 1;
        if (checks.number) strength += 1;
        if (checks.symbol) strength += 1;
        if (checks.uppercase) strength += 1;
    }

    const getStrengthColor = (index) => {
        if (strength === 0) return 'var(--primary-light)';
        if (strength === 1) return index === 0 ? '#ff4d4f' : 'var(--primary-light)';
        if (strength === 2) return index <= 1 ? '#faad14' : 'var(--primary-light)';
        if (strength === 3) return index <= 2 ? '#1890ff' : 'var(--primary-light)';
        return '#52c41a';
    };

    const getStrengthText = () => {
        if (!value) return '';
        if (strength <= 1) return 'Lemah';
        if (strength === 2) return 'Sedang';
        if (strength === 3) return 'Baik';
        return 'Kuat';
    };

    const requirements = [
        { key: 'length', label: 'Minimal 8 karakter', ok: checks.length },
        { key: 'uppercase', label: 'Mengandung huruf kapital', ok: checks.uppercase },
        { key: 'number', label: 'Mengandung angka', ok: checks.number },
        { key: 'symbol', label: 'Mengandung simbol', ok: checks.symbol },
    ];

    return (
        <div className="mb-4 strength-checker" style={{ marginTop: 6 }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                }}
            >
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--black)' }}>
                    Keamanan Kata Sandi
                </span>
                {value && (
                    <div
                        style={{
                            padding: '2px 10px',
                            background:
                                strength === 4
                                    ? 'rgba(34, 197, 94, 0.1)'
                                    : strength === 3
                                      ? 'rgba(59, 130, 246, 0.1)'
                                      : strength === 2
                                        ? 'rgba(245, 158, 11, 0.1)'
                                        : 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                        }}
                    >
                        <div
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background:
                                    strength === 4
                                        ? '#22c55e'
                                        : strength === 3
                                          ? '#3b82f6'
                                          : strength === 2
                                            ? '#f59e0b'
                                            : '#ef4444',
                            }}
                        />
                        <span
                            style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color:
                                    strength === 4
                                        ? '#22c55e'
                                        : strength === 3
                                          ? '#3b82f6'
                                          : strength === 2
                                            ? '#f59e0b'
                                            : '#ef4444',
                            }}
                        >
                            {getStrengthText()}
                        </span>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        style={{
                            height: '6px',
                            flex: 1,
                            borderRadius: '10px',
                            background: getStrengthColor(i),
                            transition: 'all 0.3s ease',
                        }}
                    />
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {requirements.map((req) => (
                    <div
                        key={req.key}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            opacity: req.ok ? 1 : 0.45,
                            transition: 'all 0.3s',
                        }}
                    >
                        <div
                            style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: req.ok ? 'var(--primary-dark)' : 'var(--primary-light)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: req.ok ? '#fff' : 'var(--text-muted)',
                            }}
                        >
                            <CheckOutlined style={{ fontSize: '10px' }} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--black)' }}>
                            {req.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ModalPassword = forwardRef((_props, ref) => {
    const [statusModal, setStatusModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const { dataUser } = userStore();

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: {
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    const passwordValue = useWatch({
        control,
        name: 'newPassword',
        defaultValue: '',
    });

    useImperativeHandle(ref, () => ({
        actStatusModal: (status) => {
            setStatusModal(status);
        },
        actOpenModal: () => {
            reset();
            setStatusModal(true);
        },
    }));

    const storeForm = async (payload) => {
        if (payload.newPassword !== payload.confirmPassword) {
            message.error('Password Baru dan Konfirmasi Password Tidak Sama');
            return;
        }

        setLoading(true);
        try {
            const userId = dataUser?.id || localStorage.getItem('userId');
            const response = await API.PUT(`/api/users/${userId}`, {
                old_password: payload.oldPassword,
                password: payload.newPassword,
                confirm_password: payload.confirmPassword,
            });

            if (response?.status === 200 && response?.result?.rc === 200) {
                message.success('Berhasil Ubah Password');
                setStatusModal(false);
                reset();
            } else {
                message.error(
                    response?.result?.rm ||
                        response?.result?.message ||
                        'Gagal Ubah Password'
                );
            }
        } catch {
            message.error('Gagal Ubah Password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            centered
            closeIcon={false}
            open={statusModal}
            onCancel={() => setStatusModal(false)}
            width={500}
            footer={
                <div className="card-footer p-3" style={{ textAlign: 'right' }}>
                    <button
                        type="button"
                        onClick={handleSubmit(storeForm)}
                        className="btn btn-dark btn-lg"
                    >
                        Simpan
                    </button>
                </div>
            }
        >
            <Spin spinning={loading}>
                <button
                    type="button"
                    aria-label="Tutup modal"
                    className="btn btn-circle btn-transparent btn-icon"
                    style={{
                        position: 'absolute',
                        right: '15px',
                        top: '15px',
                        background: 'none',
                        zIndex: 3,
                    }}
                    onClick={() => setStatusModal(false)}
                >
                    <CloseOutlined style={{ fontSize: '20px' }} />
                </button>

                <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <BlockOutlined
                            style={{ fontSize: '36px', color: 'var(--primary-dark)' }}
                        />
                        <div>
                            <div
                                style={{
                                    fontSize: '18px',
                                    fontWeight: 600,
                                    color: 'var(--primary-dark)',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Ubah Password
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                Keamanan Akun Pengguna
                            </div>
                        </div>
                    </div>

                    <div className="separator" style={{ margin: '18px 0 24px' }} />

                    <form onSubmit={handleSubmit(storeForm)}>
                        <Row gutter={15}>
                            <Col span={24}>
                                <Input.Password
                                    required
                                    title="Password Lama"
                                    name="oldPassword"
                                    register={register}
                                    error={errors}
                                    maxlength={100}
                                />
                            </Col>
                            <Col span={24}>
                                <Input.Password
                                    required
                                    title="Password Baru"
                                    name="newPassword"
                                    register={register}
                                    error={errors}
                                    maxlength={100}
                                />
                            </Col>
                            <Col span={24}>
                                <Input.Password
                                    required
                                    title="Konfirmasi Password"
                                    name="confirmPassword"
                                    register={register}
                                    error={errors}
                                    maxlength={100}
                                />
                            </Col>
                            <Col span={24}>
                                <div style={{ padding: '0 4px' }}>
                                    <PasswordStrength value={passwordValue} />
                                </div>
                            </Col>
                        </Row>
                    </form>
                </div>
            </Spin>
        </Modal>
    );
});

ModalPassword.displayName = 'ModalPassword';

export default ModalPassword;
