import type { BrandVoice, ContentGenerationOptions, PillarTopic, GeneratedPost } from '../types';
import { GoogleGenAI, Type } from '@google/genai';

// Initialize Gemini AI
if (!process.env.API_KEY) {
  throw new Error('API_KEY environment variable not set. Please provide your Gemini API key.');
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates brand voice instructions for Gemini prompts
 */
function generateBrandVoiceInstructions(brandVoice: BrandVoice): string {
  return `
    התאם את הכתיבה לפי Brand Voice הבא:

    **טון כללי:** ${brandVoice.tone}
    **שם ה-Brand Voice:** ${brandVoice.name}

    **הנחיות סגנון:**
    - אורך משפט: ${brandVoice.writingStyle.sentenceLength}
    - אורך פסקה: ${brandVoice.writingStyle.paragraphLength}
    ${brandVoice.writingStyle.useEmojis ? '- השתמש באימוג\'ים במתינות (1-2 לפוסט)' : '- אל תשתמש באימוג\'ים'}
    ${brandVoice.writingStyle.useHumor ? '- הוסף הומור קל וחכם' : '- שמור על טון רציני ומקצועי'}

    **מילים מועדפות (השתמש בהן לעיתים קרובות):**
    ${brandVoice.vocabulary.length > 0 ? brandVoice.vocabulary.join(', ') : 'אין מילים מועדפות ספציפיות'}

    **מילים להימנע מהן (אל תשתמש בהן כלל):**
    ${brandVoice.avoidWords.length > 0 ? brandVoice.avoidWords.join(', ') : 'אין מילים אסורות'}

    **דוגמאות לסגנון כתיבה (חקה את הסגנון הזה):**
    ${brandVoice.examples.map((ex, i) => `${i + 1}. ${ex}`).join('\n')}

    חשוב: שמור על עקביות בסגנון לאורך כל הטקסט!
  `;
}

/**
 * Generates style-specific instructions
 */
function getStyleInstructions(style: ContentGenerationOptions['style']): string {
  const styles = {
    tutorial: 'כתוב כמדריך שלב-אחר-שלב עם הוראות ברורות וממוספרות. כל שלב צריך להיות מפורט ומעשי.',
    listicle:
      'כתוב כרשימה ממוספרת עם נקודות תמציתיות. כל פריט ברשימה צריך להיות עצמאי ומעניין.',
    review:
      'כתוב כביקורת מפורטת עם יתרונות וחסרונות ברורים. כלול ציון או המלצה בסוף.',
    guide:
      'כתוב כמדריך מקיף עם רקע, הסברים מפורטים וטיפים מתקדמים. התייחס לכל ההיבטים של הנושא.',
    news: 'כתוב כידיעה עיתונאית עם עובדות, ציטוטים (אופציונלי) ומבנה הפוך. התחל בחשוב ביותר.',
    story:
      'כתוב כסיפור מרתק עם התחלה מושכת, אמצע מפתח וסיום מסכם. השתמש בדוגמאות אישיות או מקרי מבחן.',
  };
  return styles[style];
}

/**
 * Generates length-specific instructions
 */
function getLengthInstructions(length: ContentGenerationOptions['length']): string {
  const lengths = {
    short: 'צור תוכן קצר ותמציתי (300-500 מילים). התמקד בנקודות העיקריות בלבד.',
    medium: 'צור תוכן באורך בינוני (700-1000 מילים). כלול פרטים חשובים ודוגמאות.',
    long: 'צור תוכן ארוך ומפורט (1500-2000 מילים). כסה את הנושא לעומק עם דוגמאות רבות.',
    comprehensive:
      'צור תוכן מקיף ומעמיק (2500+ מילים). זהו מאמר אולטימטיבי שמכסה כל היבט אפשרי.',
  };
  return lengths[length];
}

/**
 * Generates a post with Brand Voice support
 */
export async function generatePostWithBrandVoice(
  options: ContentGenerationOptions,
  pillarTopics: PillarTopic[],
  existingTitles: string[]
): Promise<Omit<GeneratedPost, 'publishStatus' | 'imageGenStatus'>> {
  const brandVoiceInstructions = options.brandVoice
    ? generateBrandVoiceInstructions(options.brandVoice)
    : '';

  const styleInstructions = getStyleInstructions(options.style);
  const lengthInstructions = getLengthInstructions(options.length);

  const topicsString = pillarTopics.map((t) => `- ${t.topic}: ${t.description}`).join('\n');
  const titlesString = existingTitles.slice(-20).join('\n- ');

  const prompt = `
    אתה עוזר וירטואלי מומחה ביצירת תוכן לאתרי WordPress, המתמחה בכתיבה שיווקית ובאופטימיזציה למנועי חיפוש (SEO).

    ${brandVoiceInstructions}

    **הנחיות סגנון:**
    ${styleInstructions}

    **הנחיות אורך:**
    ${lengthInstructions}

    **נושאי הליבה של האתר:**
    ${topicsString}

    **מילות מפתח למיקוד (חובה להשתמש בהן):**
    ${options.focusKeywords.join(', ')}

    ${options.semanticKeywords ? `**מילות מפתח סמנטיות (רצוי להשתמש):**\n${options.semanticKeywords.join(', ')}` : ''}

    ${options.targetAudience ? `**קהל יעד:**\n${options.targetAudience}` : ''}

    **כותרות פוסטים קיימים (להימנע מכפילויות):**
    - ${titlesString}

    **דרישות נוספות:**
    - הכותרת צריכה להיות מושכת, ייחודית ומותאמת SEO (50-60 תווים)
    - פסקת הפתיחה צריכה למשוך תשומת לב מיד ולכלול מילת מפתח ראשית
    - המבנה צריך להיות לוגי וקל לעיקוב
    - כל כותרת משנה צריכה להיות ברורה וספציפית
    - מילות המפתח צריכות להיות רלוונטיות ובעלות פוטנציאל חיפוש
    ${options.includeImages ? `- צור ${options.imageCount || 1} רעיונות לתמונות רלוונטיות` : ''}

    הגש את התוצאה כאובייקט JSON תקין בלבד, בשפה העברית, התואם במדויק למבנה שהוגדר.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: 'כותרת מושכת וידידותית ל-SEO (בעברית, 50-60 תווים).',
          },
          openingParagraph: {
            type: Type.STRING,
            description: 'פסקת פתיחה מרתקת (2-3 משפטים) שמציגה את הנושא (בעברית).',
          },
          structure: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'מערך של מחרוזות המייצגות כותרות משנה למבנה הפוסט (בעברית).',
          },
          keywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'מערך של מילות מפתח רלוונטיות (בעברית).',
          },
          imageSuggestion: {
            type: Type.OBJECT,
            properties: {
              altText: {
                type: Type.STRING,
                description: 'טקסט חלופי תיאורי לתמונה, מותאם ל-SEO (בעברית).',
              },
              concept: {
                type: Type.STRING,
                description: 'תיאור קצר של הקונספט הוויזואלי לתמונה (באנגלית, לצורך יצירת התמונה).',
              },
            },
            required: ['altText', 'concept'],
          },
        },
        required: ['title', 'openingParagraph', 'structure', 'keywords', 'imageSuggestion'],
      },
    },
  });

  try {
    const jsonText = (response.text ?? '').trim();
    return JSON.parse(jsonText);
  } catch {
    console.error('Failed to parse Gemini response for post generation:', response.text ?? '');
    throw new Error('AI נכשל בהחזרת רעיון תקין לפוסט. נסה שוב.');
  }
}

/**
 * Generates full post content with Brand Voice
 */
export async function generateFullPostWithBrandVoice(
  postIdea: GeneratedPost,
  brandVoice?: BrandVoice
): Promise<string> {
  const brandVoiceInstructions = brandVoice ? generateBrandVoiceInstructions(brandVoice) : '';

  let fullContent = `<p>${postIdea.openingParagraph}</p>`;

  for (const heading of postIdea.structure) {
    const prompt = `
      ${brandVoiceInstructions}

      אתה כותב תוכן מקצועי ומומחה SEO.
      משימתך היא לכתוב 2-3 פסקאות תוכן אינפורמטיביות ומרתקות, בשפה העברית, עבור כותרת המשנה הבאה: "${heading}".

      התוכן צריך להיות חלק ממאמר גדול יותר שכותרתו: "${postIdea.title}".

      **הנחיות:**
      - שמור על סגנון כתיבה מקצועי, קל לקריאה ומותאם לקוראים באינטרנט
      - אל תחזור על כותרת המשנה עצמה בתשובתך
      - התמקד במתן ערך אמיתי לקורא
      - השתמש בדוגמאות ספציפיות כשאפשר
      - שמור על קשר לוגי עם הפסקאות הקודמות
      ${brandVoice ? '- שמור על עקביות עם ה-Brand Voice שהוגדר' : ''}

      החזר רק את התוכן עצמו ללא כותרת המשנה.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const sectionContent = (response.text ?? '').trim();
    fullContent += `<h2>${heading}</h2><p>${sectionContent.replace(/\n\n/g, '</p><p>')}</p>`;
  }

  // Add conclusion if not already present
  if (!postIdea.structure.some((h) => h.includes('סיכום') || h.includes('לסיום'))) {
    const conclusionPrompt = `
      ${brandVoiceInstructions}

      כתוב פסקת סיכום קצרה (2-3 משפטים) למאמר שכותרתו: "${postIdea.title}".
      הסיכום צריך לסכם את הנקודות העיקריות ולעודד את הקורא לפעולה או למחשבה.

      ${brandVoice ? 'שמור על עקביות עם ה-Brand Voice שהוגדר.' : ''}
    `;

    const conclusionResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: conclusionPrompt,
    });

    fullContent += `<h2>לסיום</h2><p>${(conclusionResponse.text ?? '').trim()}</p>`;
  }

  return fullContent;
}

/**
 * Creates a default brand voice for getting started
 */
export function createDefaultBrandVoice(): BrandVoice {
  return {
    id: 'default',
    name: 'ברירת מחדל - מקצועי וידידותי',
    tone: 'professional',
    vocabulary: ['מומלץ', 'איכותי', 'יעיל', 'מתקדם', 'חדשני'],
    avoidWords: ['לא טוב', 'גרוע', 'ישן'],
    writingStyle: {
      sentenceLength: 'medium',
      paragraphLength: 'medium',
      useEmojis: false,
      useHumor: false,
    },
    examples: [
      'בעולם הדיגיטלי של היום, חשוב להישאר מעודכנים בטכנולוגיות החדשות. אנחנו נעזור לכם להבין את היסודות ולהתחיל בקלות.',
      'השיטה שנציג כאן הוכחה כיעילה אצל אלפי משתמשים ברחבי העולם. היא משלבת גישה מעשית עם תוצאות מדידות.',
    ],
  };
}
