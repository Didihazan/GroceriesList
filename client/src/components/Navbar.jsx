import React, { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { LogOut, ShoppingCart, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
    const { currentUser, logoutUser } = useContext(UserContext);
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => setMenuOpen(!menuOpen);

    return (
        <nav className="bg-blue-600 text-white shadow-md sticky top-0 z-10">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* לוגו */}
                    <div className="flex items-center">
                        <ShoppingCart className="mr-2" />
                        <span className="text-xl font-bold">רשימת קניות חכמה</span>
                    </div>

                    {/* תפריט מובייל */}
                    <div className="block md:hidden">
                        <button
                            onClick={toggleMenu}
                            className="flex items-center p-2"
                        >
                            {menuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>

                    {/* תפריט רגיל */}
                    <div className="hidden md:block">
                        {currentUser && (
                            <div className="flex items-center space-x-4">
                                <span className="ml-4">שלום {currentUser.name}</span>
                                <button
                                    onClick={logoutUser}
                                    className="flex items-center bg-blue-700 px-3 py-2 rounded-md hover:bg-blue-800 transition-colors duration-200"
                                >
                                    <LogOut className="ml-1" size={18} />
                                    התנתק
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* תפריט מובייל פתוח */}
                {menuOpen && currentUser && (
                    <div className="md:hidden pb-4 border-t border-blue-500 pt-2">
                        <div className="flex flex-col space-y-3">
                            <span>שלום {currentUser.name}</span>
                            <button
                                onClick={logoutUser}
                                className="flex items-center bg-blue-700 px-3 py-2 rounded-md hover:bg-blue-800 transition-colors duration-200 justify-center"
                            >
                                <LogOut className="ml-1" size={18} />
                                התנתק
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;