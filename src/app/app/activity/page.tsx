"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { StatusPill } from "@/components/ui/status-pill";
import { formatDate } from "@/lib/utils";
import {
  Pulse,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
} from "@phosphor-icons/react";

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  botName: string;
  timestamp: string;
  taskId: string;
  status: string;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActivity() {
      try {
        const res = await fetch("/api/activity");
        if (res.ok) {
          const data = await res.json();
          setActivities(data.activities || []);
        }
      } catch (err) {
        console.error("Failed to load activity:", err);
      } finally {
        setLoading(false);
      }
    }
    loadActivity();
  }, []);

  return (
    <div className="flex flex-col min-h-screen pb-12 bg-white">
      <Header
        title="Activity"
        description="Real-time timeline of pipeline executions and system events"
      />

      <main className="p-8 max-w-5xl mx-auto w-full space-y-6">
        <div className="rounded-3xl border border-[#EBEBEB] bg-white overflow-hidden shadow-xs">
          <div className="p-6 border-b border-[#EBEBEB] flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Pulse className="h-4 w-4 text-neutral-500" />
              <h2 className="text-[16px] font-semibold text-black font-sans">
                Execution Timeline
              </h2>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">
              {activities.length} Events
            </span>
          </div>

          <div className="p-0">
            {loading ? (
              <div className="p-12 text-center text-xs text-neutral-400 animate-pulse font-mono">
                Loading activity events...
              </div>
            ) : activities.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <div className="text-sm font-semibold text-black font-sans">
                  No activity recorded yet.
                </div>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto font-sans leading-relaxed">
                  Activity events will appear here automatically when tasks are submitted and processed through the execution engine.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#F0F0F0]">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-5 hover:bg-[#FAFAFA] transition-colors flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="mt-0.5">
                        {act.status === "completed" ? (
                          <div className="h-7 w-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                            <CheckCircle weight="fill" className="h-4 w-4" />
                          </div>
                        ) : act.status === "failed" ? (
                          <div className="h-7 w-7 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
                            <XCircle weight="fill" className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center animate-pulse border border-blue-200">
                            <Clock weight="bold" className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-black font-sans">
                            {act.title}
                          </span>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border border-[#EBEBEB] bg-[#FAFAFA] text-neutral-600">
                            {act.botName}
                          </span>
                          <StatusPill status={act.status} showDot={false} />
                        </div>
                        <p className="text-xs text-neutral-500 truncate max-w-xl font-sans">
                          {act.description}
                        </p>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          {formatDate(act.timestamp)}
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/app/tasks/${act.taskId}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#EBEBEB] bg-[#FAFAFA] hover:bg-white hover:border-black text-xs font-medium text-black font-sans transition-colors shrink-0 shadow-2xs"
                    >
                      <span>Trace</span>
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
