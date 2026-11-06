"use client";

import React from "react";
import { NotionHeader } from "@/components/notion/NotionHeader";
import { NotionNav } from "@/components/notion/NotionNav";
import { NotionLobbyView } from "@/components/notion/NotionLobbyView";
import { useRouter } from "next/navigation";

export default function LobbyPage() {
  const router = useRouter();

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md antialiased min-h-screen flex flex-col max-w-md mx-auto shadow-sm relative">
      <NotionHeader roomCode="ALCH88" memberCount="4/8" />
      <main className="flex-1 w-full bg-surface pt-14 pb-20 px-margin flex flex-col">
        <NotionLobbyView
          roomCode="ALCH88"
          onStartGame={() => router.push("/spectator")}
          onOpenInvite={() => router.push("/share")}
          onSoloTest={() => router.push("/spectator")}
          onLeaveRoom={() => router.push("/auth")}
        />
      </main>
      <NotionNav
        currentScreen="lobby"
        onSelectScreen={(screen) => router.push(`/${screen === "spectator" ? "spectator" : screen}`)}
      />
    </div>
  );
}
