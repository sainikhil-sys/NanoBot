import { NextRequest, NextResponse } from "next/server";
import { GmailService } from "@/lib/tools/personal/gmail-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || undefined;
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const maxResults = Number(searchParams.get("maxResults") || 10);

    const result = await GmailService.searchEmails({
      query,
      unreadOnly,
      maxResults,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, to, subject, bodyText, threadId, recipientName, topicOrIntent, tone } = body;

    if (action === "draft") {
      const draft = await GmailService.draftReply({
        recipientName: recipientName || "Colleague",
        topicOrIntent: topicOrIntent || "Follow up on our discussion",
        tone,
      });
      return NextResponse.json({ success: true, draft });
    }

    if (action === "send") {
      if (!to || !subject || !bodyText) {
        return NextResponse.json({ success: false, error: "Missing to, subject, or bodyText" }, { status: 400 });
      }
      const sendResult = await GmailService.sendEmail({
        to,
        subject,
        bodyText,
        threadId,
      });
      return NextResponse.json(sendResult);
    }

    return NextResponse.json({ success: false, error: "Invalid action specified." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
