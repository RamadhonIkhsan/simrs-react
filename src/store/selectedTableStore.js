import { create } from 'zustand';

const selectedTableStore = create((set) => ({
    dataSelectedStore: [],
    dataRowSelected: [],
    setDataSelect: (data) =>
        set(() => ({
            dataSelectedStore: data,
        })),
    setDataRowSelected: (data) =>
        set(() => ({
            dataRowSelected: data,
        })),
    resetDataSelect: () =>
        set(() => ({
            dataSelectedStore: [],
            dataRowSelected: [],
        })),
}));

export default selectedTableStore;
