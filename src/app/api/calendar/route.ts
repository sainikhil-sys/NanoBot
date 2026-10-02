import { NextRequest, NextResponse } from "next/server";
import { CalendarService } from "@/lib/tools/personal/calendar-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const duration = Number(searchParams.get("duration") || 30);
    const preferredTimeOfDay = searchParams.get("preferredTimeOfDay") as any;

    const [eventsRes, slotsRes] = await Promise.all([
      CalendarService.listEvents({ maxResults: 10 }),
      CalendarService.findAvailableSlots({
        date,
        durationMinutes: duration,
        preferredTimeOfDay,
      }),
    ]);

    return NextResponse.json({
      success: true,
      events: eventsRes.events,
      slots: slotsRes.slots,
      connected: eventsRes.connected,
      notice: eventsRes.notice,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, title, description, startTime, endTime, attendees, location } = body;

    if (action === "create") {
      if (!title || !startTime || !endTime) {
        return NextResponse.json({ success: false, error: "Title, startTime, and endTime are required" }, { status: 400 });
      }
      const createRes = await CalendarService.createEvent({
        title,
        description,
        startTime,
        endTime,
        attendees,
        location,
      });
      return NextResponse.json(createRes);
    }

    return NextResponse.json({ success: false, error: "Invalid calendar action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
