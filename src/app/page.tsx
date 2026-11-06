"use client";

import React, { useState, useEffect } from "react";
import { NotionHeader } from "@/components/notion/NotionHeader";
import { NotionNav, NotionScreen } from "@/components/notion/NotionNav";
import { NotionSummaryView } from "@/components/notion/NotionSummaryView";
import { NotionAuthView, GoogleUser } from "@/components/notion/NotionAuthView";
import { NotionShareView } from "@/components/notion/NotionShareView";
import { NotionLobbyView } from "@/components/notion/NotionLobbyView";
import { NotionInteractivePlay } from "@/components/notion/NotionInteractivePlay";
import { onAuthUserChanged } from "@/lib/firebase";
import {
  createRoom,
  joinRoom,
  subscribeToRoom,
  updateRoom,
  getShuffledDeck,
  RoomState,
  OnlineUser,
  updatePresence,
  subscribeToOnlineUsers,
  subscribeToActiveRooms,
} from "@/lib/roomService";

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<NotionScreen>("auth");
  const [roomCode, setRoomCode] = useState<string>("");
  const [totalCards, setTotalCards] = useState<number>(100);
  const [currentUser, setCurrentUser] = useState<GoogleUser | null>(null);
  const [isHost, setIsHost] = useState<boolean>(true);
  const [isInvited, setIsInvited] = useState<boolean>(false);
  const [roomData, setRoomData] = useState<RoomState | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [activeRooms, setActiveRooms] = useState<RoomState[]>([]);

  // 1. Phục hồi Session đăng nhập tự động khi F5 / mở lại trang (Không cần đăng nhập lại)
  useEffect(() => {
    // Đọc session lưu trữ từ localStorage để render ngay lập tức 0ms
    if (typeof window !== "undefined") {
      try {
        const savedUser = localStorage.getItem("drinklab_user_session");
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setCurrentUser(parsed);
        }

        const savedRoom = localStorage.getItem("drinklab_last_room");
        if (savedRoom) {
          const cleanCode = savedRoom.toUpperCase().trim();
          setRoomCode(cleanCode);
        }
      } catch (e) {
        console.warn("Lỗi đọc local session:", e);
      }
    }

    // Lắng nghe trạng thái Firebase Auth
    const unsubscribeAuth = onAuthUserChanged((user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        if (typeof window !== "undefined" && !localStorage.getItem("drinklab_user_session")) {
          setCurrentUser(null);
        }
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // 2. Lắng nghe Danh Sách Người Dùng Online & Các Phòng Chơi Đang Mở
  useEffect(() => {
    const unsubOnline = subscribeToOnlineUsers((users) => {
      setOnlineUsers(users);
    });

    const unsubRooms = subscribeToActiveRooms((rooms) => {
      setActiveRooms(rooms);
    });

    return () => {
      unsubOnline();
      unsubRooms();
    };
  }, []);

  // 3. Heartbeat cập nhật trạng thái online trên Firestore
  useEffect(() => {
    if (!currentUser) return;
    updatePresence(currentUser, roomCode || null);

    const interval = setInterval(() => {
      updatePresence(currentUser, roomCode || null);
    }, 45000); // Gửi heartbeat mỗi 45s

    return () => clearInterval(interval);
  }, [currentUser, roomCode]);

  // 4. Kiểm tra URL query param khi người khác bấm vào link mời (?room=XYZ hoặc ?join=XYZ)
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

  // 5. Real-time listener phòng chơi qua Cloud Firestore (onSnapshot)
  useEffect(() => {
    if (!roomCode) return;

    const unsubscribe = subscribeToRoom(roomCode, (updatedRoom) => {
      setRoomData(updatedRoom);
      setTotalCards(updatedRoom.totalCards || 100);

      // Lưu mã phòng đang chơi vào localStorage
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("drinklab_last_room", roomCode);
        } catch {}
      }

      // Xác định host
      if (currentUser?.email) {
        setIsHost(updatedRoom.hostEmail === currentUser.email || updatedRoom.players?.[0]?.email === currentUser.email);
      }

      // Tự động chuyển màn hình theo trạng thái phòng
      if (updatedRoom.status === "playing") {
        if (currentScreen === "lobby" || currentScreen === "auth") {
          setCurrentScreen("spectator");
        }
      } else if (updatedRoom.status === "summary") {
        if (currentScreen === "spectator") {
          setCurrentScreen("summary");
        }
      } else if (updatedRoom.status === "lobby") {
        if (currentScreen === "summary" || currentScreen === "spectator") {
          setCurrentScreen("lobby");
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [roomCode, currentScreen, currentUser?.email]);

  // 6. Kiểm soát truy cập: Bàn chơi (spectator) KHÔNG được xuất hiện khi chưa bắt đầu ván đấu
  useEffect(() => {
    if (currentScreen === "spectator" && roomData && roomData.status !== "playing") {
      setCurrentScreen("lobby");
    }
  }, [currentScreen, roomData]);

  // 7. Xử lý Tạo Phòng Mới (Chủ Xị / Host lưu trực tiếp vào Cloud Firestore)
  const handleCreateRoom = async (user: GoogleUser) => {
    try {
      const { roomCode: newCode, room } = await createRoom(user, totalCards);
      setRoomCode(newCode);
      setRoomData(room);
      setCurrentUser(user);
      setIsHost(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("drinklab_last_room", newCode);
      }
      updatePresence(user, newCode);
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

  // 8. Xử lý Tham Gia Phòng (Guest hoặc Bạn Bè lưu vào Cloud Firestore)
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
        if (typeof window !== "undefined") {
          localStorage.setItem("drinklab_last_room", result.room.code);
        }
        updatePresence(user, result.room.code);
        setCurrentScreen(result.room.status === "playing" ? "spectator" : "lobby");
        return;
      }
    } catch (e) {
      console.error("Lỗi vào phòng:", e);
    }

    setRoomCode(cleanCode);
    setCurrentUser(user);
    setIsHost(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("drinklab_last_room", cleanCode);
    }
    updatePresence(user, cleanCode);
    setCurrentScreen("lobby");
  };

  // 9. Rời phòng
  const handleLeaveRoom = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("drinklab_last_room");
      } catch {}
    }
    if (currentUser) {
      updatePresence(currentUser, null);
    }
    setRoomCode("");
    setRoomData(null);
    setCurrentScreen("auth");
  };

  // 10. Thay đổi tổng số câu hỏi (Host Only)
  const handleChangeTotalCards = async (count: number) => {
    setTotalCards(count);
    const newDeck = getShuffledDeck(count);
    await updateRoom(roomCode, { totalCards: count, deck: newDeck });
  };

  // 11. Bắt đầu ván chơi
  const handleStartGame = async () => {
    await updateRoom(roomCode, { status: "playing" });
    setCurrentScreen("spectator");
  };

  // 12. Kết thúc ván
  const handleFinishGame = async () => {
    await updateRoom(roomCode, { status: "summary" });
    setCurrentScreen("summary");
  };

  // 13. Chơi lại
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
            currentUser={currentUser}
            onlineUsers={onlineUsers}
            activeRooms={activeRooms}
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
            onlineUsers={onlineUsers}
            isHost={isHost}
            onTotalCardsChange={handleChangeTotalCards}
            onStartGame={handleStartGame}
            onOpenInvite={() => setCurrentScreen("share")}
            onSoloTest={handleStartGame}
            onLeaveRoom={handleLeaveRoom}
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
            onLeave={handleLeaveRoom}
          />
        )}
      </main>

      {/* Bottom Fixed Notion Navigation (Ẩn hoàn toàn khi đang trong trận đấu thực chiến, chỉ hiện tab Bàn Chơi khi đang chơi) */}
      {currentScreen !== "spectator" && (
        <NotionNav
          currentScreen={currentScreen}
          isPlaying={roomData?.status === "playing"}
          onSelectScreen={(screen) => {
            if (screen === "spectator" && roomData?.status !== "playing") {
              return;
            }
            setCurrentScreen(screen);
          }}
        />
      )}
    </div>
  );
}
