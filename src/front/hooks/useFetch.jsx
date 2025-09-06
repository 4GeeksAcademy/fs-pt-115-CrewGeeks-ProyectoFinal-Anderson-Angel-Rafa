import { useEffect, useState } from "react"


const urlApi = import.meta.env.VITE_BACKEND_URL + '/api';


export const useFetch = (url, options = {}) => {


    const [data, setData] = useState(null)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const fetchApi = async () => {
        setLoading(true)
        try {
            const response = await fetch(urlApi + url, options);
            const data = await response.json()
            if (!response.ok) {
                const responseError = await response.json()
                throw new Error(responseError.detail || "Error desconocido")
            }

            setData(data)

        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }



    useEffect(() => {
        fetchApi()
    }, [url])

    return {
        data,
        error,
        loading
    }

}