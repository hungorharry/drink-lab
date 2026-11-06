"use client";

import React, { useState } from "react";
import { CardHistoryItem } from "@/types/game";
import { SAMPLE_CARD_HISTORY } from "@/data/history";

interface QuestionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history?: CardHistoryItem[];
}

export const QuestionHistoryModal: React.FC<QuestionHistoryModalProps> = ({
  isOpen,
  onClose,
  history = [],
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  if (!isOpen) return null;

  // Lấy danh sách tên người chơi duy nhất
  const playerNames = Array.from(new Set(history.map((item) => item.playerName)));

  const filteredHistory = history.filter((item) => {
    const matchPlayer =
      selectedPlayer === "all" || item.playerName === selectedPlayer;
    const matchSearch =
      searchQuery.trim() === "" ||
      item.cardTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.cardContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.playerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchPlayer && matchSearch;
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none touch-manipulation"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-2xl max-w-md w-full max-h-[85dvh] flex flex-col shadow-2xl overflow-hidden border border-surface-container-high/60 gpu-accelerated"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 bg-surface-container-low border-b border-surface-container-high flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">
              history_edu
            </span>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold leading-tight">
                Lịch Sử Câu Hỏi Đã Bốc
              </h3>
              <p className="font-label-sm text-label-sm text-secondary">
                Xem lại câu hỏi &amp; thử thách của từng người chơi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-highest active:scale-95 flex items-center justify-center text-on-surface transition-transform"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Filter controls */}
        <div className="p-3 bg-surface-container-lowest border-b border-surface-container-low space-y-2">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm câu hỏi, người chơi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low text-on-surface font-body-sm text-body-sm rounded-lg py-1.5 pl-8 pr-3 focus:bg-surface-container-lowest focus:outline-none transition-colors border-0"
            />
            <span className="material-symbols-outlined absolute left-2 top-2 text-[16px] text-secondary">
              search
            </span>
          </div>

          {/* Player filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-label-sm">
            <button
              onClick={() => setSelectedPlayer("all")}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                selectedPlayer === "all"
                  ? "bg-primary text-on-primary font-medium"
                  : "bg-surface-container text-on-surface hover:bg-surface-container-high"
              }`}
              type="button"
            >
              Tất cả ({history.length})
            </button>
            {playerNames.map((name) => {
              const count = history.filter((h) => h.playerName === name).length;
              return (
                <button
                  key={name}
                  onClick={() => setSelectedPlayer(name)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                    selectedPlayer === name
                      ? "bg-primary text-on-primary font-medium"
                      : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                  }`}
                  type="button"
                >
                  {name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* List of cards history */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-secondary font-body-sm">
              <span className="material-symbols-outlined text-3xl mb-1 opacity-60">
                history
              </span>
              <p className="font-medium text-on-surface">Chưa có lượt bốc thẻ nào</p>
              <p className="text-xs text-secondary mt-0.5">
                Lịch sử các câu hỏi và ngụm bia phạt sẽ được lưu tự động tại đây khi chơi!
              </p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="bg-surface-container-low p-3 rounded-xl border border-surface-container-high space-y-2 hover:bg-surface-container transition-colors"
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-label-sm shrink-0">
                      {item.playerInitial}
                    </div>
                    <div>
                      <span className="font-body-sm font-semibold text-on-surface">
                        {item.playerName}
                      </span>
                      <span className="text-secondary font-code-inline text-[11px] ml-1.5">
                        Lượt #{item.turnNumber} • {item.timestamp}
                      </span>
                    </div>
                  </div>
                  <span className="font-code-inline text-[10px] px-1.5 py-0.5 rounded bg-surface-container-highest text-secondary uppercase font-semibold">
                    {item.cardType}
                  </span>
                </div>

                {/* Card title & Question */}
                <div className="bg-surface-container-lowest p-2.5 rounded-lg space-y-1">
                  <p className="font-label-sm text-primary font-bold">
                    {item.cardTitle}
                  </p>
                  <p className="font-body-sm text-on-surface leading-snug">
                    {item.cardContent}
                  </p>
                </div>

                {/* Result footer */}
                <div className="flex items-center justify-between pt-0.5">
                  <span className="font-label-sm text-secondary truncate max-w-[200px]">
                    {item.penalty}
                  </span>
                  <span
                    className={`font-label-sm px-2 py-0.5 rounded-full font-medium flex items-center gap-1 shrink-0 ${
                      item.result === "passed"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    <span>{item.resultText}</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-surface-container-low border-t border-surface-container-high flex items-center justify-between text-label-sm text-secondary">
          <span>Tổng số lượt ghi nhận: {history.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface-container-highest hover:bg-surface-container text-on-surface font-medium transition-colors"
            type="button"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
