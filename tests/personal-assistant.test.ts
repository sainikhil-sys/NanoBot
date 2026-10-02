import { describe, it, expect } from "vitest";
import { GmailService } from "@/lib/tools/personal/gmail-service";
import { CalendarService } from "@/lib/tools/personal/calendar-service";
import { TasksService } from "@/lib/tools/personal/tasks-service";
import { MemoryService } from "@/lib/tools/personal/memory-service";
import { LinkedInService } from "@/lib/tools/personal/linkedin-service";
import { BriefingService } from "@/lib/tools/personal/briefing-service";
import { PersonalOrchestrator } from "@/lib/orchestration/personal-orchestrator";
import { TaskRouter } from "@/lib/ai/routing/task-router";
import { SYSTEM_TOOLS } from "@/lib/tools/tool-registry";

describe("Personal AI Assistant Module Suite", () => {
  describe("1. Gmail Semantic Email Classification", () => {
    it("classifies high urgency emails with urgencyScore >= 90", () => {
      const result = GmailService.classifyEmail(
        "URGENT: Production Server Deployment Alert",
        "We are seeing a critical issue with the database cluster. Immediate attention required ASAP.",
        "devops@cogniqa.systems"
      );
      expect(result.category).toBe("URGENT");
      expect(result.urgencyScore).toBeGreaterThanOrEqual(90);
      expect(result.responseRequired).toBe(true);
    });

    it("identifies calendar invites and meeting requests", () => {
      const result = GmailService.classifyEmail(
        "Sync on NanoBot Personal Assistant",
        "Can we schedule a 30 min call on Google Meet to discuss the architecture? RSVP if this time works.",
        "rahul@cogniqa.systems"
      );
      expect(result.category).toBe("MEETING");
      expect(result.responseRequired).toBe(true);
      expect(result.detectedAction).toContain("meeting");
    });

    it("drafts concise and professional replies", async () => {
      const draft = await GmailService.draftReply({
        recipientName: "Rahul",
        topicOrIntent: "I will review the proposal and send it tomorrow morning.",
        tone: "concise",
      });
      expect(draft.to).toBe("Rahul");
      expect(draft.subject).toContain("Re:");
      expect(draft.body).toContain("send it tomorrow");
    });
  });

  describe("2. Google Calendar Free Slot Calculation", () => {
    it("calculates and ranks open time slots during working hours", async () => {
      const date = "2026-08-14";
      const result = await CalendarService.findAvailableSlots({
        date,
        durationMinutes: 30,
        preferredTimeOfDay: "afternoon",
      });
      expect(result.connected).toBe(true);
      expect(result.slots.length).toBeGreaterThan(0);
      expect(result.slots[0].durationMinutes).toBe(30);
      expect(result.slots[0].score).toBeGreaterThanOrEqual(80);
    });

    it("prepares meeting proposals without causing external mutations", () => {
      const proposal = CalendarService.prepareEvent({
        title: "Sprint Retrospective",
        startTime: "2026-08-14T14:00:00.000Z",
        endTime: "2026-08-14T14:30:00.000Z",
        attendees: ["team@cogniqa.systems"],
      });
      expect(proposal.title).toBe("Sprint Retrospective");
      expect(proposal.attendees).toContain("team@cogniqa.systems");
    });
  });

  describe("3. Personal Tasks & AI Auto-Extraction", () => {
    it("creates and retrieves personal tasks with priority", async () => {
      const task = await TasksService.createTask({
        title: "Prepare presentation for Friday board review",
        priority: "high",
        category: "Work",
      });
      expect(task.id).toBeDefined();
      expect(task.priority).toBe("high");
      expect(task.status).toBe("pending");
    });

    it("extracts action items from unstructured text snippets", () => {
      const notes = `Meeting Summary:
- [ ] Deploy Next.js 15 update before Friday
- [ ] Follow up with the investor regarding term sheet
Please review the security report ASAP.`;

      const extracted = TasksService.extractTasksFromText(notes);
      expect(extracted.length).toBeGreaterThanOrEqual(2);
      expect(extracted.some((t) => t.title.includes("Deploy Next.js"))).toBe(true);
    });
  });

  describe("4. Personal Memory System", () => {
    it("stores and retrieves structured facts by category", async () => {
      const mem = await MemoryService.storeMemory({
        category: "preferences",
        key: "Meeting Availability",
        value: "Prefers morning meetings after 10 AM",
      });
      expect(mem.category).toBe("preferences");

      const results = await MemoryService.searchMemories("morning meetings");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].value).toContain("10 AM");
    });
  });

  describe("5. LinkedIn Studio", () => {
    it("generates structured thought leadership posts with hashtags and hooks", () => {
      const post = LinkedInService.generatePost({
        topic: "NanoBot Personal AI Architecture",
        tone: "thought_leadership",
      });
      expect(post.hook).toContain("landscape of AI");
      expect(post.hashtags.length).toBeGreaterThan(3);
      expect(post.fullPost).toContain("#AI");
    });
  });

  describe("6. Daily AI Briefing Synthesis", () => {
    it("synthesizes emails, calendar, tasks, and recommendations", async () => {
      const briefing = await BriefingService.generateDailyBriefing();
      expect(briefing.date).toBeDefined();
      expect(briefing.summary).toBeDefined();
      expect(briefing.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe("7. Personal Orchestrator & Natural Language Routing", () => {
    it("routes 'Check my important emails' to GMAIL_SEARCH", async () => {
      const result = await PersonalOrchestrator.handlePersonalPrompt("Check my important emails");
      expect(result).not.toBeNull();
      expect(result?.intentType).toBe("GMAIL_SEARCH");
    });

    it("routes 'Do I have any meetings tomorrow?' to CALENDAR_QUERY", async () => {
      const result = await PersonalOrchestrator.handlePersonalPrompt("Do I have any meetings tomorrow?");
      expect(result).not.toBeNull();
      expect(result?.intentType).toBe("CALENDAR_QUERY");
    });

    it("routes 'What should I focus on today?' to DAILY_BRIEFING", async () => {
      const result = await PersonalOrchestrator.handlePersonalPrompt("What should I focus on today?");
      expect(result).not.toBeNull();
      expect(result?.intentType).toBe("DAILY_BRIEFING");
    });

    it("routes 'Draft a reply to Rahul saying I will send it tomorrow' to GMAIL_DRAFT", async () => {
      const result = await PersonalOrchestrator.handlePersonalPrompt("Draft a reply to Rahul saying I will send it tomorrow");
      expect(result).not.toBeNull();
      expect(result?.intentType).toBe("GMAIL_DRAFT");
      expect(result?.actionCard?.type).toBe("email_draft");
    });

    it("TaskRouter accurately classifies personal queries into personal-assistant bot", () => {
      const decision = TaskRouter.route("Find a free slot tomorrow afternoon for meeting");
      expect(decision.botId).toBe("personal-assistant");
      expect(decision.category).toBe("Executive");
    });
  });

  describe("8. 3-Tier Permission Matrix Validation", () => {
    it("enforces permission level metadata across all registered tools", () => {
      expect(SYSTEM_TOOLS.gmail_search.permissionLevel).toBe("READ");
      expect(SYSTEM_TOOLS.calendar_availability.permissionLevel).toBe("READ");
      expect(SYSTEM_TOOLS.tasks_create.permissionLevel).toBe("PREPARE");
      expect(SYSTEM_TOOLS.memory_store.permissionLevel).toBe("PREPARE");
      expect(SYSTEM_TOOLS.linkedin_prepare_post.permissionLevel).toBe("PREPARE");
    });
  });
});
