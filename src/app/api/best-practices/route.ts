import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const revalidate = 3600;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    // 1. Fetch current stable milestone for Chrome
    const dashRes = await fetch('https://chromiumdash.appspot.com/fetch_releases?channel=Stable&platform=Windows&num=1');
    const dashData = await dashRes.json();
    const milestone = dashData[0]?.milestone || 147;

    // 2. Fetch both feeds
    const [workspaceRes, entRes] = await Promise.all([
      fetch('https://workspaceupdates.googleblog.com/feeds/posts/default?alt=json'),
      fetch(`https://release-notes-787862449254.us-central1.run.app/features?version=${milestone}`)
    ]);

    const workspaceData = await workspaceRes.json();
    const entData = await entRes.json();

    const workspaceEntries = workspaceData.feed?.entry || [];
    const chromeEntries = entData.features || [];

    // Tag and merge
    const allEntries = [
      ...workspaceEntries.map((e: any) => ({ 
        source: 'Workspace',
        title: e.title?.$t || '',
        content: e.content?.$t || '',
        published: e.published?.$t || 0,
        link: e.link?.find((l: any) => l.rel === 'alternate')?.href || '#'
      })),
      ...chromeEntries.map((e: any) => ({ 
        source: 'Chrome',
        title: e.name || '',
        content: e.summary || '',
        published: e.updated?.when || e.created?.when || 0,
        link: 'https://chromeenterprise.google/resources/release-notes/'
      }))
    ];

    // Sort by published date descending
    allEntries.sort((a: any, b: any) => {
      const dateA = new Date(a.published).getTime();
      const dateB = new Date(b.published).getTime();
      return dateB - dateA;
    });

    // 3. Filter for Admin Console / Policy related updates
    const adminUpdates = allEntries.filter((entry: any) => {
      const title = entry.title.toLowerCase();
      const content = entry.content.toLowerCase();
      
      const isWeeklyRecap = title.includes('weekly recap');
      
      let isRelevant = false;
      if (entry.source === 'Workspace') {
        const mentionsAdmin = title.includes('admin') || content.includes('admin console') || title.includes('setting');
        const isForEducation = content.includes('education');
        isRelevant = mentionsAdmin && isForEducation;
      } else {
        // Chrome Enterprise features are by definition for admins/enterprise
        isRelevant = true;
      }
      
      return !isWeeklyRecap && isRelevant;
    });

    // Apply pagination to avoid Gemini timeout
    const paginatedUpdates = adminUpdates.slice(skip, skip + limit);

    if (paginatedUpdates.length === 0) {
      return NextResponse.json({ recommendations: [], hasMore: false });
    }

    const updatesData = paginatedUpdates.map((entry: any) => {
      const rawContent = entry.content || '';
      const cleanContent = rawContent.replace(/<[^>]*>?/gm, ' ').substring(0, 800) + '...';
      return {
        source: entry.source,
        title: entry.title || 'Untitled',
        content: cleanContent,
        link: entry.link || '#'
      };
    });

    // 3. Initialize Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 4. Prompt Gemini
    const prompt = `
      You are an expert Google Workspace and Chrome Education Consultant.
      I am providing you with the latest Google Workspace and Chrome updates that introduce new Admin Console settings or Chrome policies.
      
      For each update, explain what the setting does, and then provide tailored Best Practices on how a school district or university should configure it.
      
      For the recommendations, keep the conversational piece short. Provide the recommendation, and then the 'why'.
      Each recommendation MUST be exactly 2 to 3 sentences long.
      
      Here are the updates:
      ${JSON.stringify(updatesData, null, 2)}
      
      Analyze each one and return a strictly formatted JSON object (no markdown, just valid JSON) matching this exact schema:
      {
        "recommendations": [
          {
            "title": "Update Title",
            "summary": "A brief 1-sentence summary of what this new admin setting is.",
            "link": "The URL provided in the data",
            "k12Staff": "The recommendation, then the why. (2 to 3 sentences).",
            "k12Students": "The recommendation, then the why. Differentiate Elementary vs High School if applicable. (2 to 3 sentences).",
            "higherEd": "The recommendation, then the why. (2 to 3 sentences)."
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    const cleanText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const finalData = JSON.parse(cleanText);
    
    // Check if there are more updates beyond this slice
    finalData.hasMore = adminUpdates.length > skip + limit;

    return NextResponse.json(finalData);
  } catch (error) {
    console.error('Error generating best practices:', error);
    return NextResponse.json({ error: 'Failed to generate best practices' }, { status: 500 });
  }
}
