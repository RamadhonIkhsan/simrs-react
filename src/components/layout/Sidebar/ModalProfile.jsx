import { forwardRef, useImperativeHandle, useState } from 'react';
import {
    CheckCircleOutlined,
    CloseOutlined,
    IdcardOutlined,
    MailOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Alert, Avatar, Empty, Modal, Spin } from 'antd';
import dayjs from 'dayjs';
import { API } from '@/lib/API';
import userStore from '@/store/userStore';
import './profile.scss';

const formatDate = (value) => {
    if (!value) return '–';
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.format('DD-MM-YYYY HH:mm:ss') : String(value);
};

const ModalProfile = forwardRef((_props, ref) => {
    const [statusModal, setStatusModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState('');
    const { dataUser, setDataUser } = userStore();

    const loadProfile = async () => {
        setLoading(true);
        setError('');

        const userId = dataUser?.id || localStorage.getItem('userId');
        if (!userId) {
            setProfile(dataUser || null);
            setLoading(false);
            return;
        }

        try {
            const response = await API.GET(`/api/users/${userId}`);
            const res = response?.result;

            if (response?.status === 200 && res?.rc === 200 && res?.data) {
                const merged = { ...(dataUser || {}), ...res.data };
                setProfile(merged);
                setDataUser(merged);
            } else if (dataUser) {
                setProfile(dataUser);
            } else {
                throw new Error(res?.rm || 'Gagal memuat profil pengguna.');
            }
        } catch (cause) {
            if (dataUser) {
                setProfile(dataUser);
            } else {
                setError(
                    cause instanceof Error ? cause.message : 'Gagal memuat profil pengguna.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    useImperativeHandle(ref, () => ({
        actStatusModal: setStatusModal,
        actOpenModal: () => {
            setStatusModal(true);
            void loadProfile();
        },
    }));

    const fullName = profile?.full_name || profile?.fullname || profile?.name || profile?.username || '';
    const initials = fullName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();

    const details = [
        {
            label: 'Nama Lengkap',
            value: fullName,
            Icon: IdcardOutlined,
        },
        {
            label: 'Email',
            value: profile?.email,
            Icon: MailOutlined,
        },
        {
            label: 'Status Akun',
            value:
                profile?.is_active !== undefined
                    ? profile.is_active
                        ? 'Aktif'
                        : 'Tidak Aktif'
                    : 'Aktif',
            Icon: CheckCircleOutlined,
        },
    ];

    return (
        <Modal
            centered
            closeIcon={false}
            open={statusModal}
            onCancel={() => setStatusModal(false)}
            width={440}
            footer={null}
            styles={{
                content: { padding: 0, borderRadius: '24px', overflow: 'hidden' },
                body: { padding: 0 },
            }}
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
                        color: '#fff',
                        background: '#ffffff20',
                        zIndex: 3,
                    }}
                    onClick={() => setStatusModal(false)}
                >
                    <CloseOutlined style={{ fontSize: '18px' }} />
                </button>

                <div className="user-profile-card">
                    <section aria-label="Profil Pengguna">
                        <div className="user-profile-cover">
                            <span className="user-profile-eyebrow">PROFIL PENGGUNA</span>
                            <Avatar
                                size={88}
                                icon={!initials ? <UserOutlined /> : undefined}
                            >
                                {initials}
                            </Avatar>
                            <h2>{fullName || (loading ? 'Memuat profil...' : 'Profil Pengguna')}</h2>
                            <p>{profile?.username ? `@${profile.username}` : 'Informasi akun SIMRS'}</p>
                        </div>

                        <div className="user-profile-content">
                            {error ? (
                                <Alert
                                    type="error"
                                    showIcon
                                    message={error}
                                    action={
                                        <button
                                            type="button"
                                            className="btn btn-light-primary sm"
                                            onClick={() => void loadProfile()}
                                        >
                                            Coba Lagi
                                        </button>
                                    }
                                />
                            ) : profile ? (
                                <>
                                    <div className="user-profile-account">
                                        <div>
                                            <span>Wewenang / Role</span>
                                            <strong>
                                                {profile?.role_name ||
                                                    profile?.role?.nm ||
                                                    (profile?.role_id ? `Role #${profile.role_id}` : '–')}
                                            </strong>
                                        </div>
                                        <div>
                                            <span>User ID</span>
                                            <strong>{profile?.id || '–'}</strong>
                                        </div>
                                    </div>

                                    <dl className="user-profile-details">
                                        {details.map((item) => {
                                            const DetailIcon = item.Icon;
                                            return (
                                                <div key={item.label}>
                                                    <DetailIcon aria-hidden="true" />
                                                    <div>
                                                        <dt>{item.label}</dt>
                                                        <dd>{item.value || '–'}</dd>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </dl>

                                    <div className="user-profile-dates">
                                        <div>
                                            <span>Tanggal Dibuat</span>
                                            <time>{formatDate(profile?.created_at)}</time>
                                        </div>
                                        <div>
                                            <span>Login Terakhir</span>
                                            <time>{formatDate(profile?.last_login_at)}</time>
                                        </div>
                                    </div>
                                </>
                            ) : !loading ? (
                                <Empty description="Data profil belum tersedia." />
                            ) : (
                                <output>Memuat informasi akun...</output>
                            )}

                            <button
                                type="button"
                                className="btn btn-light-primary user-profile-close"
                                onClick={() => setStatusModal(false)}
                            >
                                Tutup Profil
                            </button>
                        </div>
                    </section>
                </div>
            </Spin>
        </Modal>
    );
});

ModalProfile.displayName = 'ModalProfile';

export default ModalProfile;
