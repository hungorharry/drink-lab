import React from "react";
import { sounds } from "@/utils/soundEffects";

export type NotionScreen = "summary" | "auth" | "share" | "lobby" | "spectator";

interface NotionNavProps {
  currentScreen: NotionScreen;
  isPlaying?: boolean;
  onSelectScreen: (screen: NotionScreen) => void;
}

export const NotionNav: React.FC<NotionNavProps> = ({
  currentScreen,
  isPlaying = false,
  onSelectScreen,
}) => {
  const handleNav = (screen: NotionScreen) => {
    sounds.playCardFlip();
    onSelectScreen(screen);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[440px] mx-auto z-50 pb-safe bg-surface/85 backdrop-blur-xl border-t border-surface-container-high/50 shadow-[0_-1px_8px_rgba(0,0,0,0.03)] select-none">
      <div className="h-16 px-gutter flex items-center justify-around gap-space-xs">
        {/* Chỉ hiện tab Bàn Chơi khi trận đấu thực sự đã bắt đầu */}
        {isPlaying && (
          <button
            type="button"
            onClick={() => handleNav("spectator")}
            className={`min-w-[58px] min-h-[44px] flex flex-col items-center justify-center py-1 px-space-xs rounded-xl active:scale-95 transition-all touch-manipulation ${
              currentScreen === "spectator"
                ? "bg-surface-container text-on-surface font-semibold shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              table_restaurant
            </span>
            <span className="font-label-sm text-label-sm tracking-tight mt-0.5">
              Bàn Chơi
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => handleNav("lobby")}
          className={`min-w-[58px] min-h-[44px] flex flex-col items-center justify-center py-1 px-space-xs rounded-xl active:scale-95 transition-all touch-manipulation ${
            currentScreen === "lobby"
              ? "bg-surface-container text-on-surface font-semibold shadow-xs"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            grid_view
          </span>
          <span className="font-label-sm text-label-sm tracking-tight mt-0.5">
            Lobby
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleNav("share")}
          className={`min-w-[58px] min-h-[44px] flex flex-col items-center justify-center py-1 px-space-xs rounded-xl active:scale-95 transition-all touch-manipulation ${
            currentScreen === "share"
              ? "bg-surface-container text-on-surface font-semibold shadow-xs"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            qr_code_2
          </span>
          <span className="font-label-sm text-label-sm tracking-tight mt-0.5">
            Mời Bạn
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleNav("summary")}
          className={`min-w-[58px] min-h-[44px] flex flex-col items-center justify-center py-1 px-space-xs rounded-xl active:scale-95 transition-all touch-manipulation ${
            currentScreen === "summary"
              ? "bg-surface-container text-on-surface font-semibold shadow-xs"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            military_tech
          </span>
          <span className="font-label-sm text-label-sm tracking-tight mt-0.5">
            Tổng Kết
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleNav("auth")}
          className={`min-w-[58px] min-h-[44px] flex flex-col items-center justify-center py-1 px-space-xs rounded-xl active:scale-95 transition-all touch-manipulation ${
            currentScreen === "auth"
              ? "bg-surface-container text-on-surface font-semibold shadow-xs"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            login
          </span>
          <span className="font-label-sm text-label-sm tracking-tight mt-0.5">
            Vào Bàn
          </span>
        </button>
      </div>
    </nav>
  );
};
