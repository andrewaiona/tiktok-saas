import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export type AnalysisResult = {
    isRelevant: boolean;
    relevanceScore: number;
    reasoning: string;
};

export async function analyzeVideoContent(
    videoUrl: string,
    description: string,
    brandContext: string
): Promise<AnalysisResult> {
    // Check if API key is valid
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.length < 10) {
        console.warn("⚠️  GEMINI_API_KEY not configured. Using mock analysis.");
        return mockAnalysis(description, brandContext);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
      You are a marketing expert. Analyze this TikTok video based on the following brand context:
      
      BRAND CONTEXT:
      ${brandContext}

      VIDEO INFORMATION:
      Description: "${description}"

      Determine if this video is relevant for the brand to engage with (e.g., commenting, collaborating).
      
      Return a JSON object with:
      - isRelevant: boolean
      - relevanceScore: number (0-100)
      - reasoning: string (brief explanation)
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Basic JSON parsing (Gemini usually returns markdown code blocks)
        let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonStr);

        return {
            isRelevant: data.isRelevant,
            relevanceScore: data.relevanceScore,
            reasoning: data.reasoning
        };
    } catch (error) {
        console.error("AI Analysis failed:", error);
        console.warn("⚠️  Falling back to mock analysis due to API error.");
        return mockAnalysis(description, brandContext);
    }
}

// Mock analysis for testing when API key is not configured
function mockAnalysis(description: string, brandContext: string): AnalysisResult {
    // Simple keyword matching as fallback
    const descLower = description.toLowerCase();
    const brandLower = brandContext.toLowerCase();

    // Extract some keywords from brand context
    const keywords = brandLower.match(/\b\w{4,}\b/g) || [];
    const matchCount = keywords.filter(kw => descLower.includes(kw)).length;

    const isRelevant = matchCount > 0;
    const relevanceScore = Math.min(matchCount * 25, 100);

    return {
        isRelevant,
        relevanceScore,
        reasoning: isRelevant
            ? `Mock analysis: Found ${matchCount} keyword match(es). Configure GEMINI_API_KEY for real AI analysis.`
            : `Mock analysis: No keyword matches found. Configure GEMINI_API_KEY for real AI analysis.`
    };
}

export async function generateComment(
    description: string,
    brandContext: string,
    persona: string
): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
You are a social media engagement expert. Write a TikTok comment that:

1. Feels GENUINE and ORGANIC (not spammy)
2. Relates naturally to the video content
3. Subtly promotes the product WITHOUT being pushy
4. Matches the brand persona: ${persona}
5. Is short (1-2 sentences max)
6. Uses casual language, emojis where appropriate

VIDEO DESCRIPTION:
"${description}"

BRAND TO PROMOTE:
${brandContext}

Write ONLY the comment text, nothing else. Make it conversational and authentic.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Comment generation failed:", error);
        return "This is so relatable! 💯";
    }
}
