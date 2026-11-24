import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRightOutlined,
    EyeInvisibleOutlined,
    EyeOutlined,
    LoadingOutlined,
    LockOutlined,
    UserOutlined,
} from '@ant-design/icons';
import useAuth from '@/hooks/useAuth';
import { API } from '@/lib/API';
import userStore from '@/store/userStore';
import './style.scss';

const Login = () => {
    const navigate = useNavigate();
    const { setAuth } = useAuth();
    const { setDataUser } = userStore();

    const [loadingLogin, setLoadingLogin] = useState(false);
    const [errorLogin, setErrorLogin] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            username: '',
            password: '',
        },
    });

    const storeData = handleSubmit(async (payload) => {
        setLoadingLogin(true);
        setErrorLogin('');

        try {
            const response = await API.POST('/api/login', {
                username: payload.username,
                password: payload.password,
            });

            const resData = response?.result;

            if (response?.status === 200 && resData?.rc === 200 && resData?.data?.token) {
                const { token, user } = resData.data;
                await setAuth(token, user?.id ?? '');
                setDataUser(user || {});
                navigate('/dashboard', { replace: true });
            } else {
                setErrorLogin(
                    resData?.rm ||
                        resData?.message ||
                        'Login gagal. Periksa kembali username dan password Anda.'
                );
            }
        } catch {
            setErrorLogin('Terjadi kesalahan pada sistem.');
        } finally {
            setLoadingLogin(false);
        }
    });

    return (
        <>
            <div className="lv3">
                {/* ======================== LEFT PANEL ======================== */}
                <div className="lv3-left">
                    <div className="lv3-left-bg">
                        <img
                            src="/img/hospital-building.jpg"
                            alt="Hospital Building"
                            className="lv3-left-bg-img"
                        />
                        <div className="lv3-left-bg-overlay" />
                    </div>

                    <div className="lv3-left-content">
                        {/* Logo */}
                        <div className="lv3-logo">
                            <img
                                src="/img/logo-harkel.png"
                                alt="Logo SIMRS"
                                className="lv3-logo-img"
                            />
                        </div>

                        {/* Branding */}
                        <div className="lv3-brand">
                            <div className="lv3-brand-accent" />
                            <h1 className="lv3-brand-title">
                                SIMRS
                            </h1>
                            <p className="lv3-brand-subtitle">
                                Sistem Informasi Manajemen Rumah Sakit
                            </p>
                            <p className="lv3-brand-desc">
                                Pelayanan kesehatan terpadu,
                                <br />
                                cepat, akurat, dan terintegrasi
                                <br />
                                untuk keselamatan pasien.
                            </p>
                        </div>
                    </div>

                    {/* Values */}
                    <div className="lv3-values">
                        <span>Integritas</span>
                        <span className="lv3-values-sep">|</span>
                        <span>Profesionalisme</span>
                        <span className="lv3-values-sep">|</span>
                        <span>Inovasi</span>
                    </div>

                    {/* Decorative accents — static SVG */}
                    <img
                        src="/img/accent-tr.svg"
                        alt=""
                        aria-hidden="true"
                        className="lv3-accent-tr"
                        draggable={false}
                    />
                </div>

                {/* ======================== RIGHT PANEL ======================== */}
                <div className="lv3-right">
                    {/* Decorative accents — static SVG */}
                    <img
                        src="/img/accent-bl.svg"
                        alt=""
                        aria-hidden="true"
                        className="lv3-accent-bl"
                        draggable={false}
                    />
                    <img
                        src="/img/accent-tr2.svg"
                        alt=""
                        aria-hidden="true"
                        className="lv3-accent-tr2"
                        draggable={false}
                    />

                    <div className="lv3-right-inner">
                        {/* Header */}
                        <div className="lv3-header">
                            <h2 className="lv3-welcome">Selamat Datang</h2>
                            <p className="lv3-welcome-sub">
                                Silakan masuk ke akun SIMRS Anda.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={storeData} className="lv3-form" noValidate>
                            {/* Username */}
                            <div className="lv3-field">
                                <label htmlFor="username-input" className="sr-only">
                                    Username atau Email
                                </label>
                                <div className="lv3-input-box">
                                    <UserOutlined
                                        className="lv3-input-ico"
                                        aria-hidden="true"
                                    />
                                    <input
                                        id="username-input"
                                        type="text"
                                        {...register('username', {
                                            required: 'Username harus diisi',
                                        })}
                                        placeholder="Username atau Email"
                                        className="lv3-input"
                                        autoComplete="username"
                                        aria-label="Username atau Email"
                                    />
                                </div>
                                {errors.username && (
                                    <div className="lv3-field-err" role="alert">
                                        {errors.username.message}
                                    </div>
                                )}
                            </div>

                            {/* Password */}
                            <div className="lv3-field">
                                <label htmlFor="password-input" className="sr-only">
                                    Password
                                </label>
                                <div className="lv3-input-box">
                                    <LockOutlined
                                        className="lv3-input-ico"
                                        aria-hidden="true"
                                    />
                                    <input
                                        id="password-input"
                                        type={showPassword ? 'text' : 'password'}
                                        {...register('password', {
                                            required: 'Password harus diisi',
                                        })}
                                        placeholder="Password"
                                        className="lv3-input"
                                        autoComplete="current-password"
                                        aria-label="Password"
                                    />
                                    <button
                                        type="button"
                                        className="lv3-eye"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={
                                            showPassword
                                                ? 'Sembunyikan password'
                                                : 'Tampilkan password'
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOutlined aria-hidden="true" />
                                        ) : (
                                            <EyeInvisibleOutlined aria-hidden="true" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <div className="lv3-field-err" role="alert">
                                        {errors.password.message}
                                    </div>
                                )}
                            </div>

                            {/* Options */}
                            {/* <div className="lv3-options">
                                <button
                                    type="button"
                                    className="lv3-forgot"
                                    onClick={() => setForgotModalOpen(true)}
                                >
                                    Lupa password?
                                </button>
                            </div> */}

                            {/* Submit */}
                            <div className="lv3-submit-wrap">
                                <button
                                    type="submit"
                                    className="lv3-submit"
                                    disabled={loadingLogin}
                                    aria-busy={loadingLogin}
                                >
                                    {loadingLogin ? (
                                        <>
                                            <LoadingOutlined
                                                style={{ marginRight: 6, fontSize: 15 }}
                                                spin
                                            />
                                            Memproses...
                                        </>
                                    ) : (
                                        <>
                                            Masuk
                                            <ArrowRightOutlined
                                                style={{ marginLeft: 8, fontSize: 14 }}
                                                aria-hidden="true"
                                            />
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Error */}
                            {errorLogin && (
                                <div className="lv3-error-msg" role="alert">
                                    {errorLogin}
                                </div>
                            )}
                        </form>

                        {/* Footer */}
                        {/* <div className="lv3-footer">
                            <div className="lv3-footer-brand">
                                <SafetyCertificateOutlined
                                    className="lv3-footer-ico"
                                    aria-hidden="true"
                                />
                                <div>
                                    <div className="lv3-footer-name">SIMRS</div>
                                    <div className="lv3-footer-sub">Healthcare System</div>
                                </div>
                            </div>
                            <div className="lv3-footer-sep" />
                            <div className="lv3-footer-tag">
                                Tata kelola layanan medis yang baik,
                                <br />
                                rekam medis yang terintegrasi,
                                <br />
                                pelayanan rumah sakit berkelanjutan.
                            </div>
                        </div> */}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Login;
