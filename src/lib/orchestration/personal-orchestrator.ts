import { GmailService } from "@/lib/tools/personal/gmail-service";
import { CalendarService } from "@/lib/tools/personal/calendar-service";
import { DriveService } from "@/lib/tools/personal/drive-service";
import { TasksService } from "@/lib/tools/personal/tasks-service";
import { MemoryService } from "@/lib/tools/personal/memory-service";
import { LinkedInService } from "@/lib/tools/personal/linkedin-service";
import { BriefingService } from "@/lib/tools/personal/briefing-service";
import { DbService } from "@/lib/supabase/db-service";

export interface PersonalIntentResult {
  handled: boolean;
  intentType: string;
  responseMarkdown: string;
  actionCard?: {
    type: "email_draft" | "calendar_proposal" | "task_list" | "linkedin_post" | "briefing_card";
    title: string;
    data: Record<string, unknown>;
  };
  toolsInvoked: string[];
}

export class PersonalOrchestrator {
  /**
   * Evaluates if the prompt contains a personal assistant intent and executes the required workflow.
   */
  static async handlePersonalPrompt(prompt: string, userId?: string): Promise<PersonalIntentResult | null> {
    const raw = prompt.trim();
    const p = raw.toLowerCase();

    // 1. DAILY BRIEFING / WHAT TO FOCUS ON
    if (
      p.includes("what should i focus on") ||
      p.includes("morning briefing") ||
      p.includes("daily briefing") ||
      p.includes("my daily briefing") ||
      p.includes("overview of my day") ||
      p.includes("what's on my plate") ||
      p.includes("what do i have today")
    ) {
      const briefing = await BriefingService.generateDailyBriefing(userId);
      let md = `### ☀️ Good day, Nikhil!\n\nHere is your **Personal AI Briefing**:\n\n`;

      md += `#### 📬 Emails & Inquiries\n`;
      if (briefing.email_highlights.length > 0) {
        briefing.email_highlights.forEach((e) => {
          md += `- **[${e.category}]** ${e.subject} *(from ${e.from})*\n  *Action: ${e.actionRequired || e.summary}*\n`;
        });
      } else {
        md += `*All important inboxes are clear.*\n`;
      }

      md += `\n#### 📅 Calendar & Agenda\n`;
      if (briefing.calendar_highlights.length > 0) {
        briefing.calendar_highlights.forEach((c) => {
          const time = new Date(c.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
          md += `- **${c.title}** at **${time}** with ${c.attendees.join(", ") || "team"}\n`;
        });
      } else {
        md += `*No upcoming meetings scheduled for today.*\n`;
      }

      md += `\n#### 🎯 Tasks & Deadlines\n`;
      if (briefing.task_highlights.length > 0) {
        briefing.task_highlights.forEach((t) => {
          md += `- **[${t.priority.toUpperCase()}]** ${t.title}${t.isOverdue ? " ⚠️ *Overdue*" : ""}\n`;
        });
      } else {
        md += `*No urgent pending tasks.*\n`;
      }

      md += `\n#### 💡 AI Recommendations\n`;
      briefing.recommendations.forEach((r, i) => {
        md += `${i + 1}. ${r}\n`;
      });

      return {
        handled: true,
        intentType: "DAILY_BRIEFING",
        responseMarkdown: md,
        actionCard: {
          type: "briefing_card",
          title: "Today's Personal Briefing",
          data: briefing as any,
        },
        toolsInvoked: ["briefing_generate", "gmail_search", "calendar_list", "tasks_list"],
      };
    }

    // 2. GMAIL: CHECK IMPORTANT EMAILS / INBOX
    if (
      p.includes("check my email") ||
      p.includes("check my emails") ||
      p.includes("check my inbox") ||
      p.includes("important emails") ||
      p.includes("unread emails") ||
      p.includes("summarize my emails") ||
      p.includes("what emails do i have")
    ) {
      const emailRes = await GmailService.searchEmails({ unreadOnly: true, maxResults: 5 });
      if (!emailRes.connected) {
        return {
          handled: true,
          intentType: "GMAIL_SEARCH",
          responseMarkdown: `⚠️ **Google Workspace Not Connected**\n\nTo view and summarize your live emails, please connect your Google account in [Connected Accounts](/app/connected-accounts).`,
          toolsInvoked: ["gmail_search"],
        };
      }

      if (emailRes.emails.length === 0) {
        return {
          handled: true,
          intentType: "GMAIL_SEARCH",
          responseMarkdown: `📬 **Your inbox is completely caught up!**\n\nNo unread or urgent emails requiring immediate response at this moment.`,
          toolsInvoked: ["gmail_search"],
        };
      }

      let md = `📬 **Found ${emailRes.emails.length} unread/important email(s):**\n\n`;
      emailRes.emails.forEach((e, idx) => {
        md += `**${idx + 1}. [${e.classification.category}]** ${e.subject}\n`;
        md += `- **From:** ${e.fromName} (${e.from})\n`;
        md += `- **Urgency Score:** ${e.classification.urgencyScore}/100 | **Importance:** ${e.classification.importanceScore}/100\n`;
        if (e.classification.detectedAction) {
          md += `- **Detected Action:** ${e.classification.detectedAction}\n`;
        }
        md += `- **Snippet:** *"${e.snippet}"*\n\n`;
      });

      md += `💡 *Tip: You can ask me to "Draft a reply to ${emailRes.emails[0]?.fromName || "the sender"}" or "Create tasks from these emails".*`;

      return {
        handled: true,
        intentType: "GMAIL_SEARCH",
        responseMarkdown: md,
        toolsInvoked: ["gmail_search"],
      };
    }

    // 3. GMAIL: DRAFT REPLY (PREPARE TIER)
    if (
      p.startsWith("draft a reply") ||
      p.startsWith("draft reply") ||
      p.includes("reply to") ||
      p.includes("draft an email to")
    ) {
      // Extract recipient name and intent
      const recipientMatch = p.match(/(?:to|for)\s+([a-zA-Z]+)/i);
      const recipientName = recipientMatch ? recipientMatch[1] : "Recipient";

      const sayingMatch = p.match(/saying\s+(.+)$/i) || p.match(/that\s+(.+)$/i);
      const intentText = sayingMatch ? sayingMatch[1] : "I have received your message and will follow up shortly.";

      const draft = await GmailService.draftReply({
        recipientName: recipientName.charAt(0).toUpperCase() + recipientName.slice(1),
        topicOrIntent: intentText,
        tone: p.includes("friendly") ? "friendly" : p.includes("professional") ? "professional" : "concise",
      });

      const md = `✉️ **Prepared Email Draft for ${draft.to}**:\n\n\`\`\`text\nTo: ${draft.to}\nSubject: ${draft.subject}\n\n${draft.body}\n\`\`\`\n\n> 🛡️ **Safety Confirmation**: This email has **not** been sent. Click **Send Email** below or confirm to dispatch.`;

      return {
        handled: true,
        intentType: "GMAIL_DRAFT",
        responseMarkdown: md,
        actionCard: {
          type: "email_draft",
          title: `Draft for ${draft.to}`,
          data: draft as any,
        },
        toolsInvoked: ["gmail_draft"],
      };
    }

    // 4. CALENDAR: MEETINGS QUERY
    if (
      p.includes("do i have any meetings") ||
      p.includes("my meetings") ||
      p.includes("meetings tomorrow") ||
      p.includes("what meetings") ||
      p.includes("check my calendar") ||
      p.includes("calendar tomorrow")
    ) {
      const isTomorrow = p.includes("tomorrow");
      const targetDate = new Date();
      if (isTomorrow) targetDate.setDate(targetDate.getDate() + 1);

      const calRes = await CalendarService.listEvents({
        startDate: targetDate.toISOString(),
        maxResults: 5,
        userId,
      });

      if (!calRes.connected) {
        return {
          handled: true,
          intentType: "CALENDAR_QUERY",
          responseMarkdown: `⚠️ **Google Calendar Not Connected**\n\nTo view your schedule and schedule meetings, please connect Google Calendar in [Connected Accounts](/app/connected-accounts).`,
          toolsInvoked: ["calendar_list"],
        };
      }

      if (calRes.events.length === 0) {
        return {
          handled: true,
          intentType: "CALENDAR_QUERY",
          responseMarkdown: `📅 **Your calendar is completely open for ${isTomorrow ? "tomorrow" : "today"}!**\n\nNo scheduled meetings or conflicts found.`,
          toolsInvoked: ["calendar_list"],
        };
      }

      let md = `📅 **Scheduled Meetings for ${isTomorrow ? "Tomorrow" : "Today"}:**\n\n`;
      calRes.events.forEach((ev, idx) => {
        const start = new Date(ev.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        const end = new Date(ev.endTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        md += `**${idx + 1}. ${ev.title}**\n`;
        md += `- **Time:** ${start} – ${end}\n`;
        if (ev.attendees.length > 0) {
          md += `- **Attendees:** ${ev.attendees.map((a) => a.name || a.email).join(", ")}\n`;
        }
        if (ev.meetLink) {
          md += `- **Video Link:** [Join Meeting](${ev.meetLink})\n`;
        }
        if (ev.prepNotes) {
          md += `- **Prep Notes:** ${ev.prepNotes}\n`;
        }
        md += `\n`;
      });

      return {
        handled: true,
        intentType: "CALENDAR_QUERY",
        responseMarkdown: md,
        toolsInvoked: ["calendar_list"],
      };
    }

    // 5. CALENDAR: FIND FREE SLOTS & SCHEDULE MEETING
    if (
      p.includes("find a free slot") ||
      p.includes("free slot tomorrow") ||
      p.includes("schedule a meeting") ||
      p.includes("schedule meeting") ||
      p.includes("book a meeting")
    ) {
      const isTomorrow = p.includes("tomorrow");
      const isAfternoon = p.includes("afternoon");
      const isMorning = p.includes("morning");

      const targetDate = new Date();
      if (isTomorrow) targetDate.setDate(targetDate.getDate() + 1);

      const targetDateStr = targetDate.toISOString().split("T")[0];
      const slotRes = await CalendarService.findAvailableSlots({
        date: targetDateStr,
        durationMinutes: 30,
        preferredTimeOfDay: isAfternoon ? "afternoon" : isMorning ? "morning" : "any",
        userId,
      });

      const recipientMatch = p.match(/(?:with)\s+([a-zA-Z]+)/i);
      const recipientName = recipientMatch ? recipientMatch[1] : "Attendee";

      let md = `🗓️ **Found ${slotRes.slots.length} available slots for ${isTomorrow ? "tomorrow" : targetDateStr}**:\n\n`;
      slotRes.slots.forEach((s, idx) => {
        md += `**Option ${idx + 1}: ${s.formattedTime}** (${s.formattedDate})\n`;
        md += `*Rationale: ${s.rationale} (Score: ${s.score}/100)*\n\n`;
      });

      md += `> 🛡️ **Select an option to prepare the calendar invitation with ${recipientName}.**`;

      return {
        handled: true,
        intentType: "CALENDAR_AVAILABILITY",
        responseMarkdown: md,
        actionCard: {
          type: "calendar_proposal",
          title: `Schedule Meeting with ${recipientName}`,
          data: {
            recipientName,
            slots: slotRes.slots,
            targetDate: targetDateStr,
          },
        },
        toolsInvoked: ["calendar_availability"],
      };
    }

    // 6. TASKS: EXTRACT TASKS FROM EMAILS (CROSS-SERVICE WORKFLOW)
    if (
      p.includes("create tasks from") ||
      p.includes("tasks from email") ||
      p.includes("tasks from the emails")
    ) {
      const emailRes = await GmailService.searchEmails({ maxResults: 5 });
      const createdTasks = [];

      for (const e of emailRes.emails) {
        if (e.classification.detectedAction) {
          const task = await TasksService.createTask({
            title: e.classification.detectedAction,
            description: `Extracted from email: "${e.subject}" from ${e.fromName}`,
            priority: e.classification.urgencyScore > 75 ? "urgent" : e.classification.importanceScore > 60 ? "high" : "medium",
            category: "Email Follow-up",
            sourceType: "email",
            sourceId: e.id,
            userId,
          });
          createdTasks.push(task);
        }
      }

      let md = `✅ **Cross-Service Workflow Completed: Extracted ${createdTasks.length} Task(s) from Inbox**\n\n`;
      if (createdTasks.length > 0) {
        createdTasks.forEach((t, i) => {
          md += `${i + 1}. **[${t.priority.toUpperCase()}]** ${t.title}\n   *Source: ${t.category}*\n`;
        });
        md += `\nTasks are now tracked in your [Personal Tasks](/app/tasks) dashboard.`;
      } else {
        md += `No pending action items or tasks detected in recent emails.`;
      }

      return {
        handled: true,
        intentType: "TASKS_FROM_EMAIL",
        responseMarkdown: md,
        toolsInvoked: ["gmail_search", "tasks_create"],
      };
    }

    // 7. TASKS: REMIND ME / CREATE PERSONAL TASK
    if (
      p.startsWith("remind me to") ||
      p.startsWith("create a task") ||
      p.startsWith("create task") ||
      p.includes("add a task")
    ) {
      const extracted = TasksService.extractTasksFromText(raw);
      const first = extracted[0] || {
        title: raw.replace(/^remind me to\s*/i, "").trim(),
        priority: "medium",
        category: "Personal",
      };

      const task = await TasksService.createTask({
        title: first.title,
        priority: first.priority,
        dueDate: first.dueDate,
        category: first.category,
        sourceType: "chat",
        userId,
      });

      const dueFormatted = task.due_date ? ` (Due: ${new Date(task.due_date).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })})` : "";
      const md = `✅ **Created Task**: **"${task.title}"**${dueFormatted}\n\n- **Priority:** ${task.priority.toUpperCase()}\n- **Category:** ${task.category}\n- **Status:** Pending\n\nTracked in your [Personal Tasks](/app/tasks) list.`;

      return {
        handled: true,
        intentType: "TASKS_CREATE",
        responseMarkdown: md,
        toolsInvoked: ["tasks_create"],
      };
    }

    // 8. PERSONAL MEMORY: STORE FACT / PREFERENCE
    if (
      p.startsWith("remember that") ||
      p.startsWith("remember:") ||
      p.includes("prefer meetings after") ||
      p.includes("my preference is") ||
      p.includes("is my current ai project") ||
      p.includes("is working with me")
    ) {
      let category: any = "preferences";
      let key = "User Preference";
      let value = raw.replace(/^remember\s+that\s*/i, "").trim();

      if (p.includes("prefer") || p.includes("preference")) {
        category = "preferences";
        key = "Meeting & Communication Preference";
      } else if (p.includes("working with") || p.includes("colleague") || p.includes("team")) {
        category = "people";
        key = "Team & Collaborators";
      } else if (p.includes("project") || p.includes("nanobot")) {
        category = "projects";
        key = "Active Project";
      }

      const mem = await MemoryService.storeMemory({
        category,
        key,
        value,
        userId,
      });

      const md = `🧠 **Personal Memory Saved**\n\n- **Category:** \`${mem.category}\`\n- **Fact:** "${mem.value}"\n\nNanoBot will now factor this preference into all future personal recommendations and schedule planning. View and manage in [Personal Memory](/app/memory).`;

      return {
        handled: true,
        intentType: "MEMORY_STORE",
        responseMarkdown: md,
        toolsInvoked: ["memory_store"],
      };
    }

    // 9. LINKEDIN: POST CREATION (PREPARE TIER)
    if (
      p.includes("linkedin post") ||
      p.includes("post about nanobot") ||
      p.includes("thought leadership post")
    ) {
      const topicMatch = p.match(/(?:about|on)\s+(.+)$/i);
      const topic = topicMatch ? topicMatch[1] : "NanoBot Personal AI Assistant";

      const draft = LinkedInService.generatePost({
        topic,
        tone: p.includes("technical") ? "technical" : "thought_leadership",
      });

      const md = `💼 **LinkedIn Thought Leadership Post Drafted**:\n\n\`\`\`markdown\n${draft.fullPost}\n\`\`\`\n\n> 🛡️ **Preview & Controls**: Copy the formatted markdown or publish directly below if your LinkedIn account is connected.`;

      return {
        handled: true,
        intentType: "LINKEDIN_POST",
        responseMarkdown: md,
        actionCard: {
          type: "linkedin_post",
          title: "LinkedIn Post Ready",
          data: draft as any,
        },
        toolsInvoked: ["linkedin_prepare_post"],
      };
    }

    // 10. GOOGLE DRIVE: DOCUMENT SEARCH
    if (
      p.includes("in my drive") ||
      p.includes("find the proposal") ||
      p.includes("search drive") ||
      p.includes("search my drive")
    ) {
      const queryMatch = p.match(/(?:find|search|for)\s+(?:the\s+)?([^in]+?)(?:\s+in\s+drive|\s+in\s+my\s+drive|$)/i);
      const query = queryMatch ? queryMatch[1].trim() : "NanoBot Proposal";

      const driveRes = await DriveService.searchFiles({ query, userId });
      if (!driveRes.connected) {
        return {
          handled: true,
          intentType: "DRIVE_SEARCH",
          responseMarkdown: `⚠️ **Google Drive Not Connected**\n\nTo search your documents and connect Drive files to AI context, connect Drive in [Connected Accounts](/app/connected-accounts).`,
          toolsInvoked: ["drive_search"],
        };
      }

      let md = `📂 **Drive Search Results for "${query}":**\n\n`;
      if (driveRes.files.length > 0) {
        driveRes.files.forEach((f, i) => {
          md += `${i + 1}. **${f.name}**\n   - Modified: ${new Date(f.modifiedTime).toLocaleDateString()}\n   - [Open in Google Drive](${f.webViewLink || "#"})\n`;
        });
      } else {
        md += `No files matching "${query}" were found in your connected Google Drive.`;
      }

      return {
        handled: true,
        intentType: "DRIVE_SEARCH",
        responseMarkdown: md,
        toolsInvoked: ["drive_search"],
      };
    }

    return null;
  }
}
