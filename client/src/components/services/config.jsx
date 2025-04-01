// בודקים אם אנחנו בסביבת פיתוח
const isDevelopment = process.env.NODE_ENV === 'development';

export const API_BASE_URL = isDevelopment
    ? `http://localhost:${process.env.PORT || 5000}`
    : 'https://grocerieslist-server.onrender.com';