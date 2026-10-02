import { NextRequest, NextResponse } from "next/server";
import { LinkedInService } from "@/lib/tools/personal/linkedin-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, topic, tone, targetAudience, postText } = body;

    if (action === "generate") {
      if (!topic) {
        return NextResponse.json({ success: false, error: "Topic is required" }, { status: 400 });
      }
      const draft = LinkedInService.generatePost({
        topic,
        tone,
        targetAudience,
      });
      return NextResponse.json({ success: true, draft });
    }

    if (action === "publish") {
      if (!postText) {
        return NextResponse.json({ success: false, error: "Post text is required" }, { status: 400 });
      }
      const result = await LinkedInService.publishPost(postText);
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
