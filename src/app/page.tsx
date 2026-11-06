"use client";

import React, { useState, useEffect } from "react";
import { NotionHeader } from "@/components/notion/NotionHeader";
import { NotionNav, NotionScreen } from "@/components/notion/NotionNav";
import { NotionSummaryView } from "@/components/notion/NotionSummaryView";
import { NotionAuthView, GoogleUser } from "@/components/notion/NotionAuthView";
import { NotionShareView } from "@/components/notion/NotionShareView";
import { NotionLobbyView } from "@/components/notion/NotionLobbyView";
import { NotionInteractivePlay } from "@/components/notion/NotionInteractivePlay";
import { RoomState } from "@/app/api/room/route";

export default function Home() {
  // Giao diện bắt đầu từ màn hình xác thực Google
  const [currentScreen, setCurrentScreen] = useState<NotionScreen>("auth");
  const [roomCode, setRoomCode] = useState<string>("ALCH88");
  const [totalCards, setTotalCards] = useState<number>(100);
  const [currentUser, setCurrentUser] = useState<GoogleUser | null>(null);
  const [isHost, setIsHost] = useState<boolean>(true);
  const [isInvited, setIsInvited] = useState<boolean>(false);
  const [roomData, setRoomData] = useState<RoomState | null>(null);

  // 1. Kiểm tra URL query param khi người khác bấm vào link mời (?room=XYZ hoặc ?join=XYZ)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const invitedCode = params.get("room") || params.get("join");
      if (invitedCode) {
        const cleanCode = invitedCode.toUpperCase().trim();
        setRoomCode(cleanCode);
        setIsInvited(true);
        setCurrentScreen("auth");

        // Thử fetch thông tin phòng trước
        fetch(`/api/room?code=${cleanCode}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.room) {
              setRoomData(data.room);
              setTotalCards(data.room.totalCards || 100);
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  // 2. Định kỳ đồng bộ trạng thái phòng (Sync Polling mỗi 2.5s) khi đã vào phòng
  useEffect(() => {
    if (currentScreen === "auth" || !roomCode) return;

    let isMounted = true;
    const syncRoom = async () => {
      try {
        const res = await fetch(`/api/room?code=${roomCode}`);
        const data = await res.json();
        if (isMounted && data.success && data.room) {
          setRoomData(data.room);
          setTotalCards(data.room.totalCards || 100);

          // Tự động chuyển màn hình khi Chủ Phòng bắt đầu ván đấu
          if (data.room.status === "playing" && currentScreen === "lobby") {
            setCurrentScreen("spectator");
          } else if (data.room.status === "summary" && currentScreen === "spectator") {
            setCurrentScreen("summary");
          } else if (data.room.status === "lobby" && currentScreen === "summary") {
            setCurrentScreen("lobby");
          }
        }
      } catch (err) {
        // Fallback im lặng nếu offline
      }
    };

    syncRoom();
    const interval = setInterval(syncRoom, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [roomCode, currentScreen]);

  // 3. Xử lý Tạo Phòng Mới (Chủ Xị / Host)
  const handleCreateRoom = async (user: GoogleUser) => {
    try {
      const res = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", user, totalCards }),
      });
      const data = await res.json();
      if (data.success && data.roomCode) {
        setRoomCode(data.roomCode);
        setRoomData(data.room);
        setCurrentUser(user);
        setIsHost(true);
        setCurrentScreen("lobby");
        return;
      }
    } catch (e) {
      console.error("Lỗi tạo phòng:", e);
    }

    // Fallback nếu server bận
    const fallbackCode = `SIP-${Math.floor(1000 + Math.random() * 9000)}`;
    setRoomCode(fallbackCode);
    setCurrentUser(user);
    setIsHost(true);
    setCurrentScreen("lobby");
  };

  // 4. Xử lý Tham Gia Phòng (Guest hoặc Bạn Bè)
  const handleJoinRoom = async (code: string, nickname: string, tolerance: string, user: GoogleUser) => {
    const cleanCode = (code || roomCode || "ALCH88").toUpperCase().trim();
    try {
      const res = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          roomCode: cleanCode,
          user,
          nickname,
          tolerance,
        }),
      });
      const data = await res.json();
      if (data.success && data.room) {
        setRoomCode(data.room.code);
        setRoomData(data.room);
        setCurrentUser(user);
        const host = data.room.players?.[0]?.email === user.email;
        setIsHost(host);
        setCurrentScreen(data.room.status === "playing" ? "spectator" : "lobby");
        return;
      }
    } catch (e) {
      console.error("Lỗi vào phòng:", e);
    }

    setRoomCode(cleanCode);
    setCurrentUser(user);
    setIsHost(false);
    setCurrentScreen("lobby");
  };

  // 5. Thay đổi tổng số câu hỏi (Host Only)
  const handleChangeTotalCards = async (count: number) => {
    setTotalCards(count);
    try {
      const res = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_total_cards", roomCode, totalCards: count }),
      });
      const data = await res.json();
      if (data.success && data.room) {
        setRoomData(data.room);
      }
    } catch {}
  };

  // 6. Bắt đầu ván chơi
  const handleStartGame = async () => {
    try {
      const res = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start_game", roomCode }),
      });
      const data = await res.json();
      if (data.success && data.room) {
        setRoomData(data.room);
      }
    } catch {}
    setCurrentScreen("spectator");
  };

  // 7. Kết thúc ván
  const handleFinishGame = async () => {
    try {
      await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "finish_game", roomCode }),
      });
    } catch {}
    setCurrentScreen("summary");
  };

  // 8. Chơi lại
  const handleReplayGame = async () => {
    try {
      const res = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "replay", roomCode }),
      });
      const data = await res.json();
      if (data.success && data.room) {
        setRoomData(data.room);
      }
    } catch {}
    setCurrentScreen("lobby");
  };

  const memberCountText =
    currentScreen === "auth"
      ? "Sẵn sàng"
      : `${roomData?.players?.length || 4}/8`;

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md antialiased min-h-screen min-h-[100dvh] flex flex-col w-full max-w-[440px] mx-auto shadow-sm relative overflow-x-hidden">
      {/* Top Fixed Notion Header */}
      <NotionHeader
        roomCode={roomCode}
        memberCount={memberCountText}
        currentUser={currentUser}
        onAvatarClick={() => setCurrentScreen("auth")}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full bg-surface pt-header-safe pb-nav-safe px-margin flex flex-col">
        {/* Step 1: Đăng nhập Google & Vào bàn hoặc Tạo phòng mới */}
        {currentScreen === "auth" && (
          <NotionAuthView
            initialRoomCode={roomCode}
            isInvited={isInvited}
            onJoinRoom={handleJoinRoom}
            onCreateRoom={handleCreateRoom}
          />
        )}

        {/* Step 2: Phòng chờ (Lobby) */}
        {currentScreen === "lobby" && (
          <NotionLobbyView
            roomCode={roomCode}
            totalCards={totalCards}
            players={roomData?.players}
            isHost={isHost}
            onTotalCardsChange={handleChangeTotalCards}
            onStartGame={handleStartGame}
            onOpenInvite={() => setCurrentScreen("share")}
            onSoloTest={() => setCurrentScreen("spectator")}
            onLeaveRoom={() => setCurrentScreen("auth")}
          />
        )}

        {/* Step 3: Mời bạn bè (Copy link hoặc QR Code động) */}
        {currentScreen === "share" && (
          <NotionShareView
            roomCode={roomCode}
            onBackToLobby={() => setCurrentScreen("lobby")}
          />
        )}

        {/* Step 4: Bàn chơi thực chiến (Câu hỏi 100% ngẫu nhiên, không trùng lặp) */}
        {currentScreen === "spectator" && (
          <NotionInteractivePlay
            roomCode={roomCode}
            totalCards={totalCards}
            initialDeck={roomData?.deck}
            initialPlayers={roomData?.players}
            onFinishGame={handleFinishGame}
            onGoToLobby={() => setCurrentScreen("lobby")}
          />
        )}

        {/* Step 5: Tổng kết ván & Bảng Phong Thần */}
        {currentScreen === "summary" && (
          <NotionSummaryView
            totalCards={totalCards}
            onReplay={handleReplayGame}
            onLeave={() => setCurrentScreen("auth")}
          />
        )}
      </main>

      {/* Bottom Fixed Notion Navigation */}
      <NotionNav
        currentScreen={currentScreen}
        onSelectScreen={(screen) => setCurrentScreen(screen)}
      />
    </div>
  );
}
