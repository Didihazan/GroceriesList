import React, { useState, useContext } from 'react';
import { GroceryContext } from '../../context/GroceryContext';
import { Plus } from 'lucide-react';

const GroceryForm = () => {
    const { addGroceryItem } = useContext(GroceryContext);
    const [newItem, setNewItem] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newItem.trim()) {
            await addGroceryItem(newItem);
            setNewItem('');
        }
    };

    return (
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
                    <Plus size={20}/>
                    <span className="hidden sm:inline ml-1">הוסף</span>
                </button>
            </div>
        </form>
    );
};

export default GroceryForm;