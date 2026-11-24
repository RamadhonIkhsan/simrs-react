import { create } from 'zustand';

const modalStore = create((set) => ({
    modalStat: false,
    modalLoading: false,
    FormId: null,
    actionType: null,
    modalDetail: false,
    modalPassword: false,
    modalProfile: false,
    modalLoadingPassword: false,
    modalLoadingProfile: false,
    modalPasswordType: 'normal',
    modalOpen: (id, action = null) =>
        set(() => ({
            modalStat: true,
            modalLoading: true,
            FormId: id,
            actionType: action,
        })),
    modalClose: () =>
        set(() => ({
            modalStat: false,
            modalDetail: false,
            FormId: null,
            actionType: null,
        })),
    setModalLoading: (status) =>
        set(() => ({
            modalLoading: status,
        })),
    setModalLoadingPassword: (status) =>
        set(() => ({
            modalLoadingPassword: status,
        })),
    setModalLoadingProfile: (status) =>
        set(() => ({
            modalLoadingProfile: status,
        })),
    setModalPassword: (status, type) =>
        set(() => ({
            modalPassword: status,
            modalPasswordType: type,
        })),
    setModalProfile: (status) =>
        set(() => ({
            modalProfile: status,
        })),
    setModalDetail: (status) =>
        set(() => ({
            modalDetail: status,
        })),
}));

export default modalStore;
