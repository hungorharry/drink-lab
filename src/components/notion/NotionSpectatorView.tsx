"use client";

import React, { useState, useEffect } from "react";
import { QuestionHistoryModal } from "./QuestionHistoryModal";
import { SAMPLE_CARD_HISTORY } from "@/data/history";
import { CardHistoryItem } from "@/types/game";

interface NotionSpectatorViewProps {
  roomCode?: string;
  totalCards?: number;
  onTurnAction?: (action: string) => void;
}

export const NotionSpectatorView: React.FC<NotionSpectatorViewProps> = ({
  roomCode = "ALCH88",
  totalCards = 100,
  onTurnAction,
}) => {
  const [timerVal, setTimerVal] = useState<number>(14);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [showToast, setShowToast] = useState<boolean>(false);
  const [beerConsumed, setBeerConsumed] = useState<number>(18);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<CardHistoryItem[]>(SAMPLE_CARD_HISTORY);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerVal((prev) => (prev > 1 ? prev - 1 : 20));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const sendReaction = (actionName: string) => {
    setToastMessage(`Bạn vừa gửi ${actionName} tới Mai Anh!`);
    setShowToast(true);
    if (actionName.includes("Ép uống")) {
      setBeerConsumed((prev) => prev + 1);
      // Ghi nhận thêm vào lịch sử
      const newHistoryItem: CardHistoryItem = {
        id: `hist-${Date.now()}`,
        turnNumber: 15,
        playerId: 1,
        playerName: "Mai Anh",
        playerInitial: "MA",
        cardTitle: "Lá Bài #15: Thử Thách Bí Mật",
        cardContent: "Bị cả bàn ép uống thêm 1 ngụm vì chần chừ nhận thẻ!",
        cardType: "DARE",
        cardTypeLabel: "Ép Uống Khán Giả",
        penalty: "Bị phạt 1 ngụm bia.",
        result: "drank",
        resultText: "Cả bàn ép uống +1 ngụm 🍺",
        sips: 1,
        timestamp: "Vừa xong",
      };
      setHistoryList((prev) => [newHistoryItem, ...prev]);
    }
    if (onTurnAction) {
      onTurnAction(actionName);
    }
    setTimeout(() => {
      setShowToast(false);
    }, 2200);
  };

  return (
    <div className="flex flex-col w-full gap-space-md">
      {/* Notion Document Header / Breadcrumbs */}
      <div className="flex flex-col gap-space-xs">
        <div className="flex items-center justify-between gap-space-xs text-secondary">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="material-symbols-outlined text-[15px] shrink-0">
              inventory_2
            </span>
            <span className="font-code-inline text-code-inline truncate">Workspace</span>
            <span className="font-code-inline text-code-inline">/</span>
            <span className="font-code-inline text-code-inline truncate">{roomCode}</span>
            <span className="font-code-inline text-code-inline">/</span>
            <span className="font-code-inline text-code-inline text-on-surface font-medium shrink-0">
              Lượt #15
            </span>
          </div>
          <div className="flex items-center gap-1 bg-surface-container-high px-2 py-0.5 rounded shadow-sm shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
              Đang diễn ra
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[26px] select-none leading-none">🃏</span>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface tracking-tight font-bold">
              Bàn Chơi Notion{" "}
              <span className="font-body-md text-body-md text-secondary font-normal">
                (Khán giả)
              </span>
            </h1>
          </div>
          {/* Button to open history */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1 bg-surface-container hover:bg-surface-container-high text-primary px-2.5 py-1 rounded-lg text-label-sm font-semibold transition-all active:scale-95 shadow-xs"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">history_edu</span>
            <span>Lịch sử ({historyList.length})</span>
          </button>
        </div>
      </div>

      {/* Notion Callout Block: Current Turn Alert */}
      <div className="bg-surface-container p-3.5 rounded-xl flex items-start gap-3 shadow-sm transition-all">
        <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0 text-[18px]">
          ⏳
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
              Lượt của: <span className="text-primary font-bold">Mai Anh</span>
            </span>
            <span className="font-label-sm text-label-sm text-secondary bg-surface-container-highest px-1.5 py-0.2 rounded shrink-0">
              Còn 2 người nữa tới bạn
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug">
            Bạn (<strong className="text-on-surface">Hoàng Nam</strong>) đang ở hàng chờ khán giả. Hãy sẵn sàng đếm ngụm và cổ vũ Mai Anh rút bài!
          </p>
        </div>
      </div>

      {/* Notion Timeline Queue / Player Avatars */}
      <div className="bg-surface-container-lowest p-3 rounded-xl shadow-sm flex flex-col gap-2">
        <div className="flex items-center justify-between text-secondary">
          <span className="font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-1 font-semibold">
            <span className="material-symbols-outlined text-[14px]">
              format_list_bulleted
            </span>
            Hàng chờ lượt chơi
          </span>
          <span className="font-code-inline text-code-inline text-secondary">
            4 người
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 pt-0.5">
          {/* Player 1: Mai Anh (Active) */}
          <div className="relative bg-surface-container-high p-2 rounded-lg flex flex-col items-center text-center shadow-sm">
            <div className="relative mb-1">
              <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm shadow-sm">
                MA
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-error rounded-full flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-surface-container-lowest animate-ping"></span>
              </span>
            </div>
            <span className="font-label-sm text-label-sm font-semibold text-on-surface truncate w-full">
              Mai Anh
            </span>
            <span className="font-code-inline text-[10px] text-error font-medium truncate w-full">
              Đang rút...
            </span>
          </div>

          {/* Player 2: Tuấn Hải */}
          <div className="bg-surface-container-low p-2 rounded-lg flex flex-col items-center text-center opacity-85">
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm mb-1">
              TH
            </div>
            <span className="font-label-sm text-label-sm font-medium text-on-surface truncate w-full">
              Tuấn Hải
            </span>
            <span className="font-code-inline text-[10px] text-secondary truncate w-full">
              Kế tiếp
            </span>
          </div>

          {/* Player 3: Hoàng Nam (You) */}
          <div className="bg-surface-container-highest p-2 rounded-lg flex flex-col items-center text-center shadow-sm">
            <div className="relative mb-1">
              <div className="w-10 h-10 rounded-full bg-on-tertiary-container text-on-primary flex items-center justify-center font-bold text-sm">
                HN
              </div>
              <span className="absolute -top-1 -right-1 text-[11px] leading-none">🎯</span>
            </div>
            <span className="font-label-sm text-label-sm font-bold text-on-surface truncate w-full">
              Hoàng Nam
            </span>
            <span className="font-code-inline text-[10px] text-on-tertiary-container font-semibold truncate w-full">
              Bạn (Vị trí 3)
            </span>
          </div>

          {/* Player 4: Minh Trang */}
          <div className="bg-surface-container-low p-2 rounded-lg flex flex-col items-center text-center opacity-85">
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm mb-1">
              MT
            </div>
            <span className="font-label-sm text-label-sm font-medium text-on-surface truncate w-full">
              Minh Trang
            </span>
            <span className="font-code-inline text-[10px] text-secondary truncate w-full">
              Chờ
            </span>
          </div>
        </div>
      </div>

      {/* Arena Central Card Area (Spectating Mai Anh's Card Draw) */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
        {/* Subtle top bar status */}
        <div className="w-full flex items-center justify-between pb-3">
          <div className="flex items-center gap-1.5 text-secondary">
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            <span className="font-label-sm text-label-sm font-medium">
              Chế độ Khán giả (Spectator)
            </span>
          </div>
          <div className="flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded text-secondary font-code-inline text-code-inline">
            <span className="material-symbols-outlined text-[13px]">timer</span>
            <span id="turn-timer">{timerVal}s</span>
          </div>
        </div>

        {/* Active Notion Playing Card */}
        <div className="w-full max-w-[280px] bg-surface-container-low rounded-xl p-4 shadow-md flex flex-col items-center text-center relative my-1 transition-transform">
          <div className="w-full flex justify-between items-center text-secondary mb-2">
            <span className="font-code-inline text-code-inline text-on-surface-variant">
              LÁ BÀI #15 / {totalCards}
            </span>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
              lock_open
            </span>
          </div>

          {/* Card Central Illustration/Icon */}
          <div className="w-20 h-24 bg-surface-container-lowest rounded-lg shadow-sm flex flex-col items-center justify-center my-2 relative">
            <span className="text-3xl select-none animate-bounce">🎲</span>
            <div className="absolute bottom-1.5 flex gap-1">
              <span className="w-1 h-1 rounded-full bg-primary/40 animate-pulse"></span>
              <span className="w-1 h-1 rounded-full bg-primary/60 animate-pulse"></span>
              <span className="w-1 h-1 rounded-full bg-primary/80 animate-pulse"></span>
            </div>
          </div>
          <div className="font-headline-sm text-headline-sm text-on-surface mt-1 font-semibold">
            Thử Thách Bí Mật
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 px-1">
            Mai Anh đang chạm thẻ và mở phong ấn thử thách...
          </p>
          <div className="w-full mt-3 pt-2.5 bg-surface-container-high/60 rounded px-2 py-1.5 flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-label-sm text-label-sm text-secondary italic truncate">
              Đang chờ Mai Anh đọc thử thách &amp; thực hiện...
            </span>
          </div>
        </div>

        {/* Live Reaction Counter Floater */}
        <div
          className={`transition-opacity duration-300 mt-2 bg-primary text-on-primary font-label-sm text-label-sm px-3 py-1 rounded shadow-md flex items-center gap-1.5 ${
            showToast ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">
            local_fire_department
          </span>
          <span>{toastMessage}</span>
        </div>
      </div>

      {/* Spectator Interactive Reactions & Action Bar */}
      <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-secondary flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">touch_app</span>
            Tương tác khán giả
          </span>
          <span className="font-label-sm text-label-sm text-secondary">
            Chạm để cổ vũ / trêu
          </span>
        </div>

        {/* Quick action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            className="bg-surface-container hover:bg-surface-container-high active:scale-95 transition-all text-on-surface p-2.5 rounded-lg flex items-center justify-center gap-2 shadow-sm"
            onClick={() => sendReaction("🍻 Ép uống")}
            type="button"
          >
            <span className="text-base select-none">🍻</span>
            <span className="font-label-md text-label-md font-semibold truncate">
              Ép uống (+1 ngụm)
            </span>
          </button>
          <button
            className="bg-surface-container hover:bg-surface-container-high active:scale-95 transition-all text-on-surface p-2.5 rounded-lg flex items-center justify-center gap-2 shadow-sm"
            onClick={() => sendReaction("👏 Vỗ tay")}
            type="button"
          >
            <span className="text-base select-none">👏</span>
            <span className="font-label-md text-label-md font-semibold truncate">
              Vỗ tay cổ vũ
            </span>
          </button>
          <button
            className="bg-surface-container hover:bg-surface-container-high active:scale-95 transition-all text-on-surface p-2.5 rounded-lg flex items-center justify-center gap-2 shadow-sm"
            onClick={() => sendReaction("😂 Cười xỉu")}
            type="button"
          >
            <span className="text-base select-none">😂</span>
            <span className="font-label-md text-label-md font-semibold truncate">
              Cười xỉu
            </span>
          </button>
          <button
            className="bg-surface-container hover:bg-surface-container-high active:scale-95 transition-all text-on-surface p-2.5 rounded-lg flex items-center justify-center gap-2 shadow-sm"
            onClick={() => sendReaction("👀 Hóng biến")}
            type="button"
          >
            <span className="text-base select-none">👀</span>
            <span className="font-label-md text-label-md font-semibold truncate">
              Hóng biến lớn
            </span>
          </button>
        </div>

        {/* Mini Notion Tip Callout with History button */}
        <div className="bg-surface-container-low p-2.5 rounded flex items-center justify-between gap-2 text-on-surface-variant">
          <div className="flex items-start gap-2">
            <span className="text-sm select-none leading-none pt-0.5">💡</span>
            <p className="font-label-sm text-label-sm leading-relaxed text-secondary">
              Xem lại những câu ai từng bốc trúng để gài kèo phạt tiếp!
            </p>
          </div>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm px-2.5 py-1 rounded transition-colors whitespace-nowrap font-medium"
            type="button"
          >
            Xem lịch sử
          </button>
        </div>
      </div>

      {/* Notion Table Database Properties: Game Parameters */}
      <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm flex flex-col gap-2">
        <div className="flex items-center justify-between text-secondary pb-1">
          <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]">database</span>
            Thuộc tính ván chơi (Properties)
          </span>
          <span className="font-code-inline text-code-inline text-secondary">
            {totalCards} CÂU HỎI
          </span>
        </div>
        <div className="flex flex-col bg-surface-container-low rounded-lg overflow-hidden">
          {/* Property Row 1 */}
          <div className="flex items-center justify-between px-3 py-2 bg-surface-container-lowest">
            <div className="flex items-center gap-2 text-secondary min-w-0">
              <span className="material-symbols-outlined text-[15px] shrink-0">cached</span>
              <span className="font-body-sm text-body-sm truncate">Tiến độ vòng chơi</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-label-md text-label-md font-semibold text-on-surface">
                Vòng 2
              </span>
              <span className="font-code-inline text-code-inline text-secondary">
                / {Math.ceil(totalCards / 4)} vòng
              </span>
            </div>
          </div>

          {/* Property Row 2 */}
          <div className="flex items-center justify-between px-3 py-2 bg-surface-container-low">
            <div className="flex items-center gap-2 text-secondary min-w-0">
              <span className="material-symbols-outlined text-[15px] shrink-0">style</span>
              <span className="font-body-sm text-body-sm truncate">Bộ bài còn lại</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-label-md text-label-md font-semibold text-on-surface">
                {Math.max(0, totalCards - 14)}
              </span>
              <span className="font-code-inline text-code-inline text-secondary">
                / {totalCards} lá
              </span>
            </div>
          </div>

          {/* Property Row 3 */}
          <div className="flex items-center justify-between px-3 py-2 bg-surface-container-lowest">
            <div className="flex items-center gap-2 text-secondary min-w-0">
              <span className="material-symbols-outlined text-[15px] shrink-0">
                sports_bar
              </span>
              <span className="font-body-sm text-body-sm truncate">
                Bia đã uống cả bàn
              </span>
            </div>
            <div className="flex items-center gap-1 bg-surface-container-highest px-2 py-0.5 rounded shrink-0">
              <span className="font-label-md text-label-md font-bold text-on-surface">
                {beerConsumed}
              </span>
              <span className="font-label-sm text-label-sm text-secondary">ngụm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Question History Modal */}
      <QuestionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={historyList}
      />
    </div>
  );
};
