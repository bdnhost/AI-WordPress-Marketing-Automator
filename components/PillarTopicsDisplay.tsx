import React from 'react';
import { PillarTopic } from '../types';
import { LightBulbIcon } from './icons';

interface Props {
    topics: PillarTopic[];
}

export const PillarTopicsDisplay: React.FC<Props> = ({ topics }) => {
    if (!topics || topics.length === 0) {
        return (
            <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 text-center">
                <h3 className="text-xl font-bold text-gray-400">לא זוהו נושאי ליבה</h3>
                <p className="text-gray-500 mt-2">המערכת לא מצאה מספיק תוכן כדי לזהות נושאי ליבה באופן אוטומטי.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 animate-fade-in">
            <h3 className="text-2xl font-bold text-gray-200 mb-4 flex items-center gap-2">
                <LightBulbIcon />
                נושאי ליבה שזוהו על ידי AI
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topics.map((topic, index) => (
                    <div key={index} className="bg-gray-700 p-4 rounded-md shadow-lg">
                        <h4 className="font-semibold text-indigo-400">{topic.topic}</h4>
                        <p className="text-sm text-gray-400 mt-1">{topic.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};