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

// ============================================================================
// Phase 2: Advanced Features Types
// ============================================================================

// Brand Voice Engine
export interface BrandVoice {
    id: string;
    name: string;
    tone: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'playful';
    vocabulary: string[]; // Preferred words
    avoidWords: string[]; // Words to avoid
    writingStyle: {
        sentenceLength: 'short' | 'medium' | 'long' | 'varied';
        paragraphLength: 'concise' | 'medium' | 'detailed';
        useEmojis: boolean;
        useHumor: boolean;
    };
    examples: string[]; // Example paragraphs in this voice
}

export interface ContentGenerationOptions {
    brandVoice?: BrandVoice;
    tone: BrandVoice['tone'];
    length: 'short' | 'medium' | 'long' | 'comprehensive';
    style: 'tutorial' | 'listicle' | 'review' | 'guide' | 'news' | 'story';
    targetAudience?: string;
    focusKeywords: string[];
    semanticKeywords?: string[];
    includeImages: boolean;
    imageCount?: number;
}

// SEO Analysis
export interface KeywordAnalysis {
    keyword: string;
    density: number; // percentage
    prominence: number; // 0-100
    distribution: 'good' | 'fair' | 'poor';
    inTitle: boolean;
    inHeadings: number;
    inFirstParagraph: boolean;
}

export interface ReadabilityScore {
    score: number; // 0-100
    grade: string; // e.g., "כיתה ח'"
    avgSentenceLength: number;
    avgWordLength: number;
    complexWords: number;
    suggestions: string[];
}

export interface MetaAnalysis {
    titleLength: number;
    titleOptimal: boolean;
    descriptionLength: number;
    descriptionOptimal: boolean;
    hasH1: boolean;
    headingsStructure: string[]; // H1, H2, H3, etc.
}

export interface SEOSuggestion {
    type: 'critical' | 'warning' | 'info';
    message: string;
    fix?: string;
}

export interface SEOAnalysis {
    score: number; // 0-100
    keywords: KeywordAnalysis[];
    readability: ReadabilityScore;
    meta: MetaAnalysis;
    suggestions: SEOSuggestion[];
    lastAnalyzed: Date;
}

// Content Calendar
export interface CalendarEvent {
    id: string;
    title: string;
    date: Date;
    status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
    post: GeneratedPost;
    siteId: string;
    recurrence?: RecurrenceRule;
    color?: string;
    notes?: string;
}

export interface RecurrenceRule {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number; // e.g., every 2 days
    endDate?: Date;
    count?: number; // number of occurrences
    byDay?: number[]; // for weekly: 0-6 (Sunday-Saturday)
    byMonthDay?: number[]; // for monthly: 1-31
}

export interface CalendarFilter {
    status?: CalendarEvent['status'][];
    siteId?: string[];
    dateRange?: {
        start: Date;
        end: Date;
    };
}

// Analytics
export interface PerformanceMetrics {
    views: number;
    uniqueVisitors: number;
    avgTimeOnPage: number; // seconds
    bounceRate: number; // percentage
    conversions: number;
    conversionRate: number; // percentage
}

export interface EngagementMetrics {
    likes: number;
    shares: number;
    comments: number;
    backlinks: number;
    socialMentions: number;
}

export interface SEOMetrics {
    organicTraffic: number;
    avgPosition: number;
    clickThroughRate: number; // percentage
    impressions: number;
    topKeywords: Array<{
        keyword: string;
        position: number;
        clicks: number;
        impressions: number;
    }>;
}

export interface ROIMetrics {
    totalPosts: number;
    timeSaved: number; // hours
    estimatedValue: number; // currency
    costPerPost: number;
    roi: number; // percentage
}

export interface PostAnalytics {
    postId: string;
    postTitle: string;
    publishedDate: Date;
    performance: PerformanceMetrics;
    engagement: EngagementMetrics;
    seo: SEOMetrics;
}

export interface SiteAnalytics {
    siteId: string;
    period: 'day' | 'week' | 'month' | 'year';
    dateRange: {
        start: Date;
        end: Date;
    };
    overview: {
        totalViews: number;
        totalPosts: number;
        avgEngagement: number;
        topPerformingPosts: PostAnalytics[];
    };
    trends: Array<{
        date: Date;
        views: number;
        engagement: number;
    }>;
}

// Team & Collaboration (Phase 4)
export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'admin' | 'editor' | 'viewer';
    avatar?: string;
    joinedAt: Date;
}

export interface Permission {
    resource: 'sites' | 'posts' | 'analytics' | 'team' | 'settings';
    action: 'read' | 'write' | 'delete' | 'share';
}

export interface Role {
    id: string;
    name: string;
    permissions: Permission[];
}

export interface Comment {
    id: string;
    postId: string;
    userId: string;
    content: string;
    createdAt: Date;
    resolved: boolean;
}

export interface ApprovalWorkflow {
    id: string;
    name: string;
    steps: Array<{
        role: string;
        action: 'review' | 'approve' | 'publish';
        required: boolean;
    }>;
    enabled: boolean;
}

// Workflow Automation (Phase 4)
export interface WorkflowTrigger {
    type: 'schedule' | 'event' | 'manual';
    config: {
        schedule?: string; // cron expression
        event?: string; // event name
    };
}

export interface WorkflowAction {
    type: 'generate' | 'publish' | 'notify' | 'webhook';
    config: Record<string, unknown>;
}

export interface WorkflowCondition {
    field: string;
    operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
    value: unknown;
}

export interface Workflow {
    id: string;
    name: string;
    description?: string;
    enabled: boolean;
    triggers: WorkflowTrigger[];
    conditions: WorkflowCondition[];
    actions: WorkflowAction[];
    createdAt: Date;
    updatedAt: Date;
}