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
import { sounds } from "@/utils/soundEffects";
import { safeStorage } from "@/utils/safeStorage";
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
  subscribeToUserDoc,
  clearRoomInvite,
  getCanonicalUid,
} from "@/lib/roomService";

// Helper cấp tài khoản tạm thời cho người chơi không cần đăng nhập
function getOrCreateGuestUser(): GoogleUser {
  const saved = safeStorage.getItem("drinklab_user_session");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {}
  }
  const funnyNames = [
    "Chiến Hữu",
    "Bợm Nhậu",
    "Thần Cồn",
    "Vua Rót Bia",
    "Cao Thủ Zô",
    "Tiên Tửu",
    "Hải Đếm Ngụm",
    "Nam Lắc Lư",
  ];
  const randomName = `${funnyNames[Math.floor(Math.random() * funnyNames.length)]} #${Math.floor(100 + Math.random() * 900)}`;
  const guest: GoogleUser = {
    name: randomName,
    email: "",
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(randomName)}`,
    uid: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  };
  safeStorage.setItem("drinklab_user_session", JSON.stringify(guest));
  return guest;
}

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
  const [incomingInvite, setIncomingInvite] = useState<{
    roomCode: string;
    fromName: string;
    fromAvatar?: string;
    timestamp: number;
  } | null>(null);

  // 1. Phục hồi Session hoặc tự cấp acc tạm thời để vào chơi 0ms không cần đăng nhập
  useEffect(() => {
    // Đọc session lưu trữ từ safeStorage hoặc tự cấp acc tạm thời
    const activeUser = getOrCreateGuestUser();
    setCurrentUser(activeUser);

    const savedRoom = safeStorage.getItem("drinklab_last_room");
    if (savedRoom) {
      const cleanCode = savedRoom.toUpperCase().trim();
      setRoomCode(cleanCode);
    }

    // Lắng nghe trạng thái Firebase Auth (nếu người dùng có liên kết Google/Email)
    const unsubscribeAuth = onAuthUserChanged((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // 2. Lắng nghe Danh Sách Người Dùng Online & Các Phòng Chơi Đang Mở (Tự dọn dẹp phòng > 5 phút)
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

  // 4. Lắng nghe Lời Mời Trực Tiếp từ bạn bè (In-app realtime invite)
  useEffect(() => {
    const currentUid = getCanonicalUid(currentUser);
    if (!currentUid) return;

    const unsubUser = subscribeToUserDoc(currentUid, (userDoc) => {
      if (userDoc?.incomingInvite) {
        const invite = userDoc.incomingInvite;
        const elapsed = Date.now() - (invite.timestamp || 0);
        // Lời mời có hiệu lực trong 2 phút
        if (elapsed < 120000) {
          // Hiện modal nếu người dùng đang ở ngoài màn hình chính, hoặc khác phòng thực tế đang chơi
          const isAlreadyInThatRoom =
            currentScreen !== "auth" &&
            roomData?.code &&
            roomData.code.toUpperCase() === invite.roomCode.toUpperCase();

          if (!isAlreadyInThatRoom) {
            setIncomingInvite(invite);
            sounds.playBeerClink();
          }
        }
      }
    });

    return () => {
      unsubUser();
    };
  }, [currentUser, roomCode, currentScreen, roomData?.code]);

  // 5. TỰ ĐỘNG VÀO THẲNG PHÒNG LOBBY KHI BẤM LINK MỜI (?room=XYZ hoặc ?join=XYZ)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const invitedCode = params.get("room") || params.get("join");
      if (invitedCode) {
        const cleanCode = invitedCode.toUpperCase().trim();
        const activeUser = getOrCreateGuestUser();
        setCurrentUser(activeUser);
        setRoomCode(cleanCode);
        setIsInvited(false);
        setIsHost(false);
        // Tự động gia nhập phòng và chuyển thẳng vào phòng chờ (Lobby) trong 0ms!
        joinRoom(cleanCode, activeUser.name, "toi-ben", activeUser).then((result) => {
          if (result.success && result.room) {
            setRoomData(result.room);
            safeStorage.setItem("drinklab_last_room", result.room.code);
            updatePresence(activeUser, result.room.code);
            setCurrentScreen(result.room.status === "playing" ? "spectator" : "lobby");
          } else {
            setCurrentScreen("lobby");
          }
        }).catch((err) => {
          console.error("Lỗi tự động vào phòng từ link mời:", err);
          setCurrentScreen("lobby");
        });
      }
    }
  }, []);

  // 6. Real-time listener phòng chơi qua Cloud Firestore (onSnapshot)
  useEffect(() => {
    if (!roomCode) return;

    const unsubscribe = subscribeToRoom(roomCode, (updatedRoom) => {
      setRoomData(updatedRoom);
      setTotalCards(updatedRoom.totalCards || 100);

      // Lưu mã phòng đang chơi vào safeStorage
      safeStorage.setItem("drinklab_last_room", roomCode);

      // Xác định host linh hoạt (UID, Name, hoặc Email) cho cả người chơi Khách và Google
      if (currentUser) {
        const isCurrentHost = Boolean(
          (currentUser.uid && updatedRoom.players?.[0]?.uid === currentUser.uid) ||
          (currentUser.name && updatedRoom.hostName && updatedRoom.hostName.toLowerCase() === currentUser.name.toLowerCase()) ||
          (currentUser.email && (updatedRoom.hostEmail === currentUser.email || updatedRoom.players?.[0]?.email === currentUser.email))
        );
        setIsHost(isCurrentHost);
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

  // 7. Host Room Keep-Alive: Cập nhật updatedAt định kỳ để không bị xóa khi ngồi trong phòng chờ
  useEffect(() => {
    if (!roomCode || !isHost || !roomData) return;

    const keepAliveInterval = setInterval(() => {
      updateRoom(roomCode, { updatedAt: Date.now() });
    }, 90000); // 1.5 phút cập nhật 1 lần

    return () => clearInterval(keepAliveInterval);
  }, [roomCode, isHost, roomData]);

  // 8. Kiểm soát truy cập: Bàn chơi (spectator) KHÔNG được xuất hiện khi chưa bắt đầu ván đấu
  useEffect(() => {
    if (currentScreen === "spectator" && roomData && roomData.status !== "playing") {
      setCurrentScreen("lobby");
    }
  }, [currentScreen, roomData]);

  // 9. Xử lý Tạo Phòng Mới (Chủ Xị / Host lưu trực tiếp vào Cloud Firestore)
  const handleCreateRoom = async (user: GoogleUser) => {
    try {
      const { roomCode: newCode, room } = await createRoom(user, totalCards);
      setRoomCode(newCode);
      setRoomData(room);
      setCurrentUser(user);
      setIsHost(true);
      safeStorage.setItem("drinklab_last_room", newCode);
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

  // 10. Xử lý Tham Gia Phòng (Guest hoặc Bạn Bè lưu vào Cloud Firestore)
  const handleJoinRoom = async (code: string, nickname: string, tolerance: string, user: GoogleUser) => {
    const cleanCode = (code || roomCode).toUpperCase().trim();
    if (!cleanCode) return;
    try {
      const result = await joinRoom(cleanCode, nickname, tolerance, user);
      if (result.success && result.room) {
        setRoomCode(result.room.code);
        setRoomData(result.room);
        setCurrentUser(user);
        const host = Boolean(
          (result.room.players?.[0]?.uid && user.uid && result.room.players[0].uid === user.uid) ||
          (user.email && result.room.players?.[0]?.email === user.email)
        );
        setIsHost(host);
        safeStorage.setItem("drinklab_last_room", result.room.code);
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
    safeStorage.setItem("drinklab_last_room", cleanCode);
    updatePresence(user, cleanCode);
    setCurrentScreen("lobby");
  };

  // 11. Xử lý Chấp Nhận / Từ Chối Lời Mời
  const handleAcceptInvite = async (targetCode: string) => {
    sounds.playBeerClink();
    const currentUid = getCanonicalUid(currentUser);
    if (currentUid) {
      await clearRoomInvite(currentUid);
    }
    setIncomingInvite(null);
    setIsInvited(false);

    if (!currentUser) {
      setRoomCode(targetCode);
      setCurrentScreen("auth");
      return;
    }

    // Tự động vào thẳng phòng và hiển thị trong danh sách người chơi của host ngay lập tức!
    await handleJoinRoom(targetCode, currentUser.name, "toi-ben", currentUser);
  };

  const handleDeclineInvite = async () => {
    sounds.playCardFlip();
    const currentUid = getCanonicalUid(currentUser);
    if (currentUid) {
      await clearRoomInvite(currentUid);
    }
    setIncomingInvite(null);
    setIsInvited(false);
  };

  // 12. Rời phòng
  const handleLeaveRoom = () => {
    safeStorage.removeItem("drinklab_last_room");
    if (currentUser) {
      updatePresence(currentUser, null);
    }
    setRoomCode("");
    setRoomData(null);
    setCurrentScreen("auth");
  };

  // 13. Thay đổi tổng số câu hỏi (Host Only)
  const handleChangeTotalCards = async (count: number) => {
    setTotalCards(count);
    const newDeck = getShuffledDeck(count);
    await updateRoom(roomCode, { totalCards: count, deck: newDeck });
  };

  // 14. Bắt đầu ván chơi
  const handleStartGame = async () => {
    await updateRoom(roomCode, { status: "playing" });
    setCurrentScreen("spectator");
  };

  // 15. Kết thúc ván
  const handleFinishGame = async () => {
    await updateRoom(roomCode, { status: "summary" });
    setCurrentScreen("summary");
  };

  // 16. Chơi lại
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

  const activeInviteCode = incomingInvite ? incomingInvite.roomCode : (isInvited ? roomCode : "");
  const showInviteModal = Boolean(incomingInvite || (isInvited && roomCode && roomCode !== roomData?.code));

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
            onUserChange={(u) => {
              setCurrentUser(u);
              if (u) updatePresence(u, roomCode || null);
            }}
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
            currentUser={currentUser}
            isHost={isHost}
            onTotalCardsChange={handleChangeTotalCards}
            onStartGame={handleStartGame}
            onOpenInvite={() => setCurrentScreen("share")}
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

      {/* POPUP MODAL: LỜI MỜI VÀO PHÒNG TRỰC TIẾP TỪ BẠN BÈ HOẶC QUA LINK */}
      {showInviteModal && activeInviteCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-[340px] rounded-2xl bg-surface-container-lowest p-5 shadow-2xl border-2 border-amber-500/60 space-y-4 text-center animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-white flex items-center justify-center text-3xl mx-auto shadow-md">
              🍻
            </div>

            <div className="space-y-1">
              <span className="font-label-sm font-bold tracking-wider uppercase text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block">
                Lời Mời Vào Bàn Nhậu
              </span>
              <h3 className="font-headline-sm text-base font-bold text-on-surface">
                {incomingInvite
                  ? `${incomingInvite.fromName} Mời Bạn Vào Bàn!`
                  : "Bạn Nhận Được Lời Mời Vào Bàn Nhậu!"}
              </h3>
              <p className="font-body-sm text-xs text-secondary leading-relaxed">
                Chiến hữu đang đợi bạn tại Bàn{" "}
                <strong className="text-on-surface font-code-inline font-bold text-sm">
                  #{activeInviteCode}
                </strong>
                . Bấm đồng ý để nhập tiệc và tự động vào bàn ngay!
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleAcceptInvite(activeInviteCode)}
                className="w-full py-3 px-4 rounded-xl bg-primary text-on-primary font-headline-sm text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform cursor-pointer"
              >
                <span>🍻 Đồng Ý Vào Bàn Ngay</span>
              </button>

              <button
                type="button"
                onClick={handleDeclineInvite}
                className="w-full py-2 px-3 rounded-lg text-secondary hover:text-on-surface font-label-md text-xs font-medium transition-colors cursor-pointer"
              >
                Để Sau / Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}

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
