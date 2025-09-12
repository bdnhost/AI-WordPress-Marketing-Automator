import React from 'react';
import { GeneratedPost, SchedulingFrequency } from '../types';
import { Spinner } from './Spinner';
import { PlusIcon, DownloadIcon, CalendarIcon } from './icons';

interface Props {
    onGenerate: () => void;
    isLoading: boolean;
    generatedPosts: GeneratedPost[];
    scheduling: SchedulingFrequency;
    setScheduling: (freq: SchedulingFrequency) => void;
}

export const ControlPanel: React.FC<Props> = ({ onGenerate, isLoading, generatedPosts, scheduling, setScheduling }) => {
    
    const handleDownloadJson = () => {
        const dataStr = JSON.stringify(generatedPosts, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'generated_posts.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };
    
    return (
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-wrap items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-4">
                <button
                    onClick={onGenerate}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
                >
                    {isLoading ? <Spinner small /> : <PlusIcon />}
                    {isLoading ? 'יוצר...' : 'צור פוסטים חדשים'}
                </button>
                {generatedPosts.length > 0 && (
                    <button 
                        onClick={handleDownloadJson}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors duration-200"
                    >
                        <DownloadIcon />
                        הורד JSON
                    </button>
                )}
            </div>
            <div className="flex items-center gap-2">
                <CalendarIcon />
                <label htmlFor="scheduling" className="text-sm font-medium text-gray-300">תזמון פרסום:</label>
                <select 
                    id="scheduling"
                    value={scheduling}
                    onChange={(e) => setScheduling(e.target.value as SchedulingFrequency)}
                    className="bg-gray-700 border border-gray-600 rounded-md shadow-sm py-1.5 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value={SchedulingFrequency.OnClick}>לפי לחיצה</option>
                    <option value={SchedulingFrequency.Daily}>יומי</option>
                    <option value={SchedulingFrequency.Weekly}>שבועי</option>
                </select>
            </div>
        </div>
    );
};