import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { SiteManager } from './components/SiteManager';
import { CredentialsForm } from './components/CredentialsForm';
import { PillarTopicsDisplay } from './components/PillarTopicsDisplay';
import { ControlPanel } from './components/ControlPanel';
import { GeneratedPostCard } from './components/GeneratedPostCard';
import { Spinner } from './components/Spinner';
import { Site, WPCredentials, PillarTopic, GeneratedPost, AppState, SchedulingFrequency } from './types';
import * as wordpressService from './services/wordpressService';
import * as geminiService from './services/geminiService';
import { LogoIcon, ArrowRightIcon } from './components/icons';

const App: React.FC = () => {
    const [sites, setSites] = useState<Site[]>(() => {
        try {
            const savedSites = localStorage.getItem('wpAutomatorSites');
            return savedSites ? JSON.parse(savedSites) : [];
        } catch (error) {
            console.error("Failed to load sites from localStorage", error);
            return [];
        }
    });
    const [activeSiteId, setActiveSiteId] = useState<string | null>(null);
    const [appState, setAppState] = useState<AppState>(AppState.SiteSelection);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddingSite, setIsAddingSite] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scheduling, setScheduling] = useState<SchedulingFrequency>(SchedulingFrequency.OnClick);
    
    const activeSite = useMemo(() => sites.find(s => s.id === activeSiteId), [sites, activeSiteId]);

    useEffect(() => {
        try {
            localStorage.setItem('wpAutomatorSites', JSON.stringify(sites));
        } catch (error) {
            console.error("Failed to save sites to localStorage", error);
        }
    }, [sites]);
    
    const updateSite = (siteId: string, updates: Partial<Site>) => {
        setSites(prevSites => prevSites.map(site => site.id === siteId ? { ...site, ...updates } : site));
    };

    const updatePostInSite = (siteId: string, postTitle: string, updates: Partial<GeneratedPost>) => {
        const site = sites.find(s => s.id === siteId);
        if (!site) return;
        const updatedPosts = site.generatedPosts.map(p => p.title === postTitle ? { ...p, ...updates } : p);
        updateSite(siteId, { generatedPosts: updatedPosts });
    };

    const handleAddSite = async (creds: WPCredentials) => {
        if (sites.some(s => s.id === creds.url)) {
            setError('אתר עם כתובת זו כבר קיים.');
            return;
        }
        setIsLoading(true);
        setAppState(AppState.Connecting);
        setError(null);

        try {
            const posts = await wordpressService.fetchPosts(creds);
            const topics = await geminiService.identifyPillarTopics(posts);
            const newSite: Site = {
                id: creds.url,
                credentials: creds,
                wpPosts: posts,
                pillarTopics: topics,
                generatedPosts: []
            };
            setSites(prev => [...prev, newSite]);
            setActiveSiteId(newSite.id);
            setAppState(AppState.Dashboard);
            setIsAddingSite(false);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'אירעה שגיאה לא ידועה.');
            setAppState(AppState.Error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSelectSite = (siteId: string) => {
        setActiveSiteId(siteId);
        setAppState(AppState.Dashboard);
        setError(null);
    };
    
    const handleDeleteSite = (siteId: string) => {
        setSites(sites.filter(s => s.id !== siteId));
    };
    
    const handleBackToManager = () => {
        setActiveSiteId(null);
        setAppState(AppState.SiteSelection);
        setIsAddingSite(false);
        setError(null);
    };

    const handleGeneratePosts = useCallback(async (count: number = 3) => {
        if (!activeSite) return;

        setIsLoading(true);
        setError(null);

        try {
            const existingTitles = [...activeSite.wpPosts.map(p => p.title.rendered), ...activeSite.generatedPosts.map(p => p.title)];
            const newPostsPromises = Array.from({ length: count }, () => 
                geminiService.generatePostIdea(activeSite.pillarTopics, existingTitles)
            );
            const newPosts = await Promise.all(newPostsPromises);
            const newGeneratedPosts: GeneratedPost[] = newPosts.map(p => ({ ...p, publishStatus: 'draft', imageGenStatus: 'idle' }));
            updateSite(activeSite.id, { generatedPosts: [...activeSite.generatedPosts, ...newGeneratedPosts] });
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'נכשל ביצירת פוסטים חדשים.');
            setAppState(AppState.Error);
        } finally {
            setIsLoading(false);
        }
    }, [activeSite, sites]);

    const handleGenerateImage = useCallback(async (postToUpdate: GeneratedPost) => {
        if (!activeSite) return;
        
        updatePostInSite(activeSite.id, postToUpdate.title, { imageGenStatus: 'generating' });

        try {
            const base64Image = await geminiService.generateImage(postToUpdate.imageSuggestion.concept);
            const imageUrl = `data:image/jpeg;base64,${base64Image}`;
            updatePostInSite(activeSite.id, postToUpdate.title, { imageUrl, imageGenStatus: 'done' });
        } catch (err) {
            console.error(err);
            updatePostInSite(activeSite.id, postToUpdate.title, { imageGenStatus: 'error', errorMessage: 'נכשל ביצירת התמונה.' });
        }
    }, [activeSite, sites]);


    const handlePublishPost = useCallback(async (postToPublish: GeneratedPost) => {
        if (!activeSite) return;

        updatePostInSite(activeSite.id, postToPublish.title, { publishStatus: 'generating_content', errorMessage: undefined });
        
        try {
            // Step 1: Generate full content
            const fullContent = await geminiService.generateFullPostContent(postToPublish);
            updatePostInSite(activeSite.id, postToPublish.title, { fullContent, publishStatus: 'publishing' });

            // Step 2: Upload image (if exists) to get media ID
            let mediaId: number | undefined = undefined;
            if (postToPublish.imageUrl) {
                const mediaItem = await wordpressService.uploadImage(
                    activeSite.credentials,
                    postToPublish.imageUrl,
                    postToPublish.title,
                    postToPublish.imageSuggestion.altText
                );
                mediaId = mediaItem.id;
            }

            // Step 3: Create post with full content and featured media ID in one go
            await wordpressService.createPost(
                activeSite.credentials,
                postToPublish,
                fullContent,
                mediaId
            );

            updatePostInSite(activeSite.id, postToPublish.title, { publishStatus: 'published' });

        } catch (err) {
            console.error(err);
            const errorMessage = `שגיאה בפרסום: "${postToPublish.title}". ` + (err instanceof Error ? err.message : '');
            updatePostInSite(activeSite.id, postToPublish.title, { publishStatus: 'error', errorMessage });
        }
    }, [activeSite, sites]);


    const renderContent = () => {
        if (appState === AppState.Connecting || (isLoading && !activeSite)) {
             return <div className="text-center"><Spinner /> <p className="mt-4 text-lg">מתחבר ומנתח את האתר שלך...</p></div>;
        }

        if (appState === AppState.SiteSelection || !activeSite) {
            return (
                 <SiteManager 
                    sites={sites} 
                    onSelectSite={handleSelectSite}
                    onDeleteSite={handleDeleteSite}
                    onAddNew={() => setIsAddingSite(true)}
                    isAddingSite={isAddingSite}
                 >
                    <CredentialsForm onSubmit={handleAddSite} onCancel={() => setIsAddingSite(false)} />
                </SiteManager>
            );
        }
        
        // Dashboard view
        return (
            <div className="space-y-8">
                <PillarTopicsDisplay topics={activeSite.pillarTopics} />
                <ControlPanel 
                    onGenerate={() => handleGeneratePosts(3)}
                    isLoading={isLoading}
                    generatedPosts={activeSite.generatedPosts}
                    scheduling={scheduling}
                    setScheduling={setScheduling}
                />
                {activeSite.generatedPosts.length > 0 && (
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-gray-200 border-b border-gray-700 pb-2">פוסטים שנוצרו</h3>
                        {activeSite.generatedPosts.map((post, index) => (
                            <GeneratedPostCard 
                                key={`${post.title}-${index}`} 
                                post={post} 
                                onPublish={handlePublishPost} 
                                onGenerateImage={handleGenerateImage}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                <header className="text-center mb-8">
                    <div className="flex items-center justify-center gap-4">
                        <LogoIcon />
                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
                            מערכת אוטומציה שיווקית לוורדפרס
                        </h1>
                    </div>
                    <p className="mt-2 text-gray-400">הפכו את אסטרטגיית התוכן שלכם לאוטומטית בעזרת Gemini AI.</p>
                </header>

                {(appState === AppState.Error || error) && (
                    <div className="bg-red-900 border border-red-600 text-red-100 px-4 py-3 rounded-lg relative mb-6" role="alert">
                        <strong className="font-bold">שגיאה: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                
                {activeSite && (
                     <div className="mb-6 flex justify-between items-center bg-gray-800 p-3 rounded-lg shadow-lg">
                        <div>
                            <span className="text-sm text-gray-400">אתר פעיל: </span>
                            <span className="font-bold text-indigo-400">{activeSite.credentials.url}</span>
                        </div>
                        <button
                            onClick={handleBackToManager}
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                           החלף אתר <ArrowRightIcon />
                        </button>
                    </div>
                )}

                <main className="bg-gray-800 shadow-2xl rounded-lg p-6">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default App;