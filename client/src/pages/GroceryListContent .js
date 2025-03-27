import React, { useState, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { GroceryContext } from '../context/GroceryContext';
import { Check, Trash2, Plus, Database, ShoppingCart } from 'lucide-react';

const GroceryListContent = () => {
    const { currentUser } = useContext(UserContext);
    const {
        groceryItems,
        loading,
        addGroceryItem,
        toggleItemCompletion,
        deleteItem,
        mockWhatsAppData
    } = useContext(GroceryContext);
    const [newItem, setNewItem] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newItem.trim()) {
            await addGroceryItem(newItem);
            setNewItem('');
        }
    };

    const handleDeleteItem = async (id) => {
        try {
            console.log(`לחיצה על מחיקת פריט: ${id}`);
            const success = await deleteItem(id);

            if (!success) {
                console.error(`בעיה במחיקת פריט ${id}`);
            }
        } catch (error) {
            console.error('שגיאה בטיפול במחיקת פריט:', error);
        }
    };

    const handleLoadMockData = async () => {
        await mockWhatsAppData();
    };

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">טוען רשימת קניות...</p>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-lg mb-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold">רשימת הקניות שלי</h1>
                    <span className="text-gray-500 text-sm flex items-center">
            <ShoppingCart size={16} className="ml-1" />
                        {groceryItems.length} פריטים
          </span>
                </div>

                <form onSubmit={handleSubmit} className="mb-4">
                    <div className="flex">
                        <input
                            type="text"
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            className="flex-1 p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="הוסף פריט חדש לרשימה"
                        />
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded-l-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
                        >
                            <Plus size={20} />
                            <span className="hidden sm:inline ml-1">הוסף</span>
                        </button>
                    </div>
                </form>

                {groceryItems.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 mb-4">הרשימה שלך ריקה</p>
                        <button
                            onClick={handleLoadMockData}
                            className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors duration-200 flex items-center mx-auto"
                        >
                            <Database className="mr-2" size={18} />
                            טען נתוני דוגמה
                        </button>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100 -mx-6">
                        {groceryItems.map(item => (
                            <li
                                key={item._id}
                                className="p-4 flex items-center justify-between hover:bg-blue-50 transition-colors duration-150"
                            >
                                <div className="flex items-center">
                                    <button
                                        onClick={() => toggleItemCompletion(item._id)}
                                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors duration-200 ${
                                            item.completed ? 'bg-green-500 border-green-500' : 'border-gray-400'
                                        }`}
                                    >
                                        {item.completed && <Check size={16} className="text-white" />}
                                    </button>
                                    <span className={`mr-3 ${item.completed ? 'line-through text-gray-500' : ''}`}>
        {item.text}
      </span>
                                </div>
                                <button
                                    onClick={() => handleDeleteItem(item._id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-2"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default GroceryListContent;