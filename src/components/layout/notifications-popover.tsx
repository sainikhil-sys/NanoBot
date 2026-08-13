"use client";

import React, { useState, useEffect } from "react";
import { Bell, Check, Sparkle, ChatDots } from "@phosphor-icons/react";
import { AppNotification } from "@/types/database.types";
import { formatDate } from "@/lib/utils";

export function NotificationsPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          const items: AppNotification[] = data.notifications || [];
          setNotifications(items);
          setUnreadCount(items.filter((n) => !n.read).length);
        }
      } catch (err) {
        console.warn("Could not load notifications:", err);
      }
    }
    loadNotifications();
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#059669]" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#EBEBEB] bg-white p-3 shadow-xl z-50 space-y-2">
          <div className="flex items-center justify-between px-2 pb-2 border-b border-[#F0F0F0]">
            <span className="text-xs font-bold text-black font-sans">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[10px] font-mono text-[#059669] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-[#F0F0F0]">
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-400 font-sans">
                No new notifications.
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-2 space-y-0.5 hover:bg-[#FAFAFA] rounded-xl transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-black font-sans">{n.title}</span>
                    <span className="text-[9px] font-mono text-neutral-400">
                      {formatDate(n.created_at)}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 font-sans leading-tight">
                    {n.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
