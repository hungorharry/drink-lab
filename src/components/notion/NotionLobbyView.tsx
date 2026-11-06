"use client";

import React, { useState } from "react";
import { QuestionHistoryModal } from "./QuestionHistoryModal";
import { Player } from "@/types/game";
import { sounds } from "@/utils/soundEffects";
import { DynamicQRCode } from "./DynamicQRCode";

interface NotionLobbyViewProps {
  roomCode?: string;
  totalCards?: number;
  players?: Player[];
  isHost?: boolean;
  onTotalCardsChange?: (count: number) => void;
  onStartGame?: () => void;
  onSoloTest?: () => void;
  onLeaveRoom?: () => void;
  onOpenInvite?: () => void;
}

export const NotionLobbyView: React.FC<NotionLobbyViewProps> = ({
  roomCode = "ALCH88",
  totalCards = 100,
  players,
  isHost = true,
  onTotalCardsChange,
  onStartGame,
  onSoloTest,
  onLeaveRoom,
  onOpenInvite,
}) => {
  const [selectedCards, setSelectedCards] = useState<number>(totalCards);
  const [copyText, setCopyText] = useState<string>("Sao chép mã");
  const [copyIcon, setCopyIcon] = useState<string>("content_copy");
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [showToast, setShowToast] = useState<boolean>(false);

  const inviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/?room=${roomCode}`
      : `https://sipcraft.app/?room=${roomCode}`;

  // Only show real players who actually joined the room (no fake/mock players)
  const activePlayers: Player[] = players && players.length > 0 ? players : [];

  const cardPresets = [
    { count: 20, label: "20 câu", desc: "~30 phút" },
    { count: 50, label: "50 câu", desc: "~1 tiếng" },
    { count: 100, label: "100 câu", desc: "~2 tiếng" },
    { count: 200, label: "200 câu", desc: "~3-4 tiếng" },
    { count: 500, label: "500 câu", desc: "Thâu đêm" },
    { count: 1000, label: "1000 câu", desc: "Full kho" },
  ];

  const handleSelectCards = (count: number) => {
    sounds.playCardFlip();
    setSelectedCards(count);
    if (onTotalCardsChange) onTotalCardsChange(count);
    triggerToast(`Đã nâng bộ bài lên ${count} câu hỏi (~${Math.round(count * 1.2)} phút chơi)!`);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2200);
  };

  const copyRoomCode = () => {
    sounds.playSuccessChime();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(roomCode).then(() => {
        setCopyText("Đã chép!");
        setCopyIcon("check");
        triggerToast(`Đã sao chép mã phòng: ${roomCode}`);
        setTimeout(() => {
          setCopyText("Sao chép mã");
          setCopyIcon("content_copy");
        }, 2000);
      });
    } else {
      triggerToast(`Mã phòng: ${roomCode}`);
    }
  };

  const handleStart = () => {
    sounds.playBeerClink();
    setIsStarting(true);
    setTimeout(() => {
      setIsStarting(false);
      triggerToast(`Ván chơi ${selectedCards} câu đã bắt đầu! Chúc cả bàn say sưa vui vẻ 🍻`);
      if (onStartGame) onStartGame();
    }, 1000);
  };

  const handleConfirmLeave = () => {
    if (confirm(`Bạn có chắc muốn rời bàn nhậu ${roomCode}?`)) {
      triggerToast("Đã rời phòng chơi.");
      if (onLeaveRoom) onLeaveRoom();
    }
  };

  return (
    <div className="flex flex-col w-full pb-6 space-y-space-md">
      {/* Document Header / Breadcrumb */}
      <div className="flex flex-col gap-space-xs pt-1">
        <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm">
          <span className="hover:text-on-surface transition-colors cursor-pointer">
            Workspace
          </span>
          <span className="text-outline-variant font-code-inline text-[10px]">/</span>
          <span className="hover:text-on-surface transition-colors cursor-pointer truncate max-w-[120px]">
            Bàn Nhậu {roomCode}
          </span>
          <span className="text-outline-variant font-code-inline text-[10px]">/</span>
          <span className="text-on-surface font-medium truncate">Phòng Chờ</span>
        </div>
        <div className="flex items-center justify-between gap-space-sm mt-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl select-none">🍻</span>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-on-surface font-bold">
              Phòng Chờ Game Nhậu
            </h1>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
            <span>4/8 chỗ</span>
          </div>
        </div>
      </div>

      {/* Notion Callout Box: Room Key & Share Controls */}
      <div className="flex items-start gap-space-md p-space-md rounded-xl bg-surface-container-low shadow-sm">
        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-base select-none shrink-0 mt-0.5">
          🎲
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-space-xs mb-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium uppercase tracking-wider">
              Mã Phòng Đấu
            </span>
            <span className="font-code-inline text-code-inline px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-semibold tracking-wide">
              {roomCode}
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm leading-relaxed">
            Gửi mã cho hội bạn hoặc quét mã QR trực tiếp tại bàn để tự động ghép chỗ ngồi.
          </p>
          {/* Action Pills */}
          <div className="flex items-center gap-2 flex-wrap pt-0.5">
            <button
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-highest hover:bg-surface-dim text-on-surface font-label-md text-label-md transition-all active:scale-95 shadow-sm"
              onClick={copyRoomCode}
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">{copyIcon}</span>
              <span>{copyText}</span>
            </button>
            <button
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-highest hover:bg-surface-dim text-on-surface font-label-md text-label-md transition-all active:scale-95 shadow-sm"
              onClick={() => setIsQrModalOpen(true)}
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">qr_code_2</span>
              <span>Mã QR</span>
            </button>
            <button
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-highest hover:bg-surface-dim text-on-surface font-label-md text-label-md transition-all active:scale-95 shadow-sm"
              onClick={onOpenInvite}
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">person_add</span>
              <span>Mời bạn</span>
            </button>
            <button
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-highest hover:bg-surface-dim text-primary font-label-md text-label-md transition-all active:scale-95 shadow-sm font-semibold"
              onClick={() => setIsHistoryOpen(true)}
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">history</span>
              <span>Lịch sử câu</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUESTION COUNT CONFIGURATION SECTION (Nâng tổng số câu hỏi 2-3 tiếng) */}
      <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm space-y-2.5 border border-surface-container-high">
        <div className="flex items-center justify-between pb-0.5">
          <div className="flex items-center gap-1.5 text-on-surface">
            <span className="material-symbols-outlined text-[18px] text-primary">
              timer
            </span>
            <span className="font-label-md text-label-md font-semibold tracking-tight uppercase">
              Quy Mô Câu Hỏi &amp; Thời Lượng Nhậu
            </span>
          </div>
          <span className="bg-primary text-on-primary font-code-inline text-code-inline px-2 py-0.5 rounded font-bold">
            {selectedCards} CÂU HỎI
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-secondary">
          Kho game có sẵn <strong>1000 câu</strong>. Hãy chọn số lượng thẻ phù hợp để cuộc vui kéo dài 2-3 tiếng không lo hết bài:
        </p>

        {/* Quick Presets Grid */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {cardPresets.map((preset) => (
            <button
              key={preset.count}
              onClick={() => handleSelectCards(preset.count)}
              type="button"
              className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all active:scale-95 touch-manipulation select-none ${
                selectedCards === preset.count
                  ? "bg-primary text-on-primary border-primary shadow-sm"
                  : "bg-surface-container-low hover:bg-surface-container border-surface-container-high text-on-surface"
              }`}
            >
              <span className="font-headline-sm text-sm font-bold">
                {preset.label}
              </span>
              <span
                className={`font-label-sm text-[11px] ${
                  selectedCards === preset.count ? "text-secondary-container" : "text-secondary"
                }`}
              >
                {preset.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Notion Properties Table View */}
      <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm space-y-space-sm">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">
              Thuộc tính phiên chơi
            </span>
          </div>
          <span className="font-code-inline text-code-inline text-secondary">v2.4</span>
        </div>

        {/* Property Row 1: Gói Thẻ Bài */}
        <div className="flex items-center justify-between py-1.5 gap-space-sm text-on-surface">
          <div className="flex items-center gap-2 text-on-surface-variant min-w-[110px]">
            <span className="material-symbols-outlined text-[15px]">style</span>
            <span className="font-body-sm text-body-sm">Bộ Thẻ</span>
          </div>
          <div className="flex items-center justify-end flex-1 min-w-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span className="truncate">
                Sinh Viên Bựa &amp; Tình Trường ({selectedCards} thẻ • ~{Math.round(selectedCards / 40) || 1} - {Math.ceil(selectedCards / 30)}h)
              </span>
            </span>
          </div>
        </div>

        {/* Property Row 2: Chế Độ */}
        <div className="flex items-center justify-between py-1.5 gap-space-sm text-on-surface">
          <div className="flex items-center gap-2 text-on-surface-variant min-w-[110px]">
            <span className="material-symbols-outlined text-[15px]">rotate_right</span>
            <span className="font-body-sm text-body-sm">Vòng Chơi</span>
          </div>
          <div className="flex items-center justify-end flex-1 min-w-0">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">
              Theo chiều kim đồng hồ
            </span>
          </div>
        </div>

        {/* Property Row 3: Luật Phạt */}
        <div className="flex items-center justify-between py-1.5 gap-space-sm text-on-surface">
          <div className="flex items-center gap-2 text-on-surface-variant min-w-[110px]">
            <span className="material-symbols-outlined text-[15px]">gavel</span>
            <span className="font-body-sm text-body-sm">Luật Phạt</span>
          </div>
          <div className="flex items-center justify-end flex-1 min-w-0">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-medium">
              Tính ngụm lũy kế • Lưu lịch sử
            </span>
          </div>
        </div>
      </div>

      {/* Notion Database Gallery: Danh Sách Bạn Nhậu */}
      <div className="space-y-space-sm">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-on-surface">
              space_dashboard
            </span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Danh Sách Bạn Nhậu
            </span>
          </div>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1 text-primary font-label-sm text-label-sm bg-surface-container px-2 py-0.5 rounded hover:bg-surface-container-high transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[14px]">history</span>
            <span>Xem lịch sử bài đã bốc</span>
          </button>
        </div>

        {/* Grid Cards (2 columns on mobile) */}
        <div className="grid grid-cols-2 gap-space-sm">
          {activePlayers.length === 0 ? (
            <div className="col-span-2 p-4 rounded-xl bg-surface-container-low border border-surface-container-high text-center">
              <span className="text-2xl block mb-1">🍻</span>
              <p className="font-body-sm text-on-surface font-semibold">Chưa có ai trong bàn nhậu</p>
              <p className="font-label-sm text-secondary text-xs mt-0.5">
                Hãy chia sẻ mã phòng hoặc quét mã QR bên dưới để bạn bè vào bàn!
              </p>
            </div>
          ) : (
            activePlayers.map((player) => (
              <div
                key={player.id}
                className="group relative flex flex-col justify-between p-space-sm rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-1 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center font-bold text-on-surface font-headline-sm text-headline-sm select-none overflow-hidden">
                    {player.avatar ? (
                      <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                    ) : (
                      player.initial || player.name.charAt(0)
                    )}
                  </div>
                  {player.isHost ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-primary text-on-primary font-label-sm text-label-sm">
                      <span>👑</span>
                      <span>Host</span>
                    </span>
                  ) : (
                    <span className="text-base select-none">🍻</span>
                  )}
                </div>
                <div className="min-w-0 mb-3">
                  <div className="font-body-md text-body-md font-semibold text-on-surface truncate">
                    {player.name}
                  </div>
                  <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm mt-0.5">
                    <span className="material-symbols-outlined text-[13px] text-secondary">
                      sports_bar
                    </span>
                    <span className="truncate">Sẵn sàng nhập tiệc</span>
                  </div>
                </div>
                <div className="pt-2 flex items-center justify-between bg-surface-container-low px-2 py-1 rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface font-medium">
                    Đã vào bàn
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                </div>
              </div>
            ))
          )}

          {/* Add Player Slot */}
          <button
            className="group flex flex-col items-center justify-center p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors col-span-2 py-4 cursor-pointer active:scale-95 border-2 border-dashed border-surface-container-high"
            onClick={onOpenInvite}
            type="button"
          >
            <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant mb-1 group-hover:bg-surface-dim transition-colors">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
            </div>
            <span className="font-body-md text-body-md font-medium text-on-surface">
              Mời thêm bạn nhậu
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
              Copy link hoặc quét QR để bạn bè đăng nhập vào bàn ({activePlayers.length}/8)
            </span>
          </button>
        </div>
      </div>

      {/* Notion Activity Callout */}
      <div className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between text-on-surface-variant">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-[16px] text-secondary">info</span>
          <span className="font-body-sm text-body-sm truncate">
            Chỉ Host mới có thể ấn bắt đầu vòng chơi {selectedCards} câu.
          </span>
        </div>
        <span className="font-label-sm text-label-sm text-secondary shrink-0">
          Ready {activePlayers.length}/8
        </span>
      </div>

      {/* Action Controls */}
      <div className="flex flex-col gap-2 pt-1">
        {/* Primary CTA: Host Start Game */}
        <button
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-headline-sm text-headline-sm tracking-tight shadow-md transition-all ${
            isHost
              ? "bg-primary text-on-primary hover:bg-surface-tint active:scale-[0.99] cursor-pointer"
              : "bg-surface-container-high text-secondary cursor-not-allowed opacity-85"
          }`}
          onClick={handleStart}
          type="button"
          disabled={!isHost || isStarting}
        >
          {isStarting ? (
            <span>⏳ Đang chuẩn bị xáo {selectedCards} thẻ bài...</span>
          ) : isHost ? (
            <>
              <span>🚀</span>
              <span>Bắt Đầu Ván {selectedCards} Câu (Host Only)</span>
            </>
          ) : (
            <>
              <span>⏳</span>
              <span>Đang Chờ Host Bắt Đầu ({selectedCards} Câu)...</span>
            </>
          )}
        </button>

        {/* Secondary Row Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-dim active:scale-[0.98] transition-all"
            onClick={() => {
              triggerToast("Đã chuyển sang chế độ chơi thử 1 mình!");
              if (onSoloTest) onSoloTest();
            }}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">smart_toy</span>
            <span>Chơi Thử Solo</span>
          </button>
          <button
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-surface-container-low text-error font-label-md text-label-md hover:bg-error-container hover:text-on-error-container active:scale-[0.98] transition-all"
            onClick={handleConfirmLeave}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Rời Phòng</span>
          </button>
        </div>
      </div>

      {/* Modal Popover for QR Code */}
      {isQrModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-margin bg-inverse-surface/30 backdrop-blur-xs"
          onClick={() => setIsQrModalOpen(false)}
        >
          <div
            className="w-full max-w-[320px] rounded-xl bg-surface-container-lowest p-space-lg shadow-xl space-y-space-md text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Mã QR Bàn {roomCode}
              </span>
              <button
                className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface"
                onClick={() => setIsQrModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            {/* Real Dynamic Scannable QR Code */}
            <div className="flex flex-col items-center justify-center py-2">
              <DynamicQRCode value={inviteLink} size={170} />
            </div>
            <div className="space-y-0.5">
              <p className="font-label-md text-label-md text-on-surface font-semibold">
                Quét bằng Zalo hoặc Camera điện thoại
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Tự động vào bàn không cần nhập mã code
              </p>
            </div>
            <button
              className="w-full py-2 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-dim transition-colors"
              onClick={() => setIsQrModalOpen(false)}
              type="button"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Question History Modal */}
      <QuestionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
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
