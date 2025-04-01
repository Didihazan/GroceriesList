import React, { useContext } from 'react';
import { GroceryContext } from '../../context/GroceryContext';
import { Check, Trash2 } from 'lucide-react';

const GroceryItems = () => {
    const { groceryItems, toggleItemCompletion, deleteItem } = useContext(GroceryContext);

    const handleDeleteItem = async (id) => {
        await deleteItem(id);
    };

    if (groceryItems.length === 0) {
        return (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-4">הרשימה שלך ריקה</p>
            </div>
        );
    }

    return (
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
                            {item.completed && <Check size={16} className="text-white"/>}
                        </button>
                        <span className={`mr-3 ${item.completed ? 'line-through text-gray-500' : ''}`}>
                            {item.text}
                        </span>
                    </div>
                    <button
                        onClick={() => handleDeleteItem(item._id)}
                        className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-2"
                    >
                        <Trash2 size={18}/>
                    </button>
                </li>
            ))}
        </ul>
    );
};

export default GroceryItems;