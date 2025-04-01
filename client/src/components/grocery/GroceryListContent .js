import React, { useState } from 'react';
import { useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { GroceryContext } from '../../context/GroceryContext';
import { ShoppingCart } from 'lucide-react';
import WhatsAppConnection from './WhatsAppConnection';
import GroceryForm from './GroceryForm';
import GroceryItems from './GroceryItems';

const GroceryListContent = () => {
    const { currentUser } = useContext(UserContext);
    const { groceryItems, loading, fetchGroceryItems } = useContext(GroceryContext);
    const [recentWhatsAppItems, setRecentWhatsAppItems] = useState([]);

    const handleWhatsAppItemsUpdate = (items) => {
        setRecentWhatsAppItems(prev => [...items, ...prev].slice(0, 5));
    };

    if (loading) {
        return (
            <div className="text-center py-8 rtl">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">טוען רשימת קניות...</p>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto rtl">
            <div className="bg-white p-6 rounded-lg shadow-lg mb-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold">רשימת הקניות שלי</h1>
                    <span className="text-gray-500 text-sm flex items-center">
                        <ShoppingCart size={16} className="ml-1" />
                        {groceryItems.length} פריטים
                    </span>
                </div>

                <WhatsAppConnection
                    currentUser={currentUser}
                    onItemsUpdate={handleWhatsAppItemsUpdate}
                    recentItems={recentWhatsAppItems}
                    fetchGroceryItems={fetchGroceryItems}
                />

                <GroceryForm />

                <GroceryItems />
            </div>
        </div>
    );
};

export default GroceryListContent;