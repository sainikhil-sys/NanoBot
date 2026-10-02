import { NextRequest, NextResponse } from "next/server";
import { DbService } from "@/lib/supabase/db-service";

export async function GET() {
  try {
    const requests = await DbService.listApprovalRequests();
    return NextResponse.json({ success: true, requests });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status || (status !== "approved" && status !== "rejected")) {
      return NextResponse.json({ success: false, error: "id and valid status ('approved' | 'rejected') are required" }, { status: 400 });
    }

    const updated = await DbService.updateApprovalRequestStatus(id, status);

    await DbService.createAuditLog({
      user_id: "usr-prod-001",
      action: status === "approved" ? "approve_request" : "reject_request",
      tool: "approval_manager",
      target: id,
      permission_level: "EXECUTE",
      approval_status: status === "approved" ? "user_approved" : "rejected",
      result_status: "success",
      metadata: { requestId: id, decision: status },
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
