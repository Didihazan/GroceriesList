import React, { useState, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { UserPlus, LogIn, Phone, User } from 'lucide-react';

const LoginRegisterForm = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const { loginUser, registerUser } = useContext(UserContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (isLogin) {
            const success = await loginUser(phone);
            if (!success) {
                setError('מספר הטלפון לא נמצא. אנא הירשם קודם.');
            }
        } else {
            if (!name.trim()) {
                setError('אנא הזן שם');
                return;
            }

            const success = await registerUser({ phone, name });
            if (!success) {
                setError('הרשמה נכשלה. ייתכן שמספר הטלפון כבר קיים.');
            }
        }
    };

    return (
        <div>
            <div className="flex mb-6 rounded-md overflow-hidden">
                <button
                    className={`flex-1 py-3 transition-colors duration-200 flex items-center justify-center ${isLogin ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                    onClick={() => setIsLogin(true)}
                >
                    <LogIn className="mr-2" size={18} />
                    התחברות
                </button>
                <button
                    className={`flex-1 py-3 transition-colors duration-200 flex items-center justify-center ${!isLogin ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                    onClick={() => setIsLogin(false)}
                >
                    <UserPlus className="mr-2" size={18} />
                    הרשמה
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block mb-2 text-gray-700">מספר טלפון</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="הזן מספר טלפון"
                            required
                        />
                    </div>
                </div>

                {!isLogin && (
                    <div className="mb-4">
                        <label className="block mb-2 text-gray-700">שם</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="הזן את שמך"
                            />
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center justify-center"
                >
                    {isLogin ? 'התחבר' : 'הירשם'}
                </button>
            </form>
        </div>
    );
};
export default LoginRegisterForm;