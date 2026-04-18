import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const revalidate = 3600; // Cache the AI response for 1 hour to save API calls

export async function GET() {
  try {
    // 1. Fetch latest news
    const parser = new Parser();
    const feed = await parser.parseURL('https://news.google.com/rss/search?q=schools+technology+AI+Google&hl=en-US&gl=US&ceid=US:en');
    
    const articles = feed.items.slice(0, 10).map(item => ({
      title: item.title,
      snippet: item.contentSnippet || ''
    }));

    // 2. Initialize Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 3. Create the Prompt
    const prompt = `
      You are an expert Education Technology consultant. Analyze the following recent news headlines and summaries regarding AI and technology in schools:
      
      ${JSON.stringify(articles, null, 2)}
      
      Based on these articles, identify 3 specific, actionable app ideas that could solve the problems or harness the trends mentioned.
      Return your response in clean JSON format matching exactly this structure:
      {
        "ideas": [
          {
            "title": "App Name",
            "problem": "A 1-sentence description of the problem identified in the news.",
            "solution": "A 2-3 sentence description of how the app solves it."
          }
        ]
      }
      Make sure to return ONLY valid JSON and nothing else. No markdown formatting blocks like \`\`\`json.
    `;

    // 4. Call Gemini
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Parse the JSON
    // Clean up potential markdown blocks if the model ignored the instruction
    const cleanText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const data = JSON.parse(cleanText);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error analyzing news with Gemini:', error);
    return NextResponse.json({ error: 'Failed to analyze news' }, { status: 500 });
  }
}
