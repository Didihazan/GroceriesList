import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            try {
                setCurrentUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('שגיאה בטעינת משתמש מהאחסון המקומי:', error);
                localStorage.removeItem('currentUser');
            }
        }
        setLoading(false);
    }, []);

    const loginUser = async (phone) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/users/${phone}`);
            setCurrentUser(res.data);
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
            localStorage.setItem('currentUser', JSON.stringify(res.data));
            return true;
        } catch (err) {
            console.error('שגיאת הרשמה:', err);
            return false;
        }
    };

    const logoutUser = () => {
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
    };

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