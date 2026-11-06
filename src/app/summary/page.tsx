"use client";

import React from "react";
import { NotionHeader } from "@/components/notion/NotionHeader";
import { NotionNav } from "@/components/notion/NotionNav";
import { NotionSummaryView } from "@/components/notion/NotionSummaryView";
import { useRouter } from "next/navigation";

export default function SummaryPage() {
  const router = useRouter();

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md antialiased min-h-screen flex flex-col max-w-md mx-auto shadow-sm relative">
      <NotionHeader roomCode="ALCH88" memberCount="4/8" />
      <main className="flex-1 w-full bg-surface pt-14 pb-20 px-margin flex flex-col">
        <NotionSummaryView
          onReplay={() => router.push("/lobby")}
          onLeave={() => router.push("/auth")}
        />
      </main>
      <NotionNav
        currentScreen="summary"
        onSelectScreen={(screen) => router.push(`/${screen === "spectator" ? "spectator" : screen}`)}
      />
    </div>
  );
}
