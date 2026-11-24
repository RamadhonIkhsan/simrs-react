import { create } from 'zustand';

const confirmStore = create((set) => ({
    confirmStat: false,
    confirmLoading: false,
    confirmAct: null,
    FormId: null,
    title: null,
    subTitle: null,
    confirmOpen: (title, subTitle, act) =>
        set(() => ({
            confirmStat: true,
            title,
            subTitle,
            confirmAct: act,
        })),
    confirmClose: () =>
        set(() => ({
            confirmStat: false,
            confirmLoading: false,
        })),
    setConfirmLoading: (status) =>
        set(() => ({
            confirmLoading: status,
        })),
}));

export default confirmStore;
