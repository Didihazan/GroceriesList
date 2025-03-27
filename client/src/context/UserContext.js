import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // בדיקה אם יש משתמש שמור בלוקל סטורג' ושחזור המצב
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            try {
                setCurrentUser(JSON.parse(storedUser));
            } catch (error) {
                // במקרה שיש בעיה עם ה-JSON בלוקל סטורג'
                console.error('שגיאה בטעינת משתמש מהאחסון המקומי:', error);
                localStorage.removeItem('currentUser'); // מוחק את המידע הפגום
            }
        }
        setLoading(false);
    }, []);

    const loginUser = async (phone) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/users/${phone}`);
            setCurrentUser(res.data);
            // שמירה בלוקל סטורג' ללא תאריך תפוגה
            localStorage.setItem('currentUser', JSON.stringify(res.data));
            return true;
        } catch (err) {
            console.error('שגיאת התחברות:', err);
            return false;
        }
    };

    const registerUser = async (userData) => {
        try {
            const res = await axios.post('http://localhost:5000/api/users', userData);
            setCurrentUser(res.data);
            // שמירה בלוקל סטורג' ללא תאריך תפוגה
            localStorage.setItem('currentUser', JSON.stringify(res.data));
            return true;
        } catch (err) {
            console.error('שגיאת הרשמה:', err);
            return false;
        }
    };

    const logoutUser = () => {
        // מחיקת המידע מהלוקל סטורג'
        localStorage.removeItem('currentUser');
        // איפוס הסטייט
        setCurrentUser(null);
    };

    // פונקציה לעדכון המשתמש הנוכחי (שימושי אם יש שינויים בנתוני המשתמש)
    const updateCurrentUser = (userData) => {
        setCurrentUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
    };

    return (
        <UserContext.Provider value={{
            currentUser,
            loading,
            loginUser,
            registerUser,
            logoutUser,
            updateCurrentUser
        }}>
            {children}
        </UserContext.Provider>
    );
};