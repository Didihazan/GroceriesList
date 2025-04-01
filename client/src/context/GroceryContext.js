import React, { createContext, useState, useContext, useEffect } from 'react';
import { UserContext } from './UserContext';
import {apiService} from "../components/services/apiServices";

// יצירת שירות ייעודי לפריטי קניות
const groceryService = {
    getItems: (userId) => apiService.get(`/api/groceries/user/${userId}`),
    addItem: (userId, text) => apiService.post('/api/groceries', { userId, text }),
    toggleCompletion: (itemId) => apiService.patch(`/api/groceries/${itemId}`),
    deleteItem: (itemId) => apiService.delete(`/api/groceries/${itemId}`)
};

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
            const response = await groceryService.getItems(currentUser._id);

            if (response.error) {
                throw new Error(response.error);
            }

            setGroceryItems(response.data);
        } catch (err) {
            console.error('Error fetching grocery items:', err);
        }
        setLoading(false);
    };

    const addGroceryItem = async (text) => {
        try {
            const response = await groceryService.addItem(currentUser._id, text);

            if (response.error) {
                throw new Error(response.error);
            }

            setGroceryItems([response.data, ...groceryItems]);
            return true;
        } catch (err) {
            console.error('Error adding grocery item:', err);
            return false;
        }
    };

    const toggleItemCompletion = async (id) => {
        try {
            const response = await groceryService.toggleCompletion(id);

            if (response.error) {
                throw new Error(response.error);
            }

            setGroceryItems(
                groceryItems.map(item =>
                    item._id === id ? { ...item, completed: response.data.completed } : item
                )
            );
            return true;
        } catch (err) {
            console.error('שגיאה בעדכון סטטוס פריט:', err);
            return false;
        }
    };

    const deleteItem = async (id) => {
        try {
            const response = await groceryService.deleteItem(id);

            if (response.error) {
                throw new Error(response.error);
            }

            setGroceryItems(prevItems => prevItems.filter(item => item._id !== id));
            return true;
        } catch (err) {
            console.error('שגיאה במחיקת פריט:', err);
            return false;
        }
    };

    return (
        <GroceryContext.Provider value={{
            groceryItems,
            loading,
            fetchGroceryItems,
            addGroceryItem,
            toggleItemCompletion,
            deleteItem,
        }}>
            {children}
        </GroceryContext.Provider>
    );
};