"use client";

import React from "react";
import { Header } from "@/components/layout/header";
import { UniversalChatWorkspace } from "@/components/chat/universal-chat-workspace";

export default function OverviewPage() {
  return (
    <div className="flex flex-col h-full w-full bg-white font-sans text-neutral-900 overflow-hidden">
      <Header />
      <UniversalChatWorkspace />
    </div>
  );
}
