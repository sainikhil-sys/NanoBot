import React from "react";
import { Sidebar } from "@/components/layout/sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-[#0A0A0A]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto bg-white">
        {children}
      </main>
    </div>
  );
}
