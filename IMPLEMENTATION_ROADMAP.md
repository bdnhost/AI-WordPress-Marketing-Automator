# 🗺️ Implementation Roadmap - Step by Step

**Project:** AI WordPress Marketing Automator → Masterpiece
**Timeline:** 10 Weeks
**Start Date:** November 10, 2025

---

## 📋 Phase 1: Foundation & Critical Fixes (Weeks 1-2)

### Week 1: Project Infrastructure

#### Day 1-2: Development Environment Setup

**1.1 Package Management & Dependencies**
```bash
# Install core dependencies
npm install zustand @tanstack/react-query immer
npm install zod date-fns crypto-js dompurify
npm install @radix-ui/react-dropdown-menu @radix-ui/react-dialog
npm install @radix-ui/react-select @radix-ui/react-tabs
npm install framer-motion recharts
npm install lucide-react # Better icons

# Install dev dependencies
npm install -D vitest @vitest/ui jsdom @testing-library/react
npm install -D @testing-library/user-event @testing-library/jest-dom
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier eslint-plugin-react-hooks
npm install -D husky lint-staged
npm install -D @playwright/test
npm install -D vite-plugin-pwa workbox-window
```

**1.2 ESLint Configuration**
```javascript
// .eslintrc.cjs
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
  },
}
```

**1.3 Prettier Configuration**
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

**1.4 Husky Pre-commit**
```bash
npx husky init
echo "npx lint-staged" > .husky/pre-commit
```

```json
// package.json addition
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

**1.5 Vitest Configuration**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/']
    }
  }
});
```

#### Day 3-4: State Management Migration

**2.1 Create Zustand Stores**

```typescript
// src/stores/sitesStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Site } from '../types';

interface SitesState {
  sites: Site[];
  activeSiteId: string | null;
  addSite: (site: Site) => void;
  removeSite: (siteId: string) => void;
  updateSite: (siteId: string, updates: Partial<Site>) => void;
  setActiveSite: (siteId: string | null) => void;
}

export const useSitesStore = create<SitesState>()(
  persist(
    immer((set) => ({
      sites: [],
      activeSiteId: null,

      addSite: (site) => set((state) => {
        state.sites.push(site);
      }),

      removeSite: (siteId) => set((state) => {
        state.sites = state.sites.filter(s => s.id !== siteId);
        if (state.activeSiteId === siteId) {
          state.activeSiteId = null;
        }
      }),

      updateSite: (siteId, updates) => set((state) => {
        const site = state.sites.find(s => s.id === siteId);
        if (site) {
          Object.assign(site, updates);
        }
      }),

      setActiveSite: (siteId) => set((state) => {
        state.activeSiteId = siteId;
      }),
    })),
    {
      name: 'wp-automator-sites',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

```typescript
// src/stores/uiStore.ts
import { create } from 'zustand';

interface UIState {
  theme: 'light' | 'dark';
  isLoading: boolean;
  error: string | null;
  setTheme: (theme: 'light' | 'dark') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'dark',
  isLoading: false,
  error: null,
  setTheme: (theme) => set({ theme }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
```

**2.2 TanStack Query Setup**

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (was cacheTime)
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});
```

```typescript
// src/hooks/useWordPressPosts.ts
import { useQuery } from '@tanstack/react-query';
import * as wordpressService from '../services/wordpressService';
import { WPCredentials } from '../types';

export function useWordPressPosts(credentials: WPCredentials | null) {
  return useQuery({
    queryKey: ['wordpress-posts', credentials?.url],
    queryFn: () => {
      if (!credentials) throw new Error('No credentials');
      return wordpressService.fetchPosts(credentials);
    },
    enabled: !!credentials,
  });
}
```

#### Day 5-6: Security Implementation

**3.1 Encryption Service**

```typescript
// src/services/encryptionService.ts
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-key-change-in-production';

export function encrypt(data: string): string {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
}

export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export function encryptObject<T>(obj: T): string {
  return encrypt(JSON.stringify(obj));
}

export function decryptObject<T>(ciphertext: string): T {
  return JSON.parse(decrypt(ciphertext));
}
```

**3.2 Secure Storage**

```typescript
// src/services/secureStorage.ts
import { encrypt, decrypt } from './encryptionService';

export const secureStorage = {
  setItem(key: string, value: unknown): void {
    const encrypted = encrypt(JSON.stringify(value));
    localStorage.setItem(key, encrypted);
  },

  getItem<T>(key: string): T | null {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;

    try {
      const decrypted = decrypt(encrypted);
      return JSON.parse(decrypted) as T;
    } catch {
      return null;
    }
  },

  removeItem(key: string): void {
    localStorage.removeItem(key);
  },

  clear(): void {
    localStorage.clear();
  },
};
```

**3.3 Error Boundary**

```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Here: send to error tracking service (Sentry)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">משהו השתבש</h1>
            <p className="text-gray-400 mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              טען מחדש את הדף
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

#### Day 7: Performance Optimization

**4.1 Code Splitting**

```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';
import { Spinner } from './components/Spinner';

// Lazy load heavy components
const GeneratedPostCard = lazy(() => import('./components/GeneratedPostCard'));
const ControlPanel = lazy(() => import('./components/ControlPanel'));
const PillarTopicsDisplay = lazy(() => import('./components/PillarTopicsDisplay'));

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Spinner />}>
        {/* App content */}
      </Suspense>
    </ErrorBoundary>
  );
}
```

**4.2 Vite Optimization**

```typescript
// vite.config.ts - Enhanced
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'AI WordPress Marketing Automator',
        short_name: 'WP Automator',
        description: 'AI-powered content automation for WordPress',
        theme_color: '#6366f1',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dropdown-menu', '@radix-ui/react-dialog'],
          'state-vendor': ['zustand', '@tanstack/react-query'],
        }
      }
    },
    chunkSizeWarningLimit: 600,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', '@tanstack/react-query'],
  },
});
```

### Week 2: Testing & CI/CD

#### Day 8-9: Testing Setup

**5.1 Unit Tests**

```typescript
// src/stores/__tests__/sitesStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useSitesStore } from '../sitesStore';
import { Site } from '../../types';

describe('SitesStore', () => {
  beforeEach(() => {
    const { setState } = useSitesStore;
    setState({ sites: [], activeSiteId: null });
  });

  it('should add a new site', () => {
    const { addSite, sites } = useSitesStore.getState();

    const newSite: Site = {
      id: 'https://example.com',
      credentials: { url: 'https://example.com', username: 'admin', password: 'test' },
      wpPosts: [],
      pillarTopics: [],
      generatedPosts: [],
    };

    addSite(newSite);

    expect(useSitesStore.getState().sites).toHaveLength(1);
    expect(useSitesStore.getState().sites[0].id).toBe('https://example.com');
  });

  it('should remove a site', () => {
    const { addSite, removeSite } = useSitesStore.getState();

    const site: Site = { /* ... */ };
    addSite(site);
    removeSite(site.id);

    expect(useSitesStore.getState().sites).toHaveLength(0);
  });
});
```

**5.2 Component Tests**

```typescript
// src/components/__tests__/CredentialsForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CredentialsForm } from '../CredentialsForm';

describe('CredentialsForm', () => {
  it('should render form fields', () => {
    render(<CredentialsForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText(/כתובת אתר/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/שם משתמש/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/סיסמת יישום/i)).toBeInTheDocument();
  });

  it('should call onSubmit with form data', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<CredentialsForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText(/כתובת אתר/i), 'https://example.com');
    await user.type(screen.getByLabelText(/שם משתמש/i), 'admin');
    await user.type(screen.getByLabelText(/סיסמת יישום/i), 'password123');

    await user.click(screen.getByRole('button', { name: /נתח וחבר/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      url: 'https://example.com',
      username: 'admin',
      password: 'password123',
    });
  });
});
```

#### Day 10: CI/CD Pipeline

**6.1 GitHub Actions Workflow**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Run tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  build:
    needs: test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist
```

---

## 📋 Phase 2: Core Features Enhancement (Weeks 3-4)

### Week 3: Advanced Content Generation

#### Day 11-13: Brand Voice Engine

**1.1 Brand Voice Types**

```typescript
// src/types/brandVoice.ts
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
  examples: string[]; // Example paragraphs
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
```

**1.2 Enhanced Gemini Service**

```typescript
// src/services/geminiService.ts - Enhanced
export async function generatePostWithBrandVoice(
  options: ContentGenerationOptions,
  pillarTopics: PillarTopic[],
  existingTitles: string[]
): Promise<GeneratedPost> {
  const brandVoiceInstructions = options.brandVoice
    ? `
    התאם את הכתיבה לפי Brand Voice הבא:
    - טון: ${options.brandVoice.tone}
    - מילים מועדפות: ${options.brandVoice.vocabulary.join(', ')}
    - מילים להימנע מהן: ${options.brandVoice.avoidWords.join(', ')}
    - אורך משפט: ${options.brandVoice.writingStyle.sentenceLength}
    - אורך פסקה: ${options.brandVoice.writingStyle.paragraphLength}
    ${options.brandVoice.writingStyle.useEmojis ? '- השתמש באימוג\'ים במתינות' : ''}
    ${options.brandVoice.writingStyle.useHumor ? '- הוסף הומור קל' : ''}

    דוגמאות לסגנון כתיבה:
    ${options.brandVoice.examples.join('\n\n')}
    `
    : '';

  const styleInstructions = getStyleInstructions(options.style);
  const lengthInstructions = getLengthInstructions(options.length);

  const prompt = `
    ${brandVoiceInstructions}
    ${styleInstructions}
    ${lengthInstructions}

    צור רעיון לפוסט חדש בהתבסס על נושאי הליבה:
    ${pillarTopics.map(t => `- ${t.topic}: ${t.description}`).join('\n')}

    מילות מפתח למיקוד: ${options.focusKeywords.join(', ')}
    ${options.semanticKeywords ? `מילות מפתח סמנטיות: ${options.semanticKeywords.join(', ')}` : ''}
    ${options.targetAudience ? `קהל יעד: ${options.targetAudience}` : ''}

    הימנע מכותרות קיימות:
    ${existingTitles.slice(-20).join('\n')}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        // ... enhanced schema
      },
    },
  });

  return JSON.parse(response.text);
}

function getStyleInstructions(style: ContentGenerationOptions['style']): string {
  const styles = {
    tutorial: 'כתוב כמדריך שלב-אחר-שלב עם הוראות ברורות',
    listicle: 'כתוב כרשימה ממוספרת עם נקודות תמציתיות',
    review: 'כתוב כביקורת מפורטת עם יתרונות וחסרונות',
    guide: 'כתוב כמדריך מקיף עם רקע ופרטים',
    news: 'כתוב כידיעה עיתונאית עם עובדות ומקורות',
    story: 'כתוב כסיפור מרתק עם התחלה, אמצע וסוף'
  };
  return styles[style];
}
```

#### Day 14-15: SEO Powerhouse

**2.1 SEO Analysis Service**

```typescript
// src/services/seoService.ts
import { z } from 'zod';

export interface SEOAnalysis {
  score: number; // 0-100
  keywords: KeywordAnalysis[];
  readability: ReadabilityScore;
  suggestions: SEOSuggestion[];
  meta: MetaAnalysis;
}

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

export async function analyzeSEO(content: string, targetKeywords: string[]): Promise<SEOAnalysis> {
  const keywords = analyzeKeywords(content, targetKeywords);
  const readability = analyzeReadability(content);
  const meta = analyzeMetaTags(content);
  const suggestions = generateSuggestions(keywords, readability, meta);
  const score = calculateSEOScore(keywords, readability, meta);

  return {
    score,
    keywords,
    readability,
    suggestions,
    meta,
  };
}

function analyzeKeywords(content: string, targetKeywords: string[]): KeywordAnalysis[] {
  const wordCount = content.split(/\s+/).length;

  return targetKeywords.map(keyword => {
    const regex = new RegExp(keyword, 'gi');
    const matches = content.match(regex) || [];
    const count = matches.length;
    const density = (count / wordCount) * 100;

    const inTitle = content.toLowerCase().includes(keyword.toLowerCase());
    const headings = content.match(/<h[1-6]>.*?<\/h[1-6]>/gi) || [];
    const inHeadings = headings.filter(h =>
      h.toLowerCase().includes(keyword.toLowerCase())
    ).length;

    const firstParagraph = content.match(/<p>.*?<\/p>/i)?.[0] || '';
    const inFirstParagraph = firstParagraph.toLowerCase().includes(keyword.toLowerCase());

    return {
      keyword,
      density: Math.round(density * 100) / 100,
      prominence: calculateProminence(density, inTitle, inHeadings, inFirstParagraph),
      distribution: getDistribution(density),
      inTitle,
      inHeadings,
      inFirstParagraph,
    };
  });
}

function analyzeReadability(content: string): ReadabilityScore {
  const text = content.replace(/<[^>]*>/g, ''); // Strip HTML
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);

  const avgSentenceLength = words.length / sentences.length;
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;

  // Complex words (>3 syllables in Hebrew - approximation)
  const complexWords = words.filter(w => w.length > 10).length;
  const complexWordRatio = (complexWords / words.length) * 100;

  // Flesch-Kincaid adaptation for Hebrew
  const score = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgWordLength;
  const normalizedScore = Math.max(0, Math.min(100, score));

  return {
    score: Math.round(normalizedScore),
    grade: getReadingGrade(normalizedScore),
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    complexWords,
    suggestions: generateReadabilitySuggestions(avgSentenceLength, complexWordRatio),
  };
}
```

**2.2 Real-time SEO Component**

```typescript
// src/components/SEOScorePanel.tsx
import { useEffect, useState } from 'react';
import { analyzeSEO, type SEOAnalysis } from '../services/seoService';
import { Progress } from './ui/Progress';
import { Badge } from './ui/Badge';

interface Props {
  content: string;
  targetKeywords: string[];
}

export function SEOScorePanel({ content, targetKeywords }: Props) {
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!content || targetKeywords.length === 0) return;

    const timer = setTimeout(async () => {
      setIsAnalyzing(true);
      const result = await analyzeSEO(content, targetKeywords);
      setAnalysis(result);
      setIsAnalyzing(false);
    }, 500); // Debounce

    return () => clearTimeout(timer);
  }, [content, targetKeywords]);

  if (!analysis) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">ניתוח SEO</h3>
        <div className="text-3xl font-bold" style={{ color: getScoreColor(analysis.score) }}>
          {analysis.score}/100
        </div>
      </div>

      <Progress value={analysis.score} className="h-2" />

      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">מילות מפתח</h4>
          <div className="space-y-2">
            {analysis.keywords.map((kw) => (
              <div key={kw.keyword} className="flex items-center justify-between text-sm">
                <span>{kw.keyword}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={kw.distribution === 'good' ? 'success' : 'warning'}>
                    {kw.density.toFixed(2)}%
                  </Badge>
                  {kw.inTitle && <Badge variant="success">בכותרת</Badge>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">קריאות</h4>
          <p className="text-sm text-gray-400">
            ציון: {analysis.readability.score}/100 ({analysis.readability.grade})
          </p>
          <p className="text-sm text-gray-400">
            אורך משפט ממוצע: {analysis.readability.avgSentenceLength} מילים
          </p>
        </div>

        {analysis.suggestions.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">המלצות לשיפור</h4>
            <ul className="space-y-1 text-sm text-gray-400">
              {analysis.suggestions.map((suggestion, i) => (
                <li key={i}>• {suggestion}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Week 4: Content Calendar & Scheduling

#### Day 16-18: Calendar Implementation

**3.1 Calendar Types & State**

```typescript
// src/types/calendar.ts
export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  post: GeneratedPost;
  siteId: string;
  recurrence?: RecurrenceRule;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  endDate?: Date;
  count?: number;
}

// src/stores/calendarStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CalendarState {
  events: CalendarEvent[];
  view: 'month' | 'week' | 'day' | 'list';
  selectedDate: Date;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  setView: (view: CalendarState['view']) => void;
  setSelectedDate: (date: Date) => void;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      events: [],
      view: 'month',
      selectedDate: new Date(),

      addEvent: (event) => set((state) => ({
        events: [...state.events, event],
      })),

      updateEvent: (id, updates) => set((state) => ({
        events: state.events.map(e => e.id === id ? { ...e, ...updates } : e),
      })),

      deleteEvent: (id) => set((state) => ({
        events: state.events.filter(e => e.id !== id),
      })),

      setView: (view) => set({ view }),
      setSelectedDate: (date) => set({ selectedDate: date }),
    }),
    {
      name: 'wp-automator-calendar',
    }
  )
);
```

**3.2 Calendar Component**

```typescript
// src/components/Calendar/Calendar.tsx
import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import { useCalendarStore } from '../../stores/calendarStore';
import { CalendarEvent } from './CalendarEvent';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Calendar() {
  const { events, selectedDate, setSelectedDate, view } = useCalendarStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), date));
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {format(currentMonth, 'MMMM yyyy', { locale: he })}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
            className="p-2 hover:bg-gray-700 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-4 py-2 hover:bg-gray-700 rounded-lg"
          >
            היום
          </button>
          <button
            onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
            className="p-2 hover:bg-gray-700 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(day => (
          <div key={day} className="text-center font-semibold text-gray-400 py-2">
            {day}
          </div>
        ))}

        {/* Days */}
        {days.map(day => {
          const dayEvents = getEventsForDay(day);
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <div
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`
                min-h-24 p-2 border rounded-lg cursor-pointer transition-colors
                ${isCurrentMonth ? 'bg-gray-900' : 'bg-gray-800/50 text-gray-600'}
                ${isToday ? 'border-indigo-500' : 'border-gray-700'}
                ${isSelected ? 'ring-2 ring-indigo-500' : ''}
                hover:bg-gray-700/50
              `}
            >
              <div className="text-sm font-semibold mb-1">
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map(event => (
                  <CalendarEvent key={event.id} event={event} compact />
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-400">
                    +{dayEvents.length - 2} נוספים
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

#### Day 19-20: Smart Scheduling System

**4.1 Scheduler Service**

```typescript
// src/services/schedulerService.ts
import { CalendarEvent } from '../types/calendar';
import { GeneratedPost } from '../types';
import * as wordpressService from './wordpressService';
import * as geminiService from './geminiService';

export class Scheduler {
  private queue: Map<string, CalendarEvent> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  schedulePost(event: CalendarEvent) {
    this.queue.set(event.id, event);

    const now = new Date();
    const scheduledTime = new Date(event.date);
    const delay = scheduledTime.getTime() - now.getTime();

    if (delay > 0) {
      const timer = setTimeout(() => {
        this.publishPost(event);
      }, delay);

      this.timers.set(event.id, timer);
    }
  }

  cancelSchedule(eventId: string) {
    const timer = this.timers.get(eventId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(eventId);
    }
    this.queue.delete(eventId);
  }

  async publishPost(event: CalendarEvent) {
    try {
      // Generate full content if not exists
      if (!event.post.fullContent) {
        event.post.fullContent = await geminiService.generateFullPostContent(event.post);
      }

      // Upload image if exists
      let mediaId: number | undefined;
      if (event.post.imageUrl) {
        const site = getSiteById(event.siteId);
        const mediaItem = await wordpressService.uploadImage(
          site.credentials,
          event.post.imageUrl,
          event.post.title,
          event.post.imageSuggestion.altText
        );
        mediaId = mediaItem.id;
      }

      // Create post
      const site = getSiteById(event.siteId);
      await wordpressService.createPost(
        site.credentials,
        event.post,
        event.post.fullContent,
        mediaId
      );

      // Update event status
      useCalendarStore.getState().updateEvent(event.id, {
        status: 'published',
      });

      // Handle recurrence
      if (event.recurrence) {
        this.scheduleRecurrence(event);
      }
    } catch (error) {
      console.error('Failed to publish scheduled post:', error);
      useCalendarStore.getState().updateEvent(event.id, {
        status: 'failed',
      });
    } finally {
      this.queue.delete(event.id);
      this.timers.delete(event.id);
    }
  }

  private scheduleRecurrence(event: CalendarEvent) {
    if (!event.recurrence) return;

    const nextDate = calculateNextDate(event.date, event.recurrence);

    if (!nextDate) return; // No more recurrences

    const newEvent: CalendarEvent = {
      ...event,
      id: generateId(),
      date: nextDate,
      status: 'scheduled',
    };

    this.schedulePost(newEvent);
    useCalendarStore.getState().addEvent(newEvent);
  }
}

export const scheduler = new Scheduler();
```

---

## 📋 Phase 3: Analytics & Intelligence (Weeks 5-6)

*[Detailed implementation plan continues...]*

---

## 📋 Phase 4: Enterprise Features (Weeks 7-8)

*[Detailed implementation plan continues...]*

---

## 📋 Phase 5: Polish & Scale (Weeks 9-10)

*[Detailed implementation plan continues...]*

---

## ✅ Success Checklist

### Phase 1
- [ ] ESLint + Prettier configured
- [ ] Husky pre-commit hooks working
- [ ] Vitest test framework set up
- [ ] Zustand stores implemented
- [ ] TanStack Query configured
- [ ] Encryption service implemented
- [ ] Error boundary added
- [ ] Code splitting implemented
- [ ] CI/CD pipeline configured
- [ ] Tests passing (>80% coverage)

### Phase 2
- [ ] Brand voice engine working
- [ ] SEO analysis real-time
- [ ] Content calendar implemented
- [ ] Smart scheduling active
- [ ] Drag & drop working
- [ ] Recurring posts supported

### Phase 3
- [ ] Analytics dashboard live
- [ ] AI insights generating
- [ ] Reporting system working
- [ ] Performance tracking active

### Phase 4
- [ ] Team management implemented
- [ ] Multi-channel publishing working
- [ ] Workflow automation live
- [ ] Permissions system active

### Phase 5
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Production deployed
- [ ] Monitoring active
- [ ] User feedback collected

---

**Next:** Start implementing Phase 1!
