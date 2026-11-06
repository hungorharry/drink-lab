"use client";

import React, { useState } from "react";
import { QuestionHistoryModal } from "./QuestionHistoryModal";
import { DynamicQRCode } from "./DynamicQRCode";

interface NotionShareViewProps {
  roomCode?: string;
  onBackToLobby?: () => void;
}

export const NotionShareView: React.FC<NotionShareViewProps> = ({
  roomCode = "ALCH88",
  onBackToLobby,
}) => {
  const [copyCodeText, setCopyCodeText] = useState<string>("Sao chép mã");
  const [copyLinkText, setCopyLinkText] = useState<string>("Copy Link");
  const [copyQuoteText, setCopyQuoteText] = useState<string>("Sao chép lời mời bựa");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [showToast, setShowToast] = useState<boolean>(false);

  const [inviteLink, setInviteLink] = useState<string>(`https://sipcraft.app/?room=${roomCode}`);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setInviteLink(`${window.location.origin}/?room=${roomCode}`);
    }
  }, [roomCode]);

  const inviteQuote = `🍻 Kèo nhậu #${roomCode} đang thiếu tay! Bấm link đăng nhập Google vào bàn uống cùng tụi tui ngay: ${inviteLink}`;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2200);
  };

  const copyToClipboard = (text: string, onSuccess: () => void) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(onSuccess).catch(() => {
        triggerToast(`Đã sao chép: ${text}`);
      });
    } else {
      triggerToast(`Đã sao chép: ${text}`);
    }
  };

  const handleCopyCode = () => {
    copyToClipboard(roomCode, () => {
      setCopyCodeText("Đã chép!");
      triggerToast(`Đã sao chép mã phòng: ${roomCode}`);
      setTimeout(() => setCopyCodeText("Sao chép mã"), 1800);
    });
  };

  const handleCopyLink = () => {
    copyToClipboard(inviteLink, () => {
      setCopyLinkText("Đã chép!");
      triggerToast("Đã sao chép link tham gia bàn!");
      setTimeout(() => setCopyLinkText("Copy Link"), 1800);
    });
  };

  const handleCopyQuote = () => {
    copyToClipboard(inviteQuote, () => {
      setCopyQuoteText("Đã chép lời mời!");
      triggerToast("Đã chép lời mời, dán ngay vào nhóm chat!");
      setTimeout(() => setCopyQuoteText("Sao chép lời mời bựa"), 1800);
    });
  };

  return (
    <div className="flex flex-col w-full pb-6 space-y-4">
      {/* Notion-style Breadcrumb Trail */}
      <div className="flex items-center gap-1.5 text-on-surface-variant font-label-md text-label-md px-1 pt-1 overflow-x-auto whitespace-nowrap">
        <span className="flex items-center gap-1 text-secondary">
          <span className="material-symbols-outlined text-[15px]">folder_open</span>
          <span>Workspace</span>
        </span>
        <span className="text-outline-variant font-label-sm">/</span>
        <span className="flex items-center gap-1 text-secondary">
          <span className="material-symbols-outlined text-[15px]">table_bar</span>
          <span>Bàn Nhậu {roomCode}</span>
        </span>
        <span className="text-outline-variant font-label-sm">/</span>
        <span className="text-on-surface font-semibold flex items-center gap-1">
          <span className="material-symbols-outlined text-[15px]">person_add</span>
          <span>Mời Bạn Bè</span>
        </span>
      </div>

      {/* Room Overview Header Card */}
      <div className="bg-surface-container-low rounded-xl p-3.5 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-[18px]">
              🍻
            </span>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface leading-tight font-bold">
                Bàn Nhậu Tinh Tú
              </h2>
              <p className="font-label-sm text-label-sm text-secondary">
                Chế độ phạt bia • Lượt quay vòng 15p
              </p>
            </div>
          </div>
          <span className="bg-surface-container-highest text-on-surface font-label-sm text-label-sm px-2.5 py-1 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container animate-pulse"></span>
            <span>Đang mở (4/8)</span>
          </span>
        </div>

        {/* Mini Progress tracker bar */}
        <div className="space-y-1">
          <div className="flex justify-between font-label-sm text-label-sm text-secondary">
            <span>Tiến độ lấp đầy bàn</span>
            <span className="font-semibold text-on-surface">50%</span>
          </div>
          <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: "50%" }}
            ></div>
          </div>
        </div>
      </div>

      {/* Central Invitation Document Block */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden p-4 space-y-4">
        {/* Card header label */}
        <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
          <span className="flex items-center gap-1 font-medium">
            <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
            <span>Thẻ Mời Định Danh Trực Tiếp</span>
          </span>
          <span className="font-code-inline text-code-inline text-secondary bg-surface-container px-2 py-0.5 rounded">
            AUTO_EXPIRE 2H
          </span>
        </div>

        {/* Stylized Notion QR Presentation Frame */}
        {/* 100% Dynamic QR generated from the actual link without any third-party dependencies */}
        <div className="flex flex-col items-center justify-center py-4 bg-surface-container-low rounded-2xl relative group">
          <DynamicQRCode value={inviteLink} size={180} />

          <p className="font-label-sm text-label-sm text-secondary mt-3 flex items-center gap-1.5 font-medium">
            <span className="material-symbols-outlined text-[15px] text-primary">photo_camera</span>
            <span>Mở camera điện thoại quét để vào bàn ngay</span>
          </p>
          <span className="font-code-inline text-[11px] text-secondary/80 mt-0.5 truncate max-w-[280px]">
            {inviteLink}
          </span>
        </div>
        <div style={{ display: "none" }}>
        <div className="flex flex-col items-center justify-center py-3 bg-surface-container-low rounded-xl relative group">
          <div className="bg-surface-container-lowest p-3 rounded-lg shadow-sm flex flex-col items-center relative">
            {/* Real scannable QR Code */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(inviteLink)}`}
              alt={`QR Code Bàn Nhậu ${roomCode}`}
              className="w-44 h-44 rounded-lg object-contain"
            />
            <div style={{ display: "none" }}>
            <svg
              className="w-48 h-48 text-primary"
              fill="currentColor"
              viewBox="0 0 160 160"
            >
              <rect fill="currentColor" height="38" rx="4" width="38" x="10" y="10" />
              <rect fill="#FFFFFF" height="26" rx="2" width="26" x="16" y="16" />
              <rect fill="currentColor" height="14" rx="2" width="14" x="22" y="22" />
              <rect fill="currentColor" height="38" rx="4" width="38" x="112" y="10" />
              <rect fill="#FFFFFF" height="26" rx="2" width="26" x="118" y="16" />
              <rect fill="currentColor" height="14" rx="2" width="14" x="22" y="22" />
              <rect fill="currentColor" height="38" rx="4" width="38" x="10" y="112" />
              <rect fill="#FFFFFF" height="26" rx="2" width="26" x="16" y="118" />
              <rect fill="currentColor" height="14" rx="2" width="14" x="22" y="124" />
              <rect height="6" rx="1.5" width="6" x="56" y="12" />
              <rect height="6" rx="1.5" width="6" x="68" y="12" />
              <rect height="6" rx="1.5" width="6" x="80" y="12" />
              <rect height="6" rx="1.5" width="8" x="94" y="14" />
              <rect height="6" rx="1.5" width="8" x="56" y="24" />
              <rect height="6" rx="1.5" width="6" x="74" y="24" />
              <rect height="6" rx="1.5" width="6" x="88" y="24" />
              <rect height="8" rx="1.5" width="6" x="56" y="36" />
              <rect height="6" rx="1.5" width="10" x="70" y="38" />
              <rect height="6" rx="1.5" width="6" x="92" y="36" />
              <rect height="6" rx="1.5" width="6" x="12" y="56" />
              <rect height="6" rx="1.5" width="8" x="24" y="58" />
              <rect height="8" rx="1.5" width="6" x="38" y="56" />
              <rect height="6" rx="1.5" width="8" x="114" y="56" />
              <rect height="8" rx="1.5" width="8" x="128" y="56" />
              <rect height="6" rx="1.5" width="8" x="140" y="58" />
              <rect height="6" rx="1.5" width="8" x="14" y="70" />
              <rect height="6" rx="1.5" width="6" x="30" y="68" />
              <rect height="6" rx="1.5" width="6" x="42" y="70" />
              <rect height="6" rx="1.5" width="6" x="112" y="70" />
              <rect height="8" rx="1.5" width="8" x="124" y="68" />
              <rect height="6" rx="1.5" width="10" x="138" y="72" />
              <rect height="8" rx="1.5" width="6" x="12" y="86" />
              <rect height="6" rx="1.5" width="8" x="24" y="84" />
              <rect height="6" rx="1.5" width="6" x="38" y="88" />
              <rect height="6" rx="1.5" width="8" x="114" y="86" />
              <rect height="6" rx="1.5" width="6" x="128" y="88" />
              <rect height="8" rx="1.5" width="8" x="140" y="84" />
              <rect height="6" rx="1.5" width="10" x="10" y="98" />
              <rect height="6" rx="1.5" width="6" x="28" y="98" />
              <rect height="6" rx="1.5" width="8" x="40" y="100" />
              <rect height="6" rx="1.5" width="6" x="56" y="114" />
              <rect height="8" rx="1.5" width="8" x="70" y="112" />
              <rect height="6" rx="1.5" width="6" x="86" y="114" />
              <rect height="8" rx="1.5" width="6" x="98" y="112" />
              <rect height="6" rx="1.5" width="6" x="114" y="102" />
              <rect height="6" rx="1.5" width="8" x="126" y="100" />
              <rect height="6" rx="1.5" width="10" x="138" y="102" />
              <rect height="6" rx="1.5" width="8" x="56" y="128" />
              <rect height="6" rx="1.5" width="6" x="72" y="126" />
              <rect height="8" rx="1.5" width="8" x="86" y="128" />
              <rect height="6" rx="1.5" width="6" x="100" y="126" />
              <rect height="6" rx="1.5" width="6" x="114" y="118" />
              <rect height="6" rx="1.5" width="8" x="128" y="118" />
              <rect height="8" rx="1.5" width="8" x="140" y="116" />
              <rect height="8" rx="1.5" width="6" x="56" y="140" />
              <rect height="6" rx="1.5" width="8" x="68" y="140" />
              <rect height="6" rx="1.5" width="6" x="84" y="142" />
              <rect height="8" rx="1.5" width="10" x="96" y="138" />
              <rect height="8" rx="1.5" width="6" x="114" y="132" />
              <rect height="6" rx="1.5" width="6" x="128" y="132" />
              <rect height="6" rx="1.5" width="10" x="138" y="134" />
              <rect height="6" rx="1.5" width="8" x="118" y="144" />
              <rect height="6" rx="1.5" width="6" x="134" y="144" />
              <circle cx="80" cy="80" fill="#FFFFFF" r="18" />
            </svg>
            </div>
            {/* Center Beer Mug Floating Badge */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md ring-4 ring-white">
                <span className="material-symbols-outlined text-on-primary text-[20px]">
                  sports_bar
                </span>
              </div>
            </div>
          </div>
          <p className="font-label-sm text-label-sm text-secondary mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">photo_camera</span>
            <span>Mở camera điện thoại quét để tham gia</span>
          </p>
        </div>
        </div>

        {/* Notion Monospace Room Code Box */}
        <div className="bg-surface-container p-3 rounded-lg flex items-center justify-between">
          <div className="flex flex-col min-w-0">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
              Mã Phòng Chơi
            </span>
            <span className="font-code-inline text-headline-sm font-bold tracking-widest text-on-surface">
              {roomCode}
            </span>
          </div>
          <button
            className="bg-primary text-on-primary hover:bg-inverse-surface px-3 py-1.5 rounded font-label-md text-label-md flex items-center gap-1.5 active:scale-95 transition-all"
            onClick={handleCopyCode}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
            <span>{copyCodeText}</span>
          </button>
        </div>

        {/* Direct Web Link Box */}
        <div className="bg-surface-container-low p-2.5 rounded-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-secondary text-[18px] shrink-0">
              link
            </span>
            <span className="font-code-inline text-code-inline text-on-surface truncate">
              {inviteLink}
            </span>
          </div>
          <button
            className="bg-surface-container hover:bg-surface-container-highest text-on-surface font-label-sm text-label-sm px-2.5 py-1.5 rounded shrink-0 flex items-center gap-1 transition-colors"
            onClick={handleCopyLink}
            type="button"
          >
            <span className="material-symbols-outlined text-[14px]">share</span>
            <span>{copyLinkText}</span>
          </button>
        </div>
      </div>

      {/* Custom Invite Message Preview */}
      <div className="bg-surface-container-low rounded-xl p-3.5 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-label-md text-label-md font-semibold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-secondary">
              format_quote
            </span>
            <span>Mẫu Lời Mời Nhập Tiệc</span>
          </span>
          <span className="bg-secondary-container text-on-secondary-container font-label-sm text-label-sm px-2 py-0.5 rounded">
            Hóm hỉnh
          </span>
        </div>

        <div className="bg-surface-container-lowest p-3 rounded-lg flex items-start gap-2.5 shadow-xs">
          <span className="text-[20px] select-none shrink-0 leading-none mt-0.5">🍺</span>
          <p className="font-body-sm text-body-sm text-on-surface leading-relaxed italic">
            &ldquo;Kèo nhậu {roomCode} đang thiếu tay! Vào rút bài phạt bia ngay kẻo hết lượt:{" "}
            <span className="not-italic text-on-tertiary-container font-code-inline text-code-inline font-semibold">
              sipcraft.app/join/{roomCode}
            </span>
            &rdquo;
          </p>
        </div>
        <button
          className="w-full bg-surface-container hover:bg-surface-container-highest text-on-surface font-label-md text-label-md py-2 rounded flex items-center justify-center gap-1.5 transition-colors"
          onClick={handleCopyQuote}
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">content_paste</span>
          <span>{copyQuoteText}</span>
        </button>
      </div>

      {/* List of Currently Joined Friends */}
      <div className="bg-surface-container-lowest rounded-xl p-3.5 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[17px] text-secondary">view_list</span>
            <span className="font-label-md text-label-md font-semibold text-on-surface">
              Danh Sách Tay Bài Trong Bàn
            </span>
          </div>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="font-code-inline text-[11px] text-primary bg-surface-container px-2 py-0.5 rounded hover:bg-surface-container-high transition-colors flex items-center gap-1"
            type="button"
          >
            <span className="material-symbols-outlined text-[13px]">history</span>
            <span>Xem lịch sử câu</span>
          </button>
        </div>

        <div className="space-y-1.5">
          {/* Member 1 (Host) */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-label-sm shrink-0">
                N
              </div>
              <div className="truncate">
                <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                  Nam
                </span>
                <span className="text-secondary font-label-sm text-label-sm ml-1.5">
                  (Chủ Bàn)
                </span>
              </div>
            </div>
            <span className="bg-surface-container-highest text-on-surface font-label-sm text-label-sm px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              <span>Đã vào</span>
            </span>
          </div>

          {/* Member 2 */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-surface-variant text-on-surface flex items-center justify-center font-bold text-label-sm shrink-0">
                M
              </div>
              <span className="font-body-sm text-body-sm font-medium text-on-surface truncate">
                Mai Anh
              </span>
            </div>
            <span className="bg-surface-container-highest text-on-surface font-label-sm text-label-sm px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              <span>Đã vào</span>
            </span>
          </div>

          {/* Member 3 */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-surface-variant text-on-surface flex items-center justify-center font-bold text-label-sm shrink-0">
                H
              </div>
              <span className="font-body-sm text-body-sm font-medium text-on-surface truncate">
                Tuấn Hải
              </span>
            </div>
            <span className="bg-surface-container-highest text-on-surface font-label-sm text-label-sm px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              <span>Đã vào</span>
            </span>
          </div>

          {/* Member 4 */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-surface-variant text-on-surface flex items-center justify-center font-bold text-label-sm shrink-0">
                T
              </div>
              <span className="font-body-sm text-body-sm font-medium text-on-surface truncate">
                Minh Trang
              </span>
            </div>
            <span className="bg-surface-container-highest text-on-surface font-label-sm text-label-sm px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              <span>Đã vào</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Cluster */}
      <div className="pt-2 flex flex-col gap-2">
        <button
          className="w-full bg-primary text-on-primary hover:bg-inverse-surface py-3 rounded-lg font-headline-sm text-headline-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all"
          onClick={() => setIsModalOpen(true)}
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">fullscreen</span>
          <span>Chia Sẻ QR Toàn Màn Hình</span>
        </button>

        {onBackToLobby && (
          <button
            className="w-full bg-surface-container hover:bg-surface-container-highest text-on-surface py-2.5 rounded-lg font-body-md text-body-md text-center flex items-center justify-center gap-1.5 transition-colors"
            onClick={onBackToLobby}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Quay Lại Phòng Chờ Bàn {roomCode}</span>
          </button>
        )}
      </div>

      {/* Fullscreen QR Lightbox Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2">
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Quét Tham Gia Bàn
              </span>
              <button
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-highest flex items-center justify-center text-on-surface"
                onClick={() => setIsModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-3 bg-surface-container-low rounded-xl flex flex-col items-center justify-center">
              <svg
                className="w-64 h-64 text-primary"
                fill="currentColor"
                viewBox="0 0 160 160"
              >
                <rect fill="currentColor" height="38" rx="4" width="38" x="10" y="10" />
                <rect fill="#FFFFFF" height="26" rx="2" width="26" x="16" y="16" />
                <rect fill="currentColor" height="14" rx="2" width="14" x="22" y="22" />
                <rect fill="currentColor" height="38" rx="4" width="38" x="112" y="10" />
                <rect fill="#FFFFFF" height="26" rx="2" width="26" x="118" y="16" />
                <rect fill="currentColor" height="14" rx="2" width="14" x="22" y="22" />
                <rect fill="currentColor" height="38" rx="4" width="38" x="10" y="112" />
                <rect fill="#FFFFFF" height="26" rx="2" width="26" x="16" y="118" />
                <rect fill="currentColor" height="14" rx="2" width="14" x="22" y="22" />
                <circle cx="80" cy="80" fill="#FFFFFF" r="18" />
              </svg>
            </div>
            <div>
              <p className="font-code-inline text-headline-lg font-bold tracking-widest text-on-surface">
                {roomCode}
              </p>
              <p className="font-label-sm text-label-sm text-secondary mt-1">
                Đưa điện thoại lại gần để camera quét tự động
              </p>
            </div>
            <button
              className="w-full bg-surface-container hover:bg-surface-container-highest text-on-surface font-label-md text-label-md py-2.5 rounded-lg transition-colors"
              onClick={() => setIsModalOpen(false)}
              type="button"
            >
              Đóng Cửa Sổ
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
