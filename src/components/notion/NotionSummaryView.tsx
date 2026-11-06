"use client";

import React, { useState } from "react";
import { QuestionHistoryModal } from "./QuestionHistoryModal";
import { Player, CardHistoryItem } from "@/types/game";

interface NotionSummaryViewProps {
  roomCode?: string;
  totalCards?: number;
  players?: Player[];
  beerConsumed?: number;
  history?: CardHistoryItem[];
  onReplay?: () => void;
  onLeave?: () => void;
}

export const NotionSummaryView: React.FC<NotionSummaryViewProps> = ({
  roomCode = "DRINK",
  totalCards = 100,
  players = [],
  beerConsumed = 0,
  history = [],
  onReplay,
  onLeave,
}) => {
  const [toastMessage, setToastMessage] = useState<string>("");
  const [showToast, setShowToast] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2500);
  };

  // Tính số ngụm phạt của từng người chơi dựa trên lịch sử thật
  const playerStatsMap = new Map<string, { player: Player; sips: number; passes: number }>();

  players.forEach((p) => {
    playerStatsMap.set(p.name, { player: p, sips: p.drinksCount || 0, passes: 0 });
  });

  history.forEach((h) => {
    const existing = playerStatsMap.get(h.playerName);
    if (existing) {
      existing.sips += h.sips || 0;
      if (h.result === "passed") existing.passes += 1;
    } else {
      playerStatsMap.set(h.playerName, {
        player: {
          id: h.playerId,
          uid: `user_${h.playerId}`,
          name: h.playerName,
          initial: h.playerInitial,
          isHost: false,
          color: "bg-amber-600",
        },
        sips: h.sips || 0,
        passes: h.result === "passed" ? 1 : 0,
      });
    }
  });

  // Sắp xếp người chơi từ uống nhiều nhất đến ít nhất
  const rankedPlayers = Array.from(playerStatsMap.values()).sort(
    (a, b) => b.sips - a.sips
  );

  const totalSipsCalculated =
    beerConsumed > 0
      ? beerConsumed
      : rankedPlayers.reduce((acc, curr) => acc + curr.sips, 0);

  const estCans = (totalSipsCalculated / 6).toFixed(1);

  // Tìm câu phạt nhiều nhất trong lịch sử
  const maxSipCard = history.reduce<CardHistoryItem | null>((prev, curr) => {
    if (!prev) return curr;
    return curr.sips > prev.sips ? curr : prev;
  }, null);

  const rankTitles = ["Vua Tửu Lượng", "Á Quân", "Hạng 3"];
  const rankIcons = ["🥇", "🥈", "🥉"];
  const rankSubtitles = [
    "Danh hiệu: \"Thùng Không Đáy\"",
    "Danh hiệu: \"Cao Thủ Bền Bỉ\"",
    "Danh hiệu: \"Chiến Binh Gan Dạ\"",
  ];

  return (
    <div className="flex flex-col w-full pb-6 space-y-space-md">
      {/* Breadcrumb Path in Notion Workspace style */}
      <div className="flex items-center gap-1.5 text-secondary overflow-x-auto py-1">
        <span className="material-symbols-outlined text-[16px]">folder</span>
        <span className="font-label-md text-label-md hover:text-on-surface cursor-pointer">
          Workspace
        </span>
        <span className="text-secondary/60">/</span>
        <span className="font-code-inline text-code-inline px-1 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium">
          #{roomCode}
        </span>
        <span className="text-secondary/60">/</span>
        <span className="font-label-md text-label-md text-on-surface flex items-center gap-1 font-medium">
          <span>Bảng Phong Thần</span>
          <span>🏆</span>
        </span>
      </div>

      {/* Page Header Title Area */}
      <div className="flex flex-col space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[30px] leading-none select-none">🍻</span>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold tracking-tight">
            Tổng Kết Bàn Nhậu #{roomCode}
          </h1>
        </div>
        <p className="font-body-sm text-body-sm text-secondary flex items-center gap-1.5 pt-0.5">
          <span className="material-symbols-outlined text-[15px]">check_circle</span>
          <span>
            Đã hoàn thành {history.length} lượt bốc thẻ • Kèo nhậu chân thật
          </span>
        </p>
      </div>

      {/* Snapshot Gallery Grid / Notion Properties (Metrics) */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {/* Stat 1 */}
        <div className="bg-surface-container-low rounded-xl p-3 flex flex-col justify-between shadow-sm hover:bg-surface-container transition-colors">
          <div className="flex items-center gap-1 text-secondary mb-1">
            <span className="material-symbols-outlined text-[16px]">local_bar</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
              Tiêu Thụ
            </span>
          </div>
          <div>
            <div className="font-headline-sm text-headline-sm font-bold text-on-surface">
              {totalSipsCalculated} <span className="font-label-sm text-label-sm font-normal text-secondary">ngụm</span>
            </div>
            <div className="font-code-inline text-code-inline text-secondary mt-0.5">
              ~{estCans} lon bia
            </div>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-surface-container-low rounded-xl p-3 flex flex-col justify-between shadow-sm hover:bg-surface-container transition-colors">
          <div className="flex items-center gap-1 text-secondary mb-1">
            <span className="material-symbols-outlined text-[16px]">style</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
              Đã Rút
            </span>
          </div>
          <div>
            <div className="font-headline-sm text-headline-sm font-bold text-on-surface">
              {history.length} <span className="font-label-sm text-label-sm font-normal text-secondary">thẻ</span>
            </div>
            <div className="font-label-sm text-label-sm text-secondary mt-0.5">
              Bộ {totalCards} câu
            </div>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-surface-container-low rounded-xl p-3 flex flex-col justify-between shadow-sm hover:bg-surface-container transition-colors">
          <div className="flex items-center gap-1 text-secondary mb-1">
            <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
              Nặng Nhất
            </span>
          </div>
          <div>
            <div className="font-body-sm text-body-sm font-semibold text-on-surface line-clamp-1">
              {maxSipCard ? maxSipCard.cardTitle : "Chưa có"}
            </div>
            <div className="font-code-inline text-code-inline text-error mt-0.5">
              {maxSipCard ? `${maxSipCard.sips} ngụm phạt` : "0 ngụm"}
            </div>
          </div>
        </div>
      </div>

      {/* QUESTION HISTORY REVIEW ACTION CALLOUT */}
      <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[20px]">history_edu</span>
          </div>
          <div className="min-w-0">
            <span className="font-body-md font-semibold text-on-surface block leading-tight">
              Lịch Sử Chi Tiết Từng Câu Hỏi
            </span>
            <span className="font-label-sm text-secondary truncate block">
              Xem lại những câu từng người đã bốc &amp; kết quả phạt ({history.length} lượt)
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="bg-primary text-on-primary px-3 py-1.5 rounded-lg text-label-md font-medium shrink-0 active:scale-95 transition-all shadow-xs flex items-center gap-1"
          type="button"
        >
          <span>Xem Lịch Sử</span>
          <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
        </button>
      </div>

      {/* Notion Database View Header: BẢNG PHONG THẦN THẬT */}
      <div className="flex flex-col space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-secondary">
              table_rows
            </span>
            <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Bảng Phong Thần
            </span>
            <span className="bg-surface-container-highest text-on-surface-variant font-code-inline text-code-inline px-1.5 py-0.5 rounded-full font-medium">
              {rankedPlayers.length} người
            </span>
          </div>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="text-secondary hover:text-on-surface text-label-sm font-medium flex items-center gap-1"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            <span>Chi tiết từng câu</span>
          </button>
        </div>

        {/* Database Card / Row Stack */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
          {rankedPlayers.length === 0 ? (
            <div className="p-6 text-center text-secondary font-body-sm">
              Chưa có người chơi nào hoàn thành lượt trong ván đấu này!
            </div>
          ) : (
            rankedPlayers.map((item, idx) => {
              const icon = rankIcons[idx] || "🍺";
              const title = rankTitles[idx] || `Hạng ${idx + 1}`;
              const subtitle =
                rankSubtitles[idx] ||
                `Đã vượt qua ${item.passes} thử thách`;

              return (
                <React.Fragment key={item.player.name}>
                  {idx > 0 && <div className="h-px bg-surface-container-high w-full"></div>}
                  <div className="p-3.5 flex items-center justify-between gap-3 bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center shrink-0 font-headline-sm text-headline-sm font-bold text-on-secondary-fixed shadow-sm">
                        {icon}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-body-md text-body-md font-semibold text-on-surface truncate">
                            {item.player.name}
                          </span>
                          <span className="bg-secondary-container text-on-secondary-container font-label-sm text-label-sm px-1.5 py-0.5 rounded font-medium shrink-0">
                            {title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="material-symbols-outlined text-[14px] text-secondary">
                            military_tech
                          </span>
                          <span className="font-body-sm text-body-sm text-secondary truncate">
                            {subtitle}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                        {item.sips}
                      </span>
                      <span className="font-label-sm text-label-sm text-secondary">ngụm</span>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>

      {/* Interactive Action Buttons */}
      <div className="flex flex-col space-y-2 pt-2">
        {/* Primary Button: Chơi tiếp ván mới */}
        <button
          className="w-full h-11 rounded-lg bg-primary text-on-primary font-body-md text-body-md font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm"
          onClick={() => {
            triggerToast("🔀 Đang chuẩn bị ván bài mới cho cả bàn...");
            if (onReplay) onReplay();
          }}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">replay</span>
          <span>Chơi Tiếp Ván Mới (Xáo Lại Bộ Bài)</span>
        </button>

        {/* Tertiary Button: Rời bàn */}
        <button
          className="w-full h-10 rounded-lg text-secondary hover:text-on-surface font-body-sm text-body-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
          onClick={() => {
            triggerToast("👋 Hẹn gặp lại bạn ở cuộc nhậu sau!");
            if (onLeave) onLeave();
          }}
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          <span>Rời Bàn</span>
        </button>
      </div>

      {/* Question History Modal */}
      <QuestionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
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
