import type {
  SEOAnalysis,
  KeywordAnalysis,
  ReadabilityScore,
  MetaAnalysis,
  SEOSuggestion,
} from '../types';
import { stripHtml } from '../utils/helpers';

/**
 * Analyzes keywords in content
 */
function analyzeKeywords(content: string, targetKeywords: string[]): KeywordAnalysis[] {
  const plainText = stripHtml(content).toLowerCase();
  const wordCount = plainText.split(/\s+/).length;

  return targetKeywords.map((keyword) => {
    const keywordLower = keyword.toLowerCase();
    const regex = new RegExp(keywordLower, 'gi');
    const matches = plainText.match(regex) || [];
    const count = matches.length;
    const density = (count / wordCount) * 100;

    // Check if keyword is in title
    const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = titleMatch ? stripHtml(titleMatch[1]).toLowerCase() : '';
    const inTitle = title.includes(keywordLower);

    // Count appearances in headings
    const headings = content.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [];
    const inHeadings = headings.filter((h) => stripHtml(h).toLowerCase().includes(keywordLower))
      .length;

    // Check first paragraph
    const firstPMatch = content.match(/<p[^>]*>(.*?)<\/p>/i);
    const firstParagraph = firstPMatch ? stripHtml(firstPMatch[1]).toLowerCase() : '';
    const inFirstParagraph = firstParagraph.includes(keywordLower);

    const prominence = calculateProminence(density, inTitle, inHeadings, inFirstParagraph);
    const distribution = getDistribution(density);

    return {
      keyword,
      density: Math.round(density * 100) / 100,
      prominence,
      distribution,
      inTitle,
      inHeadings,
      inFirstParagraph,
    };
  });
}

/**
 * Calculates keyword prominence score
 */
function calculateProminence(
  density: number,
  inTitle: boolean,
  inHeadings: number,
  inFirstPara: boolean
): number {
  let score = 0;

  // Density contribution (0-30 points)
  if (density >= 1 && density <= 3) {
    score += 30;
  } else if (density > 3 && density <= 5) {
    score += 20;
  } else if (density > 0.5 && density < 1) {
    score += 15;
  } else if (density > 5) {
    score += 5; // Keyword stuffing penalty
  }

  // Title contribution (0-30 points)
  if (inTitle) {
    score += 30;
  }

  // Headings contribution (0-25 points)
  if (inHeadings >= 3) {
    score += 25;
  } else if (inHeadings >= 2) {
    score += 20;
  } else if (inHeadings >= 1) {
    score += 15;
  }

  // First paragraph contribution (0-15 points)
  if (inFirstPara) {
    score += 15;
  }

  return Math.min(100, score);
}

/**
 * Gets distribution rating based on keyword density
 */
function getDistribution(density: number): 'good' | 'fair' | 'poor' {
  if (density >= 1 && density <= 3) {
    return 'good';
  } else if ((density >= 0.5 && density < 1) || (density > 3 && density <= 5)) {
    return 'fair';
  }
  return 'poor';
}

/**
 * Analyzes readability of content
 */
function analyzeReadability(content: string): ReadabilityScore {
  const text = stripHtml(content);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.length > 0);

  if (sentences.length === 0 || words.length === 0) {
    return {
      score: 0,
      grade: 'לא זמין',
      avgSentenceLength: 0,
      avgWordLength: 0,
      complexWords: 0,
      suggestions: ['התוכן ריק או לא תקין'],
    };
  }

  const avgSentenceLength = words.length / sentences.length;
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;

  // Complex words heuristic for Hebrew (words > 10 characters)
  const complexWords = words.filter((w) => w.length > 10).length;
  const complexWordRatio = (complexWords / words.length) * 100;

  // Adapted Flesch-Kincaid for Hebrew
  // Lower avg sentence length and word length = higher score (easier to read)
  const score = Math.max(
    0,
    Math.min(100, 206.835 - 1.015 * avgSentenceLength - 84.6 * (avgWordLength / 5))
  );

  const normalizedScore = Math.round(score);
  const grade = getReadingGrade(normalizedScore);
  const suggestions = generateReadabilitySuggestions(avgSentenceLength, complexWordRatio);

  return {
    score: normalizedScore,
    grade,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    complexWords,
    suggestions,
  };
}

/**
 * Gets reading grade level
 */
function getReadingGrade(score: number): string {
  if (score >= 90) return 'קל מאוד (כיתה ה\')';
  if (score >= 80) return 'קל (כיתה ו\'-ז\')';
  if (score >= 70) return 'בינוני-קל (כיתה ח\'-ט\')';
  if (score >= 60) return 'בינוני (כיתה י\'-יא\')';
  if (score >= 50) return 'קשה (כיתה יב\')';
  if (score >= 30) return 'קשה מאוד (אקדמי)';
  return 'קשה במיוחד (מקצועי)';
}

/**
 * Generates readability improvement suggestions
 */
function generateReadabilitySuggestions(avgSentenceLength: number, complexWordRatio: number): string[] {
  const suggestions: string[] = [];

  if (avgSentenceLength > 25) {
    suggestions.push('המשפטים ארוכים מדי. נסה לקצר ולפצל לכ-15-20 מילים למשפט.');
  } else if (avgSentenceLength < 10) {
    suggestions.push('המשפטים קצרים מדי. נסה לשלב כמה משפטים לזרימה טובה יותר.');
  }

  if (complexWordRatio > 20) {
    suggestions.push('יותר מדי מילים מורכבות. נסה להשתמש במילים פשוטות יותר.');
  }

  if (suggestions.length === 0) {
    suggestions.push('הקריאות טובה! המשך כך.');
  }

  return suggestions;
}

/**
 * Analyzes meta tags and structure
 */
function analyzeMetaTags(content: string, title?: string): MetaAnalysis {
  // Extract H1
  const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const hasH1 = !!h1Match;

  // Extract all headings
  const headings = content.match(/<h[1-6][^>]*>/gi) || [];
  const headingsStructure = headings.map((h) => {
    const match = h.match(/<h([1-6])/i);
    return match ? `H${match[1]}` : '';
  });

  // Title analysis (if provided)
  const titleLength = title ? title.length : h1Match ? stripHtml(h1Match[1]).length : 0;
  const titleOptimal = titleLength >= 50 && titleLength <= 60;

  // Description placeholder (would need meta tag extraction in real implementation)
  const descriptionLength = 0;
  const descriptionOptimal = false;

  return {
    titleLength,
    titleOptimal,
    descriptionLength,
    descriptionOptimal,
    hasH1,
    headingsStructure,
  };
}

/**
 * Generates SEO suggestions based on analysis
 */
function generateSuggestions(
  keywords: KeywordAnalysis[],
  readability: ReadabilityScore,
  meta: MetaAnalysis
): SEOSuggestion[] {
  const suggestions: SEOSuggestion[] = [];

  // Title suggestions
  if (!meta.titleOptimal) {
    if (meta.titleLength < 50) {
      suggestions.push({
        type: 'warning',
        message: `הכותרת קצרה מדי (${meta.titleLength} תווים). מומלץ 50-60 תווים.`,
        fix: 'הוסף מילות מפתח נוספות או תיאור מפורט יותר.',
      });
    } else if (meta.titleLength > 60) {
      suggestions.push({
        type: 'warning',
        message: `הכותרת ארוכה מדי (${meta.titleLength} תווים). מומלץ 50-60 תווים.`,
        fix: 'קצר את הכותרת תוך שמירה על מילות המפתח החשובות.',
      });
    }
  }

  // H1 suggestion
  if (!meta.hasH1) {
    suggestions.push({
      type: 'critical',
      message: 'חסרה כותרת H1! זה חובה ל-SEO.',
      fix: 'הוסף כותרת H1 בתחילת התוכן עם מילת המפתח הראשית.',
    });
  }

  // Heading structure
  if (meta.headingsStructure.length < 3) {
    suggestions.push({
      type: 'warning',
      message: 'מעט כותרות משנה. מומלץ לפחות 3-4 כותרות.',
      fix: 'חלק את התוכן לסעיפים עם כותרות H2/H3 ברורות.',
    });
  }

  // Keyword suggestions
  keywords.forEach((kw) => {
    if (kw.density === 0) {
      suggestions.push({
        type: 'critical',
        message: `מילת המפתח "${kw.keyword}" לא מופיעה בתוכן!`,
        fix: 'הוסף את מילת המפתח באופן טבעי בתוכן.',
      });
    } else if (kw.density < 0.5) {
      suggestions.push({
        type: 'warning',
        message: `מילת המפתח "${kw.keyword}" מופיעה מעט מדי (${kw.density}%).`,
        fix: 'הוסף את מילת המפתח עוד 1-2 פעמים.',
      });
    } else if (kw.density > 5) {
      suggestions.push({
        type: 'warning',
        message: `מילת המפתח "${kw.keyword}" מופיעה יותר מדי (${kw.density}%).`,
        fix: 'הפחת שימוש - יש סכנה ל-keyword stuffing.',
      });
    }

    if (!kw.inTitle) {
      suggestions.push({
        type: 'warning',
        message: `מילת המפתח "${kw.keyword}" לא בכותרת.`,
        fix: 'הוסף את מילת המפתח לכותרת ה-H1.',
      });
    }

    if (!kw.inFirstParagraph) {
      suggestions.push({
        type: 'info',
        message: `מילת המפתח "${kw.keyword}" לא בפסקה הראשונה.`,
        fix: 'רצוי להוסיף מילת מפתח בפסקת הפתיחה.',
      });
    }
  });

  // Readability suggestions
  if (readability.score < 50) {
    suggestions.push({
      type: 'warning',
      message: `הקריאות נמוכה (${readability.score}/100).`,
      fix: readability.suggestions.join(' '),
    });
  }

  return suggestions;
}

/**
 * Calculates overall SEO score
 */
function calculateSEOScore(
  keywords: KeywordAnalysis[],
  readability: ReadabilityScore,
  meta: MetaAnalysis
): number {
  let score = 0;

  // Keywords contribution (40 points)
  const avgKeywordProminence =
    keywords.reduce((sum, kw) => sum + kw.prominence, 0) / keywords.length;
  score += (avgKeywordProminence / 100) * 40;

  // Readability contribution (30 points)
  score += (readability.score / 100) * 30;

  // Meta tags contribution (30 points)
  if (meta.hasH1) score += 10;
  if (meta.titleOptimal) score += 10;
  if (meta.headingsStructure.length >= 3) score += 10;

  return Math.round(score);
}

/**
 * Main SEO analysis function
 */
export async function analyzeSEO(
  content: string,
  targetKeywords: string[],
  title?: string
): Promise<SEOAnalysis> {
  if (!content || targetKeywords.length === 0) {
    throw new Error('Content and keywords are required for SEO analysis');
  }

  const keywords = analyzeKeywords(content, targetKeywords);
  const readability = analyzeReadability(content);
  const meta = analyzeMetaTags(content, title);
  const suggestions = generateSuggestions(keywords, readability, meta);
  const score = calculateSEOScore(keywords, readability, meta);

  return {
    score,
    keywords,
    readability,
    meta,
    suggestions,
    lastAnalyzed: new Date(),
  };
}

/**
 * Quick SEO score calculation (no detailed analysis)
 */
export function quickSEOScore(content: string, targetKeywords: string[]): number {
  if (!content || targetKeywords.length === 0) return 0;

  const keywords = analyzeKeywords(content, targetKeywords);
  const readability = analyzeReadability(content);
  const meta = analyzeMetaTags(content);

  return calculateSEOScore(keywords, readability, meta);
}

/**
 * Validates if content meets minimum SEO requirements
 */
export function validateSEORequirements(content: string, targetKeywords: string[]): boolean {
  const keywords = analyzeKeywords(content, targetKeywords);
  const meta = analyzeMetaTags(content);

  // Minimum requirements
  const hasH1 = meta.hasH1;
  const hasKeywordsInContent = keywords.every((kw) => kw.density > 0);
  const hasKeywordInTitle = keywords.some((kw) => kw.inTitle);

  return hasH1 && hasKeywordsInContent && hasKeywordInTitle;
}
