import { WPCredentials, WordPressPost, GeneratedPost } from '../types';

function getAuthHeader(creds: WPCredentials): string {
    return 'Basic ' + btoa(`${creds.username}:${creds.password}`);
}

export async function fetchPosts(creds: WPCredentials): Promise<WordPressPost[]> {
    const apiUrl = `${creds.url.replace(/\/$/, '')}/wp-json/wp/v2/posts?_fields=id,title,content,excerpt,categories,tags&per_page=10`;

    const response = await fetch(apiUrl, {
        headers: {
            'Authorization': getAuthHeader(creds)
        }
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
        throw new Error(`שגיאה בקבלת פוסטים: ${response.statusText} - ${errorData.message || 'בדוק כתובת ופרטי התחברות.'}`);
    }

    return response.json();
}

export async function createPost(creds: WPCredentials, post: GeneratedPost, fullContent: string, featuredMediaId?: number): Promise<WordPressPost> {
    const apiUrl = `${creds.url.replace(/\/$/, '')}/wp-json/wp/v2/posts`;

    const body: {
        title: string;
        content: string;
        status: 'publish';
        featured_media?: number;
    } = {
        title: post.title,
        content: fullContent,
        status: 'publish',
    };
    
    if (featuredMediaId) {
        body.featured_media = featuredMediaId;
    }

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': getAuthHeader(creds),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
        throw new Error(`שגיאה ביצירת פוסט: ${response.statusText} - ${errorData.message || 'אנא בדוק הרשאות.'}`);
    }
    return response.json();
}

export async function uploadImage(creds: WPCredentials, base64ImageData: string, title: string, altText: string): Promise<{ id: number }> {
    const apiUrl = `${creds.url.replace(/\/$/, '')}/wp-json/wp/v2/media`;
    
    // Convert base64 to blob
    const base64Response = await fetch(base64ImageData);
    const blob = await base64Response.blob();

    const formData = new FormData();
    formData.append('file', blob, `${title.replace(/\s/g, '-')}.jpg`);
    formData.append('title', `תמונה שנוצרה על ידי AI עבור - ${title}`);
    formData.append('alt_text', altText);
    formData.append('caption', `רעיון לתמונה: ${altText}`);

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': getAuthHeader(creds),
        },
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
        throw new Error(`שגיאה בהעלאת תמונה: ${response.statusText} - ${errorData.message || 'אנא בדוק הרשאות.'}`);
    }
    return response.json();
}
