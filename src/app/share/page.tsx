"use client";

import React from "react";
import { NotionHeader } from "@/components/notion/NotionHeader";
import { NotionNav } from "@/components/notion/NotionNav";
import { NotionShareView } from "@/components/notion/NotionShareView";
import { useRouter } from "next/navigation";

export default function SharePage() {
  const router = useRouter();

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md antialiased min-h-screen flex flex-col max-w-md mx-auto shadow-sm relative">
      <NotionHeader roomCode="ALCH88" memberCount="4/8" />
      <main className="flex-1 w-full bg-surface pt-14 pb-20 px-margin flex flex-col">
        <NotionShareView
          roomCode="ALCH88"
          onBackToLobby={() => router.push("/lobby")}
        />
      </main>
      <NotionNav
        currentScreen="share"
        onSelectScreen={(screen) => router.push(`/${screen === "spectator" ? "spectator" : screen}`)}
      />
    </div>
  );
}
