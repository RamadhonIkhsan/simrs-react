import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import WrapperContent from '@/components/layout/WrapperContent';
import useAuth from '@/hooks/useAuth';
import { API } from '@/lib/API';
import Login from '@/login';
import Dashboard from '@/main/dashboard';
import userStore from '@/store/userStore';
import './App.css';

const verifyTokenSession = async () => {
    const token = await API.getToken();
    if (!token) {
        return { valid: false, user: null, hasToken: false };
    }

    // 1. Cek ke Node Service (/api/auth/verify)
    const verifyRes = await API.GETAuth('/api/auth/verify', 'node');
    if (verifyRes?.status === 200 && verifyRes?.result?.rc === 200) {
        return { valid: true, user: verifyRes?.result?.data || null, hasToken: true };
    }

    // 2. Fallback cek ke Yii Service (/api/menu) jika Node service sedang tidak aktif (status 500)
    if (verifyRes?.status === 500) {
        const yiiRes = await API.GETAuth('/api/menu', 'yii');
        if (yiiRes?.status === 200 && yiiRes?.result?.rc === 200) {
            return { valid: true, user: null, hasToken: true };
        }
    }

    return { valid: false, user: null, hasToken: true };
};

const ProtectedLayout = () => {
    const { removeAuth } = useAuth();
    const { dataUser, setDataUser, clearUser } = userStore();
    const [status, setStatus] = useState('checking'); // 'checking' | 'valid' | 'invalid'

    useEffect(() => {
        let isMounted = true;

        const checkAuth = async () => {
            const { valid, user, hasToken } = await verifyTokenSession();
            if (!isMounted) return;

            if (!hasToken) {
                clearUser();
                setStatus('invalid');
                return;
            }

            if (valid) {
                if (user) {
                    setDataUser({ ...(dataUser || {}), ...user });
                }
                setStatus('valid');
            } else {
                await removeAuth();
                clearUser();
                setStatus('invalid');
            }
        };

        checkAuth();
        return () => {
            isMounted = false;
        };
    }, [removeAuth]); // eslint-disable-line react-hooks/exhaustive-deps

    if (status === 'checking') {
        return (
            <div className="auth-loading-screen">
                <Spin size="large" />
            </div>
        );
    }

    if (status === 'invalid') {
        return <Navigate to="/login" replace />;
    }

    return (
        <WrapperContent>
            <Outlet />
        </WrapperContent>
    );
};

const GuestRoute = ({ children }) => {
    const { removeAuth } = useAuth();
    const [status, setStatus] = useState('checking'); // 'checking' | 'valid' | 'invalid'

    useEffect(() => {
        let isMounted = true;

        const checkAuth = async () => {
            const { valid, hasToken } = await verifyTokenSession();
            if (!isMounted) return;

            if (!hasToken) {
                setStatus('invalid');
                return;
            }

            if (valid) {
                setStatus('valid');
            } else {
                await removeAuth();
                setStatus('invalid');
            }
        };

        checkAuth();
        return () => {
            isMounted = false;
        };
    }, [removeAuth]);

    if (status === 'checking') {
        return (
            <div className="auth-loading-screen">
                <Spin size="large" />
            </div>
        );
    }

    if (status === 'valid') {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

function App() {
    return (
        <ConfigProvider
            theme={{
                token: {
                    fontFamily:
                        "'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
                },
            }}
        >
            <BrowserRouter>
                <Routes>
                    <Route
                        path="/login"
                        element={
                            <GuestRoute>
                                <Login />
                            </GuestRoute>
                        }
                    />
                    <Route element={<ProtectedLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="*" element={<Dashboard />} />
                    </Route>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </ConfigProvider>
    );
}

export default App;
