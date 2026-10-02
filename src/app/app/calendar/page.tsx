"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import {
  Calendar,
  Clock,
  VideoCamera,
  Users,
  Plus,
  ArrowsClockwise,
  CheckCircle,
  Sparkle,
  GoogleLogo,
  Star,
} from "@phosphor-icons/react";
import { CalendarEventItem } from "@/types/database.types";
import { AvailableSlot } from "@/lib/tools/personal/calendar-service";

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [connected, setConnected] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [scheduleModalOpen, setScheduleModalOpen] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [meetingTitle, setMeetingTitle] = useState<string>("Sync Discussion");
  const [attendeeEmail, setAttendeeEmail] = useState<string>("");
  const [schedulingState, setSchedulingState] = useState<"idle" | "booking" | "booked">("idle");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/calendar");
      const json = await res.json();
      if (json.success) {
        setEvents(json.events || []);
        setAvailableSlots(json.slots || []);
        setConnected(json.connected ?? true);
      }
    } catch (err) {
      console.error("Failed to load calendar:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, []);

  const handleBookSlot = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setScheduleModalOpen(true);
    setSchedulingState("idle");
  };

  const handleConfirmSchedule = async () => {
    if (!selectedSlot || !meetingTitle.trim()) return;
    try {
      setSchedulingState("booking");
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          title: meetingTitle,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          attendees: attendeeEmail ? [attendeeEmail] : [],
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSchedulingState("booked");
        setToastMessage(`Meeting "${meetingTitle}" confirmed and added to your calendar!`);
        setTimeout(() => {
          setScheduleModalOpen(false);
          setToastMessage(null);
          fetchCalendar();
        }, 1800);
      }
    } catch (err) {
      console.error("Failed to create event:", err);
      setSchedulingState("idle");
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-neutral-950 text-neutral-100 font-sans">
      <Header
        title="Google Calendar & Smart Agenda"
        subtitle="AI schedule planning, intelligent free slot calculation, and meeting preparation."
        actions={
          <button
            onClick={fetchCalendar}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-200 transition"
          >
            <ArrowsClockwise className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Calendar</span>
          </button>
        }
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 space-y-6">
        {toastMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" weight="fill" />
            <span>{toastMessage}</span>
          </div>
        )}

        {!connected ? (
          <div className="p-12 rounded-3xl bg-neutral-900/60 border border-neutral-800 text-center max-w-xl mx-auto space-y-5 my-12">
            <div className="w-16 h-16 rounded-2xl bg-neutral-800 text-white flex items-center justify-center mx-auto shadow-inner">
              <GoogleLogo className="w-8 h-8" weight="bold" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-neutral-100">Connect Google Calendar</h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Connect your Google account in Connected Accounts to view meetings, calculate open slots,
                and schedule calls using natural language.
              </p>
            </div>
            <Link
              href="/app/connected-accounts"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-semibold transition"
            >
              <GoogleLogo className="w-4 h-4" weight="bold" />
              <span>Connect Google Account</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Agenda & Upcoming Meetings */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  Upcoming Agenda & Events
                </h3>
                <span className="text-xs text-neutral-400 font-mono">{events.length} Events</span>
              </div>

              <div className="space-y-3">
                {events.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-neutral-900/40 border border-neutral-800 text-center text-xs text-neutral-400 space-y-2">
                    <Calendar className="w-8 h-8 text-neutral-400 mx-auto" />
                    <p>No upcoming meetings found on your calendar for this week.</p>
                  </div>
                ) : (
                  events.map((ev) => {
                    const start = new Date(ev.startTime);
                    const end = new Date(ev.endTime);

                    return (
                      <div
                        key={ev.id}
                        className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition flex flex-col gap-2.5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-sm font-semibold text-neutral-100">{ev.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                {start.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })} •{" "}
                                {start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} –{" "}
                                {end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>

                          {ev.meetLink && (
                            <a
                              href={ev.meetLink}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 border border-sky-500/30 text-xs font-medium transition"
                            >
                              <VideoCamera className="w-3.5 h-3.5" />
                              <span>Join Call</span>
                            </a>
                          )}
                        </div>

                        {ev.attendees.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-neutral-400">
                            <Users className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span className="truncate">
                              Attendees: {ev.attendees.map((a) => a.name || a.email).join(", ")}
                            </span>
                          </div>
                        )}

                        {ev.prepNotes && (
                          <div className="p-2 rounded-lg bg-neutral-950/80 border border-neutral-800 text-[11px] text-neutral-300">
                            💡 <strong>AI Prep</strong>: {ev.prepNotes}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: AI Free Slot Finder & Instant Scheduling */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                  <Sparkle className="w-4 h-4 text-amber-400" />
                  Recommended Free Slots
                </h3>
                <span className="text-xs text-amber-400 font-mono">Ranked by AI</span>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                <p className="text-xs text-neutral-400 leading-relaxed">
                  NanoBot scans your calendar, factors in working hours (9 AM - 6 PM), and calculates non-conflicting time slots with optimal buffers.
                </p>

                <div className="space-y-3">
                  {availableSlots.length === 0 ? (
                    <div className="p-6 text-center text-xs text-neutral-400">
                      Calculating optimal slots...
                    </div>
                  ) : (
                    availableSlots.map((slot, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 transition flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-xs font-semibold text-neutral-200">{slot.formattedTime}</div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">{slot.formattedDate} • {slot.durationMinutes}m</div>
                          <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3" weight="fill" />
                            <span>{slot.rationale} ({slot.score}% match)</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleBookSlot(slot)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-semibold transition shrink-0"
                        >
                          Book Slot
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Meeting Confirmation Modal */}
        {scheduleModalOpen && selectedSlot && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  Schedule Calendar Invitation
                </h3>
                <button onClick={() => setScheduleModalOpen(false)} className="text-neutral-400 hover:text-neutral-200 text-xs">
                  Cancel
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-neutral-300 block mb-1 font-semibold">Meeting Title:</label>
                  <input
                    type="text"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs focus:outline-hidden focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="text-neutral-300 block mb-1 font-semibold">Selected Slot:</label>
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 font-mono text-xs">
                    {selectedSlot.formattedDate} • {selectedSlot.formattedTime} ({selectedSlot.durationMinutes} min)
                  </div>
                </div>

                <div>
                  <label className="text-neutral-300 block mb-1 font-semibold">Attendee Email (Optional):</label>
                  <input
                    type="email"
                    placeholder="colleague@example.com"
                    value={attendeeEmail}
                    onChange={(e) => setAttendeeEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs focus:outline-hidden focus:border-sky-400"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/20 text-sky-300 text-[11px] leading-relaxed">
                🛡️ <strong>Safety Check</strong>: Calendar events are created only after explicit confirmation.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setScheduleModalOpen(false)}
                  disabled={schedulingState === "booking"}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSchedule}
                  disabled={schedulingState === "booking" || !meetingTitle.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-semibold transition"
                >
                  <Calendar className="w-3.5 h-3.5" weight="fill" />
                  <span>{schedulingState === "booking" ? "Scheduling..." : schedulingState === "booked" ? "Confirmed!" : "Confirm & Schedule"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
