import { create } from 'zustand';
import { API } from '@/lib/API';

let menuPromise = null;

const normalizeMenuTree = (items = []) => {
    if (!Array.isArray(items)) return [];
    return items.map((item) => {
        const key = String(item.key ?? item.menu_id ?? item.url ?? item.menu);
        const label = item.label ?? item.menu ?? '';
        const children = Array.isArray(item.children) ? normalizeMenuTree(item.children) : [];
        return {
            ...item,
            key,
            label,
            url: item.url || '#',
            icon: item.icon || null,
            children,
        };
    });
};

const menuStore = create((set, get) => ({
    menuData: [],
    loadingMenu: false,
    menuError: null,
    toggleStatus: true,
    loadingPageStatus: false,
    activeModule: 'SIMRS',

    setToggle: () =>
        set((state) => {
            const newStatus = !state.toggleStatus;
            if (typeof window !== 'undefined') {
                localStorage.setItem('toggleStatus', String(newStatus));
            }
            return { toggleStatus: newStatus };
        }),

    setToggleStatus: (status) => set({ toggleStatus: status }),

    setLoadingPageStatus: (stat) => set({ loadingPageStatus: stat }),

    setMenuData: (data) => set({ menuData: normalizeMenuTree(data) }),

    setActiveModule: (module) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('activeModule', module);
        }
        set({ activeModule: module });
    },

    resetMenu: () => {
        menuPromise = null;
        set({
            menuData: [],
            loadingMenu: false,
            menuError: null,
            activeModule: 'SIMRS',
        });
    },

    getMenus: async (force = false) => {
        const currentData = get().menuData;
        if (currentData && currentData.length > 0 && !force) {
            return currentData;
        }

        if (menuPromise && !force) {
            return menuPromise;
        }

        set({ loadingMenu: true, menuError: null });
        menuPromise = (async () => {
            try {
                const response = await API.GET('/api/menu');
                const res = response?.result;

                if (response?.status === 200 && res?.rc === 200 && Array.isArray(res?.data)) {
                    const normalized = normalizeMenuTree(res.data);
                    set({ menuData: normalized, menuError: null });
                    return normalized;
                }

                set({
                    menuData: [],
                    menuError: res?.rm || res?.message || 'Daftar menu belum dapat dimuat.',
                });
                return [];
            } catch {
                set({
                    menuData: [],
                    menuError: 'Daftar menu belum dapat dimuat.',
                });
                return [];
            } finally {
                set({ loadingMenu: false });
                menuPromise = null;
            }
        })();

        return menuPromise;
    },
}));

export default menuStore;
