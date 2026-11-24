import { create } from 'zustand';

const notifStore = create((set) => ({
    notifStat: false,
    notifLoading: false,
    FormId: null,
    title: null,
    subTitle: null,
    notifType: null,
    notifOpen: (title, subTitle, type = 'success') =>
        set(() => ({
            notifStat: true,
            title,
            subTitle,
            notifType: type,
        })),
    notifClose: () =>
        set(() => ({
            notifStat: false,
        })),
    setNotifLoading: (status) =>
        set(() => ({
            notifLoading: status,
        })),
}));

export default notifStore;
