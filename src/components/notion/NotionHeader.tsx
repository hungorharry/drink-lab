import React, { useState } from "react";
import { GoogleUser } from "./NotionAuthView";
import { sounds } from "@/utils/soundEffects";

interface NotionHeaderProps {
  roomCode?: string;
  memberCount?: string;
  currentUser?: GoogleUser | null;
  onAvatarClick?: () => void;
}

export const NotionHeader: React.FC<NotionHeaderProps> = ({
  roomCode = "ALCH88",
  memberCount = "4/8",
  currentUser,
  onAvatarClick,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(sounds.isMuted);

  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      sounds.playBeerClink();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 max-w-[440px] mx-auto z-50 pt-safe bg-surface/85 backdrop-blur-xl border-b border-surface-container-high/50 shadow-[0_1px_8px_rgba(0,0,0,0.03)] select-none">
      <div className="h-14 px-margin flex items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm min-w-0 flex-1">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-space-xs">
              <span className="truncate font-headline-sm text-headline-sm text-on-surface">
                ✦ SipCraft / Game Arena
              </span>
            </div>
            <div className="flex items-center gap-space-xs mt-0.5">
              <span className="font-code-inline text-code-inline text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
                # {roomCode}
              </span>
              <span className="font-label-sm text-label-sm text-secondary bg-surface-container-low px-1.5 py-0.5 rounded flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">group</span>
                <span>{memberCount}</span>
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Sound Toggle (🔊 / 🔇) */}
          <button
            type="button"
            onClick={handleToggleSound}
            title={isMuted ? "Bật âm thanh hiệu ứng" : "Tắt âm thanh"}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high active:scale-90 transition-transform flex items-center justify-center text-on-surface"
          >
            <span className="material-symbols-outlined text-[17px]">
              {isMuted ? "volume_off" : "volume_up"}
            </span>
          </button>

          {/* User Avatar */}
          <button
            type="button"
            onClick={onAvatarClick}
            title={currentUser ? currentUser.name : "Tài khoản"}
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-outline/20 active:scale-95 transition-transform"
          >
            {currentUser?.picture ? (
              <img
                src={currentUser.picture}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            ) : currentUser?.name ? (
              <span className="text-on-primary font-bold text-xs uppercase">
                {currentUser.name.charAt(0)}
              </span>
            ) : (
              <span className="material-symbols-outlined text-on-primary text-[18px]">
                person
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
