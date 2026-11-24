import { create } from 'zustand';

const getInitialUser = () => {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const userStore = create((set) => ({
    dataUser: getInitialUser(),
    setDataUser: (user) => {
        if (typeof window !== 'undefined') {
            if (user) {
                localStorage.setItem('user', JSON.stringify(user));
            } else {
                localStorage.removeItem('user');
            }
        }
        set({ dataUser: user });
    },
    clearUser: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('user');
            localStorage.removeItem('userId');
        }
        set({ dataUser: null });
    },
}));

export default userStore;
