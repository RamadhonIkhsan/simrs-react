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
            <div className="login">
                {/* ======================== LEFT PANEL ======================== */}
                <div className="login-left">
                    <div className="login-left-bg">
                        <img
                            src="/img/hospital-building.jpg"
                            alt="Hospital Building"
                            className="login-left-bg-img"
                        />
                        <div className="login-left-bg-overlay" />
                    </div>

                    <div className="login-left-content">
                        {/* Logo */}
                        <div className="login-logo">
                            <img
                                src="/img/logo-harkel.png"
                                alt="Logo SIMRS"
                                className="login-logo-img"
                            />
                        </div>

                        {/* Branding */}
                        <div className="login-brand">
                            <div className="login-brand-accent" />
                            <h1 className="login-brand-title">
                                SIMRS
                            </h1>
                            <p className="login-brand-subtitle">
                                Sistem Informasi Manajemen Rumah Sakit
                            </p>
                            <p className="login-brand-desc">
                                Pelayanan kesehatan terpadu,
                                <br />
                                cepat, akurat, dan terintegrasi
                                <br />
                                untuk keselamatan pasien.
                            </p>
                        </div>
                    </div>

                    <img
                        src="/img/accent-tr.svg"
                        alt=""
                        aria-hidden="true"
                        className="login-accent-tr"
                        draggable={false}
                    />
                </div>

                {/* ======================== RIGHT PANEL ======================== */}
                <div className="login-right">
                    {/* Decorative accents — static SVG */}
                    <img
                        src="/img/accent-bl.svg"
                        alt=""
                        aria-hidden="true"
                        className="login-accent-bl"
                        draggable={false}
                    />
                    <img
                        src="/img/accent-tr2.svg"
                        alt=""
                        aria-hidden="true"
                        className="login-accent-tr2"
                        draggable={false}
                    />

                    <div className="login-right-inner">
                        {/* Header */}
                        <div className="login-header">
                            <h2 className="login-welcome">Selamat Datang</h2>
                            <p className="login-welcome-sub">
                                Silakan masuk ke akun SIMRS Anda.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={storeData} className="login-form" noValidate>
                            {/* Username */}
                            <div className="login-field">
                                <label htmlFor="username-input" className="sr-only">
                                    Username
                                </label>
                                <div className="login-input-box">
                                    <UserOutlined
                                        className="login-input-ico"
                                        aria-hidden="true"
                                    />
                                    <input
                                        id="username-input"
                                        type="text"
                                        {...register('username', {
                                            required: 'Username harus diisi',
                                        })}
                                        placeholder="Username"
                                        className="login-input"
                                        autoComplete="username"
                                        aria-label="Username"
                                    />
                                </div>
                                {errors.username && (
                                    <div className="login-field-err" role="alert">
                                        {errors.username.message}
                                    </div>
                                )}
                            </div>

                            {/* Password */}
                            <div className="login-field">
                                <label htmlFor="password-input" className="sr-only">
                                    Password
                                </label>
                                <div className="login-input-box">
                                    <LockOutlined
                                        className="login-input-ico"
                                        aria-hidden="true"
                                    />
                                    <input
                                        id="password-input"
                                        type={showPassword ? 'text' : 'password'}
                                        {...register('password', {
                                            required: 'Password harus diisi',
                                        })}
                                        placeholder="Password"
                                        className="login-input"
                                        autoComplete="current-password"
                                        aria-label="Password"
                                    />
                                    <button
                                        type="button"
                                        className="login-eye"
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
                                    <div className="login-field-err" role="alert">
                                        {errors.password.message}
                                    </div>
                                )}
                            </div>

                            {/* Options */}
                            {/* <div className="login-options">
                                <button
                                    type="button"
                                    className="login-forgot"
                                    onClick={() => setForgotModalOpen(true)}
                                >
                                    Lupa password?
                                </button>
                            </div> */}

                            {/* Submit */}
                            <div className="login-submit-wrap">
                                <button
                                    type="submit"
                                    className="login-submit"
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
                                <div className="login-error-msg" role="alert">
                                    {errorLogin}
                                </div>
                            )}
                        </form>

                        {/* Footer */}
                        {/* <div className="login-footer">
                            <div className="login-footer-brand">
                                <SafetyCertificateOutlined
                                    className="login-footer-ico"
                                    aria-hidden="true"
                                />
                                <div>
                                    <div className="login-footer-name">SIMRS</div>
                                    <div className="login-footer-sub">Healthcare System</div>
                                </div>
                            </div>
                            <div className="login-footer-sep" />
                            <div className="login-footer-tag">
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
