import { deleteCookie, getCookie, setCookie } from 'cookies-next';

const yiiUrl = import.meta.env.VITE_YII_API_URL;
const nodeUrl = import.meta.env.VITE_NODE_API_URL;

let tokenAPI = null;

const resolveUrl = (url, service = 'yii') => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    const isNodeEndpoint =
        service === 'node' ||
        url.startsWith('/api/dashboard') ||
        url.startsWith('/dashboard') ||
        url.startsWith('/api/auth/verify') ||
        url.startsWith('/api/health');

    const baseUrl = isNodeEndpoint ? nodeUrl : yiiUrl;
    return baseUrl + url;
};

const getToken = async () => {
    if (tokenAPI) return tokenAPI;
    tokenAPI = await getCookie('token');
    return tokenAPI;
};

const deleteTokenCookie = async () => {
    tokenAPI = null;
    await deleteCookie('token');
    return '';
};

const setTokenCookie = async (token) => {
    tokenAPI = token;
    await setCookie('token', token, {
        sameSite: 'lax',
        secure: window.location.protocol === 'https:',
    });
    return token;
};

const getRequest = async (url, refreshToken, service = 'yii') => {
    try {
        const token = await getToken();

        const res = await fetch(resolveUrl(url, service), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + (refreshToken || token),
            },
        });

        const isLoginEndpoint = url === '/api/login' || url === '/login';
        if (res.status === 401 && !isLoginEndpoint) {
            await deleteTokenCookie();
            return window.location.replace('/login');
        }

        const result = await res.json();
        if (result?.rc === 401 && !isLoginEndpoint) {
            await deleteTokenCookie();
            return window.location.replace('/login');
        }

        return {
            status: res.status,
            statusText: res.statusText,
            result: result,
        };
    } catch {
        return {
            status: 500,
            statusText: 'Error API Connection ',
            result: {
                message: 'Error API Connection',
            },
        };
    }
};

const getAuthRequest = async (url, service = 'yii') => {
    try {
        const token = await getToken();
        const res = await fetch(resolveUrl(url, service), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
            },
        });
        const result = await res.json();
        return {
            status: res.status,
            statusText: res.statusText,
            result: result,
        };
    } catch {
        return {
            status: 500,
            statusText: 'Error API Connection ',
            result: {
                message: 'Error API Connection',
            },
        };
    }
};

const postRequest = async (url, data, service = 'yii', extraHeaders = {}) => {
    const token = await getToken();
    try {
        const res = await fetch(resolveUrl(url, service), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
                ...(extraHeaders || {}),
            },
            body: JSON.stringify(data),
        });

        const isLoginEndpoint = url === '/api/login' || url === '/login';
        if (res.status === 401 && !isLoginEndpoint) {
            await deleteTokenCookie();
            return window.location.replace('/login');
        }

        const result = await res.json();
        if (result?.rc === 401 && !isLoginEndpoint) {
            await deleteTokenCookie();
            return window.location.replace('/login');
        }
        return {
            status: res.status,
            statusText: res.statusText,
            result: result,
        };
    } catch {
        return {
            status: 500,
            statusText: 'Error API Connection ',
            result: {
                message: 'Error API Connection',
            },
        };
    }
};

const putRequest = async (url, data, service = 'yii') => {
    const token = await getToken();
    try {
        const res = await fetch(resolveUrl(url, service), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
            },
            body: JSON.stringify(data),
        });

        const isLoginEndpoint = url === '/api/login' || url === '/login';
        if (res.status === 401 && !isLoginEndpoint) {
            await deleteTokenCookie();
            return window.location.replace('/login');
        }

        const result = await res.json();
        if (result?.rc === 401 && !isLoginEndpoint) {
            await deleteTokenCookie();
            return window.location.replace('/login');
        }
        return {
            status: res.status,
            statusText: res.statusText,
            result: result,
        };
    } catch {
        return {
            status: 500,
            statusText: 'Error API Connection ',
            result: {
                message: 'Error API Connection',
            },
        };
    }
};

const deleteRequest = async (url, service = 'yii') => {
    const token = await getToken();
    try {
        const res = await fetch(resolveUrl(url, service), {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
            },
        });

        const isLoginEndpoint = url === '/api/login' || url === '/login';
        if (res.status === 401 && !isLoginEndpoint) {
            await deleteTokenCookie();
            return window.location.replace('/login');
        }

        const result = await res.json();
        if (result?.rc === 401 && !isLoginEndpoint) {
            await deleteTokenCookie();
            return window.location.replace('/login');
        }
        return {
            status: res.status,
            statusText: res.statusText,
            result: result,
        };
    } catch {
        return {
            status: 500,
            statusText: 'Error API Connection ',
            result: {
                message: 'Error API Connection',
            },
        };
    }
};

export const API = {
    GET: getRequest,
    POST: postRequest,
    GETAuth: getAuthRequest,
    PUT: putRequest,
    DELETE: deleteRequest,
    DELETE_COOKIE: deleteTokenCookie,
    SET_COOKIE: setTokenCookie,
    getToken,
    YiiUrl: yiiUrl,
    NodeUrl: nodeUrl,
};
