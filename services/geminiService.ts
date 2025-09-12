import { GoogleGenAI, Type } from "@google/genai";
import { WordPressPost, PillarTopic, GeneratedPost } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set. Please provide your Gemini API key.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const stripHtml = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
};

export async function identifyPillarTopics(posts: WordPressPost[]): Promise<PillarTopic[]> {
    const contentToAnalyze = posts.map(post => {
        const title = stripHtml(post.title.rendered);
        const excerpt = stripHtml(post.excerpt.rendered);
        return `כותרת: ${title}\nתקציר: ${excerpt}`;
    }).join('\n\n---\n\n');

    if (!contentToAnalyze.trim()) {
        return []; // Return empty array if no content, don't throw error
    }

    const prompt = `
        אתה מומחה לאסטרטגיית תוכן ושיווק דיגיטלי. משימתך היא לנתח את כותרות ותקצירי הפוסטים הבאים מאתר וורדפרס ולזהות את 3-5 נושאי הליבה (Pillar Topics) המרכזיים של האתר. נושא ליבה הוא תחום תוכן רחב ומרכזי, שניתן לפצל למספר רב של פוסטים ספציפיים ומפורטים.

        הצג את הפלט בפורמט JSON בלבד, כמערך של אובייקטים. כל אובייקט חייב להכיל 'topic' (שם הנושא בעברית) ו-'description' (תיאור קצר בעברית המסביר את מהות הנושא). ודא שהתשובה היא JSON תקין ללא טקסט נוסף.
        
        דוגמה לפלט:
        [
          {"topic": "שיווק באמצעות תוכן", "description": "אסטרטגיות וטכניקות ליצירה והפצה של תוכן בעל ערך למשיכה ושימור של קהל יעד מוגדר."},
          {"topic": "קידום אתרים אורגני למתחילים", "description": "עקרונות יסוד של אופטימיזציה למנועי חיפוש (SEO) עבור מי שחדש בתחום."}
        ]

        להלן התוכן לניתוח:
        ---
        ${contentToAnalyze.slice(0, 10000)}
        ---
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        topic: { type: Type.STRING, description: "שם נושא הליבה." },
                        description: { type: Type.STRING, description: "הסבר קצר על הנושא." },
                    },
                    required: ["topic", "description"],
                },
            },
        },
    });

    try {
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as PillarTopic[];
    } catch (e) {
        console.error("Failed to parse Gemini response for pillar topics:", response.text);
        throw new Error("AI נכשל בהחזרת נושאי ליבה תקינים. נסה שוב.");
    }
}

export async function generatePostIdea(pillarTopics: PillarTopic[], existingTitles: string[]): Promise<Omit<GeneratedPost, 'publishStatus' | 'imageGenStatus'>> {
    const topicsString = pillarTopics.map(t => `- ${t.topic}: ${t.description}`).join('\n');
    const titlesString = existingTitles.slice(-20).join('\n- ');

    const prompt = `
        אתה עוזר וירטואלי מומחה ביצירת תוכן לאתרי וורדפרס, המתמחה בכתיבה שיווקית ובאופטימיזציה למנועי חיפוש (SEO).
        בהתבסס על נושאי הליבה של האתר והכותרות של פוסטים קיימים, משימתך היא ליצור רעיון אחד לפוסט חדש, מקורי ובעל ערך לקוראים בשפה העברית. הרעיון צריך להיות רלוונטי לנושאי הליבה אך עם זווית ייחודית שטרם כוסתה בפוסטים הקיימים.

        נושאי הליבה של האתר:
        ${topicsString}

        כותרות פוסטים קיימים (להימנע מכפילויות):
        - ${titlesString}

        הגש את התוצאה כאובייקט JSON תקין בלבד, בשפה העברית, התואם במדויק למבנה שהוגדר. אל תוסיף שום טקסט לפני או אחרי ה-JSON.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "כותרת מושכת וידידותית ל-SEO (בעברית)." },
                    openingParagraph: { type: Type.STRING, description: "פסקת פתיחה מרתקת (2-3 משפטים) שמציגה את הנושא (בעברית)." },
                    structure: { type: Type.ARRAY, items: { type: Type.STRING }, description: "מערך של מחרוזות המייצגות כותרות משנה למבנה הפוסט (בעברית)." },
                    keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "מערך של מילות מפתח רלוונטיות (בעברית)." },
                    imageSuggestion: {
                        type: Type.OBJECT,
                        properties: {
                            altText: { type: Type.STRING, description: "טקסט חלופי תיאורי לתמונה, מותאם ל-SEO (בעברית)." },
                            concept: { type: Type.STRING, description: "תיאור קצר של הקונספט הוויזואלי לתמונה (באנגלית, לצורך יצירת התמונה)." }
                        },
                        required: ["altText", "concept"],
                    }
                },
                required: ["title", "openingParagraph", "structure", "keywords", "imageSuggestion"],
            },
        }
    });
    
    try {
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Failed to parse Gemini response for post generation:", response.text);
        throw new Error("AI נכשל בהחזרת רעיון תקין לפוסט. נסה שוב.");
    }
}

export async function generateFullPostContent(postIdea: GeneratedPost): Promise<string> {
    let fullContent = `<p>${postIdea.openingParagraph}</p>`;

    for (const heading of postIdea.structure) {
        const prompt = `
            אתה כותב תוכן מקצועי ומומחה SEO.
            משימתך היא לכתוב 2-3 פסקאות תוכן אינפורמטיביות ומרתקות, בשפה העברית, עבור כותרת המשנה הבאה: "${heading}".
            התוכן צריך להיות חלק ממאמר גדול יותר שכותרתו: "${postIdea.title}".
            שמור על סגנון כתיבה מקצועי, קל לקריאה ומותאם לקוראים באינטרנט. אל תחזור על כותרת המשנה עצמה בתשובתך.
            התמקד במתן ערך אמיתי לקורא.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const sectionContent = response.text.trim();
        fullContent += `<h2>${heading}</h2><p>${sectionContent.replace(/\n/g, '</p><p>')}</p>`;
    }
    
    return fullContent;
}


export async function generateImage(prompt: string): Promise<string> {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `Create a high-quality, photorealistic image for a blog post. Concept: ${prompt}. Cinematic lighting, professional photography.`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        return response.generatedImages[0].image.imageBytes;
    } else {
        throw new Error("Failed to generate image. The response did not contain any images.");
    }
}