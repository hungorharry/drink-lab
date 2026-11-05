"use client";

import React, { useRef, useEffect, useState } from "react";
import { DrinkingCard, Player, GameState } from "@/types/game";
import { burstCelestialParticles } from "@/utils/particles";
import { Sparkles, Lock, Wine, CheckCircle2, RotateCw, Users, Award, UserCheck, Check, X, AlertTriangle, ShieldCheck } from "lucide-react";

interface FloatingEmojiItem {
  id: number;
  emoji: string;
  left: number;
}

interface PhoneViewProps {
  deviceLabel: string;
  viewerUser: Player;
  gameState: GameState;
  players: Player[];
  allCards: DrinkingCard[];
  onDrawCard: () => void;
  onRequestDrinkCompletion: () => void; // Bấm đã uống / đã xong -> yêu cầu 1 người ngẫu nhiên xác nhận
  onRerollCardWithPenalty: () => void;
  onRequestHelp: (targetPlayer: Player) => void;
  onRespondHelp: (accepted: boolean) => void;
  onRespondVerification: (confirmed: boolean) => void; // Trọng tài xác nhận
  onChangeViewer: (userIdx: number) => void;
  reactions: { haha: number; lol: number; beer: number; cheer: number; popcorn: number };
  onAddReaction: (type: "haha" | "lol" | "beer" | "cheer" | "popcorn") => void;
  burstTrigger: number;
  floatingEmojis?: FloatingEmojiItem[];
}

export const PhoneView: React.FC<PhoneViewProps> = ({
  deviceLabel,
  viewerUser,
  gameState,
  players,
  onDrawCard,
  onRequestDrinkCompletion,
  onRerollCardWithPenalty,
  onRequestHelp,
  onRespondHelp,
  onRespondVerification,
  onChangeViewer,
  reactions,
  onAddReaction,
  burstTrigger,
  floatingEmojis = []
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardFlipperRef = useRef<HTMLDivElement | null>(null);
  const [showHelperModal, setShowHelperModal] = useState<boolean>(false);

  const activePlayer = players[gameState.currentTurnIndex] || players[0];
  const isMyTurn = viewerUser.id === gameState.currentTurnIndex;
  const isCardFlipped = gameState.isFlipping;
  const currentCard = gameState.currentCard;

  // Kiểm tra quyền chỉ định hộ (nếu bị từ chối thì đã được hoàn lại)
  const hasUsedHelp = Boolean(gameState.usedHelpByUser?.[viewerUser.id]);

  // Kiểm tra máy này có nhận được thỉnh cầu cứu bồ không
  const isIncomingHelpTarget =
    gameState.helpRequest?.targetPlayerId === viewerUser.id &&
    gameState.helpRequest?.status === "pending";

  // Kiểm tra máy này có được chọn làm "Trọng tài ngẫu nhiên" để xác nhận việc uống bia không
  const isRandomVerifier =
    gameState.verificationRequest?.verifierPlayerId === viewerUser.id &&
    gameState.verificationRequest?.status === "pending";

  // Đang chờ trọng tài duyệt
  const isWaitingVerification =
    gameState.verificationRequest?.status === "pending";

  useEffect(() => {
    if (burstTrigger > 0 && isCardFlipped) {
      burstCelestialParticles(canvasRef.current);
    }
  }, [burstTrigger, isCardFlipped]);

  const handleCardClick = () => {
    if (!isMyTurn) {
      if (cardFlipperRef.current) {
        cardFlipperRef.current.classList.add("translate-x-1");
        setTimeout(() => {
          cardFlipperRef.current?.classList.remove("translate-x-1");
        }, 150);
      }
      return;
    }

    if (!isCardFlipped) {
      onDrawCard();
    }
  };

  return (
    <div className="w-full max-w-[400px] flex flex-col items-center font-sans">
      
      {/* Device Header Info & Perspective Selector */}
      <div className="w-full flex items-center justify-between px-2 mb-2 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isMyTurn
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"
                : "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]"
            }`}
          />
          <span className="font-bold text-amber-300">{deviceLabel}:</span>
          <span className="text-zinc-200 truncate max-w-[130px]">
            {viewerUser.name} {isMyTurn ? "(Lượt bạn)" : "(Khán giả)"}
          </span>
        </div>

        {/* Change perspective dropdown */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-zinc-400">Góc nhìn:</span>
          <select
            value={viewerUser.id}
            onChange={(e) => onChangeViewer(Number(e.target.value))}
            className="bg-[#242321] text-amber-300 text-xs rounded border border-[#383734] px-1.5 py-0.5 focus:outline-none cursor-pointer"
          >
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id + 1}. {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Phone Hardware Mockup Shell */}
      <div className="w-full bg-[#111110] rounded-[38px] p-3 shadow-2xl border-4 border-[#333230] relative overflow-hidden flex flex-col min-h-[750px] max-h-[860px]">
        
        {/* Speaker Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-[#222120] rounded-b-xl z-50 flex items-center justify-center">
          <div className="w-10 h-1 bg-zinc-600 rounded-full" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#151515] ml-2" />
        </div>

        {/* Phone Screen Inner */}
        <div className="w-full flex-1 bg-[#fef9ef] rounded-[28px] overflow-hidden flex flex-col relative pt-4 text-[#1d1c16] shadow-inner select-none font-sans">
          
          {/* Floating Emoji Layer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
            {floatingEmojis.map((item) => (
              <span
                key={item.id}
                className="floating-emoji text-3xl"
                style={{ left: `${item.left}%`, bottom: "60px" }}
              >
                {item.emoji}
              </span>
            ))}
          </div>

          {/* Particle Canvas Overlay */}
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 w-full h-full z-40"
          />

          {/* App Topbar */}
          <div className="px-3.5 pt-2 pb-2 border-b border-[#f3ede4] flex items-center justify-between shrink-0 bg-[#fef9ef]/95 backdrop-blur-md z-30">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-bold text-xs tracking-wider text-[#1d1c16]">
                  ✦ SIPCRAFT
                </span>
                <span className="text-[10px] font-mono bg-[#f3ede4] px-1 py-0.2 rounded text-zinc-600 font-medium">
                  #{gameState.roomCode}
                </span>
              </div>
              <span className="text-[11px] text-zinc-500">
                Vòng {gameState.round} • {players.length} Bạn bè
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {viewerUser.isHost ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-700" />
                  <span>Host</span>
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-zinc-100 text-zinc-700 border border-zinc-300 flex items-center gap-1">
                  <Users className="w-3 h-3 text-zinc-600" />
                  <span>Khách</span>
                </span>
              )}

              <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {viewerUser.initial}
              </div>
            </div>
          </div>

          {/* CẢNH BÁO TOÀN BÀN: ĐỔI LÁ BÀI BẮT PHẠT UỐNG 1 NGỤM */}
          {gameState.penaltyBannerMessage && (
            <div className="bg-red-500 text-white px-3 py-1.5 text-center text-xs font-bold flex items-center justify-center gap-1.5 shadow-md animate-bounce z-30">
              <span>🚨</span>
              <span>{gameState.penaltyBannerMessage}</span>
            </div>
          )}

          {/* Screen Content Body */}
          <div className="flex-1 overflow-y-auto px-3.5 py-2 flex flex-col justify-between space-y-2.5 z-20">
            
            {/* 1. Turn Announcement Banner */}
            <div
              className={`rounded-xl p-3 shadow-sm border transition-all duration-300 flex items-start gap-2.5 ${
                isMyTurn
                  ? "border-amber-300 bg-amber-50 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                  : "border-[#e7e2d9] bg-[#f8f3ea] opacity-90"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                  isMyTurn ? "bg-amber-500 text-black" : "bg-[#ede8df] text-zinc-600"
                }`}
              >
                {isMyTurn ? "👑" : "⏳"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-zinc-600">
                    Lượt hiện tại:
                  </span>
                  <span
                    className={`text-xs font-bold px-1.5 py-0.2 rounded ${
                      isMyTurn
                        ? "text-black bg-amber-200/90"
                        : "text-zinc-900 bg-[#e7e2d9]"
                    }`}
                  >
                    {isMyTurn ? `${viewerUser.name} (Chính Bạn!)` : activePlayer.name}
                  </span>
                  {!isMyTurn && (
                    <span className="text-[10px] text-amber-700 font-semibold bg-amber-100 px-1 py-0.2 rounded">
                      Khán giả
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-zinc-600 mt-0.5 leading-snug">
                  {isMyTurn
                    ? isCardFlipped
                      ? "Đọc to thử thách bên dưới, làm hoặc uống 1 ngụm!"
                      : "Chạm vào lá bài định mệnh bên dưới để rút thẻ!"
                    : isCardFlipped
                    ? `${activePlayer.name} vừa rút bài! Đang chờ bạn ấy hành động...`
                    : `Vui lòng chờ ${activePlayer.name} chạm rút bài...`}
                </p>

                {/* Thông báo sự kiện phạt / phản hồi cứu bồ gần nhất */}
                {gameState.lastActionMessage && (
                  <div className="mt-1.5 text-[10px] bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                    <span>📣</span>
                    <span>{gameState.lastActionMessage}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Player Avatars Row */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>Bàn nhậu ({players.length})</span>
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  Lượt {gameState.currentTurnIndex + 1}/{players.length}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {players.map((p) => {
                  const isCurrent = p.id === gameState.currentTurnIndex;
                  const isViewer = p.id === viewerUser.id;
                  const isPendingTarget = gameState.helpRequest?.targetPlayerId === p.id && gameState.helpRequest?.status === "pending";
                  const isAcceptedTarget = gameState.helpRequest?.targetPlayerId === p.id && gameState.helpRequest?.status === "accepted";
                  const isVerifier = gameState.verificationRequest?.verifierPlayerId === p.id && gameState.verificationRequest?.status === "pending";

                  let boxClass = "bg-[#f8f3ea] border border-transparent";
                  let textClass = "text-zinc-500";
                  let status = "Chờ";

                  if (isCurrent) {
                    boxClass = "bg-amber-100/90 border border-amber-400 shadow-sm";
                    textClass = "text-amber-950 font-bold";
                    status = isCardFlipped ? "Đang trả lời" : "Đang rút...";
                  } else if (isVerifier) {
                    boxClass = "bg-purple-100 border border-purple-400 animate-pulse";
                    textClass = "text-purple-950 font-bold";
                    status = "Trọng tài ⚖️";
                  } else if (isPendingTarget) {
                    boxClass = "bg-amber-200 border border-amber-500 animate-pulse";
                    textClass = "text-amber-950 font-bold";
                    status = "Đang hỏi ❓";
                  } else if (isAcceptedTarget) {
                    boxClass = "bg-emerald-100 border border-emerald-400";
                    textClass = "text-emerald-900 font-bold";
                    status = "Uống hộ 🍺";
                  } else if (isViewer) {
                    boxClass = "bg-[#ede8df] border border-zinc-300";
                    textClass = "text-zinc-900 font-semibold";
                    status = "Bạn";
                  }

                  return (
                    <div
                      key={p.id}
                      className={`p-1.5 rounded-lg flex flex-col items-center text-center ${boxClass} transition-all`}
                    >
                      <div className="relative mb-0.5">
                        <div
                          className={`w-8 h-8 rounded-full ${p.color} text-white flex items-center justify-center font-bold text-xs shadow-xs`}
                        >
                          {p.initial}
                        </div>
                        {isCurrent && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-amber-500 rounded-full flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          </span>
                        )}
                        {isAcceptedTarget && (
                          <span className="absolute -top-1 -right-1 text-xs">🍺</span>
                        )}
                        {isVerifier && (
                          <span className="absolute -top-1 -right-1 text-xs">⚖️</span>
                        )}
                      </div>
                      <span className={`text-[11px] truncate w-full ${textClass}`}>
                        {p.name.split(" ").pop()}
                      </span>
                      <span className="text-[9px] truncate w-full opacity-80">
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. 3D Flipping Deck Area */}
            <div className="flex flex-col items-center justify-center py-0.5">
              <div className="w-full max-w-[265px] aspect-[5/7] relative select-none [perspective:1200px]">
                <div
                  ref={cardFlipperRef}
                  onClick={handleCardClick}
                  className={`w-full h-full relative [transform-style:preserve-3d] transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    isCardFlipped ? "[transform:rotateY(180deg)]" : ""
                  } ${isMyTurn ? "cursor-pointer" : "cursor-not-allowed opacity-95"}`}
                >
                  {/* CARD BACK */}
                  <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] rounded-2xl bg-gradient-to-br from-[#1c1b18] via-[#2a2824] to-[#141413] border-2 border-amber-500/60 shadow-xl p-3 flex flex-col justify-between items-center text-amber-100 overflow-hidden group">
                    <div className="absolute inset-0 celestial-shimmer pointer-events-none" />

                    <div className="w-full flex items-center justify-between text-amber-400/80 font-mono text-[10px] z-10">
                      <span>DECK·04</span>
                      <span className="flex items-center gap-0.5">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>CELESTIAL</span>
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center my-auto z-10 text-center">
                      <div className="w-18 h-18 p-3 rounded-full bg-gradient-to-tr from-amber-600/30 via-amber-400/20 to-transparent border border-amber-400/40 flex items-center justify-center shadow-lg relative group-hover:scale-105 transition-transform duration-300">
                        <Wine className="w-7 h-7 text-amber-300 drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]" />
                      </div>

                      <h3 className="text-amber-300 font-bold text-sm tracking-wider mt-2.5 drop-shadow">
                        THẺ BÀI ĐỊNH MỆNH
                      </h3>
                      <p className="text-[11px] text-amber-200/70 mt-0.5">
                        {isMyTurn
                          ? "Chạm để rút lá tiếp theo"
                          : `Chờ ${activePlayer.name} rút bài...`}
                      </p>
                    </div>

                    <div className="w-full py-1.5 px-2 rounded-lg bg-black/50 border border-amber-500/30 text-center z-10 flex items-center justify-center gap-1 text-[11px]">
                      {isMyTurn ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                          <span className="text-amber-300 font-bold">Chạm để Rút Bài</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="text-zinc-400">Chỉ xem • Đang khóa</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* CARD FRONT */}
                  <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl bg-white border-2 border-amber-400/80 shadow-xl p-3 flex flex-col justify-between text-[#1d1c16] overflow-hidden">
                    <div>
                      <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${currentCard.badgeBg}`}
                        >
                          {currentCard.typeLabel}
                        </span>
                        <span className="text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                          {currentCard.difficulty}
                        </span>
                      </div>

                      <div className="mt-2.5 text-left">
                        <h4 className="font-bold text-sm text-[#1d1c16] tracking-tight leading-snug">
                          {currentCard.title}
                        </h4>
                        <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">
                          {currentCard.description}
                        </p>
                      </div>
                    </div>

                    {/* Hộp hình phạt 1 ngụm nhẹ nhàng */}
                    <div className="space-y-1.5 mt-1">
                      <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-2 flex items-start gap-2 shadow-xs">
                        <span className="text-lg select-none shrink-0">🍺</span>
                        <div className="text-left min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                            Hình phạt nếu từ chối
                          </span>
                          <span className="text-xs font-semibold text-amber-950 leading-tight block mt-0.5">
                            {currentCard.penalty}
                          </span>
                        </div>
                      </div>

                      {/* Trạng thái xác nhận ngẫu nhiên */}
                      {isWaitingVerification && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-1.5 text-[11px] text-purple-900 font-semibold flex items-center gap-1.5 animate-pulse">
                          <span>⚖️</span>
                          <span>
                            Đang chờ <b>{gameState.verificationRequest?.verifierPlayerName}</b> xác nhận đã uống 1 ngụm...
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BỘ THẢ CẢM XÚC BÀN NHẬU */}
            <div className="bg-[#ede8df]/70 rounded-xl p-1.5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">
                Thả cảm xúc:
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onAddReaction("haha")}
                  className="px-1.5 py-0.5 text-xs rounded-lg bg-white/80 hover:bg-white active:scale-90 transition-all flex items-center gap-0.5 shadow-xs"
                  title="Thả Haha"
                >
                  <span>😂</span>
                  <span className="text-[10px] text-zinc-600 font-bold">{reactions.haha}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onAddReaction("lol")}
                  className="px-1.5 py-0.5 text-xs rounded-lg bg-white/80 hover:bg-white active:scale-90 transition-all flex items-center gap-0.5 shadow-xs"
                  title="Thả Cười bò"
                >
                  <span>🤣</span>
                  <span className="text-[10px] text-zinc-600 font-bold">{reactions.lol}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onAddReaction("beer")}
                  className="px-1.5 py-0.5 text-xs rounded-lg bg-white/80 hover:bg-white active:scale-90 transition-all flex items-center gap-0.5 shadow-xs"
                  title="1 Ngụm"
                >
                  <span>🍺</span>
                  <span className="text-[10px] text-zinc-600 font-bold">{reactions.beer}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onAddReaction("cheer")}
                  className="px-1.5 py-0.5 text-xs rounded-lg bg-white/80 hover:bg-white active:scale-90 transition-all flex items-center gap-0.5 shadow-xs"
                  title="Cụng ly Zô"
                >
                  <span>🍻</span>
                  <span className="text-[10px] text-zinc-600 font-bold">{reactions.cheer}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onAddReaction("popcorn")}
                  className="px-1.5 py-0.5 text-xs rounded-lg bg-white/80 hover:bg-white active:scale-90 transition-all flex items-center gap-0.5 shadow-xs"
                  title="Hóng biến"
                >
                  <span>🍿</span>
                  <span className="text-[10px] text-zinc-600 font-bold">{reactions.popcorn}</span>
                </button>
              </div>
            </div>

            {/* 4. Action Buttons Area */}
            <div className="space-y-1.5 pt-0.5 shrink-0">
              {isMyTurn ? (
                !isCardFlipped ? (
                  <>
                    <button
                      type="button"
                      onClick={onDrawCard}
                      className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-black" />
                      <span>CHẠM ĐỂ RÚT THẺ BÀI</span>
                    </button>
                    <p className="text-[10px] text-zinc-500 text-center">
                      Hoặc chạm trực tiếp vào thẻ bài ở trên
                    </p>
                  </>
                ) : (
                  <>
                    {/* Nút Đã Xong / Đã Uống 1 ngụm -> Cần 1 người ngẫu nhiên xác nhận */}
                    <button
                      type="button"
                      disabled={isWaitingVerification}
                      onClick={onRequestDrinkCompletion}
                      className={`w-full min-h-[40px] px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${
                        isWaitingVerification
                          ? "bg-purple-800 text-purple-200 cursor-wait animate-pulse"
                          : "bg-black text-white hover:bg-neutral-800 active:scale-95"
                      }`}
                    >
                      {isWaitingVerification ? (
                        <>
                          <ShieldCheck className="w-4 h-4 text-purple-300" />
                          <span>ĐANG CHỜ 1 BẠN NGẪU NHIÊN XÁC NHẬN...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>ĐÃ UỐNG 1 NGỤM (CHỜ BẠN XÁC NHẬN)</span>
                        </>
                      )}
                    </button>

                    {/* Hàng 3 nút: Uống 1 ngụm | Chỉ định hộ (hoàn lại nếu từ chối) | Đổi bài (Báo cả bàn phạt) */}
                    <div className="grid grid-cols-3 gap-1">
                      
                      {/* 1. Đã uống 1 ngụm (kích hoạt xác nhận ngẫu nhiên) */}
                      <button
                        type="button"
                        disabled={isWaitingVerification}
                        onClick={onRequestDrinkCompletion}
                        className="w-full min-h-[36px] px-1 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-[10px] flex items-center justify-center gap-1 transition-all"
                        title="Bấm để nhờ 1 bạn ngẫu nhiên trong bàn ngó và xác nhận đã uống"
                      >
                        <span>🍺</span>
                        <span>Đã uống (1 ngụm)</span>
                      </button>

                      {/* 2. Nhờ hoặc chỉ định đứa khác uống hộ (Chỉ 1 lần - nếu bị từ chối sẽ HOÀN LẠI) */}
                      <button
                        type="button"
                        disabled={hasUsedHelp || gameState.helpRequest?.status === "pending" || isWaitingVerification}
                        onClick={() => setShowHelperModal(true)}
                        className={`w-full min-h-[36px] px-1 py-1 rounded-lg font-bold text-[10px] flex flex-col items-center justify-center transition-all ${
                          hasUsedHelp
                            ? "bg-zinc-200 text-zinc-400 cursor-not-allowed border border-zinc-300"
                            : "bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300"
                        }`}
                        title={hasUsedHelp ? "Bạn đã dùng thành công 1 lần nhờ trong ván này" : "Chỉ định người uống hộ (nếu bị từ chối sẽ hoàn lại)"}
                      >
                        <div className="flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-sky-700" />
                          <span>Chỉ định hộ</span>
                        </div>
                        <span className="text-[8px] font-normal opacity-80">
                          {hasUsedHelp ? "(Đã dùng 1/1)" : "(Hoàn nếu từ chối)"}
                        </span>
                      </button>

                      {/* 3. Đổi lá khác (BÁO TOÀN BÀN BẮT PHẠT UỐNG 1 NGỤM) */}
                      <button
                        type="button"
                        disabled={isWaitingVerification}
                        onClick={onRerollCardWithPenalty}
                        className="w-full min-h-[36px] px-1 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-900 font-bold text-[10px] flex items-center justify-center gap-1 transition-all"
                        title="Đổi bài sẽ báo chuông cho cả bàn bắt uống phạt 1 ngụm!"
                      >
                        <RotateCw className="w-3 h-3 text-red-700" />
                        <span>Đổi lá (Báo phạt)</span>
                      </button>

                    </div>
                  </>
                )
              ) : (
                <>
                  <button
                    disabled
                    className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-[#ede8df] text-zinc-500 cursor-not-allowed font-medium text-xs flex items-center justify-center gap-1.5 border border-zinc-300 select-none"
                  >
                    <Lock className="w-4 h-4 text-zinc-400" />
                    <span>Chỉ xem • Đang là lượt của {activePlayer.name}</span>
                  </button>
                  <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-500 pt-0.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Bạn có thể bấm thả Haha 😂 hoặc Cười bò 🤣 ở trên</span>
                  </div>
                </>
              )}
            </div>

          </div>

          {/* Footer Bar */}
          <div className="px-3 py-1.5 bg-[#f8f3ea] border-t border-[#f3ede4] text-center text-[10px] text-zinc-500 flex items-center justify-between font-mono shrink-0">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Realtime Local Sync</span>
            </span>
            <span>Arial Font • Drinking Fun</span>
          </div>

        </div>
      </div>

      {/* MODAL 1: CHỌN ĐỨA BẠN ĐỂ CHỈ ĐỊNH (HOÀN TRẢ LẠI NẾU TỪ CHỐI) */}
      {showHelperModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-4 shadow-2xl border border-zinc-200 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-1.5">
                <span className="text-xl">🤝</span>
                <h4 className="font-bold text-sm text-zinc-900">
                  Chỉ định đứa uống hộ:
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowHelperModal(false)}
                className="text-zinc-400 hover:text-zinc-800 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-500 mt-2 mb-3">
              Chỉ được dùng <b>1 lần thành công</b>. Nếu người đó <b>từ chối</b>, quyền này sẽ được <b>hoàn trả lại</b> cho bạn!
            </p>

            <div className="space-y-1.5">
              {players
                .filter((p) => p.id !== viewerUser.id)
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onRequestHelp(p);
                      setShowHelperModal(false);
                    }}
                    className="w-full p-2 rounded-xl bg-zinc-50 hover:bg-amber-50 hover:border-amber-300 border border-zinc-200 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full ${p.color} text-white flex items-center justify-center text-xs font-bold`}
                      >
                        {p.initial}
                      </div>
                      <span className="text-xs font-bold text-zinc-800">
                        {p.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-sky-700 font-semibold bg-sky-100 px-2 py-0.5 rounded">
                      Gửi thỉnh cầu 🍺
                    </span>
                  </button>
                ))}
            </div>

            <button
              type="button"
              onClick={() => setShowHelperModal(false)}
              className="w-full mt-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 text-center font-semibold"
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: HIỂN THỊ TRÊN MÁY NGƯỜI ĐƯỢC CHỈ ĐỊNH ĐỂ CHỌN "AUKE" HAY "TỪ CHỐI" */}
      {isIncomingHelpTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xs w-full p-4 shadow-2xl border-2 border-amber-400 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center text-2xl shadow-sm">
              🍺
            </div>

            <div>
              <h4 className="font-bold text-sm text-zinc-900">
                Thỉnh Cầu Cứu Bồ!
              </h4>
              <p className="text-xs text-zinc-600 mt-1">
                <b>{gameState.helpRequest?.fromPlayerName}</b> đang thỉnh cầu bạn uống hộ <b>1 ngụm bia</b>!
              </p>
            </div>

            <div className="bg-amber-50 p-2 rounded-xl text-[11px] text-amber-900 border border-amber-200">
              Bạn có <b>auke (đồng ý)</b> hỗ trợ uống giùm không? (Nếu bạn từ chối, quyền sẽ được hoàn lại cho bạn ấy).
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onRespondHelp(true)}
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Auke, uống! 🍺</span>
              </button>

              <button
                type="button"
                onClick={() => onRespondHelp(false)}
                className="py-2 px-3 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
                <span>Từ chối 😂</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: TRỌNG TÀI NGẪU NHIÊN XÁC NHẬN "ĐÃ UỐNG 1 NGỤM" */}
      {isRandomVerifier && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xs w-full p-4 shadow-2xl border-2 border-purple-500 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 mx-auto flex items-center justify-center text-2xl shadow-sm">
              ⚖️
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                BẠN LÀ TRỌNG TÀI NGẪU NHIÊN!
              </span>
              <h4 className="font-bold text-sm text-zinc-900 mt-1.5">
                Xác Nhận Đã Uống 1 Ngụm
              </h4>
              <p className="text-xs text-zinc-600 mt-1">
                <b>{gameState.verificationRequest?.drinkingPlayerName}</b> vừa bấm khai báo là <b>đã uống xong 1 ngụm rồi</b>!
              </p>
            </div>

            <div className="bg-purple-50 p-2 rounded-xl text-[11px] text-purple-900 border border-purple-200">
              Hãy ngó qua bàn xem người đó đã uống thật chưa và bấm xác nhận để qua lượt nhé!
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onRespondVerification(true)}
                className="py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Xác nhận (Uống rồi) 🍺</span>
              </button>

              <button
                type="button"
                onClick={() => onRespondVerification(false)}
                className="py-2 px-3 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
                <span>Chưa uống / Phạt lại! 🧐</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
