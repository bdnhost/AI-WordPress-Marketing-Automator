export interface WPCredentials {
    url: string;
    username: string;
    password: string; // This is the Application Password
}

export interface WordPressPost {
    id: number;
    title: { rendered: string };
    content: { rendered: string };
    excerpt: { rendered: string };
    categories: number[];
    tags: number[];
}

export interface PillarTopic {
    topic: string;
    description: string;
}

export interface GeneratedPost {
    title: string;
    openingParagraph: string;
    structure: string[];
    keywords: string[];
    imageSuggestion: {
        altText: string;
        concept: string;
    };
    fullContent?: string; // Will hold the complete generated content
    publishStatus: 'draft' | 'generating_content' | 'publishing' | 'published' | 'error';
    imageGenStatus: 'idle' | 'generating' | 'done' | 'error';
    imageUrl?: string; // base64 data string
    featuredMediaId?: number;
    errorMessage?: string;
}

export interface Site {
    id: string; // The URL of the site, used as a unique identifier
    credentials: WPCredentials;
    wpPosts: WordPressPost[];
    pillarTopics: PillarTopic[];
    generatedPosts: GeneratedPost[];
}

export enum AppState {
    SiteSelection,
    Connecting, // Form submitted, fetching initial data
    Dashboard,
    Error
}

export enum SchedulingFrequency {
    OnClick = "on-click",
    Daily = "daily",
    Weekly = "weekly",
}