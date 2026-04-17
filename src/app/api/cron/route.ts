import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET(request: Request) {
  // Validate Vercel Cron Request
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS, // This should be a Gmail App Password
      },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'your Vercel app URL';

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: 'fred.aldrich@amplifiedit.cdw.com',
      subject: 'Daily Google Workspace Updates Dashboard is Ready',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #3b82f6;">Good morning!</h2>
          <p>The latest Google Workspace Updates and Industry News have been fetched for today.</p>
          <p>You can view the full dashboard and verify the changes here:</p>
          <a href="${siteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">View Dashboard</a>
          <p style="margin-top: 30px; font-size: 0.9em; color: #777;">
            Automated by your local Antigravity AI Assistant.<br/>
            Running on Vercel Cron Jobs.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);

    return NextResponse.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending cron email:', error);
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 });
  }
}
