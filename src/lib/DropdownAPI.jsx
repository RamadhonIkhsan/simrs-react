import { API } from '@/lib/API';

const polis = async () => {
    const response = await API.GET('/api/polis/options');
    return (response?.result?.data || []).map((v) => ({
        value: v.id,
        label: v.name,
        code: v.code,
        registration_fee: v.registration_fee,
    }));
};

const doctors = async () => {
    const response = await API.GET('/api/doctors/options');
    return (response?.result?.data || []).map((v) => ({
        value: v.id,
        label: v.full_name,
        specialty: v.specialty,
    }));
};

const procedures = async () => {
    const response = await API.GET('/api/procedures/options');
    return (response?.result?.data || []).map((v) => ({
        value: v.id,
        label: v.name,
        code: v.code,
        tariff: v.tariff,
    }));
};

const drugs = async () => {
    const response = await API.GET('/api/drugs/options');
    return (response?.result?.data || []).map((v) => ({
        value: v.id,
        label: v.name,
        code: v.code,
        unit: v.unit,
        price: v.price,
        stock: v.stock,
    }));
};

const labTest = async () => {
    const response = await API.GET('/api/lab-tests/options');
    return (response?.result?.data || []).map((v) => ({
        value: v.id,
        label: v.name,
        code: v.code,
        tariff: v.tariff,
    }));
};

const diagnose = async (search = '') => {
    const keyword = String(search || '').trim();
    if (keyword.length < 2) {
        return [];
    }
    const response = await API.GET(`/api/icd10/options?search=${encodeURIComponent(keyword)}`);
    return (response?.result?.data || []).map((v) => ({
        value: v.code,
        label: `${v.code} - ${v.name}`,
        code: v.code,
        name: v.name,
    }));
};

const roles = async () => {
    const fallbackRoles = [
        { value: 1, label: 'Administrator', code: 'ADMIN' },
        { value: 2, label: 'Petugas Pendaftaran', code: 'REGISTRATION' },
        { value: 3, label: 'Dokter', code: 'DOCTOR' },
        { value: 4, label: 'Petugas Farmasi', code: 'PHARMACY' },
        { value: 5, label: 'Petugas Laboratorium', code: 'LAB' },
        { value: 6, label: 'Kasir', code: 'CASHIER' },
    ];
    try {
        const response = await API.GET('/api/roles/options');
        const list = response?.result?.data;
        if (Array.isArray(list) && list.length > 0) {
            return list.map((v) => ({
                value: v.id,
                label: v.name || v.nm || v.code,
                code: v.code,
            }));
        }
        return fallbackRoles;
    } catch {
        return fallbackRoles;
    }
};

const doctorUsers = async () => {
    try {
        const response = await API.GET('/api/users?size=200');
        const list = response?.result?.data;
        if (Array.isArray(list)) {
            return list
                .filter(
                    (u) =>
                        u.is_active !== false &&
                        (Number(u.role_id) === 3 ||
                            String(u.role_name || '').toLowerCase().includes('dokter') ||
                            String(u.role_name || '').toUpperCase() === 'DOCTOR')
                )
                .map((u) => ({
                    value: u.id,
                    label: `${u.username} - ${u.full_name || u.name || ''}`,
                }));
        }
        return [];
    } catch {
        return [];
    }
};

export const DropdownAPI = {
    polis,
    doctors,
    procedures,
    drugs,
    labTest,
    diagnose,
    roles,
    doctorUsers,
};
