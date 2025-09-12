import React from 'react';
import { Site } from '../types';
import { PlusIcon, TrashIcon, GlobeAltIcon } from './icons';

interface Props {
    sites: Site[];
    onSelectSite: (siteId: string) => void;
    onDeleteSite: (siteId: string) => void;
    onAddNew: () => void;
    isAddingSite: boolean;
    children: React.ReactNode; // For rendering CredentialsForm
}

export const SiteManager: React.FC<Props> = ({ sites, onSelectSite, onDeleteSite, onAddNew, isAddingSite, children }) => {

    if (isAddingSite) {
        return <>{children}</>;
    }
    
    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-200">בחר אתר לניהול</h2>
            <div className="space-y-3 mb-6">
                {sites.length > 0 ? sites.map(site => (
                    <div key={site.id} className="bg-gray-700/50 p-3 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <GlobeAltIcon/>
                            <span className="font-medium">{site.credentials.url}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => onSelectSite(site.id)}
                                className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                            >
                                בחר
                            </button>
                             <button 
                                onClick={() => onDeleteSite(site.id)}
                                className="p-2 text-gray-400 hover:text-red-400 rounded-md transition-colors"
                                aria-label={`מחק אתר ${site.credentials.url}`}
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    </div>
                )) : (
                    <p className="text-center text-gray-500">עדיין לא הוספת אתרים. לחץ למטה כדי להתחיל.</p>
                )}
            </div>
             <button
                onClick={onAddNew}
                className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-dashed border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-700 hover:border-indigo-500 transition-colors"
            >
                <PlusIcon />
                הוסף אתר חדש
            </button>
        </div>
    );
};