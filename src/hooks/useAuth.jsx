"use client"
import {API} from "@/lib/API";

const useAuth = () => {
    const setAuth = async (token, user) => {
        let res = await API.SET_COOKIE(token)
        localStorage.setItem('userId', user);

        return res
    }

    const removeAuth = async () => {
        await API.DELETE_COOKIE()
        localStorage.removeItem('userId')
    }

    return {
        setAuth,
        removeAuth
    }
}

export default useAuth