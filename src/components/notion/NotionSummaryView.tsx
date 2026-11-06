"use client";

import React, { useState } from "react";
import { QuestionHistoryModal } from "./QuestionHistoryModal";
import { SAMPLE_CARD_HISTORY } from "@/data/history";

interface NotionSummaryViewProps {
  totalCards?: number;
  onReplay?: () => void;
  onLeave?: () => void;
}

export const NotionSummaryView: React.FC<NotionSummaryViewProps> = ({
  totalCards = 100,
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
          ALCH88
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
            Tổng Kết Bàn Nhậu ALCH88
          </h1>
        </div>
        <p className="font-body-sm text-body-sm text-secondary flex items-center gap-1.5 pt-0.5">
          <span className="material-symbols-outlined text-[15px]">check_circle</span>
          <span>
            Hoàn thành {totalCards}/{totalCards} lá bài • Kèo nhậu bền bỉ 2-3 tiếng
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
              86 <span className="font-label-sm text-label-sm font-normal text-secondary">ngụm</span>
            </div>
            <div className="font-code-inline text-code-inline text-secondary mt-0.5">
              ~14 lon bia
            </div>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-surface-container-low rounded-xl p-3 flex flex-col justify-between shadow-sm hover:bg-surface-container transition-colors">
          <div className="flex items-center gap-1 text-secondary mb-1">
            <span className="material-symbols-outlined text-[16px]">timer</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
              Thời Gian
            </span>
          </div>
          <div>
            <div className="font-headline-sm text-headline-sm font-bold text-on-surface">
              2.5 <span className="font-label-sm text-label-sm font-normal text-secondary">tiếng</span>
            </div>
            <div className="font-label-sm text-label-sm text-secondary mt-0.5">
              {totalCards} câu hỏi
            </div>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-surface-container-low rounded-xl p-3 flex flex-col justify-between shadow-sm hover:bg-surface-container transition-colors">
          <div className="flex items-center gap-1 text-secondary mb-1">
            <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
              Cay Nhất
            </span>
          </div>
          <div>
            <div className="font-body-sm text-body-sm font-semibold text-on-surface line-clamp-1">
              Tin nhắn Zalo
            </div>
            <div className="font-code-inline text-code-inline text-error mt-0.5">
              Lá bài #14
            </div>
          </div>
        </div>
      </div>

      {/* Notion Callout Block for Highlight/Meme */}
      <div className="bg-surface-container-high rounded-xl p-3.5 flex items-start gap-3 shadow-sm">
        <div className="text-[22px] select-none shrink-0 pt-0.5">💡</div>
        <div className="flex flex-col space-y-1 min-w-0">
          <span className="font-label-md text-label-md font-semibold text-on-surface tracking-tight uppercase">
            Khoảnh khắc đỉnh cao
          </span>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            <span className="font-semibold text-on-surface">Nam</span> bị cả bàn đồng loạt chỉ tay phong chức{" "}
            <em className="not-italic bg-secondary-container px-1 py-0.2 rounded text-on-secondary-container font-medium">
              Chúa tể cao su
            </em>
            , trong khi{" "}
            <span className="font-semibold text-on-surface">Mai Anh</span> kiên quyết từ chối gọi người yêu cũ và hiên ngang cạn trọn 3 ngụm bia 100%!
          </p>
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
              Xem lại những câu từng người đã nhận &amp; kết quả phạt bia
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

      {/* Notion Database View Header */}
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
              4 người
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
          {/* Rank 1 / Vua Tửu Lượng */}
          <div className="p-3.5 flex items-center justify-between gap-3 bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center shrink-0 font-headline-sm text-headline-sm font-bold text-on-secondary-fixed shadow-sm">
                🥇
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-body-md text-body-md font-semibold text-on-surface truncate">
                    Tuấn Hải
                  </span>
                  <span className="bg-secondary-container text-on-secondary-container font-label-sm text-label-sm px-1.5 py-0.5 rounded font-medium shrink-0">
                    Vua Tửu Lượng
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="material-symbols-outlined text-[14px] text-secondary">
                    military_tech
                  </span>
                  <span className="font-body-sm text-body-sm text-secondary truncate">
                    Danh hiệu: &ldquo;Thùng Không Đáy&rdquo;
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                32
              </span>
              <span className="font-label-sm text-label-sm text-secondary">ngụm</span>
            </div>
          </div>
          <div className="h-px bg-surface-container-high w-full"></div>

          {/* Rank 2 */}
          <div className="p-3.5 flex items-center justify-between gap-3 bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 font-headline-sm text-headline-sm font-bold text-on-surface shadow-sm">
                🥈
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-body-md text-body-md font-semibold text-on-surface truncate">
                    Nam Host
                  </span>
                  <span className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm px-1.5 py-0.5 rounded font-medium shrink-0">
                    Á Quân
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="material-symbols-outlined text-[14px] text-secondary">
                    adjust
                  </span>
                  <span className="font-body-sm text-body-sm text-secondary truncate">
                    &ldquo;Chỉ điểm cao thủ&rdquo;
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                24
              </span>
              <span className="font-label-sm text-label-sm text-secondary">ngụm</span>
            </div>
          </div>
          <div className="h-px bg-surface-container-high w-full"></div>

          {/* Rank 3 */}
          <div className="p-3.5 flex items-center justify-between gap-3 bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 font-headline-sm text-headline-sm font-bold text-on-surface shadow-sm">
                🥉
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-body-md text-body-md font-semibold text-on-surface truncate">
                    Mai Anh
                  </span>
                  <span className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm px-1.5 py-0.5 rounded font-medium shrink-0">
                    Hạng 3
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="material-symbols-outlined text-[14px] text-secondary">
                    shield
                  </span>
                  <span className="font-body-sm text-body-sm text-secondary truncate">
                    &ldquo;Gan cùng mình&rdquo;
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                19
              </span>
              <span className="font-label-sm text-label-sm text-secondary">ngụm</span>
            </div>
          </div>
          <div className="h-px bg-surface-container-high w-full"></div>

          {/* Special Prize / Nạn Nhân */}
          <div className="p-3.5 flex items-center justify-between gap-3 bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 font-headline-sm text-headline-sm font-bold text-on-surface shadow-sm">
                🍼
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-body-md text-body-md font-semibold text-on-surface truncate">
                    Minh Trang
                  </span>
                  <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-1.5 py-0.5 rounded font-medium shrink-0">
                    Nạn Nhân Dịu Dàng
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="material-symbols-outlined text-[14px] text-secondary">
                    water_drop
                  </span>
                  <span className="font-body-sm text-body-sm text-secondary truncate">
                    &ldquo;Bình cứu hỏa (Trà sữa)&rdquo;
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <span className="font-headline-sm text-headline-sm font-bold text-secondary">
                11
              </span>
              <span className="font-label-sm text-label-sm text-secondary">ngụm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notion Card Commemorative Snapshot Placeholder */}
      <div className="flex flex-col space-y-2 pt-1">
        <div className="flex items-center gap-1.5 text-secondary">
          <span className="material-symbols-outlined text-[16px]">photo_camera</span>
          <span className="font-label-md text-label-md uppercase tracking-wider font-semibold text-secondary">
            Thẻ Ảnh Lưu Niệm Ván Đấu
          </span>
        </div>
        <div className="relative w-full rounded-xl overflow-hidden bg-surface-container shadow-sm group">
          <img
            className="w-full h-44 object-cover"
            alt="A warm candid group celebration photo around a rustic wooden bar table with craft drinks"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeqbdG7BEA71twQwcqSDiPnZDoSTilCBtc-OgCkJyfyFPpEBDibNUPvZjUZs5Oi6QuiLMCVpnVzJyktPUUjSZpIRPMyBjli3ZE8atelBn2RXs9ikXu2MQHC5gdk_1S_XoM4hOWvuG_RGNgr9G6P44UPrvf82jSEXbObeEU0gMhy3HtlphmcfuFG13zVVQefZ7YmUZHYNMX74Am4qeUTWnIgeKnCV0nGKqBgMWHzsnz"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-transparent flex items-end p-3.5">
            <div className="flex items-center justify-between w-full text-on-primary">
              <div className="flex flex-col">
                <span className="font-body-md text-body-md font-semibold">
                  Bàn SipCraft ALCH88 • 2.5 Tiếng Nhậu
                </span>
                <span className="font-label-sm text-label-sm opacity-80">
                  Check-in: Quán Gió Cùng Đồng Bọn ({totalCards} câu hỏi)
                </span>
              </div>
              <span className="material-symbols-outlined text-[20px] bg-primary/40 backdrop-blur-md p-1.5 rounded-full">
                celebration
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Action Buttons */}
      <div className="flex flex-col space-y-2 pt-2">
        {/* Primary Button: Chơi tiếp ván mới */}
        <button
          className="w-full h-11 rounded-lg bg-primary text-on-primary font-body-md text-body-md font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm"
          onClick={() => {
            triggerToast("🔀 Đang xáo bộ bài mới cho cả bàn...");
            if (onReplay) onReplay();
          }}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">replay</span>
          <span>Chơi Tiếp Ván Mới (Đổi Bộ Bài)</span>
        </button>

        {/* Secondary Button: Xuất ảnh Notion Card */}
        <button
          className="w-full h-11 rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md font-medium flex items-center justify-center gap-2 active:scale-[0.98] hover:bg-surface-container-highest transition-all shadow-sm"
          onClick={() => {
            triggerToast("📸 Đã lưu thẻ Notion Card vào thư viện ảnh!");
          }}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">ios_share</span>
          <span>Xuất Ảnh Kỷ Niệm (Notion Card)</span>
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
