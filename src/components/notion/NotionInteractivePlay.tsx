"use client";

import React, { useState } from "react";
import { CARD_DECK, INITIAL_PLAYERS } from "@/data/cards";
import { DrinkingCard, Player, CardHistoryItem } from "@/types/game";
import { QuestionHistoryModal } from "./QuestionHistoryModal";
import { SAMPLE_CARD_HISTORY } from "@/data/history";
import { sounds } from "@/utils/soundEffects";

interface NotionInteractivePlayProps {
  roomCode?: string;
  totalCards?: number;
  initialDeck?: DrinkingCard[];
  initialPlayers?: Player[];
  onFinishGame?: () => void;
  onGoToLobby?: () => void;
}

// Fisher-Yates unbiased shuffle to guarantee 100% random cards with 0 duplicates
function shuffleCards(cards: DrinkingCard[], count: number): DrinkingCard[] {
  const pool = [...cards];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

export const NotionInteractivePlay: React.FC<NotionInteractivePlayProps> = ({
  roomCode = "ALCH88",
  totalCards = 100,
  initialDeck,
  initialPlayers,
  onFinishGame,
  onGoToLobby,
}) => {
  // Use passed deck or shuffle a fresh 100% unique deck from the 1,000 card pool
  const [deck, setDeck] = useState<DrinkingCard[]>(() => {
    if (initialDeck && initialDeck.length > 0) return initialDeck;
    return shuffleCards(CARD_DECK, totalCards);
  });

  const [players, setPlayers] = useState<Player[]>(() => {
    return initialPlayers && initialPlayers.length > 0 ? initialPlayers : INITIAL_PLAYERS;
  });

  const [currentTurnIdx, setCurrentTurnIdx] = useState<number>(0);
  const [activeViewerId, setActiveViewerId] = useState<number>(0);
  const [cardIndex, setCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [currentCard, setCurrentCard] = useState<DrinkingCard>(() => {
    if (initialDeck && initialDeck.length > 0) return initialDeck[0];
    return shuffleCards(CARD_DECK, 1)[0] || CARD_DECK[0];
  });
  const [beerConsumed, setBeerConsumed] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [showToast, setShowToast] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<CardHistoryItem[]>([]);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; left: number }[]>([]);

  // Update deck if initialDeck changes from server
  React.useEffect(() => {
    if (initialDeck && initialDeck.length > 0) {
      setDeck(initialDeck);
      if (cardIndex < initialDeck.length) {
        setCurrentCard(initialDeck[cardIndex]);
      }
    }
  }, [initialDeck]);

  // Update players if initialPlayers changes
  React.useEffect(() => {
    if (initialPlayers && initialPlayers.length > 0) {
      setPlayers(initialPlayers);
    }
  }, [initialPlayers]);

  const activePlayer = players[currentTurnIdx] || players[0];
  const viewerUser = players.find((p) => p.id === activeViewerId) || players[0];
  const isMyTurn = activeViewerId === currentTurnIdx;

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
      } catch {
        // ignore
      }
    }
  };

  const spawnEmoji = (emoji: string) => {
    const newId = Date.now() + Math.random();
    const left = Math.floor(Math.random() * 60) + 20;
    setFloatingEmojis((prev) => [...prev, { id: newId, emoji, left }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== newId));
    }, 1500);
  };

  // Bốc lá bài tiếp theo
  const handleDrawCard = async () => {
    if (!isFlipped) {
      triggerHaptic("medium");
      sounds.playCardFlip();
      setIsFlipped(true);
      triggerToast(`🃏 ${activePlayer.name} vừa lật mở ${currentCard.title}!`);
      spawnEmoji("✨");

      try {
        await fetch("/api/room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "flip_card", roomCode }),
        });
      } catch {}
    }
  };

  // Hoàn thành lượt chơi & chuyển lượt (Đảm bảo 100% không trùng lặp câu hỏi)
  const handleCompleteTurn = async (resultType: "passed" | "drank", sipsToAdd: number = 0) => {
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
      playerInitial: activePlayer.initial,
      cardTitle: currentCard.title,
      cardContent: currentCard.description,
      cardType: currentCard.type,
      cardTypeLabel: currentCard.typeLabel,
      penalty: currentCard.penalty,
      result: resultType,
      resultText:
        resultType === "passed"
          ? "Đã dũng cảm hoàn thành thử thách ✅"
          : `Đã uống ${sipsToAdd || 1} ngụm phạt 🍺`,
      sips: sipsToAdd,
      timestamp: "Vừa xong",
    };

    setHistoryList((prev) => [historyEntry, ...prev]);
    if (sipsToAdd > 0) {
      setBeerConsumed((prev) => prev + sipsToAdd);
    }

    const nextCardIdx = cardIndex + 1;
    const nextTurn = (currentTurnIdx + 1) % players.length;

    if (nextCardIdx >= deck.length) {
      sounds.playBeerClink();
      triggerToast(`🏆 Chúc mừng cả bàn đã hoàn thành toàn bộ ${deck.length} câu hỏi độc nhất!`);
      if (onFinishGame) onFinishGame();
      return;
    }

    setIsFlipped(false);
    setCardIndex(nextCardIdx);
    setCurrentCard(deck[nextCardIdx]);
    setCurrentTurnIdx(nextTurn);

    triggerToast(`Đã ghi nhận! Chuyển lượt sang ${players[nextTurn].name} 🍻`);
    spawnEmoji("🍻");

    try {
      await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete_turn",
          roomCode,
          resultType,
          sips: sipsToAdd,
          historyItem: historyEntry,
        }),
      });
    } catch {}
  };

  // Đổi câu khác (phạt 1 ngụm) - Lấy từ kho câu chưa từng xuất hiện (không bao giờ trùng)
  const handleRerollWithPenalty = async () => {
    triggerHaptic("heavy");
    sounds.playShuffle();
    setBeerConsumed((prev) => prev + 1);

    // Lọc ra các câu chưa từng có trong ván chơi hiện tại
    const usedIds = new Set(deck.map((c) => c.id));
    const availablePool = CARD_DECK.filter((c) => !usedIds.has(c.id));
    const replacementCard =
      availablePool.length > 0
        ? availablePool[Math.floor(Math.random() * availablePool.length)]
        : CARD_DECK[Math.floor(Math.random() * CARD_DECK.length)];

    // Cập nhật lá bài hiện tại trong bộ bài
    const updatedDeck = [...deck];
    updatedDeck[cardIndex] = replacementCard;
    setDeck(updatedDeck);
    setCurrentCard(replacementCard);
    setIsFlipped(true);

    triggerToast(`🔄 ${activePlayer.name} đổi câu hỏi mới tinh & chịu phạt 1 ngụm!`);
    spawnEmoji("🍺");

    try {
      await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reroll_card", roomCode }),
      });
    } catch {}
  };

  // Tương tác khán giả
  const handleSpectatorReaction = (action: string) => {
    triggerHaptic("light");
    if (action.includes("Ép uống")) {
      sounds.playBeerClink();
      setBeerConsumed((prev) => prev + 1);
      triggerToast(`🍻 Bạn vừa ép ${activePlayer.name} uống thêm +1 ngụm!`);
      spawnEmoji("🍺");
    } else if (action.includes("Vỗ tay")) {
      sounds.playSuccessChime();
      triggerToast(`👏 Bạn đã vỗ tay cổ vũ ${activePlayer.name}!`);
      spawnEmoji("👏");
    } else if (action.includes("Cười")) {
      sounds.playLaughWobble();
      triggerToast(`😂 Bạn cười nghiêng ngả với thử thách này!`);
      spawnEmoji("😂");
    } else {
      sounds.playCardFlip();
      triggerToast(`👀 Bạn đang chăm chú hóng biến từ ${activePlayer.name}!`);
      spawnEmoji("👀");
    }
  };

  return (
    <div className="flex flex-col w-full gap-space-md relative">
      {/* Floating Emojis Animation */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingEmojis.map((e) => (
          <span
            key={e.id}
            className="absolute text-4xl animate-bounce transition-all duration-1000"
            style={{ left: `${e.left}%`, bottom: "120px" }}
          >
            {e.emoji}
          </span>
        ))}
      </div>

      {/* Role Switcher & History Shortcut */}
      <div className="bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container-high shadow-sm flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-secondary">
            <span className="material-symbols-outlined text-[16px]">touch_app</span>
            <span className="font-label-md text-label-md font-semibold uppercase tracking-tight text-on-surface">
              Chơi Thử Bàn Nhậu (Tính Theo Ngụm)
            </span>
          </div>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="bg-primary text-on-primary px-2.5 py-1 rounded text-label-sm font-semibold flex items-center gap-1 shadow-xs active:scale-95 transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[15px]">history_edu</span>
            <span>Lịch sử ({historyList.length})</span>
          </button>
        </div>

        {/* Change perspective pills */}
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-surface-container-low text-label-sm">
          <span className="text-secondary shrink-0">Đổi vai:</span>
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setActiveViewerId(p.id);
                  triggerToast(`Đã chuyển góc nhìn sang: ${p.name}`);
                }}
                className={`px-2 py-0.5 rounded-full transition-colors flex items-center gap-1 shrink-0 ${
                  activeViewerId === p.id
                    ? "bg-primary text-on-primary font-bold shadow-xs"
                    : "bg-surface-container hover:bg-surface-container-high text-on-surface"
                }`}
                type="button"
              >
                <span>{p.initial}</span>
                <span>{p.name}</span>
                {p.id === currentTurnIdx && <span>👑</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SINGLE PHONE GAME VIEW */}
      <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container-high shadow-md space-y-3">
        {/* Turn Banner */}
        <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-sm">
              {activePlayer.initial}
            </div>
            <div>
              <span className="font-body-md font-bold text-on-surface">
                {isMyTurn ? `${viewerUser.name} (Chính Bạn!)` : `Lượt của: ${activePlayer.name}`}
              </span>
              <span className="text-secondary font-label-sm block">
                {isMyTurn ? "Chạm vào lá bài để bốc lượt này" : "Bạn đang theo dõi và chờ đến lượt"}
              </span>
            </div>
          </div>
          <span className="font-code-inline text-code-inline px-2 py-0.5 rounded bg-surface-container-highest text-primary font-bold">
            #{cardIndex + 1} / {totalCards}
          </span>
        </div>

        {/* Interactive Card Canvas */}
        {!isFlipped ? (
          <div
            onClick={handleDrawCard}
            className="w-full min-h-[240px] rounded-2xl bg-gradient-to-br from-surface-container-low to-surface-container-highest border-2 border-dashed border-primary/40 flex flex-col items-center justify-center cursor-pointer p-5 text-center active:scale-[0.98] transition-transform shadow-inner group select-none touch-manipulation gpu-accelerated"
          >
            <div className="w-16 h-16 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-3xl mb-3 group-hover:scale-110 active:scale-95 transition-transform">
              🎲
            </div>
            <span className="font-headline-sm font-bold text-on-surface">
              {isMyTurn ? "CHẠM ĐỂ BỐC LÁ BÀI" : `CHẠM ĐỂ BỐC THẺ CHO ${activePlayer.name}`}
            </span>
            <span className="font-label-sm text-secondary mt-1">
              Lá bài #{cardIndex + 1} • Luật phạt tính theo từng ngụm bia
            </span>
            <span className="mt-3 px-3.5 py-1.5 rounded-full bg-primary text-on-primary font-label-sm font-semibold shadow-xs active:scale-95 transition-transform">
              Lật Thẻ 🃏
            </span>
          </div>
        ) : (
          <div className="w-full min-h-[240px] rounded-2xl bg-surface-container-low border border-surface-container-high p-5 flex flex-col justify-between shadow-sm animate-fadeIn select-none touch-manipulation gpu-accelerated">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-code-inline text-xs font-bold uppercase px-2.5 py-1 rounded bg-primary text-on-primary">
                  {currentCard.typeLabel}
                </span>
                <span className="font-label-sm text-secondary font-medium">
                  {currentCard.difficulty}
                </span>
              </div>
              <h3 className="font-headline-sm font-bold text-on-surface mt-1">
                {currentCard.title}
              </h3>
              <p className="font-body-md text-on-surface mt-2.5 leading-relaxed bg-surface-container-lowest p-3 rounded-xl border border-surface-container-high/60 shadow-xs">
                {currentCard.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-surface-container-high flex items-center justify-between text-label-md">
              <span className="text-error font-semibold flex items-center gap-1 truncate max-w-[240px]">
                <span className="material-symbols-outlined text-[18px]">gavel</span>
                <span>{currentCard.penalty}</span>
              </span>
              <span className="font-bold text-secondary font-code-inline text-xs shrink-0">
                🍺 {beerConsumed} ngụm cả bàn
              </span>
            </div>
          </div>
        )}

        {/* Player controls */}
        <div className="space-y-2 pt-1">
          {isFlipped ? (
            <>
              <button
                onClick={() => handleCompleteTurn("passed")}
                className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-headline-sm text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <span>Đã Khai Thật / Vượt Qua Thử Thách!</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCompleteTurn("drank", 1)}
                  className="py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-label-md font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">sports_bar</span>
                  <span>Không Dám (Uống 1 Ngụm)</span>
                </button>
                <button
                  onClick={handleRerollWithPenalty}
                  className="py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">replay</span>
                  <span>Đổi Câu (+1 Ngụm)</span>
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={handleDrawCard}
              className="w-full py-3 rounded-xl bg-primary hover:bg-neutral-800 text-on-primary font-headline-sm text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
              type="button"
            >
              <span>Bốc &amp; Lật Lá Bài 🃏</span>
            </button>
          )}

          {/* Spectator reactions row */}
          <div className="pt-2 border-t border-surface-container-high">
            <span className="font-label-sm text-secondary font-medium mb-1.5 block">
              Cả bàn tương tác thả cảm xúc:
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => handleSpectatorReaction("🍻 Ép uống")}
                className="py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold flex items-center justify-center gap-1"
                type="button"
              >
                <span>🍻 Ép 1 ngụm</span>
              </button>
              <button
                onClick={() => handleSpectatorReaction("👏 Vỗ tay")}
                className="py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold flex items-center justify-center gap-1"
                type="button"
              >
                <span>👏 Cổ vũ</span>
              </button>
              <button
                onClick={() => handleSpectatorReaction("😂 Cười")}
                className="py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold flex items-center justify-center gap-1"
                type="button"
              >
                <span>😂 Cười xỉu</span>
              </button>
              <button
                onClick={() => handleSpectatorReaction("👀 Hóng")}
                className="py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold flex items-center justify-center gap-1"
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
              className="text-error font-label-md font-semibold hover:underline flex items-center gap-1"
              type="button"
            >
              <span>Xem Bảng Phong Thần</span>
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
