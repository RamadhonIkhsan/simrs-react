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

export const DropdownAPI = {
    polis,
    doctors,
    procedures,
    drugs,
    labTest,
    diagnose,
};
