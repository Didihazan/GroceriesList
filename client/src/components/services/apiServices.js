import { API_BASE_URL } from './config';

// פונקציה עזר לשליחת בקשות
const fetchApi = async (endpoint, options = {}) => {
    try {
        const url = `${API_BASE_URL}${endpoint}`;

        // הגדרות ברירת מחדל
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        // מיזוג ההגדרות עם ההגדרות שהתקבלו
        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...(options.headers || {}),
            },
        };

        const response = await fetch(url, config);

        // בדיקה אם התגובה תקינה
        if (!response.ok) {
            throw new Error(`שגיאת שרת: ${response.status}`);
        }

        const data = await response.json();
        return { data };

    } catch (error) {
        console.error('שגיאת API:', error);
        return {
            error: error instanceof Error ? error.message : 'שגיאה לא ידועה'
        };
    }
};

// פונקציות נוחות לשימוש
export const apiService = {
    get: (endpoint, options) =>
        fetchApi(endpoint, { ...options, method: 'GET' }),

    post: (endpoint, data, options) =>
        fetchApi(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        }),

    put: (endpoint, data, options) =>
        fetchApi(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data)
        }),

    delete: (endpoint, options) =>
        fetchApi(endpoint, { ...options, method: 'DELETE' }),
};