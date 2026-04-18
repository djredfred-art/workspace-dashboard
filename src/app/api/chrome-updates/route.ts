import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const revalidate = 3600;

export async function GET() {
  try {
    // 1. Fetch current stable milestone
    const dashRes = await fetch('https://chromiumdash.appspot.com/fetch_releases?channel=Stable&platform=Windows&num=1');
    const dashData = await dashRes.json();
    const milestone = dashData[0]?.milestone || 147; // fallback

    // 2. Fetch Enterprise features for that milestone
    const entRes = await fetch(`https://release-notes-787862449254.us-central1.run.app/features?version=${milestone}`);
    const entData = await entRes.json();
    const features = entData.features || [];

    // Filter to limit tokens and pick relevant items
    const relevantUpdates = features.slice(0, 5);

    const updatesData = relevantUpdates.map((feature: any) => {
      const rawContent = feature.summary || '';
      const cleanContent = rawContent.replace(/<[^>]*>?/gm, ' ').substring(0, 800) + '...';
      return {
        title: feature.name || 'Chrome Enterprise Update',
        content: cleanContent,
        link: 'https://chromeenterprise.google/resources/release-notes/'
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
