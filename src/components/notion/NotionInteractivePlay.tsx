"use client";

import React, { useState, useEffect } from "react";
import { DrinkingCard, Player, CardHistoryItem } from "@/types/game";
import { QuestionHistoryModal } from "./QuestionHistoryModal";
import { sounds } from "@/utils/soundEffects";
import { updateRoom, RoomState } from "@/lib/roomService";
import { GoogleUser } from "./NotionAuthView";

interface NotionInteractivePlayProps {
  roomCode?: string;
  totalCards?: number;
  roomData?: RoomState | null;
  currentUser?: GoogleUser | null;
  isHost?: boolean;
  onFinishGame?: () => void;
  onGoToLobby?: () => void;
}

function parseSips(penaltyText?: string): number {
  if (!penaltyText) return 1;
  const match = penaltyText.match(/(\d+)\s*ngụm/i);
  if (match) return parseInt(match[1], 10);
  if (penaltyText.toLowerCase().includes("nửa cốc")) return 3;
  if (penaltyText.toLowerCase().includes("100%")) return 5;
  return 1;
}

export const NotionInteractivePlay: React.FC<NotionInteractivePlayProps> = ({
  roomCode = "DRINK",
  totalCards = 100,
  roomData,
  currentUser,
  isHost = false,
  onFinishGame,
  onGoToLobby,
}) => {
  const [toastMessage, setToastMessage] = useState<string>("");
  const [showToast, setShowToast] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [floatingEmojis, setFloatingEmojis] = useState<
    { id: number; emoji: string; left: number }[]
  >([]);

  // Dữ liệu thời gian thực được cấp trực tiếp từ Cloud Firestore qua roomData
  const players: Player[] = roomData?.players && roomData.players.length > 0
    ? roomData.players
    : currentUser
    ? [
        {
          id: 0,
          uid: currentUser.uid,
          name: currentUser.name,
          initial: currentUser.name.slice(0, 2).toUpperCase(),
          isHost: true,
          color: "bg-amber-600",
          email: currentUser.email,
          drinksCount: 0,
        },
      ]
    : [];

  const deck: DrinkingCard[] = roomData?.deck || [];
  const cardIndex = roomData?.currentCardIndex ?? 0;
  const isFlipped = Boolean(roomData?.isFlipped);
  const currentTurnIdx = roomData?.currentTurnIdx ?? 0;
  const beerConsumed = roomData?.beerConsumed ?? 0;
  const historyList: CardHistoryItem[] = roomData?.history ?? [];

  const currentCard: DrinkingCard | undefined = deck[cardIndex];
  const activePlayer: Player | undefined =
    players.length > 0 ? players[currentTurnIdx % players.length] : undefined;

  // Xác định xem có phải lượt của thiết bị hiện tại không
  const isMyTurn = Boolean(
    activePlayer &&
      currentUser &&
      (
        (activePlayer.uid && currentUser.uid && activePlayer.uid === currentUser.uid) ||
        (activePlayer.email && currentUser.email && activePlayer.email === currentUser.email) ||
        activePlayer.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase()
      )
  ) || players.length <= 1; // Nếu chơi thử 1 mình hoặc 1 người thì luôn cho phép

  // Lắng nghe reactions thời gian thực từ Firestore để bắn emoji trên mọi máy
  useEffect(() => {
    if (roomData?.reactions && roomData.reactions.length > 0) {
      const latest = roomData.reactions[0];
      // Chỉ hiện reaction mới trong vòng 3 giây
      if (Date.now() - latest.timestamp < 3000) {
        setFloatingEmojis((prev) => {
          if (prev.some((e) => e.id === latest.id)) return prev;
          return [...prev, { id: latest.id, emoji: latest.emoji, left: latest.left }];
        });
        setTimeout(() => {
          setFloatingEmojis((prev) => prev.filter((item) => item.id !== latest.id));
        }, 1800);
      }
    }
  }, [roomData?.reactions]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2400);
  };

  const triggerHaptic = (type: "light" | "medium" | "heavy" = "light") => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        if (type === "light") navigator.vibrate(10);
        else if (type === "medium") navigator.vibrate(25);
        else if (type === "heavy") navigator.vibrate([30, 40, 30]);
      } catch {}
    }
  };

  // 1. Hành động Bốc / Lật Thẻ: Đồng bộ qua Firestore
  const handleDrawCard = async () => {
    if (!isFlipped) {
      triggerHaptic("medium");
      sounds.playCardFlip();
      triggerToast(`🃏 ${activePlayer?.name || "Người chơi"} vừa lật mở thẻ bài!`);

      // Cập nhật Firestore -> Tất cả máy khác lập tức nhận snapshot và xoay 3D lật thẻ
      await updateRoom(roomCode, {
        isFlipped: true,
        updatedAt: Date.now(),
      });
    }
  };

  // 2. Hoàn thành lượt chơi: Khai thật hoặc Uống phạt (BỎ HOÀN TOÀN TÍNH NĂNG RÚT LẠI / ĐỔI CÂU)
  const handleCompleteTurn = async (resultType: "passed" | "drank") => {
    if (!currentCard || !activePlayer) return;

    const penaltySips = resultType === "passed" ? 0 : parseSips(currentCard.penalty);

    triggerHaptic(resultType === "passed" ? "medium" : "heavy");
    if (resultType === "passed") {
      sounds.playSuccessChime();
    } else {
      sounds.playBeerGulp();
      setTimeout(() => sounds.playBeerClink(), 150);
    }

    const historyEntry: CardHistoryItem = {
      id: `hist-${Date.now()}`,
      turnNumber: cardIndex + 1,
      playerId: activePlayer.id,
      playerName: activePlayer.name,
      playerInitial: activePlayer.initial || activePlayer.name.slice(0, 2).toUpperCase(),
      cardTitle: currentCard.title,
      cardContent: currentCard.description,
      cardType: currentCard.type,
      cardTypeLabel: currentCard.typeLabel,
      penalty: currentCard.penalty,
      result: resultType,
      resultText:
        resultType === "passed"
          ? "Đã dũng cảm hoàn thành thử thách ✅"
          : `Đã uống ${penaltySips} ngụm phạt 🍺`,
      sips: penaltySips,
      timestamp: "Vừa xong",
    };

    const nextCardIdx = cardIndex + 1;
    const nextTurn = players.length > 0 ? (currentTurnIdx + 1) % players.length : 0;
    const updatedHistory = [historyEntry, ...historyList];
    const updatedBeer = beerConsumed + penaltySips;

    // Cập nhật số ngụm của người chơi
    const updatedPlayers = players.map((p, idx) => {
      if (idx === (currentTurnIdx % players.length)) {
        return { ...p, drinksCount: (p.drinksCount || 0) + penaltySips };
      }
      return p;
    });

    // Nếu hết thẻ bài
    if (nextCardIdx >= deck.length) {
      sounds.playBeerClink();
      triggerToast(`🏆 Chúc mừng cả bàn đã hoàn thành toàn bộ ${deck.length} câu hỏi!`);
      await updateRoom(roomCode, {
        status: "summary",
        beerConsumed: updatedBeer,
        history: updatedHistory,
        players: updatedPlayers,
        updatedAt: Date.now(),
      });
      if (onFinishGame) onFinishGame();
      return;
    }

    // Đẩy cập nhật đồng bộ lên Cloud Firestore
    await updateRoom(roomCode, {
      isFlipped: false,
      currentCardIndex: nextCardIdx,
      currentTurnIdx: nextTurn,
      beerConsumed: updatedBeer,
      history: updatedHistory,
      players: updatedPlayers,
      updatedAt: Date.now(),
    });

    const nextPlayerName = players[nextTurn]?.name || "người tiếp theo";
    triggerToast(`Đã ghi nhận! Chuyển lượt sang ${nextPlayerName} 🍻`);
  };

  // 3. Tương tác khán giả thời gian thực qua Firestore
  const handleSpectatorReaction = async (emoji: string, actionText: string) => {
    triggerHaptic("light");
    sounds.playBeerClink();
    triggerToast(`Bạn đã gửi ${actionText} tới ${activePlayer?.name || "bàn nhậu"}!`);

    const newReaction = {
      id: Date.now(),
      emoji,
      left: Math.floor(Math.random() * 60) + 20,
      timestamp: Date.now(),
    };

    // Đẩy lên Firestore để các máy khác cũng nhìn thấy emoji bay lên
    await updateRoom(roomCode, {
      reactions: [newReaction, ...(roomData?.reactions || []).slice(0, 5)],
      updatedAt: Date.now(),
    });
  };

  const penaltySips = parseSips(currentCard?.penalty);

  return (
    <div className="flex flex-col w-full gap-space-md relative">
      {/* Floating Emojis Animation Realtime */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingEmojis.map((e) => (
          <span
            key={e.id}
            className="absolute text-4xl animate-bounce transition-all duration-1000"
            style={{ left: `${e.left}%`, bottom: "140px" }}
          >
            {e.emoji}
          </span>
        ))}
      </div>

      {/* Header bar: Bàn chơi thời gian thực & Lịch sử */}
      <div className="bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container-high shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <span className="font-label-md text-label-md font-bold text-on-surface truncate">
            Bàn Nhậu #{roomCode}
          </span>
          <span className="text-secondary font-code-inline text-xs">
            ({players.length} người)
          </span>
        </div>
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="bg-primary text-on-primary px-2.5 py-1 rounded-lg text-label-sm font-semibold flex items-center gap-1 shadow-xs active:scale-95 transition-all shrink-0"
          type="button"
        >
          <span className="material-symbols-outlined text-[15px]">history_edu</span>
          <span>Lịch sử ({historyList.length})</span>
        </button>
      </div>

      {/* SINGLE PHONE GAME VIEW */}
      <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container-high shadow-md space-y-3">
        {/* Turn Status Banner */}
        <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-sm shrink-0">
              {activePlayer?.initial || "??"}
            </div>
            <div className="min-w-0">
              <span className="font-body-md font-bold text-on-surface truncate block">
                {isMyTurn ? `${activePlayer?.name} (Chính Bạn!)` : `Lượt của: ${activePlayer?.name}`}
              </span>
              <span className="text-secondary font-label-sm block truncate">
                {isMyTurn
                  ? isFlipped
                    ? "Bạn đang đọc thử thách & chịu phạt"
                    : "Chạm vào thẻ bài để bốc lượt này"
                  : isFlipped
                  ? `Đang xem ${activePlayer?.name} chịu phạt`
                  : `Đang đợi ${activePlayer?.name} bốc bài trên máy của họ`}
              </span>
            </div>
          </div>
          <span className="font-code-inline text-code-inline px-2 py-0.5 rounded bg-surface-container-highest text-primary font-bold shrink-0">
            #{cardIndex + 1} / {totalCards}
          </span>
        </div>

        {/* 3D FLIP CARD ANIMATION CANVAS */}
        <div className="card-3d-wrap my-1 select-none">
          <div className={`card-3d-inner ${isFlipped ? "card-3d-flipped" : ""}`}>
            {/* CARD FRONT: Mặt úp của lá bài (Card Back Design) */}
            <div
              onClick={(isMyTurn || isHost) && !isFlipped ? handleDrawCard : undefined}
              className={`card-3d-face card-3d-front bg-gradient-to-br from-surface-container-low via-surface-container to-surface-container-high border-2 border-dashed ${
                isMyTurn || isHost
                  ? "border-primary cursor-pointer active:scale-[0.98] shadow-md hover:border-primary/80"
                  : "border-outline-variant/60 cursor-not-allowed opacity-90 shadow-sm"
              } p-6 flex flex-col items-center justify-center text-center transition-transform`}
            >
              <div
                className={`w-16 h-16 rounded-2xl ${
                  isMyTurn || isHost
                    ? "bg-primary text-on-primary shadow-md animate-pulse"
                    : "bg-surface-container-highest text-secondary"
                } flex items-center justify-center text-3xl mb-3`}
              >
                🎲
              </div>
              <h3 className="font-headline-sm text-base font-bold text-on-surface">
                {isMyTurn
                  ? "LƯỢT CỦA BẠN - CHẠM ĐỂ BỐC THẺ"
                  : isHost
                  ? `LƯỢT CỦA ${activePlayer?.name?.toUpperCase()} (HOST BỐC HỘ ĐƯỢC)`
                  : `LƯỢT CỦA ${activePlayer?.name?.toUpperCase() || "BẠN NHẬU"}`}
              </h3>
              <p className="font-label-sm text-secondary mt-1 max-w-[280px]">
                {isMyTurn
                  ? `Lá bài #${cardIndex + 1} • Luật phạt tính theo từng ngụm bia`
                  : `Đang chờ ${activePlayer?.name || "người chơi"} rút thẻ bài trên thiết bị của họ...`}
              </p>
              {isMyTurn || isHost ? (
                <span className="mt-4 px-4 py-1.5 rounded-full bg-primary text-on-primary font-label-sm font-semibold shadow-sm animate-bounce">
                  Lật Thẻ Ngay 🃏
                </span>
              ) : (
                <span className="mt-4 px-3.5 py-1 rounded-full bg-surface-container-highest text-secondary font-label-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  <span>Đang đợi người chơi bốc bài...</span>
                </span>
              )}
            </div>

            {/* CARD BACK: Mặt ngửa hiển thị câu hỏi (Card Face) */}
            <div className="card-3d-face card-3d-back bg-surface-container-low border border-surface-container-high p-5 flex flex-col justify-between shadow-lg select-none">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-code-inline text-xs font-bold uppercase px-2.5 py-1 rounded bg-primary text-on-primary">
                    {currentCard?.typeLabel || "THỬ THÁCH"}
                  </span>
                  <span className="font-label-sm text-secondary font-medium">
                    {currentCard?.difficulty || "Độ khó: 3/5"}
                  </span>
                </div>
                <h3 className="font-headline-sm text-base font-bold text-on-surface mt-1">
                  {currentCard?.title || "Thử Thách Nhậu"}
                </h3>
                <p className="font-body-md text-on-surface mt-2 leading-relaxed bg-surface-container-lowest p-3 rounded-xl border border-surface-container-high/60 shadow-xs">
                  {currentCard?.description || "Đang tải nội dung lá bài..."}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-surface-container-high flex items-center justify-between text-label-md">
                <span className="text-error font-semibold flex items-center gap-1 truncate max-w-[220px]">
                  <span className="material-symbols-outlined text-[18px]">gavel</span>
                  <span>{currentCard?.penalty || "Phạt 1 ngụm"}</span>
                </span>
                <span className="font-bold text-secondary font-code-inline text-xs shrink-0">
                  🍺 {beerConsumed} ngụm cả bàn
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Turn Controls */}
        <div className="space-y-2 pt-1">
          {isFlipped ? (
            // Thẻ đã lật: Chỉ người đến lượt (hoặc Host) mới được chọn Vượt qua hoặc Uống phạt
            isMyTurn || isHost ? (
              <div className="space-y-2">
                <button
                  onClick={() => handleCompleteTurn("passed")}
                  className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-headline-sm text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  <span>Đã Khai Thật / Vượt Qua Thử Thách ✅</span>
                </button>
                <button
                  onClick={() => handleCompleteTurn("drank")}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-label-md font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">sports_bar</span>
                  <span>Không Dám (Uống Phạt {penaltySips} Ngụm) 🍺</span>
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high text-center">
                <p className="font-body-sm font-semibold text-on-surface">
                  👀 {activePlayer?.name} đang đọc thử thách &amp; chịu phạt
                </p>
                <p className="font-label-sm text-secondary text-xs mt-0.5">
                  Hãy thả cảm xúc hoặc ép bạn nhậu uống thêm ở các nút bên dưới!
                </p>
              </div>
            )
          ) : (
            // Thẻ chưa lật
            isMyTurn || isHost ? (
              <button
                onClick={handleDrawCard}
                className="w-full py-3 rounded-xl bg-primary hover:bg-neutral-800 text-on-primary font-headline-sm text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
                type="button"
              >
                <span>Bốc &amp; Lật Lá Bài 🃏</span>
              </button>
            ) : (
              <div className="w-full py-3 rounded-xl bg-surface-container-high text-secondary font-headline-sm text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed opacity-75">
                <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
                <span>Đang Chờ {activePlayer?.name} Bốc Bài...</span>
              </div>
            )
          )}

          {/* Spectator reactions row (Tất cả mọi người đều bấm được để tương tác) */}
          <div className="pt-2 border-t border-surface-container-high">
            <span className="font-label-sm text-secondary font-medium mb-1.5 block">
              Tương tác thả cảm xúc thời gian thực:
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => handleSpectatorReaction("🍺", "Ép 1 ngụm")}
                className="py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-transform"
                type="button"
              >
                <span>🍺 Ép uống</span>
              </button>
              <button
                onClick={() => handleSpectatorReaction("👏", "Cổ vũ")}
                className="py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-transform"
                type="button"
              >
                <span>👏 Cổ vũ</span>
              </button>
              <button
                onClick={() => handleSpectatorReaction("😂", "Cười xỉu")}
                className="py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-transform"
                type="button"
              >
                <span>😂 Cười xỉu</span>
              </button>
              <button
                onClick={() => handleSpectatorReaction("👀", "Hóng biến")}
                className="py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-transform"
                type="button"
              >
                <span>👀 Hóng biến</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Table Quick Info */}
      <div className="bg-surface-container-lowest p-3 rounded-xl border border-surface-container-high flex items-center justify-between text-body-sm shadow-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">analytics</span>
          <span className="font-medium text-on-surface">Đã ghi nhận {historyList.length} lượt</span>
        </div>
        <div className="flex items-center gap-2">
          {onFinishGame && (
            <button
              onClick={onFinishGame}
              className="text-error font-label-md font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              type="button"
            >
              <span>Kết Thúc &amp; Xem Bảng Phong Thần</span>
              <span className="material-symbols-outlined text-[15px]">trophy</span>
            </button>
          )}
        </div>
      </div>

      {/* Question History Modal */}
      <QuestionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={historyList}
      />

      {/* Feedback Toast */}
      <div
        className={`fixed bottom-20 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-4 py-2.5 rounded-lg shadow-xl font-body-sm text-body-sm flex items-center gap-2 transition-all duration-300 z-50 ${
          showToast ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <span className="material-symbols-outlined text-[18px] text-tertiary-fixed">
          verified
        </span>
        <span>{toastMessage}</span>
      </div>
    </div>
  );
};
