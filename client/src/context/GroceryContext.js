import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { UserContext } from './UserContext';

export const GroceryContext = createContext();

export const GroceryProvider = ({ children }) => {
    const [groceryItems, setGroceryItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useContext(UserContext);

    useEffect(() => {
        if (currentUser) {
            fetchGroceryItems();
        } else {
            setGroceryItems([]);
            setLoading(false);
        }
    }, [currentUser]);

    const fetchGroceryItems = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/groceries/user/${currentUser._id}`);
            setGroceryItems(res.data);
        } catch (err) {
            console.error('Error fetching grocery items:', err);
        }
        setLoading(false);
    };

    const addGroceryItem = async (text) => {
        try {
            const res = await axios.post('http://localhost:5000/api/groceries', {
                userId: currentUser._id,
                text
            });
            setGroceryItems([res.data, ...groceryItems]);
            return true;
        } catch (err) {
            return false;
        }
    };

    const toggleItemCompletion = async (id) => {
        try {
            const res = await axios.patch(`http://localhost:5000/api/groceries/${id}`);
            setGroceryItems(
                groceryItems.map(item =>
                    item._id === id ? { ...item, completed: res.data.completed } : item
                )
            );
            return true;
        } catch (err) {
            return false;
        }
    };

    const deleteItem = async (id) => {
        try {
            console.log(`מנסה למחוק פריט עם ID: ${id}`);
            await axios.delete(`http://localhost:5000/api/groceries/${id}`);

            // עדכון ה-state באופן מיידי לאחר מחיקה מוצלחת
            setGroceryItems(prevItems => prevItems.filter(item => item._id !== id));

            console.log(`פריט ${id} נמחק בהצלחה`);
            return true;
        } catch (err) {
            console.error('שגיאה במחיקת פריט:', err);
            return false;
        }
    };

    // לצורך פיתוח ראשוני - פונקציה המדמה נתונים מהווטסאפ
    const mockWhatsAppData = () => {
        const mockItems = [
            "חלב",
            "לחם",
            "ביצים",
            "גבינה צהובה",
            "עגבניות",
            "מלפפונים"
        ];

        return Promise.all(
            mockItems.map(text => addGroceryItem(text))
        );
    };

    return (
        <GroceryContext.Provider value={{
            groceryItems,
            loading,
            fetchGroceryItems,
            addGroceryItem,
            toggleItemCompletion,
            deleteItem,
            mockWhatsAppData
        }}>
            {children}
        </GroceryContext.Provider>
    );
};