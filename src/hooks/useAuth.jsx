import { useCallback } from 'react';
import { API } from '@/lib/API';

const useAuth = () => {
    const setAuth = useCallback(async (token, user) => {
        const res = await API.SET_COOKIE(token);
        localStorage.setItem('userId', user);

        return res;
    }, []);

    const removeAuth = useCallback(async () => {
        await API.DELETE_COOKIE();
        localStorage.removeItem('userId');
    }, []);

    return {
        setAuth,
        removeAuth,
    };
};

export default useAuth;
