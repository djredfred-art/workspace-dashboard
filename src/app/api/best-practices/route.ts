import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const revalidate = 3600;

export async function GET() {
  try {
    // 1. Fetch Google Workspace Updates
    const res = await fetch('https://workspaceupdates.googleblog.com/feeds/posts/default?alt=json');
    const data = await res.json();
    const allEntries = data.feed?.entry || [];

    // 2. Filter for Admin Console related updates
    const adminUpdates = allEntries.filter((entry: any) => {
      const title = entry.title?.$t?.toLowerCase() || '';
      const content = entry.content?.$t?.toLowerCase() || '';
      return title.includes('admin') || content.includes('admin console') || title.includes('setting');
    }).slice(0, 3); // Take the top 3 most recent admin updates to avoid overwhelming the LLM

    const updatesData = adminUpdates.map((entry: any) => {
      // Strip HTML tags for cleaner prompt
      const rawContent = entry.content?.$t || '';
      const cleanContent = rawContent.replace(/<[^>]*>?/gm, ' ').substring(0, 800) + '...';
      return {
        title: entry.title?.$t || 'Untitled',
        content: cleanContent,
        link: entry.link?.find((l: any) => l.rel === 'alternate')?.href || '#'
      };
    });

    if (updatesData.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // 3. Initialize Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 4. Prompt Gemini
    const prompt = `
      You are an expert Google Workspace Education Consultant. Your tone should be highly conversational, advisory, and helpful.
      I am providing you with the latest Google Workspace updates that introduce new Admin Console settings.
      
      For each update, explain what the setting does, and then provide tailored Best Practices on how a school district or university should configure it.
      
      Here are the updates:
      ${JSON.stringify(updatesData, null, 2)}
      
      Analyze each one and return a strictly formatted JSON object (no markdown, just valid JSON) matching this exact schema:
      {
        "recommendations": [
          {
            "title": "Update Title",
            "summary": "A brief conversational summary of what this new admin setting is.",
            "link": "The URL provided in the data",
            "k12Staff": "Your recommendation for K-12 Staff.",
            "k12Students": "Your recommendation for K-12 Students. If you deem it necessary, break this down into Elementary vs High School approaches.",
            "higherEd": "Your recommendation for Higher Education (university staff and students)."
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    const cleanText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const finalData = JSON.parse(cleanText);

    return NextResponse.json(finalData);
  } catch (error) {
    console.error('Error generating best practices:', error);
    return NextResponse.json({ error: 'Failed to generate best practices' }, { status: 500 });
  }
}
