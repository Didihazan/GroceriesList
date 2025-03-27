import React, { useContext } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { UserProvider, UserContext } from './context/UserContext';
import { GroceryProvider } from './context/GroceryContext';
import Navbar from './components/Navbar';
import GroceryListContent from "./pages/GroceryListContent ";
import LoginRegisterForm from "./pages/LoginRegisterForm";

const MainContent = () => {
    const { currentUser } = useContext(UserContext);
    return (
        <div className="container mx-auto px-4 py-4 md:py-6">
            {currentUser ? (
                <GroceryListContent />
            ) : (
                <div className="max-w-md mx-auto">
                    <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
                        <h1 className="text-2xl font-bold mb-4 text-center">רשימת הקניות החכמה</h1>
                        <p className="text-gray-600 mb-6 text-center">
                            התחבר כדי לנהל את רשימת הקניות שלך בקלות
                        </p>
                        <LoginRegisterForm />
                    </div>
                </div>
            )}
        </div>
    );
};

const App = () => {
    return (
        <UserProvider>
            <GroceryProvider>
                <Router>
                    <div className="min-h-screen bg-gray-50">
                        <Navbar />
                        <MainContent />
                    </div>
                </Router>
            </GroceryProvider>
        </UserProvider>
    );
};

export default App;