import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const revalidate = 3600;

export async function GET() {
  try {
    const res = await fetch('https://chromereleases.googleblog.com/feeds/posts/default?alt=json');
    const data = await res.json();
    const allEntries = data.feed?.entry || [];

    // Filter for Stable Channel, ChromeOS, or Chrome Browser
    const relevantUpdates = allEntries.filter((entry: any) => {
      const title = entry.title?.$t?.toLowerCase() || '';
      
      const isStable = title.includes('stable');
      const isChromeOS = title.includes('chromeos') || title.includes('chrome os');
      const isBrowser = title.includes('desktop') || title.includes('chrome browser');
      const isBeta = title.includes('beta') || title.includes('dev');

      return (isStable || isChromeOS || isBrowser) && !isBeta;
    }).slice(0, 5); // Take top 5 to avoid timeouts

    const updatesData = relevantUpdates.map((entry: any) => {
      const rawContent = entry.content?.$t || '';
      const cleanContent = rawContent.replace(/<[^>]*>?/gm, ' ').substring(0, 800) + '...';
      return {
        title: entry.title?.$t || 'Untitled',
        content: cleanContent,
        link: entry.link?.find((l: any) => l.rel === 'alternate')?.href || '#'
      };
    });

    if (updatesData.length === 0) {
      return NextResponse.json({ updates: [] });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are a Google Chrome Education Specialist. 
      I am providing you with the latest Google Chrome Release Notes.
      
      For each update, explain what the update is, and then explicitly state "Why it matters for K-12".
      Keep the explanations concise and relevant to schools.
      
      Here are the updates:
      ${JSON.stringify(updatesData, null, 2)}
      
      Analyze each one and return a strictly formatted JSON object (no markdown, just valid JSON) matching this exact schema:
      {
        "updates": [
          {
            "title": "Update Title",
            "summary": "A brief 2-3 sentence summary of the Chrome update.",
            "k12Importance": "Why this matters for a K-12 environment (2-3 sentences).",
            "link": "The URL provided in the data"
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
    console.error('Error generating Chrome updates:', error);
    return NextResponse.json({ error: 'Failed to generate Chrome updates' }, { status: 500 });
  }
}
