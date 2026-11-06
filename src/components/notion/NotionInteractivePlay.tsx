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
  const [readCountdown, setReadCountdown] = useState<number>(0);
  const [endGameCountdown, setEndGameCountdown] = useState<number>(20);
  const [voteCountdown, setVoteCountdown] = useState<number>(10);
  const [voteWinner, setVoteWinner] = useState<{ name: string; count: number } | null>(null);
  const [showImmunityModal, setShowImmunityModal] = useState<boolean>(false);
  const [luckyPlayerName, setLuckyPlayerName] = useState<string>("");
  const [floatingEmojis, setFloatingEmojis] = useState<
    { id: number; emoji: string; left: number }[]
  >([]);

  // Dữ liệu thời gian thực được cấp trực tiếp từ Cloud Firestore qua roomData
  const players: Player[] =
    roomData?.players && roomData.players.length > 0
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
  const votes = roomData?.votes || {};
  const endGameRequest = roomData?.endGameRequest;

  const currentCard: DrinkingCard | undefined = deck[cardIndex];
  const activePlayer: Player | undefined =
    players.length > 0 ? players[currentTurnIdx % players.length] : undefined;

  // LOGIC PHÂN QUYỀN LƯỢT CHƠI TUYỆT ĐỐI:
  // Chỉ đúng tài khoản của người đến lượt mới được rút thẻ và bấm nút hoàn thành!
  const isMyTurn = Boolean(
    activePlayer &&
      currentUser &&
      (
        (activePlayer.email &&
          currentUser.email &&
          activePlayer.email.trim().toLowerCase() === currentUser.email.trim().toLowerCase()) ||
        (activePlayer.uid && currentUser.uid && activePlayer.uid === currentUser.uid) ||
        (activePlayer.name &&
          currentUser.name &&
          activePlayer.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
      )
  );

  // Kiểm tra xem thẻ hiện tại có phải câu hỏi vote / bình chọn cả bàn không
  const isVoteCard = Boolean(
    currentCard &&
      (
        currentCard.type === "POLL" ||
        currentCard.title.toLowerCase().includes("bình chọn") ||
        currentCard.title.toLowerCase().includes("vote") ||
        currentCard.title.toLowerCase().includes("chỉ tay") ||
        currentCard.description.toLowerCase().includes("bình chọn") ||
        currentCard.description.toLowerCase().includes("chỉ tay") ||
        currentCard.description.toLowerCase().includes("nhiều muối nhất") ||
        currentCard.description.toLowerCase().includes("ai là người") ||
        currentCard.description.toLowerCase().includes("đồng loạt chỉ")
      )
  );

  // Thống kê bình chọn cho câu hỏi vote
  const voteCounts: Record<string, number> = {};
  Object.values(votes).forEach((targetName) => {
    voteCounts[targetName] = (voteCounts[targetName] || 0) + 1;
  });
  const myCurrentVote = currentUser
    ? votes[currentUser.uid || currentUser.email || currentUser.name]
    : undefined;

  // 6 giây đếm ngược đọc thử thách trước khi được bấm hoàn thành
  useEffect(() => {
    if (isFlipped) {
      setReadCountdown(6);
      const interval = setInterval(() => {
        setReadCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setReadCountdown(0);
    }
  }, [isFlipped, cardIndex]);

  // Đếm ngược 10 giây cho câu hỏi Bình Chọn (Vote)
  useEffect(() => {
    if (isFlipped && isVoteCard) {
      setVoteCountdown(10);
      setVoteWinner(null);
      const interval = setInterval(() => {
        setVoteCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setVoteCountdown(10);
      setVoteWinner(null);
    }
  }, [isFlipped, cardIndex, isVoteCard]);

  // Chốt người có số phiếu cao nhất khi hết 10 giây hoặc tất cả người chơi đã vote
  useEffect(() => {
    if (
      isFlipped &&
      isVoteCard &&
      (voteCountdown === 0 || (Object.keys(votes).length >= players.length && players.length > 1))
    ) {
      let maxCount = -1;
      let topPlayerName = "";
      Object.entries(voteCounts).forEach(([name, count]) => {
        if (count > maxCount) {
          maxCount = count;
          topPlayerName = name;
        }
      });

      if (topPlayerName && maxCount > 0 && (!voteWinner || voteWinner.name !== topPlayerName)) {
        setVoteWinner({ name: topPlayerName, count: maxCount });
        sounds.playFanfareCelebration();
      }
    }
  }, [voteCountdown, isFlipped, isVoteCard, votes, voteCounts, players.length, voteWinner]);

  // Đếm ngược 20 giây tự động kết thúc ván nếu không ai phản hồi từ chối
  useEffect(() => {
    if (!endGameRequest?.requestedAt) {
      setEndGameCountdown(20);
      return;
    }

    const checkTimeout = () => {
      const elapsed = Math.floor((Date.now() - endGameRequest.requestedAt) / 1000);
      const remaining = Math.max(0, 20 - elapsed);
      setEndGameCountdown(remaining);

      if (remaining <= 0) {
        const myId = currentUser?.uid || currentUser?.email || currentUser?.name;
        if (isHost || (myId && myId === endGameRequest.approvals[0])) {
          sounds.playSuccessChime();
          updateRoom(roomCode, {
            status: "summary",
            endGameRequest: null,
            updatedAt: Date.now(),
          });
          if (onFinishGame) onFinishGame();
        }
      }
    };

    checkTimeout();
    const interval = setInterval(checkTimeout, 1000);
    return () => clearInterval(interval);
  }, [endGameRequest, roomCode, currentUser, isHost, onFinishGame]);

  // Lắng nghe reactions thời gian thực từ Firestore để bắn emoji trên mọi máy
  useEffect(() => {
    if (roomData?.reactions && roomData.reactions.length > 0) {
      const latest = roomData.reactions[0];
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

  // 1. Hành động Bốc / Lật Thẻ: Chỉ người đến lượt mới được bấm
  const handleDrawCard = async () => {
    if (!isMyTurn) {
      triggerToast(`⛔ Chưa tới lượt bạn! Đang là lượt rút bài của ${activePlayer?.name || "bạn nhậu"}.`);
      return;
    }
    if (isFlipped) return;

    triggerHaptic("heavy");
    // Âm thanh kèn trống chúc mừng + cụng ly
    sounds.playFanfareCelebration();
    triggerToast(`🎺🎉 ${activePlayer?.name} vừa bốc mở thẻ bài mới!`);

    // Cập nhật Firestore -> Tất cả máy khác lập tức nhận snapshot và xoay 3D lật thẻ
    await updateRoom(roomCode, {
      isFlipped: true,
      votes: {}, // Reset votes cho lá bài mới
      updatedAt: Date.now(),
    });
  };

  // 2. Bỏ phiếu bình chọn người trong phòng (cho các câu hỏi Poll / Vote)
  const handleVotePlayer = async (targetPlayerName: string) => {
    if (!currentUser) return;
    if (voteCountdown === 0) {
      triggerToast("🔒 Đã hết 10 giây bình chọn! Kết quả đã được chốt.");
      return;
    }
    triggerHaptic("medium");
    sounds.playBeerClink();
    triggerToast(`🗳️ Bạn đã bình chọn cho: ${targetPlayerName}`);

    const voterId = currentUser.uid || currentUser.email || currentUser.name;
    const updatedVotes = { ...votes, [voterId]: targetPlayerName };

    await updateRoom(roomCode, {
      votes: updatedVotes,
      updatedAt: Date.now(),
    });
  };

  // 3. Hoàn thành lượt chơi: Khai thật hoặc Uống phạt
  const handleCompleteTurn = async (resultType: "passed" | "drank") => {
    if (!isMyTurn) {
      triggerToast(`⛔ Chỉ ${activePlayer?.name} mới có quyền xác nhận hoàn thành lượt này!`);
      return;
    }
    if (readCountdown > 0) {
      triggerToast(`⏳ Vui lòng đọc kỹ câu hỏi & thử thách trong ${readCountdown} giây nữa!`);
      return;
    }
    if (!currentCard || !activePlayer) return;

    const penaltySips = resultType === "passed" ? 0 : parseSips(currentCard.penalty);

    triggerHaptic(resultType === "passed" ? "medium" : "heavy");
    if (resultType === "passed") {
      sounds.playSuccessChime();
    } else {
      sounds.playBeerGulp();
      setTimeout(() => sounds.playBeerClink(), 150);
    }

    // Tỉ lệ cực kỳ thấp (~4%) xuất hiện Kim Bài Miễn Tử (Lệnh Bài Miễn Uống)
    const gotImmunityToken = Math.random() < 0.04;
    if (gotImmunityToken) {
      sounds.playFanfareCelebration();
      setLuckyPlayerName(activePlayer.name);
      setShowImmunityModal(true);
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
          ? gotImmunityToken
            ? "Đã hoàn thành thử thách & NHẬN ĐƯỢC KIM BÀI MIỄN TỬ 🛡️"
            : "Đã dũng cảm hoàn thành thử thách ✅"
          : `Đã uống ${penaltySips} ngụm phạt 🍺`,
      sips: penaltySips,
      timestamp: "Vừa xong",
    };

    const nextCardIdx = cardIndex + 1;
    const nextTurn = players.length > 0 ? (currentTurnIdx + 1) % players.length : 0;
    const updatedHistory = [historyEntry, ...historyList];
    const updatedBeer = beerConsumed + penaltySips;

    // Cập nhật số ngụm của người chơi và cộng Lệnh Bài Miễn Uống nếu may mắn
    const updatedPlayers = players.map((p, idx) => {
      if (idx === (currentTurnIdx % players.length)) {
        return {
          ...p,
          drinksCount: (p.drinksCount || 0) + penaltySips,
          immunityTokens: (p.immunityTokens || 0) + (gotImmunityToken ? 1 : 0),
        };
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
        votes: {},
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
      votes: {},
      updatedAt: Date.now(),
    });

    const nextPlayerName = players[nextTurn]?.name || "người tiếp theo";
    triggerToast(
      gotImmunityToken
        ? `🎉 ${activePlayer.name} nhận được KIM BÀI MIỄN TỬ! Lượt sang ${nextPlayerName} 🍻`
        : `Đã ghi nhận! Chuyển lượt sang ${nextPlayerName} 🍻`
    );
  };

  // 4. Dùng Kim Bài Miễn Tử (Lệnh Bài Miễn Uống) để thoát phạt
  const handleUseImmunityToken = async () => {
    if (!isMyTurn) {
      triggerToast(`⛔ Chỉ ${activePlayer?.name} mới có quyền dùng Lệnh Bài lúc này!`);
      return;
    }
    if ((activePlayer?.immunityTokens || 0) <= 0) {
      triggerToast("🛡️ Bạn chưa sở hữu Lệnh Bài Miễn Uống!");
      return;
    }
    if (!currentCard || !activePlayer) return;

    triggerHaptic("heavy");
    sounds.playFanfareCelebration();
    triggerToast(`🛡️ ${activePlayer.name} đã xuất chiêu KIM BÀI MIỄN TỬ, miễn hoàn toàn ngụm phạt!`);

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
      result: "passed",
      resultText: "🛡️ ĐÃ DÙNG KIM BÀI MIỄN TỬ (Miễn uống phạt 0 ngụm)",
      sips: 0,
      timestamp: "Vừa xong",
    };

    const nextCardIdx = cardIndex + 1;
    const nextTurn = players.length > 0 ? (currentTurnIdx + 1) % players.length : 0;
    const updatedHistory = [historyEntry, ...historyList];

    // Trừ 1 thẻ kim bài miễn tử của người chơi hiện tại
    const updatedPlayers = players.map((p, idx) => {
      if (idx === (currentTurnIdx % players.length)) {
        return {
          ...p,
          immunityTokens: Math.max(0, (p.immunityTokens || 1) - 1),
        };
      }
      return p;
    });

    if (nextCardIdx >= deck.length) {
      sounds.playBeerClink();
      await updateRoom(roomCode, {
        status: "summary",
        beerConsumed,
        history: updatedHistory,
        players: updatedPlayers,
        votes: {},
        updatedAt: Date.now(),
      });
      if (onFinishGame) onFinishGame();
      return;
    }

    await updateRoom(roomCode, {
      isFlipped: false,
      currentCardIndex: nextCardIdx,
      currentTurnIdx: nextTurn,
      history: updatedHistory,
      players: updatedPlayers,
      votes: {},
      updatedAt: Date.now(),
    });

    const nextPlayerName = players[nextTurn]?.name || "người tiếp theo";
    triggerToast(`🛡️ Thoát phạt thành công! Chuyển lượt sang ${nextPlayerName} 🍻`);
  };

  // 4. Cơ chế Kết Thúc Ván: Solo kết thúc ngay, Multiplayer đếm ngược 20s
  const handleRequestEndGame = async () => {
    if (!currentUser) return;

    // Nếu chơi một mình (Solo): Bấm kết thúc thì mặc định kết thúc luôn!
    if (players.length <= 1) {
      triggerHaptic("medium");
      sounds.playSuccessChime();
      triggerToast("🎉 Đã kết thúc ván chơi! Đang mở Bảng Phong Thần...");
      await updateRoom(roomCode, {
        status: "summary",
        endGameRequest: null,
        updatedAt: Date.now(),
      });
      if (onFinishGame) onFinishGame();
      return;
    }

    const myId = currentUser.uid || currentUser.email || currentUser.name;
    triggerHaptic("medium");
    sounds.playBeerClink();
    triggerToast("📢 Đã gửi yêu cầu kết thúc! Tự động kết thúc sau 20s nếu không ai từ chối...");

    await updateRoom(roomCode, {
      endGameRequest: {
        requesterName: currentUser.name || "Một bạn nhậu",
        requestedAt: Date.now(),
        approvals: [myId],
      },
      updatedAt: Date.now(),
    });
  };

  const handleApproveEndGame = async () => {
    if (!currentUser || !endGameRequest) return;
    const myId = currentUser.uid || currentUser.email || currentUser.name;
    if (endGameRequest.approvals.includes(myId)) return;

    triggerHaptic("medium");
    sounds.playBeerClink();

    const updatedApprovals = [...endGameRequest.approvals, myId];

    // Nếu tất cả người chơi đều đã bấm đồng ý -> Kết thúc ván và chuyển sang Bảng Phong Thần!
    if (updatedApprovals.length >= Math.max(players.length, 1)) {
      sounds.playSuccessChime();
      triggerToast("🎉 Toàn bộ người chơi đã đồng ý! Đang mở Bảng Phong Thần...");
      await updateRoom(roomCode, {
        status: "summary",
        endGameRequest: null,
        updatedAt: Date.now(),
      });
      if (onFinishGame) onFinishGame();
    } else {
      triggerToast(`✅ Bạn đã đồng ý kết thúc (${updatedApprovals.length}/${players.length})`);
      await updateRoom(roomCode, {
        endGameRequest: {
          ...endGameRequest,
          approvals: updatedApprovals,
        },
        updatedAt: Date.now(),
      });
    }
  };

  const handleRejectEndGame = async () => {
    triggerHaptic("light");
    triggerToast("🍺 Bạn đã từ chối kết thúc, tiếp tục cuộc vui!");
    await updateRoom(roomCode, {
      endGameRequest: null,
      updatedAt: Date.now(),
    });
  };

  // 5. Tương tác cảm xúc
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

    await updateRoom(roomCode, {
      reactions: [newReaction, ...(roomData?.reactions || []).slice(0, 5)],
      updatedAt: Date.now(),
    });
  };

  const penaltySips = parseSips(currentCard?.penalty);

  const currentUserId = currentUser?.uid || currentUser?.email || currentUser?.name || "";
  const hasApprovedEndGame = Boolean(endGameRequest?.approvals?.includes(currentUserId));

  return (
    <div className="flex flex-col w-full gap-space-md relative pb-6 select-none">
      {/* Floating Emojis Animation Realtime */}
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

      {/* POPUP XÁC NHẬN KẾT THÚC VÁN (20s TỰ ĐỘNG KẾT THÚC HOẶC TẤT CẢ XÁC NHẬN) */}
      {endGameRequest && (
        <div className="p-3.5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/60 shadow-lg space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-1.5">
              <span>🔔</span>
              <span>Yêu Cầu Kết Thúc Bàn Nhậu</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-code-inline text-xs font-bold">
              ⏳ Tự kết thúc sau {endGameCountdown}s
            </span>
          </div>
          <p className="font-body-sm text-xs text-on-surface leading-snug">
            <strong>{endGameRequest.requesterName}</strong> muốn kết thúc ván ({endGameRequest.approvals.length}/{players.length} đồng ý). Nếu không ai bấm &quot;Tiếp Tục Chơi&quot;, ván sẽ <strong>tự động kết thúc sau {endGameCountdown}s</strong>!
          </p>

          <div className="flex items-center gap-2 pt-1">
            {!hasApprovedEndGame ? (
              <>
                <button
                  type="button"
                  onClick={handleApproveEndGame}
                  className="flex-1 py-2 px-3 rounded-xl bg-primary text-on-primary font-label-md text-xs font-bold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Đồng Ý Kết Thúc</span>
                </button>
                <button
                  type="button"
                  onClick={handleRejectEndGame}
                  className="py-2 px-3 rounded-xl bg-surface-container-high text-on-surface font-label-md text-xs font-medium hover:bg-surface-container-highest transition-colors active:scale-95"
                >
                  Tiếp Tục Chơi 🍺
                </button>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-between bg-surface-container px-3 py-2 rounded-xl">
                <span className="text-secondary text-xs font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                  <span>Đã đồng ý (Tự kết thúc sau {endGameCountdown}s)</span>
                </span>
                <button
                  type="button"
                  onClick={handleRejectEndGame}
                  className="text-xs text-error font-medium hover:underline ml-2"
                >
                  Hủy yêu cầu
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header bar: Bàn chơi thời gian thực & Lịch sử */}
      <div className="bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container-high shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <span className="font-label-md text-label-md font-bold text-on-surface truncate">
            Bàn #{roomCode}
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

      {/* KHUNG BÀN CHƠI THỰC CHIẾN */}
      <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container-high shadow-md space-y-3">
        {/* Turn Status Banner */}
        <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-8 h-8 rounded-full ${isMyTurn ? "bg-primary text-on-primary" : "bg-secondary-fixed text-on-secondary-fixed"} flex items-center justify-center font-bold text-sm shrink-0`}>
              {activePlayer?.initial || "??"}
            </div>
            <div className="min-w-0">
              <span className="font-body-md font-bold text-on-surface truncate block">
                {isMyTurn ? `${activePlayer?.name} (LƯỢT CỦA BẠN!)` : `Lượt của: ${activePlayer?.name}`}
              </span>
              <span className="text-secondary font-label-sm block truncate">
                {isMyTurn
                  ? isFlipped
                    ? "Bạn đang đọc thử thách & chịu phạt"
                    : "Chạm vào lá bài để rút lượt này"
                  : isFlipped
                  ? `Đang theo dõi ${activePlayer?.name} thực hiện`
                  : `Đang đợi ${activePlayer?.name} rút bài trên máy của họ (Bạn không được rút thay)`}
              </span>
            </div>
          </div>
          <span className="font-code-inline text-code-inline px-2 py-0.5 rounded bg-surface-container-highest text-primary font-bold shrink-0">
            #{cardIndex + 1} / {totalCards}
          </span>
        </div>

        {/* CARD CANVAS: CHẠM ĐỂ BỐC HOẶC LẬT MỞ CÂU HỎI SIÊU NÉT (ZERO BLUR) */}
        <div className="my-1 select-none">
          {!isFlipped ? (
            /* CARD FRONT: Mặt úp của lá bài (Card Back Design) */
            <div
              onClick={isMyTurn ? handleDrawCard : undefined}
              className={`w-full min-h-[250px] rounded-2xl bg-gradient-to-br from-surface-container-low via-surface-container to-surface-container-high border-2 border-dashed ${
                isMyTurn
                  ? "border-primary cursor-pointer active:scale-[0.98] shadow-md hover:border-primary/80"
                  : "border-outline-variant/60 cursor-not-allowed shadow-sm"
              } p-6 flex flex-col items-center justify-center text-center transition-transform`}
            >
              <div
                className={`w-16 h-16 rounded-2xl ${
                  isMyTurn
                    ? "bg-primary text-on-primary shadow-md animate-pulse"
                    : "bg-surface-container-highest text-secondary"
                } flex items-center justify-center text-3xl mb-3`}
              >
                🎲
              </div>
              <h3 className="font-headline-sm text-base font-bold text-on-surface">
                {isMyTurn
                  ? "LƯỢT CỦA BẠN - CHẠM ĐỂ BỐC THẺ"
                  : `LƯỢT CỦA ${activePlayer?.name?.toUpperCase() || "BẠN NHẬU"}`}
              </h3>
              <p className="font-label-sm text-secondary mt-1 max-w-[280px]">
                {isMyTurn
                  ? `Lá bài #${cardIndex + 1} • Luật phạt tính theo từng ngụm bia`
                  : `Chỉ riêng ${activePlayer?.name} mới có quyền rút thẻ trên máy của họ.`}
              </p>
              {isMyTurn ? (
                <span className="mt-4 px-4 py-1.5 rounded-full bg-primary text-on-primary font-label-sm font-semibold shadow-sm animate-bounce">
                  Lật Thẻ Ngay 🃏
                </span>
              ) : (
                <span className="mt-4 px-3.5 py-1 rounded-full bg-surface-container-highest text-secondary font-label-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  <span>Đang đợi {activePlayer?.name} bốc bài...</span>
                </span>
              )}
            </div>
          ) : (
            /* CARD BACK: Mặt ngửa hiển thị câu hỏi - Độ tương phản cao, chữ đậm rõ nét trên mọi điện thoại */
            <div className="w-full rounded-2xl bg-white border-2 border-primary/20 p-5 flex flex-col justify-between shadow-xl animate-card-flip-crisp select-none">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-code-inline text-xs font-bold uppercase px-2.5 py-1 rounded bg-black text-white shadow-xs">
                    {currentCard?.typeLabel || "THỬ THÁCH"}
                  </span>
                  <span className="font-label-sm text-neutral-600 font-semibold">
                    {currentCard?.difficulty || "Độ khó: 3/5"}
                  </span>
                </div>
                <h3 className="font-headline-sm text-lg font-bold text-neutral-950 mt-1">
                  {currentCard?.title || "Thử Thách Nhậu"}
                </h3>
                <div className="mt-2.5 p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 shadow-xs">
                  <p className="font-body-md text-neutral-950 font-semibold text-[15px] sm:text-[16px] leading-relaxed">
                    {currentCard?.description || "Đang tải nội dung lá bài..."}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-200 flex items-center justify-between text-label-md">
                <span className="text-red-700 font-bold flex items-center gap-1 truncate max-w-[220px]">
                  <span className="material-symbols-outlined text-[18px]">gavel</span>
                  <span>{currentCard?.penalty || "Phạt 1 ngụm"}</span>
                </span>
                <span className="font-bold text-neutral-700 font-code-inline text-xs shrink-0">
                  🍺 {beerConsumed} ngụm cả bàn
                </span>
              </div>
            </div>
          )}
        </div>

        {/* PHẦN BÌNH CHỌN CHO CÂU HỎI VOTE / BÌNH CHỌN NGƯỜI TRONG BÀN */}
        {isFlipped && isVoteCard && (
          <div className="p-3.5 rounded-2xl bg-surface-container border border-primary/30 space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-xs font-bold text-on-surface flex items-center gap-1.5">
                <span>🗳️</span>
                <span>Bình Chọn Người Trong Phòng:</span>
              </span>
              <div className="flex items-center gap-1.5">
                {voteCountdown > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-code-inline text-[11px] font-bold animate-pulse">
                    ⏳ Còn {voteCountdown}s
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-neutral-900 text-white font-code-inline text-[11px] font-bold">
                    🔒 ĐÃ CHỐT VOTE
                  </span>
                )}
                <span className="text-[11px] font-code-inline text-secondary">
                  ({Object.keys(votes).length}/{players.length} Đã Vote)
                </span>
              </div>
            </div>

            {/* Thanh tiến trình đếm ngược 10 giây */}
            {voteCountdown > 0 && (
              <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-600 h-1.5 transition-all duration-1000"
                  style={{ width: `${(voteCountdown / 10) * 100}%` }}
                ></div>
              </div>
            )}

            {/* BẢNG CHỐT NGƯỜI BỊ BÌNH CHỌN NHIỀU NHẤT */}
            {voteWinner && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 border-2 border-amber-500 shadow-sm flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-2xl animate-bounce">👑</span>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                      Kết Quả Chốt Bình Chọn:
                    </span>
                    <span className="text-xs font-extrabold text-neutral-950 truncate block">
                      {voteWinner.name} ({voteWinner.count} phiếu)
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-extrabold shrink-0 shadow-xs">
                  Phạt {penaltySips} Ngụm 🍺
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-1.5">
              {players.map((p) => {
                const count = voteCounts[p.name] || 0;
                const isSelected = myCurrentVote === p.name;
                const isWinner = voteWinner?.name === p.name;
                return (
                  <button
                    key={p.name}
                    type="button"
                    disabled={voteCountdown === 0}
                    onClick={() => handleVotePlayer(p.name)}
                    className={`p-2 rounded-xl flex items-center justify-between gap-1.5 border transition-all text-left ${
                      isWinner
                        ? "border-amber-500 ring-2 ring-amber-400/50 bg-amber-50/80 font-bold"
                        : isSelected
                        ? "bg-primary text-on-primary border-primary shadow-xs font-bold"
                        : voteCountdown === 0
                        ? "bg-surface-container-lowest border-surface-container-high opacity-70 cursor-not-allowed text-on-surface"
                        : "bg-surface-container-lowest hover:bg-surface-container-high border-surface-container-high text-on-surface"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center text-[10px] font-bold shrink-0">
                        {p.initial || p.name.slice(0, 1)}
                      </div>
                      <span className="truncate text-xs">{p.name}</span>
                    </div>
                    {count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? "bg-white text-primary" : "bg-amber-100 text-amber-900"}`}>
                        {count} phiếu
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* NÚT THỰC HIỆN LƯỢT CHƠI (CÓ COUNTDOWN 6S ĐỌC BÀI CHỐNG BẤM NHẦM) */}
        <div className="space-y-2 pt-1">
          {isFlipped ? (
            // THẺ ĐÃ LẬT: Chỉ đúng người đến lượt mới được ấn Vượt qua hoặc Uống phạt
            isMyTurn ? (
              <div className="space-y-2">
                {readCountdown > 0 && (
                  <div className="space-y-1">
                    <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-600 h-1.5 transition-all duration-1000"
                        style={{ width: `${(readCountdown / 6) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-[11px] text-secondary text-center block font-medium">
                      ⏳ Đang đọc thử thách &amp; chuẩn bị ({readCountdown}s)...
                    </span>
                  </div>
                )}

                {/* Nút Kim Bài Miễn Tử nếu người chơi có sở hữu */}
                {(activePlayer?.immunityTokens || 0) > 0 && (
                  <button
                    onClick={handleUseImmunityToken}
                    disabled={readCountdown > 0}
                    type="button"
                    className={`w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-neutral-950 font-headline-sm text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md transition-all border border-amber-300 ${
                      readCountdown > 0
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:brightness-105 active:scale-95 cursor-pointer animate-pulse"
                    }`}
                  >
                    <span className="text-base">🛡️</span>
                    <span>DÙNG KIM BÀI MIỄN TỬ (Còn x{activePlayer?.immunityTokens})</span>
                  </button>
                )}

                <button
                  onClick={() => handleCompleteTurn("passed")}
                  disabled={readCountdown > 0}
                  className={`w-full py-3 rounded-xl font-headline-sm text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all ${
                    readCountdown > 0
                      ? "bg-neutral-300 text-neutral-500 cursor-not-allowed opacity-80"
                      : "bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer active:scale-95"
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  <span>
                    {readCountdown > 0
                      ? `⏳ Đọc Kỹ Thử Thách (${readCountdown}s)`
                      : "Đã Khai Thật / Vượt Qua Thử Thách ✅"}
                  </span>
                </button>

                <button
                  onClick={() => handleCompleteTurn("drank")}
                  disabled={readCountdown > 0}
                  className={`w-full py-2.5 rounded-xl font-label-md font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all ${
                    readCountdown > 0
                      ? "bg-neutral-200 text-neutral-400 cursor-not-allowed opacity-80"
                      : "bg-amber-600 hover:bg-amber-700 text-white cursor-pointer active:scale-95"
                  }`}
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
                  Chỉ riêng {activePlayer?.name} mới được bấm xác nhận trên điện thoại của họ!
                </p>
              </div>
            )
          ) : (
            // THẺ CHƯA LẬT: Chỉ đúng người đến lượt mới được bốc bài
            isMyTurn ? (
              <button
                onClick={handleDrawCard}
                className="w-full py-3 rounded-xl bg-primary hover:bg-neutral-800 text-on-primary font-headline-sm text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
                type="button"
              >
                <span>Bốc &amp; Lật Lá Bài 🃏</span>
              </button>
            ) : (
              <div className="w-full py-3 rounded-xl bg-surface-container-high text-secondary font-headline-sm text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed opacity-75">
                <span className="material-symbols-outlined text-[18px]">lock</span>
                <span>Chờ {activePlayer?.name} Rút Bài...</span>
              </div>
            )
          )}

          {/* Tương tác cảm xúc khán giả */}
          <div className="pt-2 border-t border-surface-container-high">
            <span className="font-label-sm text-secondary font-medium mb-1.5 block">
              Tương tác thả cảm xúc cả bàn:
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

      {/* Live Table Quick Info & Nút Yêu Cầu Kết Thúc Ván */}
      <div className="bg-surface-container-lowest p-3 rounded-xl border border-surface-container-high flex items-center justify-between text-body-sm shadow-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">analytics</span>
          <span className="font-medium text-on-surface">Đã qua {historyList.length} lượt</span>
        </div>
        <button
          onClick={handleRequestEndGame}
          className="text-error font-label-md font-semibold hover:underline flex items-center gap-1 cursor-pointer text-xs"
          type="button"
        >
          <span>Yêu Cầu Kết Thúc</span>
          <span className="material-symbols-outlined text-[15px]">trophy</span>
        </button>
      </div>

      {/* Popup Nhận Được Kim Bài Miễn Tử (Lệnh Bài Miễn Uống) */}
      {showImmunityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-surface-container-lowest max-w-sm w-full rounded-3xl border-2 border-amber-500 p-6 text-center shadow-2xl relative">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl shadow-inner animate-bounce">
              🛡️
            </div>
            <span className="inline-block px-3 py-1 rounded-full bg-amber-500 text-neutral-950 text-[10px] font-extrabold uppercase tracking-wider mb-1">
              VẬN MAY CỰC HIẾM!
            </span>
            <h4 className="text-lg font-extrabold text-neutral-950 mt-1">
              🎉 Chúc Mừng {luckyPlayerName}!
            </h4>
            <p className="text-xs text-neutral-700 mt-2 leading-relaxed">
              Bạn vừa nhận được <strong>1 Kim Bài Miễn Tử (Lệnh Bài Miễn Uống)</strong> với tỉ lệ xuất hiện cực kỳ thấp!
            </p>
            <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 font-medium">
              🛡️ Khi đến lượt bạn rút phải thử thách khó hoặc câu hỏi khó đỡ, hãy bấm nút <strong>&quot;DÙNG KIM BÀI MIỄN TỬ&quot;</strong> để thoát phạt 0 ngụm!
            </div>
            <button
              type="button"
              onClick={() => setShowImmunityModal(false)}
              className="mt-5 w-full py-3 rounded-2xl bg-primary hover:bg-neutral-800 text-on-primary font-bold text-xs shadow-md active:scale-95 transition-transform"
            >
              Nhận Kim Bài &amp; Tiếp Tục Cuộc Vui 🍻
            </button>
          </div>
        </div>
      )}

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
