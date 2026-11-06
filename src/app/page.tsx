"use client";

import React, { useState, useEffect } from "react";
import { NotionHeader } from "@/components/notion/NotionHeader";
import { NotionNav, NotionScreen } from "@/components/notion/NotionNav";
import { NotionSummaryView } from "@/components/notion/NotionSummaryView";
import { NotionAuthView, GoogleUser } from "@/components/notion/NotionAuthView";
import { NotionShareView } from "@/components/notion/NotionShareView";
import { NotionLobbyView } from "@/components/notion/NotionLobbyView";
import { NotionInteractivePlay } from "@/components/notion/NotionInteractivePlay";
import {
  createRoom,
  joinRoom,
  subscribeToRoom,
  updateRoom,
  getShuffledDeck,
  RoomState,
} from "@/lib/roomService";

export default function Home() {
  // Giao diện bắt đầu từ màn hình xác thực Google
  const [currentScreen, setCurrentScreen] = useState<NotionScreen>("auth");
  const [roomCode, setRoomCode] = useState<string>("");
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
      }
    }
  }, []);

  // 2. Real-time listener qua Cloud Firestore (onSnapshot)
  useEffect(() => {
    if (!roomCode) return;

    const unsubscribe = subscribeToRoom(roomCode, (updatedRoom) => {
      setRoomData(updatedRoom);
      setTotalCards(updatedRoom.totalCards || 100);

      // Tự động chuyển màn hình khi Chủ Phòng bắt đầu ván đấu
      if (updatedRoom.status === "playing" && currentScreen === "lobby") {
        setCurrentScreen("spectator");
      } else if (updatedRoom.status === "summary" && currentScreen === "spectator") {
        setCurrentScreen("summary");
      } else if (updatedRoom.status === "lobby" && currentScreen === "summary") {
        setCurrentScreen("lobby");
      }
    });

    return () => {
      unsubscribe();
    };
  }, [roomCode, currentScreen]);

  // 3. Xử lý Tạo Phòng Mới (Chủ Xị / Host lưu trực tiếp vào Cloud Firestore)
  const handleCreateRoom = async (user: GoogleUser) => {
    try {
      const { roomCode: newCode, room } = await createRoom(user, totalCards);
      setRoomCode(newCode);
      setRoomData(room);
      setCurrentUser(user);
      setIsHost(true);
      setCurrentScreen("lobby");
    } catch (e) {
      console.error("Lỗi tạo phòng:", e);
      const fallbackCode = `SIP-${Math.floor(1000 + Math.random() * 9000)}`;
      setRoomCode(fallbackCode);
      setCurrentUser(user);
      setIsHost(true);
      setCurrentScreen("lobby");
    }
  };

  // 4. Xử lý Tham Gia Phòng (Guest hoặc Bạn Bè lưu vào Cloud Firestore)
  const handleJoinRoom = async (code: string, nickname: string, tolerance: string, user: GoogleUser) => {
    const cleanCode = (code || roomCode).toUpperCase().trim();
    if (!cleanCode) return;
    try {
      const result = await joinRoom(cleanCode, nickname, tolerance, user);
      if (result.success && result.room) {
        setRoomCode(result.room.code);
        setRoomData(result.room);
        setCurrentUser(user);
        const host = result.room.players?.[0]?.email === user.email;
        setIsHost(host);
        setCurrentScreen(result.room.status === "playing" ? "spectator" : "lobby");
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
    const newDeck = getShuffledDeck(count);
    await updateRoom(roomCode, { totalCards: count, deck: newDeck });
  };

  // 6. Bắt đầu ván chơi
  const handleStartGame = async () => {
    await updateRoom(roomCode, { status: "playing" });
    setCurrentScreen("spectator");
  };

  // 7. Kết thúc ván
  const handleFinishGame = async () => {
    await updateRoom(roomCode, { status: "summary" });
    setCurrentScreen("summary");
  };

  // 8. Chơi lại
  const handleReplayGame = async () => {
    const newDeck = getShuffledDeck(totalCards);
    await updateRoom(roomCode, {
      status: "lobby",
      deck: newDeck,
      currentCardIndex: 0,
      isFlipped: false,
      history: [],
      reactions: [],
      beerConsumed: 0,
    });
    setCurrentScreen("lobby");
  };

  const memberCountText =
    currentScreen === "auth"
      ? "Sẵn sàng"
      : `${roomData?.players?.length || 0}/8`;

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md antialiased min-h-screen min-h-[100dvh] flex flex-col w-full max-w-[440px] mx-auto shadow-sm relative overflow-x-hidden">
      {/* Top Fixed Notion Header */}
      <NotionHeader
        roomCode={roomCode}
        memberCount={memberCountText}
        currentUser={currentUser}
        onAvatarClick={
          currentScreen === "spectator"
            ? undefined
            : () => setCurrentScreen("auth")
        }
      />

      {/* Main Content Area */}
      <main className={`flex-1 w-full bg-surface pt-header-safe ${currentScreen === "spectator" ? "pb-6" : "pb-nav-safe"} px-margin flex flex-col`}>
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
            players={roomData?.players}
            onBackToLobby={() => setCurrentScreen("lobby")}
          />
        )}

        {/* Step 4: Bàn chơi thực chiến (Câu hỏi 100% ngẫu nhiên, không trùng lặp) */}
        {currentScreen === "spectator" && (
          <NotionInteractivePlay
            roomCode={roomCode}
            totalCards={totalCards}
            roomData={roomData}
            currentUser={currentUser}
            isHost={isHost}
            onFinishGame={handleFinishGame}
            onGoToLobby={() => setCurrentScreen("lobby")}
          />
        )}

        {/* Step 5: Tổng kết ván & Bảng Phong Thần */}
        {currentScreen === "summary" && (
          <NotionSummaryView
            roomCode={roomCode}
            totalCards={totalCards}
            players={roomData?.players}
            beerConsumed={roomData?.beerConsumed}
            history={roomData?.history}
            onReplay={handleReplayGame}
            onLeave={() => setCurrentScreen("auth")}
          />
        )}
      </main>

      {/* Bottom Fixed Notion Navigation (Ẩn hoàn toàn khi đang trong trận đấu thực chiến) */}
      {currentScreen !== "spectator" && (
        <NotionNav
          currentScreen={currentScreen}
          onSelectScreen={(screen) => setCurrentScreen(screen)}
        />
      )}
    </div>
  );
}
