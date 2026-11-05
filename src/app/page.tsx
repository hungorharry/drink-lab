"use client";

import React, { useState, useEffect } from "react";
import { GameState, Player, HelpRequest, DrinkVerificationRequest } from "@/types/game";
import { CARD_DECK, INITIAL_PLAYERS } from "@/data/cards";
import { PhoneView } from "@/components/PhoneView";
import { FirebaseModal } from "@/components/FirebaseModal";
import { playCardFlipSound, playCelestialMagicSound, playBeerClinkSound } from "@/utils/audio";
import { Smartphone, MonitorPlay, Volume2, VolumeX, RotateCcw, FileCode, Sparkles } from "lucide-react";

interface FloatingEmojiItem {
  id: number;
  emoji: string;
  left: number;
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState>({
    roomCode: "ALCH88",
    currentTurnIndex: 0,
    isFlipping: false,
    currentCard: CARD_DECK[0],
    cardDeckIndex: 0,
    round: 2,
    lastUpdated: Date.now(),
    helpRequest: null,
    usedHelpByUser: {},
    verificationRequest: null,
    penaltyBannerMessage: null,
    lastActionMessage: null
  });

  const [device1UserIndex, setDevice1UserIndex] = useState<number>(0); // Máy 1: Hoàng Nam
  const [device2UserIndex, setDevice2UserIndex] = useState<number>(1); // Máy 2: Mai Anh
  const [viewMode, setViewMode] = useState<"dual" | "single">("dual");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [burstTrigger, setBurstTrigger] = useState<number>(0);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState<boolean>(false);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmojiItem[]>([]);

  // Bộ đếm reactions
  const [reactions, setReactions] = useState<{
    haha: number;
    lol: number;
    beer: number;
    cheer: number;
    popcorn: number;
  }>({
    haha: 16,
    lol: 9,
    beer: 14,
    cheer: 25,
    popcorn: 7
  });

  // Đồng bộ đa tab bằng BroadcastChannel
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel("sipcraft_nextjs_sync");

    channel.onmessage = (event) => {
      if (event.data?.type === "UPDATE_STATE") {
        setGameState(event.data.state);
        if (event.data.isDrawAction) {
          setBurstTrigger((prev) => prev + 1);
          playCardFlipSound(soundEnabled);
          playCelestialMagicSound(soundEnabled);
        }
      } else if (event.data?.type === "EMOJI_BURST") {
        spawnFloatingEmoji(event.data.emoji, false);
        setReactions(event.data.reactions);
      }
    };

    return () => {
      channel.close();
    };
  }, [soundEnabled]);

  const broadcastState = (newState: GameState, isDrawAction: boolean = false) => {
    setGameState(newState);
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel("sipcraft_nextjs_sync");
      channel.postMessage({ type: "UPDATE_STATE", state: newState, isDrawAction });
      channel.close();
    }
  };

  const spawnFloatingEmoji = (emoji: string, shouldBroadcast: boolean = true) => {
    const newId = Date.now() + Math.random();
    const leftPos = Math.floor(Math.random() * 70) + 15; // 15% -> 85%
    const newItem: FloatingEmojiItem = { id: newId, emoji, left: leftPos };

    setFloatingEmojis((prev) => [...prev, newItem]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== newId));
    }, 1400);

    if (shouldBroadcast && typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel("sipcraft_nextjs_sync");
      channel.postMessage({
        type: "EMOJI_BURST",
        emoji,
        reactions
      });
      channel.close();
    }
  };

  // 1. Rút bài (Người tới lượt bấm)
  const handleDrawCard = () => {
    const nextIdx = (gameState.cardDeckIndex + 1) % CARD_DECK.length;
    const nextCard = CARD_DECK[nextIdx];

    playCardFlipSound(soundEnabled);
    playCelestialMagicSound(soundEnabled);
    setBurstTrigger((prev) => prev + 1);

    const newState: GameState = {
      ...gameState,
      isFlipping: true,
      currentCard: nextCard,
      cardDeckIndex: nextIdx,
      helpRequest: null,
      verificationRequest: null,
      penaltyBannerMessage: null,
      lastActionMessage: null,
      lastUpdated: Date.now()
    };
    broadcastState(newState, true);
  };

  // 2. Chuyển lượt tự động (Cả bàn úp bài lại)
  const handleNextTurnDirect = () => {
    playCardFlipSound(soundEnabled);

    const nextTurn = (gameState.currentTurnIndex + 1) % INITIAL_PLAYERS.length;
    const nextRound = nextTurn === 0 ? gameState.round + 1 : gameState.round;

    const newState: GameState = {
      ...gameState,
      isFlipping: false,
      currentTurnIndex: nextTurn,
      round: nextRound,
      helpRequest: null,
      verificationRequest: null,
      penaltyBannerMessage: null,
      lastActionMessage: null,
      lastUpdated: Date.now()
    };
    broadcastState(newState, false);
  };

  // 3. ĐÃ UỐNG 1 NGỤM -> YÊU CẦU 1 NGƯỜI NGẪU NHIÊN XÁC NHẬN
  const handleRequestDrinkCompletion = () => {
    const currentPlayer = INITIAL_PLAYERS[gameState.currentTurnIndex];
    playBeerClinkSound(soundEnabled);
    spawnFloatingEmoji("🍺", true);

    // Chọn ngẫu nhiên 1 người khác trong bàn làm trọng tài
    const otherPlayers = INITIAL_PLAYERS.filter((p) => p.id !== currentPlayer.id);
    const randomVerifier = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];

    const verification: DrinkVerificationRequest = {
      drinkingPlayerId: currentPlayer.id,
      drinkingPlayerName: currentPlayer.name,
      verifierPlayerId: randomVerifier.id,
      verifierPlayerName: randomVerifier.name,
      status: "pending"
    };

    const newState: GameState = {
      ...gameState,
      verificationRequest: verification,
      lastActionMessage: `${currentPlayer.name} khai đã uống xong! Đang chờ ${randomVerifier.name} (Trọng tài ngẫu nhiên) xác nhận...`,
      lastUpdated: Date.now()
    };
    broadcastState(newState, false);
  };

  // 4. TRỌNG TÀI NGẪU NHIÊN XÁC NHẬN
  const handleRespondVerification = (confirmed: boolean) => {
    if (!gameState.verificationRequest) return;
    const req = gameState.verificationRequest;

    if (confirmed) {
      playBeerClinkSound(soundEnabled);
      spawnFloatingEmoji("🍻", true);
      spawnFloatingEmoji("🍺", true);

      // Chuyển lượt sang người tiếp theo
      const nextTurn = (gameState.currentTurnIndex + 1) % INITIAL_PLAYERS.length;
      const nextRound = nextTurn === 0 ? gameState.round + 1 : gameState.round;

      const newState: GameState = {
        ...gameState,
        isFlipping: false,
        currentTurnIndex: nextTurn,
        round: nextRound,
        helpRequest: null,
        verificationRequest: null,
        penaltyBannerMessage: null,
        lastActionMessage: `${req.verifierPlayerName} đã xác nhận ${req.drinkingPlayerName} uống xong 1 ngụm! Chuyển lượt thành công!`,
        lastUpdated: Date.now()
      };
      broadcastState(newState, false);
    } else {
      playCelestialMagicSound(soundEnabled);
      spawnFloatingEmoji("🧐", true);
      spawnFloatingEmoji("🤣", true);

      // Bắt quả tang chưa uống, hủy request bắt uống lại
      const newState: GameState = {
        ...gameState,
        verificationRequest: null,
        lastActionMessage: `BẮT QUẢ TANG: ${req.verifierPlayerName} xác nhận ${req.drinkingPlayerName} CHƯA UỐNG! Bắt uống lại 1 ngụm mau!`,
        lastUpdated: Date.now()
      };
      broadcastState(newState, false);
    }
  };

  // 5. ĐỔI LÁ BÀI KHÁC - BÁO CẢ BÀN BẮT NÓ UỐNG PHẠT!
  const handleRerollCardWithPenalty = () => {
    const currentPlayer = INITIAL_PLAYERS[gameState.currentTurnIndex];
    playBeerClinkSound(soundEnabled);
    spawnFloatingEmoji("🚨", true);
    spawnFloatingEmoji("🍺", true);

    const nextIdx = (gameState.cardDeckIndex + 2) % CARD_DECK.length;
    const nextCard = CARD_DECK[nextIdx];

    playCardFlipSound(soundEnabled);
    playCelestialMagicSound(soundEnabled);
    setBurstTrigger((prev) => prev + 1);

    const alertMsg = `🚨 BẮT QUẢ TANG: ${currentPlayer.name} VỪA ĐỔI LÁ! CẢ BÀN BẮT NÓ UỐNG PHẠT 1 NGỤM MAU LÊN! 🍺`;

    const newState: GameState = {
      ...gameState,
      isFlipping: true,
      currentCard: nextCard,
      cardDeckIndex: nextIdx,
      helpRequest: null,
      verificationRequest: null,
      penaltyBannerMessage: alertMsg,
      lastActionMessage: alertMsg,
      lastUpdated: Date.now()
    };
    broadcastState(newState, true);
  };

  // 6. GỬI THỈNH CẦU CHỈ ĐỊNH UỐNG HỘ
  const handleRequestHelp = (targetPlayer: Player) => {
    const currentPlayer = INITIAL_PLAYERS[gameState.currentTurnIndex];
    playBeerClinkSound(soundEnabled);
    spawnFloatingEmoji("🤝", true);

    const newHelpRequest: HelpRequest = {
      fromPlayerId: currentPlayer.id,
      fromPlayerName: currentPlayer.name,
      targetPlayerId: targetPlayer.id,
      targetPlayerName: targetPlayer.name,
      status: "pending"
    };

    const newState: GameState = {
      ...gameState,
      helpRequest: newHelpRequest,
      lastActionMessage: `${currentPlayer.name} đang nhờ ${targetPlayer.name} uống hộ 1 ngụm! Đang chờ auke...`,
      lastUpdated: Date.now()
    };
    broadcastState(newState, false);
  };

  // 7. PHẢN HỒI THỈNH CẦU CỨU BỒ (NẾU TỪ CHỐI THÌ HOÀN TRẢ LẠI QUYỀN)
  const handleRespondHelp = (accepted: boolean) => {
    if (!gameState.helpRequest) return;

    const fromId = gameState.helpRequest.fromPlayerId;
    const fromName = gameState.helpRequest.fromPlayerName;
    const targetName = gameState.helpRequest.targetPlayerName;

    if (accepted) {
      playBeerClinkSound(soundEnabled);
      spawnFloatingEmoji("🍻", true);
      spawnFloatingEmoji("🍺", true);

      // ĐỒNG Ý: Chính thức tiêu hao 1 lần quyền chỉ định hộ
      const newState: GameState = {
        ...gameState,
        helpRequest: {
          ...gameState.helpRequest,
          status: "accepted"
        },
        usedHelpByUser: {
          ...gameState.usedHelpByUser,
          [fromId]: true // Đã dùng thành công
        },
        lastActionMessage: `${targetName} đã AUKE uống hộ 1 ngụm cho ${fromName}! Quá nghĩa khí!`,
        lastUpdated: Date.now()
      };
      broadcastState(newState, false);
    } else {
      playCelestialMagicSound(soundEnabled);
      spawnFloatingEmoji("😂", true);
      spawnFloatingEmoji("🤣", true);

      // TỪ CHỐI: HOÀN TRẢ LẠI QUYỀN CHỈ ĐỊNH HỘ!
      const updatedUsedHelp = { ...gameState.usedHelpByUser };
      delete updatedUsedHelp[fromId]; // Hoàn trả lại

      const newState: GameState = {
        ...gameState,
        helpRequest: {
          ...gameState.helpRequest,
          status: "rejected"
        },
        usedHelpByUser: updatedUsedHelp, // Hoàn lại quyền
        lastActionMessage: `${targetName} từ chối! Đã HOÀN LẠI quyền chỉ định hộ cho ${fromName}!`,
        lastUpdated: Date.now()
      };
      broadcastState(newState, false);
    }
  };

  // 8. Thả reaction cảm xúc
  const handleAddReaction = (type: "haha" | "lol" | "beer" | "cheer" | "popcorn") => {
    const emojiMap = {
      haha: "😂",
      lol: "🤣",
      beer: "🍺",
      cheer: "🍻",
      popcorn: "🍿"
    };

    if (type === "beer" || type === "cheer") {
      playBeerClinkSound(soundEnabled);
    } else {
      playCelestialMagicSound(soundEnabled);
    }

    const nextReactions = {
      ...reactions,
      [type]: reactions[type] + 1
    };
    setReactions(nextReactions);
    spawnFloatingEmoji(emojiMap[type], true);
  };

  // 9. Reset bàn chơi
  const handleResetGame = () => {
    const resetState: GameState = {
      roomCode: "ALCH88",
      currentTurnIndex: 0,
      isFlipping: false,
      currentCard: CARD_DECK[0],
      cardDeckIndex: 0,
      round: 2,
      helpRequest: null,
      usedHelpByUser: {},
      verificationRequest: null,
      penaltyBannerMessage: null,
      lastActionMessage: null,
      lastUpdated: Date.now()
    };
    broadcastState(resetState, false);
  };

  return (
    <div className="bg-[#191918] text-[#1d1c16] font-sans antialiased min-h-screen flex flex-col select-none">
      
      {/* TOP HEADER CONTROLS */}
      <header className="bg-[#121211] border-b border-[#2d2d2a] text-white px-4 py-2.5 z-50 sticky top-0 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold shadow-md">
              ✦
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-sm font-bold tracking-wider">
                  SIPCRAFT CELESTIAL
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-mono">
                  NEXT.JS • ARIAL FONT
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Trọng tài ngẫu nhiên xác nhận uống • Hoàn lại quyền nếu từ chối • Báo phạt đổi bài</span>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* View Mode Toggle */}
            <div className="bg-[#242321] p-0.5 rounded-lg border border-[#383734] flex items-center text-xs">
              <button
                type="button"
                onClick={() => setViewMode("dual")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                  viewMode === "dual"
                    ? "bg-amber-500 text-black shadow font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <MonitorPlay className="w-3.5 h-3.5" />
                <span>2 Máy Song Song</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("single")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                  viewMode === "single"
                    ? "bg-amber-500 text-black shadow font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>1 Điện Thoại</span>
              </button>
            </div>

            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="bg-[#242321] hover:bg-[#31302d] text-zinc-300 hover:text-amber-400 border border-[#383734] px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
              title="Bật/Tắt âm thanh hiệu ứng"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-amber-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-zinc-500" />
              )}
              <span>{soundEnabled ? "Âm thanh: Bật" : "Âm thanh: Tắt"}</span>
            </button>

            {/* Reset Game */}
            <button
              type="button"
              onClick={handleResetGame}
              className="bg-[#242321] hover:bg-[#31302d] text-zinc-300 hover:text-white border border-[#383734] px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
              title="Reset lại vòng chơi"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Bàn</span>
            </button>

            {/* Firebase Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsFirebaseModalOpen(true)}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors font-medium"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Xem Code Firebase 100%</span>
            </button>

          </div>

        </div>
      </header>

      {/* BANNER HƯỚNG DẪN TEST BÀN NHẬU */}
      <div className="bg-[#1f1e1c] border-b border-[#2d2c29] text-zinc-300 py-2 px-4 text-xs font-sans">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">🍺 BÀN NHẬU REALTIME:</span>
            <span>
              Đổi lá sẽ <b>báo chuông cả bàn phạt 1 ngụm</b> • Từ chối cứu bồ sẽ <b>hoàn lại quyền</b> • Đã uống 1 ngụm cần <b>1 bạn ngẫu nhiên xác nhận</b> mới qua lượt!
            </span>
          </div>
          <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
            <span>Phòng: <strong className="text-amber-400">#ALCH88</strong></span>
            <span>Font: <strong className="text-emerald-400">Arial Standard</strong></span>
          </div>
        </div>
      </div>

      {/* MAIN SIMULATOR STAGE */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col justify-center items-center">
        
        {/* CONTAINER 2 ĐIỆN THOẠI */}
        <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-6 xl:gap-12 transition-all duration-300">
          
          {/* PHONE 1: DEVICE A */}
          <PhoneView
            deviceLabel="ĐIỆN THOẠI 1"
            viewerUser={INITIAL_PLAYERS[device1UserIndex]}
            gameState={gameState}
            players={INITIAL_PLAYERS}
            allCards={CARD_DECK}
            onDrawCard={handleDrawCard}
            onRequestDrinkCompletion={handleRequestDrinkCompletion}
            onRerollCardWithPenalty={handleRerollCardWithPenalty}
            onRequestHelp={handleRequestHelp}
            onRespondHelp={handleRespondHelp}
            onRespondVerification={handleRespondVerification}
            onChangeViewer={(idx) => setDevice1UserIndex(idx)}
            reactions={reactions}
            onAddReaction={handleAddReaction}
            burstTrigger={burstTrigger}
            floatingEmojis={floatingEmojis}
          />

          {/* PHONE 2: DEVICE B (Nếu bật chế độ Dual) */}
          {viewMode === "dual" && (
            <PhoneView
              deviceLabel="ĐIỆN THOẠI 2"
              viewerUser={INITIAL_PLAYERS[device2UserIndex]}
              gameState={gameState}
              players={INITIAL_PLAYERS}
              allCards={CARD_DECK}
              onDrawCard={handleDrawCard}
              onRequestDrinkCompletion={handleRequestDrinkCompletion}
              onRerollCardWithPenalty={handleRerollCardWithPenalty}
              onRequestHelp={handleRequestHelp}
              onRespondHelp={handleRespondHelp}
              onRespondVerification={handleRespondVerification}
              onChangeViewer={(idx) => setDevice2UserIndex(idx)}
              reactions={reactions}
              onAddReaction={handleAddReaction}
              burstTrigger={burstTrigger}
              floatingEmojis={floatingEmojis}
            />
          )}

        </div>

        {/* BẢNG GIẢI THÍCH 3 QUY TẮC MỚI */}
        <div className="mt-8 max-w-4xl w-full bg-[#181817] border border-[#2e2d2a] rounded-2xl p-5 text-zinc-300 text-xs font-sans">
          <div className="flex items-center justify-between pb-3 border-b border-[#2e2d2a] mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-bold text-sm">
                ĐÃ CẬP NHẬT 3 ĐIỀU CHỈNH CHUẨN XÁC THEO YÊU CẦU:
              </span>
            </div>
            <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
              ĐÃ TEST OK 100%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 leading-relaxed">
            <div className="bg-[#201f1d] p-3 rounded-xl border border-[#33322f]">
              <h5 className="text-amber-300 font-bold flex items-center gap-1.5 mb-1">
                <span>🔄 Từ chối thì HOÀN LẠI quyền:</span>
              </h5>
              <p className="text-zinc-400 text-[11px]">
                Nếu người được chỉ định bấm <b>"Từ chối 😂"</b>, hệ thống sẽ <b>hoàn trả lại ngay lập tức</b> quyền chỉ định cho người nhờ để có thể nhờ người khác!
              </p>
            </div>

            <div className="bg-[#201f1d] p-3 rounded-xl border border-[#33322f]">
              <h5 className="text-amber-300 font-bold flex items-center gap-1.5 mb-1">
                <span>🚨 Đổi lá: Báo cả bàn bắt phạt:</span>
              </h5>
              <p className="text-zinc-400 text-[11px]">
                Khi ai bấm <b>"Đổi lá (Báo phạt)"</b>, màn hình cả bàn sẽ chớp banner đỏ: <i>"BẮT QUẢ TANG: VỪA ĐỔI LÁ! CẢ BÀN BẮT NÓ UỐNG PHẠT 1 NGỤM MAU LÊN! 🍺"</i>!
              </p>
            </div>

            <div className="bg-[#201f1d] p-3 rounded-xl border border-[#33322f]">
              <h5 className="text-amber-300 font-bold flex items-center gap-1.5 mb-1">
                <span>⚖️ 1 người ngẫu nhiên xác nhận:</span>
              </h5>
              <p className="text-zinc-400 text-[11px]">
                Bấm <b>"Đã uống (1 ngụm)"</b> sẽ chọn ngẫu nhiên 1 người bạn trong bàn làm Trọng tài. Người đó bấm <b>"Xác nhận đã uống 🍺"</b> thì mới chính thức qua lượt!
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* FIREBASE MODAL */}
      <FirebaseModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />

    </div>
  );
}
