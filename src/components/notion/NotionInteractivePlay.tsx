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
  const [isSpinningRoulette, setIsSpinningRoulette] = useState<boolean>(false);
  const [spinningName, setSpinningName] = useState<string>("");
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
  // Optimistic UI state cho việc lật thẻ lập tức 0ms
  const [localFlipped, setLocalFlipped] = useState<boolean>(false);
  // Hiệu ứng tương tác 3D xoay lá bài theo chuyển động chuột / tay
  const [cardTilt, setCardTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFlippingAnim, setIsFlippingAnim] = useState<boolean>(false);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isFlippingAnim) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setCardTilt({ x: -py * 14, y: px * 14 });
  };

  const handleCardMouseLeave = () => {
    setCardTilt({ x: 0, y: 0 });
  };

  useEffect(() => {
    const remoteFlipped = Boolean(roomData?.isFlipped);
    if (remoteFlipped !== localFlipped) {
      setIsFlippingAnim(true);
      sounds.playCardFlip();
      const timer = setTimeout(() => setIsFlippingAnim(false), 800);
      return () => clearTimeout(timer);
    }
  }, [roomData?.isFlipped]);

  useEffect(() => {
    setLocalFlipped(Boolean(roomData?.isFlipped));
  }, [roomData?.isFlipped, cardIndex]);

  const isFlipped = localFlipped || Boolean(roomData?.isFlipped);
  const currentTurnIdx = roomData?.currentTurnIdx ?? 0;
  const beerConsumed = roomData?.beerConsumed ?? 0;
  const historyList: CardHistoryItem[] = roomData?.history ?? [];
  const votes = roomData?.votes || {};
  const endGameRequest = roomData?.endGameRequest;

  const currentCard: DrinkingCard | undefined = deck[cardIndex];
  const activePlayer: Player | undefined =
    players.length > 0 ? players[currentTurnIdx % players.length] : undefined;

  // LOGIC PHÂN QUYỀN LƯỢT CHƠI:
  // Nếu chơi thử một mình (solo/demo/players <= 1) -> Luôn luôn cho phép bốc thẻ!
  const isSoloOrDemo = players.length <= 1;
  const isMyTurn =
    isSoloOrDemo ||
    Boolean(
      activePlayer &&
        currentUser &&
        (
          (activePlayer.uid && currentUser.uid && activePlayer.uid === currentUser.uid) ||
          (activePlayer.name &&
            currentUser.name &&
            activePlayer.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) ||
          (activePlayer.email &&
            currentUser.email &&
            activePlayer.email.trim().toLowerCase() === currentUser.email.trim().toLowerCase())
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

  // Kiểm tra xem thẻ có yêu cầu chỉ định người khác không
  const isDesignateCard = Boolean(
    currentCard &&
      (
        currentCard.description.toLowerCase().includes("chỉ định") ||
        currentCard.description.toLowerCase().includes("chọn 1 người") ||
        currentCard.description.toLowerCase().includes("chọn một người") ||
        currentCard.description.toLowerCase().includes("thách đấu") ||
        currentCard.description.toLowerCase().includes("bắt 1 người") ||
        currentCard.description.toLowerCase().includes("uống cùng 1 người") ||
        currentCard.description.toLowerCase().includes("chọn người") ||
        currentCard.title.toLowerCase().includes("chỉ định") ||
        currentCard.title.toLowerCase().includes("thách đấu")
      )
  );

  // Kiểm tra xem thẻ có nói về "người bên cạnh" không
  const isNeighborCard = Boolean(
    currentCard &&
      (
        currentCard.description.toLowerCase().includes("bên cạnh") ||
        currentCard.title.toLowerCase().includes("bên cạnh")
      )
  );

  const activeIdx = players.length > 0 ? (currentTurnIdx % players.length) : 0;
  const leftNeighbor = players.length > 1 ? players[(activeIdx - 1 + players.length) % players.length] : undefined;
  const rightNeighbor = players.length > 1 ? players[(activeIdx + 1) % players.length] : undefined;

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

  // Đếm ngược 10 giây cho câu hỏi Bình Chọn (Vote) đồng bộ Firestore voteStartedAt
  useEffect(() => {
    if (isFlipped && isVoteCard) {
      const calcRemaining = () => {
        const start = roomData?.voteStartedAt || Date.now();
        const elapsed = Math.floor((Date.now() - start) / 1000);
        return Math.max(0, 10 - elapsed);
      };
      setVoteCountdown(calcRemaining());
      setVoteWinner(null);
      const interval = setInterval(() => {
        const rem = calcRemaining();
        setVoteCountdown(rem);
        if (rem <= 0) {
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    } else {
      setVoteCountdown(10);
      setVoteWinner(null);
    }
  }, [isFlipped, cardIndex, isVoteCard, roomData?.voteStartedAt]);

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

          // Phát âm thanh cảm xúc trên mọi thiết bị trong phòng!
          if (latest.emoji === "😂") sounds.playHahaLaugh();
          else if (latest.emoji === "👏") sounds.playApplause();
          else if (latest.emoji === "🍺") sounds.playChantDrink();
          else if (latest.emoji === "👀") sounds.playDramaSting();

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

    // Kích hoạt ngay lập tức 0ms Optimistic UI & Hiệu ứng xoay 3D
    setLocalFlipped(true);
    setIsFlippingAnim(true);
    triggerHaptic("heavy");
    // Âm thanh vút bài 3D và tiếng snap tiếp đất
    sounds.playCardFlip();
    // Âm thanh kèn trống chúc mừng + cụng ly
    setTimeout(() => {
      sounds.playFanfareCelebration();
      setIsFlippingAnim(false);
    }, 280);
    triggerToast(`🎺🎉 ${activePlayer?.name || "Bạn"} vừa bốc mở thẻ bài mới!`);

    // Cập nhật Firestore -> Tất cả máy khác lập tức nhận snapshot và xoay 3D lật thẻ
    await updateRoom(roomCode, {
      isFlipped: true,
      votes: {}, // Reset votes cho lá bài mới
      voteStartedAt: Date.now(),
      designatedPlayer: null,
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

    // Reset optimistic state
    setLocalFlipped(false);

    // Đẩy cập nhật đồng bộ lên Cloud Firestore
    await updateRoom(roomCode, {
      isFlipped: false,
      currentCardIndex: nextCardIdx,
      currentTurnIdx: nextTurn,
      beerConsumed: updatedBeer,
      history: updatedHistory,
      players: updatedPlayers,
      votes: {},
      voteStartedAt: null,
      designatedPlayer: null,
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
      voteStartedAt: null,
      designatedPlayer: null,
      updatedAt: Date.now(),
    });

    const nextPlayerName = players[nextTurn]?.name || "người tiếp theo";
    triggerToast(`🛡️ Thoát phạt thành công! Chuyển lượt sang ${nextPlayerName} 🍻`);
  };

  // 5. Quay Vòng May Mắn Roulette Chọn Người Bị Chỉ Định
  const handleSpinRoulette = async () => {
    if (!isMyTurn) {
      triggerToast(`⛔ Chỉ ${activePlayer?.name} mới có quyền quay may mắn!`);
      return;
    }
    const candidates = players.filter((p) => p.name !== activePlayer?.name);
    if (candidates.length === 0) {
      triggerToast("Bàn chơi cần ít nhất 2 người để quay chọn người!");
      return;
    }

    setIsSpinningRoulette(true);
    triggerHaptic("heavy");

    let counter = 0;
    const spinInterval = setInterval(() => {
      counter++;
      const rand = candidates[Math.floor(Math.random() * candidates.length)];
      setSpinningName(rand.name);
      sounds.playShuffle();

      if (counter >= 16) {
        clearInterval(spinInterval);
        const finalCandidate = candidates[Math.floor(Math.random() * candidates.length)];
        setSpinningName(finalCandidate.name);
        setIsSpinningRoulette(false);
        sounds.playFanfareCelebration();
        triggerToast(`🎯 Vòng quay đã chỉ định trúng: ${finalCandidate.name}!`);

        updateRoom(roomCode, {
          designatedPlayer: {
            playerName: finalCandidate.name,
            chosenBy: activePlayer?.name || "Người rút",
            timestamp: Date.now(),
          },
          updatedAt: Date.now(),
        });
      }
    }, 100);
  };

  // 6. Quay Hướng Ngẫu Nhiên: Bên Trái 👈 hay Bên Phải 👉
  const handleSpinDirection = async () => {
    if (!isMyTurn) {
      triggerToast(`⛔ Chỉ ${activePlayer?.name} mới có quyền quay hướng!`);
      return;
    }
    if (!leftNeighbor && !rightNeighbor) {
      triggerToast("Bàn chơi cần ít nhất 2 người!");
      return;
    }

    setIsSpinningRoulette(true);
    triggerHaptic("medium");

    let counter = 0;
    const spinInterval = setInterval(() => {
      counter++;
      const dir: "left" | "right" = counter % 2 === 0 ? "left" : "right";
      const targetName =
        dir === "left"
          ? leftNeighbor?.name || "Bên Trái"
          : rightNeighbor?.name || "Bên Phải";
      setSpinningName(`${dir === "left" ? "👈 Bên Trái:" : "👉 Bên Phải:"} ${targetName}`);
      sounds.playShuffle();

      if (counter >= 14) {
        clearInterval(spinInterval);
        const finalDir: "left" | "right" = Math.random() < 0.5 ? "left" : "right";
        const chosenNeighbor = finalDir === "left" ? leftNeighbor : rightNeighbor;
        const targetText = `${finalDir === "left" ? "👈 BÊN TRÁI" : "👉 BÊN PHẢI"}: ${chosenNeighbor?.name || "Bạn nhậu"}`;
        setSpinningName(targetText);
        setIsSpinningRoulette(false);
        sounds.playFanfareCelebration();
        triggerToast(`🧭 Hướng đã chọn: ${finalDir === "left" ? "👈 BÊN TRÁI" : "👉 BÊN PHẢI"} (${chosenNeighbor?.name})!`);

        updateRoom(roomCode, {
          designatedPlayer: {
            playerName: chosenNeighbor?.name || (finalDir === "left" ? "Bên Trái" : "Bên Phải"),
            chosenBy: activePlayer?.name || "Người rút",
            direction: finalDir,
            timestamp: Date.now(),
          },
          updatedAt: Date.now(),
        });
      }
    }, 110);
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

  // 7. Tương tác cảm xúc
  const handleSpectatorReaction = async (emoji: string, actionText: string) => {
    triggerHaptic("light");
    if (emoji === "😂") sounds.playHahaLaugh();
    else if (emoji === "👏") sounds.playApplause();
    else if (emoji === "🍺") sounds.playChantDrink();
    else if (emoji === "👀") sounds.playDramaSting();
    else sounds.playBeerClink();

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
        <div className="flex items-center justify-between pb-2.5 border-b border-surface-container-high gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className={`w-8 h-8 rounded-full ${isMyTurn ? "bg-primary text-on-primary shadow-xs" : "bg-secondary-fixed text-on-secondary-fixed"} flex items-center justify-center font-bold text-xs shrink-0`}>
              {activePlayer?.initial || "??"}
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-body-md font-bold text-on-surface truncate block leading-snug">
                {isMyTurn ? `${activePlayer?.name} (LƯỢT CỦA BẠN!)` : `Lượt của: ${activePlayer?.name}`}
              </span>
              <span className="text-secondary font-label-sm block truncate text-[11px] sm:text-xs">
                {isMyTurn
                  ? isFlipped
                    ? "Bạn đang đọc thử thách & chịu phạt"
                    : "Chạm vào lá bài để rút lượt này"
                  : isFlipped
                  ? `Đang theo dõi ${activePlayer?.name} thực hiện`
                  : `Đang đợi ${activePlayer?.name} rút bài trên máy của họ`}
              </span>
            </div>
          </div>
          <span className="font-code-inline text-code-inline px-2 py-0.5 rounded bg-surface-container-highest text-primary font-bold shrink-0 text-xs">
            #{cardIndex + 1} / {totalCards}
          </span>
        </div>

        {/* CARD CANVAS 3D: KHÔNG GIAN 3D VẬT LÝ VỚI GÓC XOAY THỰC VÀ ĐỘ NẢY SỐNG ĐỘNG */}
        <div
          className="my-2.5 select-none"
          style={{ perspective: "1200px" }}
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
        >
          <div
            onClick={!isFlipped && isMyTurn ? handleDrawCard : undefined}
            style={{
              transformStyle: "preserve-3d",
              WebkitTransformStyle: "preserve-3d",
              transform: isFlipped
                ? `rotateX(${cardTilt.x}deg) rotateY(${180 + cardTilt.y}deg)`
                : `rotateX(${cardTilt.x}deg) rotateY(${cardTilt.y}deg)`,
              transition: isFlippingAnim
                ? "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)"
                : "transform 0.15s ease-out",
            }}
            className={`relative w-full min-h-[310px] sm:min-h-[330px] rounded-3xl transition-shadow duration-300 ${
              isFlipped
                ? "shadow-2xl"
                : isMyTurn
                ? "shadow-xl hover:shadow-[0_12px_35px_rgba(245,158,11,0.3)] cursor-pointer"
                : "shadow-md cursor-not-allowed"
            }`}
          >
            {/* ======================================================== */}
            {/* MẶT 1: MẶT ÚP 3D (CARD BACK DESIGN - NGHỆ THUẬT QUÂN BÀI) */}
            {/* ======================================================== */}
            <div
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
              className={`absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-amber-950 p-4 sm:p-5 flex flex-col justify-between text-center border-2 ${
                isMyTurn
                  ? "border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.25)]"
                  : "border-neutral-700/60"
              } overflow-hidden`}
            >
              {/* Pattern hoa văn chìm phong cách bài tây cao cấp */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

              {/* Header của lá bài úp */}
              <div className="w-full flex items-center justify-between z-10 shrink-0">
                <span className="font-code-inline text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 tracking-wider">
                  ✦ SIPCRAFT 3D
                </span>
                <span className="text-amber-400/80 font-bold text-xs tracking-wider">
                  #{cardIndex + 1}
                </span>
              </div>

              {/* Trung tâm lá bài với hiệu ứng nổi khối 3D */}
              <div className="flex flex-col items-center justify-center my-auto z-10 py-1 flex-1 min-h-0">
                <div
                  className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl ${
                    isMyTurn
                      ? "bg-gradient-to-tr from-amber-500 to-yellow-300 text-neutral-950 shadow-[0_10px_25px_rgba(245,158,11,0.5)] animate-bounce"
                      : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                  } flex items-center justify-center text-3xl sm:text-4xl mb-2 transition-transform shrink-0`}
                >
                  🎲
                </div>

                <h3 className="font-headline-sm text-sm sm:text-base font-bold text-white tracking-tight drop-shadow-sm px-2">
                  {isMyTurn
                    ? "LƯỢT CỦA BẠN - CHẠM ĐỂ BỐC THẺ"
                    : `LƯỢT CỦA ${activePlayer?.name?.toUpperCase() || "BẠN NHẬU"}`}
                </h3>
                <p className="text-[11px] sm:text-xs text-neutral-300 mt-1 max-w-[260px] leading-snug px-2 line-clamp-2">
                  {isMyTurn
                    ? `Lá bài #${cardIndex + 1} • Luật phạt tính theo từng ngụm bia`
                    : `Chỉ riêng ${activePlayer?.name} mới có quyền rút thẻ trên máy của họ.`}
                </p>
              </div>

              {/* Nút chỉ dẫn dưới cùng */}
              <div className="z-10 w-full flex justify-center shrink-0 pt-1">
                {isMyTurn ? (
                  <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 font-bold text-[11px] sm:text-xs shadow-lg uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-transform">
                    <span>Lật Thẻ 3D Ngay</span>
                    <span className="material-symbols-outlined text-[14px]">rotate_right</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-neutral-800/90 text-neutral-400 text-[11px] flex items-center gap-1.5 border border-neutral-700/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    <span>Đang đợi {activePlayer?.name} bốc bài...</span>
                  </span>
                )}
              </div>
            </div>

            {/* ======================================================== */}
            {/* MẶT 2: MẶT NGỬA 3D (CARD FRONT - HIỂN THỊ CÂU HỎI THỬ THÁCH) */}
            {/* ======================================================== */}
            <div
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
              className="absolute inset-0 w-full h-full rounded-3xl bg-white border-2 border-amber-500/30 p-4 sm:p-5 flex flex-col justify-between shadow-2xl overflow-hidden select-none"
            >
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between gap-2 shrink-0">
                  <span className="font-code-inline text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-lg bg-neutral-950 text-white shadow-xs tracking-wider shrink-0">
                    {currentCard?.typeLabel || "THỬ THÁCH"}
                  </span>
                  <span className="font-label-sm text-neutral-600 font-bold text-xs bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200 shrink-0">
                    {currentCard?.difficulty || "Độ khó: 3/5"}
                  </span>
                </div>

                <h3 className="font-headline-sm text-base sm:text-lg font-black text-neutral-950 mt-2 leading-snug line-clamp-2 break-words shrink-0">
                  {currentCard?.title || "Thử Thách Nhậu"}
                </h3>

                <div className="mt-2 flex-1 min-h-0 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/90 to-yellow-50/70 border border-amber-200/90 shadow-xs overflow-y-auto scrollbar-none">
                  <p className="font-body-md text-neutral-950 font-semibold text-[13px] sm:text-[14px] leading-relaxed break-words">
                    {currentCard?.description || "Đang tải nội dung lá bài..."}
                  </p>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-neutral-200 flex items-center justify-between gap-2 text-label-md shrink-0">
                <span className="text-red-700 font-bold text-xs sm:text-sm flex items-center gap-1 min-w-0 flex-1 truncate">
                  <span className="material-symbols-outlined text-[18px] shrink-0">gavel</span>
                  <span className="truncate">{currentCard?.penalty || "Phạt 1 ngụm"}</span>
                </span>
                <span className="font-bold text-neutral-800 font-code-inline text-[11px] sm:text-xs bg-amber-100/90 px-2.5 py-1 rounded-lg border border-amber-200 shrink-0 whitespace-nowrap">
                  🍺 {beerConsumed} ngụm
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* HIỆU ỨNG VÒNG QUAY MAY MẮN ROULETTE ĐANG CHẠY */}
        {isSpinningRoulette && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 border-2 border-amber-600 text-neutral-950 text-center shadow-lg animate-pulse select-none">
            <span className="text-[11px] font-extrabold uppercase tracking-widest block text-amber-950">
              🎲 ĐANG QUAY MAY MẮN ROULETTE...
            </span>
            <span className="text-lg sm:text-xl font-black tracking-tight block mt-1 drop-shadow-xs">
              {spinningName || "Đang quay chọn..."}
            </span>
          </div>
        )}

        {/* BANNER KẾT QUẢ NGƯỜI BỊ CHỈ ĐỊNH / HƯỚNG BÊN CẠNH (HIỂN THỊ TRÊN TẤT CẢ CÁC MÁY) */}
        {isFlipped && roomData?.designatedPlayer && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-400/25 to-amber-500/20 border-2 border-amber-500 shadow-sm flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center text-xl shrink-0 font-bold shadow-xs">
                {roomData.designatedPlayer.direction === "left"
                  ? "👈"
                  : roomData.designatedPlayer.direction === "right"
                  ? "👉"
                  : "🎯"}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-amber-900 tracking-wider block">
                  {roomData.designatedPlayer.direction
                    ? `Hướng được chọn (${roomData.designatedPlayer.direction === "left" ? "Bên Trái" : "Bên Phải"}):`
                    : "Người Bị Chỉ Định Thử Thách:"}
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-neutral-950 truncate block">
                  {roomData.designatedPlayer.playerName}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-primary text-on-primary text-[10px] font-bold shrink-0 shadow-xs">
              {roomData.designatedPlayer.chosenBy} đã quay 🎲
            </span>
          </div>
        )}

        {/* PHẦN XÁC ĐỊNH BẠN NHẬU NGỒI BÊN CẠNH (TRÁI HAY PHẢI?) */}
        {isFlipped && isNeighborCard && (
          <div className="p-3 rounded-2xl bg-surface-container border border-surface-container-high space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-bold text-on-surface">
              <span>👥 Bạn Nhậu Ngồi Bên Cạnh:</span>
              <span className="text-secondary font-normal text-[11px]">Theo vị trí bàn nhậu</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-surface-container-lowest border border-surface-container-high flex items-center gap-2">
                <span className="text-lg">👈</span>
                <div className="min-w-0">
                  <span className="text-[10px] text-secondary font-medium block">Bên Trái</span>
                  <span className="font-bold text-on-surface truncate block">{leftNeighbor?.name || "Chưa có"}</span>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-surface-container-lowest border border-surface-container-high flex items-center gap-2">
                <span className="text-lg">👉</span>
                <div className="min-w-0">
                  <span className="text-[10px] text-secondary font-medium block">Bên Phải</span>
                  <span className="font-bold text-on-surface truncate block">{rightNeighbor?.name || "Chưa có"}</span>
                </div>
              </div>
            </div>
            {isMyTurn && (
              <button
                type="button"
                disabled={isSpinningRoulette}
                onClick={handleSpinDirection}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <span>🧭 Quay Hướng Ngẫu Nhiên (Trái hay Phải?)</span>
              </button>
            )}
          </div>
        )}

        {/* NÚT VÒNG QUAY MAY MẮN CHỈ ĐỊNH CHO NGƯỜI RÚT THẺ */}
        {isFlipped && isMyTurn && !isVoteCard && !isNeighborCard && (
          <button
            type="button"
            disabled={isSpinningRoulette}
            onClick={handleSpinRoulette}
            className={`w-full py-2.5 px-3 rounded-xl ${
              isDesignateCard
                ? "bg-gradient-to-r from-red-600 via-amber-600 to-red-600 shadow-md animate-bounce"
                : "bg-surface-container-high hover:bg-surface-container-highest border border-primary/20 text-on-surface"
            } text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer`}
          >
            <span className="text-base">{isDesignateCard ? "🎯" : "🎲"}</span>
            <span>
              {isDesignateCard
                ? "Quay May Mắn Chọn Nạn Nhân Bị Chỉ Định 🎲"
                : "🎲 Quay Roulette May Mắn (Chọn 1 Người Ngẫu Nhiên)"}
            </span>
          </button>
        )}

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

          {/* Tương tác cảm xúc cả bàn */}
          <div className="pt-2.5 border-t border-surface-container-high space-y-1.5">
            <span className="font-label-sm text-secondary font-semibold text-xs block">
              Tương tác thả cảm xúc cả bàn:
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => handleSpectatorReaction("🍺", "Ép 1 ngụm")}
                className="py-2 px-1 rounded-xl bg-surface-container hover:bg-surface-container-high text-[11px] sm:text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 active:scale-95 transition-all text-on-surface shadow-xs border border-surface-container-high cursor-pointer"
                type="button"
                title="Ép uống bia"
              >
                <span className="text-base sm:text-sm shrink-0">🍺</span>
                <span className="truncate">Ép uống</span>
              </button>
              <button
                onClick={() => handleSpectatorReaction("👏", "Cổ vũ")}
                className="py-2 px-1 rounded-xl bg-surface-container hover:bg-surface-container-high text-[11px] sm:text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 active:scale-95 transition-all text-on-surface shadow-xs border border-surface-container-high cursor-pointer"
                type="button"
                title="Cổ vũ nhiệt tình"
              >
                <span className="text-base sm:text-sm shrink-0">👏</span>
                <span className="truncate">Cổ vũ</span>
              </button>
              <button
                onClick={() => handleSpectatorReaction("😂", "Cười xỉu")}
                className="py-2 px-1 rounded-xl bg-surface-container hover:bg-surface-container-high text-[11px] sm:text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 active:scale-95 transition-all text-on-surface shadow-xs border border-surface-container-high cursor-pointer"
                type="button"
                title="Cười xỉu"
              >
                <span className="text-base sm:text-sm shrink-0">😂</span>
                <span className="truncate">Cười xỉu</span>
              </button>
              <button
                onClick={() => handleSpectatorReaction("👀", "Hóng biến")}
                className="py-2 px-1 rounded-xl bg-surface-container hover:bg-surface-container-high text-[11px] sm:text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 active:scale-95 transition-all text-on-surface shadow-xs border border-surface-container-high cursor-pointer"
                type="button"
                title="Hóng biến kịch tính"
              >
                <span className="text-base sm:text-sm shrink-0">👀</span>
                <span className="truncate">Hóng biến</span>
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
