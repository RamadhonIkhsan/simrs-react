import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card } from 'antd';
import Input from '@/components/util/Input';
import useAuth from '@/hooks/useAuth';
import { API } from '@/lib/API';
import userStore from '@/store/userStore';

const Login = () => {
    const navigate = useNavigate();
    const { setAuth } = useAuth();
    const { setDataUser } = userStore();
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

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

    const onSubmit = async (values) => {
        setLoading(true);
        setErrorMessage('');

        try {
            const response = await API.POST('/api/login', {
                username: values.username,
                password: values.password,
            });

            const resData = response?.result;

            if (response?.status === 200 && resData?.rc === 200 && resData?.data?.token) {
                const { token, user } = resData.data;
                await setAuth(token, user?.id ?? '');
                setDataUser(user || {});
                navigate('/dashboard', { replace: true });
            } else {
                setErrorMessage(
                    resData?.rm ||
                        resData?.message ||
                        'Login gagal. Periksa kembali username dan password Anda.'
                );
            }
        } catch {
            setErrorMessage('Terjadi kesalahan koneksi ke server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <Card className="login-card" bordered={false}>
                <div className="login-header">
                    <h2 className="login-title">SIMRS</h2>
                    <p className="login-subtitle">Silakan masuk ke akun Anda</p>
                </div>

                {errorMessage && (
                    <Alert
                        message={errorMessage}
                        type="error"
                        showIcon
                        closable
                        onClose={() => setErrorMessage('')}
                        style={{ marginBottom: 20 }}
                    />
                )}

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <Input.Text
                        title="Username"
                        name="username"
                        register={register}
                        error={errors}
                        required={true}
                        maxlength={100}
                        placeholder=" "
                    />

                    <Input.Password
                        title="Password"
                        name="password"
                        register={register}
                        error={errors}
                        required={true}
                        maxlength={100}
                        placeholder=" "
                    />

                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        block
                        size="large"
                        className="login-submit-btn"
                    >
                        Masuk
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default Login;
