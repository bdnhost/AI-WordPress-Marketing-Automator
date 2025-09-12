import React, { useState } from 'react';
import { WPCredentials } from '../types';
import { KeyIcon, UserIcon, GlobeAltIcon } from './icons';

interface Props {
    onSubmit: (credentials: WPCredentials) => void;
    onCancel: () => void;
}

export const CredentialsForm: React.FC<Props> = ({ onSubmit, onCancel }) => {
    const [url, setUrl] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ url, username, password });
    };

    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-center mb-2 text-gray-200">חיבור אתר WordPress חדש</h2>
            <p className="text-center text-gray-400 mb-6">הזן את פרטי האתר כדי להתחיל בניתוח AI.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="wp-url" className="block text-sm font-medium text-gray-300 mb-1">כתובת אתר WordPress</label>
                    <div className="relative">
                         <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                           <GlobeAltIcon />
                        </div>
                        <input
                            id="wp-url"
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"
                            required
                            className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 pr-10 pl-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="wp-username" className="block text-sm font-medium text-gray-300 mb-1">שם משתמש ב-WordPress</label>
                     <div className="relative">
                         <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                           <UserIcon />
                        </div>
                        <input
                            id="wp-username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="your_username"
                            required
                            className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 pr-10 pl-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="wp-password" className="block text-sm font-medium text-gray-300 mb-1">סיסמת יישום</label>
                    <div className="relative">
                         <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                           <KeyIcon />
                        </div>
                        <input
                            id="wp-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="xxxx xxxx xxxx xxxx"
                            required
                            className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 pr-10 pl-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                     <p className="mt-2 text-xs text-gray-500">
                        ניתן ליצור סיסמה זו בלוח הבקרה של וורדפרס תחת 'משתמשים' &gt; 'פרופיל' &gt; 'סיסמאות יישום'.
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="w-full flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600"
                    >
                        ביטול
                    </button>
                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors duration-200"
                    >
                        נתח וחבר את האתר
                    </button>
                </div>
            </form>
        </div>
    );
};