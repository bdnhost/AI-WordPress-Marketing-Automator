import React from 'react';
import { GeneratedPost } from '../types';
import { Spinner } from './Spinner';
import { DocumentTextIcon, TagIcon, PhotographIcon, CheckCircleIcon, ExclamationCircleIcon, ClockIcon, SparklesIcon } from './icons';

interface Props {
    post: GeneratedPost;
    onPublish: (post: GeneratedPost) => void;
    onGenerateImage: (post: GeneratedPost) => void;
}

const getStatusChip = (status: GeneratedPost['publishStatus']) => {
    switch (status) {
        case 'draft':
            return <span className="text-xs font-medium inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-700 text-gray-300">טיוטה</span>;
        case 'generating_content':
            return <span className="text-xs font-medium inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-900 text-blue-300"><ClockIcon /> <span className="mr-1">יוצר תוכן...</span></span>;
        case 'publishing':
            return <span className="text-xs font-medium inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-900 text-blue-300"><ClockIcon /> <span className="mr-1">מפרסם...</span></span>;
        case 'published':
            return <span className="text-xs font-medium inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-900 text-green-300"><CheckCircleIcon /> <span className="mr-1">פורסם</span></span>;
        case 'error':
            return <span className="text-xs font-medium inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-900 text-red-300"><ExclamationCircleIcon /> <span className="mr-1">שגיאה</span></span>;
    }
};

export const GeneratedPostCard: React.FC<Props> = ({ post, onPublish, onGenerateImage }) => {
    const isPublishing = post.publishStatus === 'publishing' || post.publishStatus === 'generating_content';
    const canPublish = post.publishStatus === 'draft' || post.publishStatus === 'error';

    const getButtonText = () => {
        if (post.publishStatus === 'generating_content') return 'יוצר תוכן...';
        if (post.publishStatus === 'publishing') return 'מפרסם...';
        if (post.publishStatus === 'error') return 'נסה לפרסם שוב';
        return 'פרסם לוורדפרס';
    };

    return (
        <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-5 shadow-md animate-fade-in-up">
            <div className="flex justify-between items-start mb-4">
                <h4 className="text-xl font-bold text-gray-100">{post.title}</h4>
                {getStatusChip(post.publishStatus)}
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-grow space-y-4">
                    <p className="text-gray-400 italic">"{post.openingParagraph}"</p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                            <h5 className="font-semibold text-gray-300 flex items-center gap-2"><DocumentTextIcon /> מבנה</h5>
                            <ul className="list-disc list-inside pr-4 text-gray-400 space-y-1">
                                {post.structure.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h5 className="font-semibold text-gray-300 flex items-center gap-2"><TagIcon /> מילות מפתח</h5>
                            <div className="flex flex-wrap gap-2">
                                {post.keywords.map((kw, i) => (
                                    <span key={i} className="px-2 py-1 bg-gray-600 text-gray-300 rounded-md text-xs">{kw}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:w-1/3 flex-shrink-0">
                     <h5 className="font-semibold text-gray-300 flex items-center gap-2 mb-2"><PhotographIcon /> תמונה לפוסט</h5>
                    <div className="aspect-video bg-gray-800 rounded-md flex items-center justify-center relative overflow-hidden">
                        {post.imageGenStatus === 'generating' && <Spinner />}
                        {post.imageGenStatus === 'done' && post.imageUrl && <img src={post.imageUrl} alt={post.imageSuggestion.altText} className="w-full h-full object-cover" />}
                        {post.imageGenStatus === 'idle' && (
                             <button onClick={() => onGenerateImage(post)} className="flex flex-col items-center justify-center text-gray-400 hover:text-white transition-colors">
                                <SparklesIcon />
                                <span className="text-sm mt-1">צור תמונה עם AI</span>
                            </button>
                        )}
                         {post.imageGenStatus === 'error' && (
                             <button onClick={() => onGenerateImage(post)} className="flex flex-col items-center justify-center text-red-400 hover:text-red-300 transition-colors p-2">
                                <ExclamationCircleIcon />
                                <span className="text-sm mt-1 text-center">שגיאה ביצירת תמונה<br/>(לחץ לניסיון חוזר)</span>
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2"><strong className="text-gray-300">קונספט:</strong> {post.imageSuggestion.concept}</p>
                    <p className="text-xs text-gray-400"><strong className="text-gray-300">טקסט חלופי:</strong> {post.imageSuggestion.altText}</p>
                </div>
            </div>
            
            {post.errorMessage && (
                <p className="mt-4 text-sm text-red-400 bg-red-900/50 p-2 rounded-md">{post.errorMessage}</p>
            )}

            <div className="mt-5 text-left">
                <button
                    onClick={() => onPublish(post)}
                    disabled={!canPublish || isPublishing}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
                >
                    {isPublishing ? <Spinner small /> : null}
                    <span className="mx-2">{getButtonText()}</span>
                </button>
            </div>
        </div>
    );
};