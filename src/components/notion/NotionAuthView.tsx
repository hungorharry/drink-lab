"use client";

import React, { useState, useEffect } from "react";
import { sounds } from "@/utils/soundEffects";
import { loginWithGoogle, loginOrRegisterWithEmail, logoutFirebase, isFirebaseConfigured } from "@/lib/firebase";
import { OnlineUser, RoomState } from "@/lib/roomService";
import { safeStorage } from "@/utils/safeStorage";

export interface GoogleUser {
  name: string;
  email: string;
  avatar: string;
  uid?: string;
}

interface NotionAuthViewProps {
  initialRoomCode?: string;
  isInvited?: boolean;
  currentUser?: GoogleUser | null;
  onlineUsers?: OnlineUser[];
  activeRooms?: RoomState[];
  onUserChange?: (user: GoogleUser | null) => void;
  onJoinRoom?: (roomCode: string, playerName: string, tolerance: string, user: GoogleUser) => void;
  onCreateRoom?: (user: GoogleUser) => void;
}

export const NotionAuthView: React.FC<NotionAuthViewProps> = ({
  initialRoomCode = "",
  isInvited = false,
  currentUser = null,
  onlineUsers = [],
  activeRooms = [],
  onUserChange,
  onJoinRoom,
  onCreateRoom,
}) => {
  // Tự động khôi phục danh tính người chơi nếu đã đăng nhập trước đó (F5 không mất)
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(currentUser);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState<boolean>(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  // Phương thức đăng nhập tùy chọn: Google hoặc Email
  const [authMode, setAuthMode] = useState<"google" | "email">("google");
  const [showAuthOptions, setShowAuthOptions] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");

  const [playerName, setPlayerName] = useState<string>(
    currentUser?.name || `Chiến Hữu #${Math.floor(100 + Math.random() * 900)}`
  );
  const [tolerance, setTolerance] = useState<string>("toi-ben");
  const [roomCode, setRoomCode] = useState<string>(initialRoomCode || "");
  const [toastMessage, setToastMessage] = useState<string>("");
  const [showToast, setShowToast] = useState<boolean>(false);

  // Đồng bộ khi currentUser được load từ auth / localStorage
  useEffect(() => {
    if (currentUser) {
      setGoogleUser(currentUser);
      if (!playerName) {
        setPlayerName(currentUser.name);
      }
    }
  }, [currentUser]);

  // Sync if initialRoomCode changes from URL
  React.useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode);
    }
  }, [initialRoomCode]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2600);
  };

  // Đăng nhập hoặc Tạo tài khoản qua Email
  const handleEmailLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!emailInput.trim()) {
      triggerToast("⚠️ Vui lòng nhập địa chỉ Email!");
      return;
    }
    if (!passwordInput.trim() || passwordInput.length < 6) {
      triggerToast("⚠️ Mật khẩu cần tối thiểu 6 ký tự!");
      return;
    }

    try {
      setIsSigningIn(true);
      sounds.playShuffle();
      const user = await loginOrRegisterWithEmail(
        emailInput.trim(),
        passwordInput.trim(),
        playerName
      );
      setGoogleUser(user);
      setPlayerName(user.name);
      if (onUserChange) onUserChange(user);
      setIsSigningIn(false);
      sounds.playSuccessChime();
      triggerToast(`✅ Đã đăng nhập Email: ${user.name}`);
    } catch (err: unknown) {
      setIsSigningIn(false);
      console.error("Email Login Error:", err);
      const errMsg = err instanceof Error ? err.message : "Đăng nhập thất bại";
      if (errMsg.includes("operation-not-allowed")) {
        triggerToast("⚠️ Hãy bật 'Email/Password' trong Firebase Console -> Authentication -> Sign-in method!");
      } else if (errMsg.includes("weak-password")) {
        triggerToast("⚠️ Mật khẩu quá yếu! Hãy nhập từ 6 ký tự.");
      } else if (errMsg.includes("invalid-email")) {
        triggerToast("⚠️ Địa chỉ Email không hợp lệ!");
      } else {
        triggerToast(`❌ Lỗi Firebase: ${errMsg.slice(0, 60)}`);
      }
    }
  };

  // Đăng nhập Google thật qua Firebase Popup
  const handleRealGoogleLogin = async () => {
    if (!isFirebaseConfigured) {
      triggerToast("⚠️ Chưa điền config Firebase trong .env.local!");
      setIsGoogleModalOpen(true);
      return;
    }

    try {
      setIsSigningIn(true);
      sounds.playShuffle();
      const user = await loginWithGoogle();
      setGoogleUser(user);
      setPlayerName(user.name);
      if (onUserChange) onUserChange(user);
      setIsSigningIn(false);
      setIsGoogleModalOpen(false);
      sounds.playSuccessChime();
      triggerToast(`✅ Đã đăng nhập Google: ${user.name}`);
    } catch (err: unknown) {
      setIsSigningIn(false);
      console.error("Firebase Login Error:", err);
      const errMsg = err instanceof Error ? err.message : "Đăng nhập thất bại";
      // Xử lý các case popup đóng hoặc domain chưa cấp quyền
      if (errMsg.includes("popup-closed-by-user")) {
        triggerToast("ℹ️ Bạn đã đóng cửa sổ đăng nhập Google.");
      } else if (errMsg.includes("popup-blocked") || errMsg.includes("Cross-Origin-Opener-Policy")) {
        triggerToast("⚠️ Trình duyệt (Firefox/Safari) đã chặn popup. Bạn có thể chơi ngay không cần tài khoản!");
      } else if (errMsg.includes("unauthorized-domain")) {
        triggerToast("⚠️ Domain chưa được cấp quyền trong Firebase Console -> Authorized Domains!");
      } else {
        triggerToast(`❌ Lỗi Firebase: ${errMsg.slice(0, 60)}`);
      }
    }
  };

  const handleOpenGoogleAuth = () => {
    if (isFirebaseConfigured) {
      handleRealGoogleLogin();
    } else {
      setIsGoogleModalOpen(true);
    }
  };

  const handleSelectGoogleAccount = (accountEmail: string, accountName: string) => {
    setIsSigningIn(true);
    setTimeout(() => {
      const user: GoogleUser = {
        name: accountName,
        email: accountEmail,
        avatar: "https://lh3.googleusercontent.com/a/default-user=s96-c",
      };
      setGoogleUser(user);
      setPlayerName(accountName);
      if (onUserChange) onUserChange(user);
      setIsSigningIn(false);
      setIsGoogleModalOpen(false);
      sounds.playSuccessChime();
      triggerToast(`✅ Đã xác thực thành công Google: ${accountEmail}`);
    }, 800);
  };

  const handleGoogleSignOut = async () => {
    try {
      await logoutFirebase();
    } catch (e) {
      console.error(e);
    }
    setGoogleUser(null);
    if (onUserChange) onUserChange(null);
    triggerToast("Đã đăng xuất tài khoản Google.");
  };

  const randomizeName = () => {
    sounds.playShuffle();
    const funnyNames = [
      "Hải Đếm Ngụm",
      "Nam Bợm",
      "Trang Rượu Nếp",
      "Tú Không Say",
      "Linh Trà Đá",
      "Đạt Đại Hiệp",
      "Khánh Nửa Cốc",
      "Phúc Lên Bia",
    ];
    let nextName = funnyNames[Math.floor(Math.random() * funnyNames.length)];
    while (nextName === playerName && funnyNames.length > 1) {
      nextName = funnyNames[Math.floor(Math.random() * funnyNames.length)];
    }
    setPlayerName(nextName);
  };

  const quickFillRoom = (code: string) => {
    sounds.playCardFlip();
    setRoomCode(code);
    triggerToast(`Đã chọn bàn #${code}`);
  };

  const ensureUser = (): GoogleUser => {
    if (googleUser) return googleUser;
    const cleanName = playerName.trim() || `Chiến Hữu #${Math.floor(100 + Math.random() * 900)}`;
    const guestUser: GoogleUser = {
      name: cleanName,
      email: "",
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`,
      uid: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    setGoogleUser(guestUser);
    setPlayerName(cleanName);
    safeStorage.setItem("drinklab_user_session", JSON.stringify(guestUser));
    if (onUserChange) onUserChange(guestUser);
    return guestUser;
  };

  const handleJoin = () => {
    const code = roomCode.trim().toUpperCase();
    if (!code) {
      triggerToast("⚠️ Vui lòng nhập mã phòng (ví dụ: SIP-1234) hoặc quét mã QR!");
      return;
    }
    const userToUse = ensureUser();
    sounds.playBeerClink();
    const name = playerName.trim() || userToUse.name;
    triggerToast(`🎉 Đang kết nối bàn [${code}] với danh tính "${name}"...`);
    if (onJoinRoom) {
      onJoinRoom(code, name, tolerance, userToUse);
    }
  };

  const handleCreate = () => {
    const userToUse = ensureUser();
    sounds.playBeerClink();
    triggerToast(`✨ Đang khởi tạo phòng mới cho chủ xị "${userToUse.name}"...`);
    if (onCreateRoom) {
      onCreateRoom(userToUse);
    }
  };

  return (
    <div className="flex flex-col w-full pb-6 space-y-4">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 py-1 text-secondary font-label-sm text-label-sm overflow-x-auto whitespace-nowrap scrollbar-none">
        <span className="hover:text-on-surface cursor-pointer transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">workspaces</span>
          <span>Workspace</span>
        </span>
        <span className="text-outline-variant font-code-inline text-code-inline">/</span>
        <span className="hover:text-on-surface cursor-pointer transition-colors">Auth</span>
        <span className="text-outline-variant font-code-inline text-code-inline">/</span>
        <span className="text-on-surface font-medium bg-surface-container px-1.5 py-0.5 rounded">
          Xác Thực &amp; Vào Bàn
        </span>
      </div>

      {/* Page Header Icon & Title */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-[24px] shadow-sm select-none border border-surface-container-highest">
            🍻
          </div>
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-secondary tracking-wider uppercase font-semibold">
              ✦ SipCraft Drinking Game Engine
            </span>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface tracking-tight font-bold">
              Vào Bàn Chơi Ngay
            </h1>
          </div>
        </div>
        <p className="font-body-sm text-body-sm text-secondary pt-0.5">
          Tạo phòng hoặc gửi link để bạn bè vào thẳng phòng chờ (lobby) trong 1 giây mà không cần tài khoản.
        </p>
      </div>

      {/* Banner thông báo khi được bạn bè mời qua Link */}
      {isInvited && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-amber-500/15 border-2 border-amber-500/50 rounded-2xl p-3.5 shadow-sm flex items-center gap-3 animate-fadeIn">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xl shrink-0 shadow-xs">
            🎉
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-label-sm uppercase font-bold tracking-wider text-amber-900 block">
              Lời Mời Vào Bàn Nhậu!
            </span>
            <p className="font-body-sm text-on-surface text-xs leading-snug">
              Bạn nhận được lời mời vào bàn <strong className="font-bold underline text-amber-950 font-code-inline text-sm">#{roomCode}</strong>. Hãy đăng nhập Google để nhập tiệc ngay!
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* KHỐI 1: CHƠI NGAY 100% (TÙY CHỌN LIÊN KẾT GOOGLE NẾU MUỐN)                */}
      {/* ========================================================================= */}
      {googleUser && googleUser.email ? (
        /* KHI ĐÃ ĐĂNG NHẬP GOOGLE HOẶC EMAIL THÀNH CÔNG */
        <div className="bg-surface-container-lowest border border-emerald-500/40 rounded-2xl p-4 shadow-sm space-y-3 bg-gradient-to-br from-surface-container-lowest to-surface-container-low">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-label-sm font-semibold">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              <span>Đã liên kết Google / Email</span>
            </span>
            <button
              onClick={handleGoogleSignOut}
              className="text-secondary hover:text-error text-xs font-medium px-2 py-1 rounded transition-colors"
              type="button"
            >
              Đổi tài khoản
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center font-headline-sm font-bold shadow-sm shrink-0">
              {googleUser.name.charAt(0)}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-body-md font-bold text-on-surface truncate">
                  {googleUser.name}
                </span>
                <span className="material-symbols-outlined text-emerald-600 text-[16px]">
                  verified
                </span>
              </div>
              <span className="font-code-inline text-code-inline text-secondary truncate">
                {googleUser.email}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* CHẾ ĐỘ CHƠI NGAY KHÔNG CẦN TÀI KHOẢN */
        <div className="bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center text-xl shrink-0">
                ⚡
              </div>
              <div className="flex flex-col">
                <span className="font-body-sm font-bold text-on-surface">
                  Chơi Ngay Không Cần Tạo Tài Khoản
                </span>
                <span className="text-[12px] text-secondary">
                  Chỉ cần đặt tên là vào bàn nhậu với bạn bè ngay lập tức (Realtime)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAuthOptions(!showAuthOptions)}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-lg border border-surface-container-high shrink-0 cursor-pointer transition-colors"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              <span>{showAuthOptions ? "Đóng tùy chọn" : "Tùy chọn: Đăng nhập Google"}</span>
            </button>
          </div>

          {/* Hộp đăng nhập Google/Email mở rộng khi người dùng bấm vào */}
          {showAuthOptions && (
            <div className="pt-3 border-t border-surface-container-high space-y-3 animate-fadeIn">
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface-container rounded-xl border border-surface-container-high">
                <button
                  type="button"
                  onClick={() => setAuthMode("google")}
                  className={`py-2 px-3 rounded-lg font-label-md font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
                    authMode === "google"
                      ? "bg-surface-container-lowest text-primary shadow-xs"
                      : "text-secondary hover:text-on-surface"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMode("email")}
                  className={`py-2 px-3 rounded-lg font-label-md font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
                    authMode === "email"
                      ? "bg-surface-container-lowest text-primary shadow-xs"
                      : "text-secondary hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">mail</span>
                  <span>Email</span>
                </button>
              </div>

              {authMode === "google" && (
                <button
                  type="button"
                  onClick={handleOpenGoogleAuth}
                  className="w-full bg-primary hover:bg-neutral-800 text-on-primary py-2.5 px-4 rounded-xl font-body-sm font-semibold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>Đăng Nhập Với Google</span>
                </button>
              )}

              {authMode === "email" && (
                <form onSubmit={handleEmailLogin} className="space-y-2 pt-1">
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Email của bạn..."
                    className="w-full bg-surface-container-low text-on-surface font-body-sm rounded-xl py-2 px-3 border border-surface-container-high focus:outline-none"
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Mật khẩu (tối thiểu 6 ký tự)..."
                    className="w-full bg-surface-container-low text-on-surface font-body-sm rounded-xl py-2 px-3 border border-surface-container-high focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSigningIn}
                    className="w-full bg-primary text-on-primary py-2 px-3 rounded-xl font-body-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSigningIn ? "Đang xác thực..." : "Đăng Nhập / Tạo Tài Khoản"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* KHỐI 2: THIẾT LẬP BIỆT DANH BÀN NHẬU (MẶC ĐỊNH UỐNG BIA TÂM SỰ)            */}
      {/* ========================================================================= */}
      <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container-high space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-on-surface">
            <span className="material-symbols-outlined text-[18px] text-primary">badge</span>
            <span className="font-label-md font-semibold tracking-tight uppercase">
              Biệt Danh Của Bạn
            </span>
          </div>
          <span className="font-code-inline text-code-inline text-secondary bg-surface-container px-2 py-0.5 rounded">
            Uống bia tâm sự 🍻
          </span>
        </div>

        {/* Biệt danh khi cụng ngụm */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center justify-between text-secondary font-label-md">
            <span>Tên hiển thị trên bàn chơi</span>
            <span className="text-[11px] text-secondary">Tự động cấp hoặc đổi tùy thích</span>
          </label>
          <div className="relative flex items-center">
            <input
              className="w-full bg-surface-container-low text-on-surface font-body-md rounded-lg py-2.5 pl-3 pr-10 focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all border border-surface-container-high font-medium"
              id="player-name-input"
              placeholder="Ví dụ: Hải Đếm Ngụm, Nam Bợm..."
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <button
              className="absolute right-2 text-secondary hover:text-on-surface p-1.5 rounded transition-colors"
              onClick={randomizeName}
              title="Đổi tên ngẫu nhiên"
              type="button"
            >
              <span className="material-symbols-outlined text-[17px]">shuffle</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KHỐI 3: VÀO BÀN CÓ SẴN HOẶC TẠO PHÒNG MỚI                                 */}
      {/* ========================================================================= */}
      <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container-high space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-on-surface">
            <span className="material-symbols-outlined text-[18px] text-secondary">
              meeting_room
            </span>
            <span className="font-label-md font-semibold tracking-tight uppercase">
              Vào Bàn Có Sẵn
            </span>
          </div>
          <span className="font-label-sm text-secondary">Mã 6 ký tự</span>
        </div>

        {/* Ô nhập mã bàn */}
        <div className="flex items-stretch gap-2">
          <div className="relative flex-1">
            <input
              className="w-full h-11 bg-surface-container-low text-on-surface font-code-inline text-[16px] tracking-[0.15em] uppercase font-bold text-center rounded-lg focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all border border-surface-container-high"
              id="room-code-input"
              maxLength={10}
              placeholder="SIP-XXXX"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            />
            <span className="absolute left-2.5 top-3 text-[14px] text-secondary material-symbols-outlined pointer-events-none">
              tag
            </span>
          </div>
          <button
            className="px-5 rounded-lg font-headline-sm text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer shrink-0 bg-primary text-on-primary hover:bg-neutral-800"
            onClick={handleJoin}
            type="button"
          >
            <span>Vào Ngay</span>
            <span className="material-symbols-outlined text-[16px]">login</span>
          </button>
        </div>

        {/* Nút quét QR */}
        <button
          className="w-full bg-surface-container-low hover:bg-surface-container text-on-surface py-2 rounded-lg font-body-sm font-medium flex items-center justify-center gap-2 transition-colors active:scale-[0.99] cursor-pointer border border-surface-container-high"
          onClick={() => setIsQRScannerOpen(true)}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px] text-secondary">
            qr_code_scanner
          </span>
          <span>Quét Mã QR Bàn Nhậu</span>
        </button>
      </div>

      {/* Nút tạo bàn mới (Làm Host) */}
      <div className="flex flex-col gap-2">
        <button
          className="w-full py-3.5 px-4 rounded-xl font-body-md font-semibold flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all cursor-pointer bg-primary text-on-primary hover:bg-neutral-800"
          type="button"
          onClick={handleCreate}
        >
          <span className="material-symbols-outlined text-[18px]">bolt</span>
          <span>Tạo Bàn Mới (Làm Host 👑)</span>
        </button>
        <div className="flex items-center justify-between px-1 text-label-sm text-secondary">
          <span>Host có quyền chọn 20 - 1000 câu (2-3 tiếng)</span>
          <span className="font-code-inline text-secondary bg-surface-container px-1 py-0.5 rounded">
            Tối đa 12 người
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KHỐI 4: PHÒNG NHẬU ĐANG MỞ (DISCOVERY 1-CHẠM THAM GIA)                     */}
      {/* ========================================================================= */}
      <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container-high space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-on-surface">
            <span className="material-symbols-outlined text-[18px] text-amber-600">
              sports_bar
            </span>
            <span className="font-label-md font-semibold tracking-tight uppercase">
              Phòng Nhậu Đang Mở
            </span>
          </div>
          <span className="font-code-inline text-[11px] text-secondary bg-surface-container px-2 py-0.5 rounded">
            {activeRooms.length} bàn đang mở
          </span>
        </div>

        {activeRooms.length === 0 ? (
          <div className="p-3 rounded-lg bg-surface-container-low text-center text-secondary font-body-sm">
            <span className="text-xl block mb-1">🛋️</span>
            <span>Chưa có bàn nào đang mở. Hãy bấm &quot;Tạo Bàn Mới&quot; để mở tiệc đầu tiên!</span>
          </div>
        ) : (
          <div className="space-y-2">
            {activeRooms.map((room) => (
              <div
                key={room.code}
                className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container border border-surface-container-high transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-900 font-bold flex items-center justify-center shrink-0">
                    🍺
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-code-inline font-bold text-on-surface text-sm">
                        {room.code}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-surface-container-highest text-secondary">
                        {room.status === "playing" ? "Đang chơi 🔥" : "Phòng chờ ⏳"}
                      </span>
                    </div>
                    <span className="text-xs text-secondary truncate block">
                      Host: {room.hostName || "Chủ Xị"} • {room.players?.length || 1}/8 người
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playBeerClink();
                    if (!googleUser) {
                      setRoomCode(room.code);
                      triggerToast("🔒 Vui lòng đăng nhập để vào bàn này!");
                      setIsGoogleModalOpen(true);
                      return;
                    }
                    const name = playerName.trim() || googleUser.name;
                    if (onJoinRoom) {
                      onJoinRoom(room.code, name, tolerance, googleUser);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-neutral-800 active:scale-95 transition-transform shrink-0 flex items-center gap-1"
                >
                  <span>Vào Bàn</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* KHỐI 5: BẠN NHẬU ĐANG ONLINE                                              */}
      {/* ========================================================================= */}
      <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container-high space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-on-surface">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-label-md font-semibold tracking-tight uppercase">
              Bạn Nhậu Đang Online
            </span>
          </div>
          <span className="font-code-inline text-[11px] text-secondary bg-surface-container px-2 py-0.5 rounded">
            {onlineUsers.length} người trực tuyến
          </span>
        </div>

        {onlineUsers.length === 0 ? (
          <div className="p-3 rounded-lg bg-surface-container-low text-center text-secondary font-body-sm">
            <span className="text-xl block mb-1">👋</span>
            <span>Các chiến hữu đang chuẩn bị mồi nhậu. Hãy tạo bàn rồi gửi mã mời nhé!</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {onlineUsers.slice(0, 8).map((u) => (
              <div
                key={u.uid}
                className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low border border-surface-container-high overflow-hidden"
              >
                <div className="relative shrink-0">
                  <div className="w-7 h-7 rounded-full bg-surface-container-highest overflow-hidden flex items-center justify-center font-bold text-xs">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      u.name.charAt(0)
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white"></span>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-body-sm text-xs font-semibold text-on-surface truncate block">
                    {u.name}
                  </span>
                  <span className="text-[10px] text-secondary truncate block">
                    {u.currentRoomCode ? `Bàn #${u.currentRoomCode}` : "Đang rảnh 🍻"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* POPUP MODAL: GOOGLE ACCOUNT CHOOSER (MÔ PHỎNG CHỈN CHU OAUTH POPUP)        */}
      {/* ========================================================================= */}
      {isGoogleModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsGoogleModalOpen(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-surface-container-high"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Google Modal */}
            <div className="flex items-center justify-between border-b border-surface-container-high pb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="font-body-md font-bold text-on-surface">
                  Đăng nhập bằng Google
                </span>
              </div>
              <button
                onClick={() => setIsGoogleModalOpen(false)}
                className="w-7 h-7 rounded-full bg-surface-container hover:bg-surface-container-highest flex items-center justify-center text-secondary"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-1">
              <p className="font-body-sm font-semibold text-on-surface">
                Chọn phương thức đăng nhập Google
              </p>
              <p className="font-label-sm text-secondary">
                Ứng dụng sẽ đồng bộ định danh và lưu lịch sử câu hỏi trên bàn nhậu.
              </p>
            </div>

            {/* Nút Đăng nhập Firebase Google Popup Thật */}
            <button
              type="button"
              onClick={handleRealGoogleLogin}
              className="w-full p-3 rounded-xl border-2 border-primary bg-primary text-on-primary hover:bg-neutral-800 flex items-center justify-center gap-3 transition-all shadow-sm group cursor-pointer"
              disabled={isSigningIn}
            >
              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shrink-0 p-0.5">
                <svg className="w-full h-full" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
              </div>
              <span className="font-body-sm font-bold">
                Mở Cửa Sổ Google (Firebase Auth)
              </span>
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform ml-auto">
                open_in_new
              </span>
            </button>

            {/* Trạng thái Firebase */}
            <div className="flex items-center justify-between px-2 py-1 bg-surface-container rounded-lg text-[11px] text-secondary">
              <span className="flex items-center gap-1.5 font-medium">
                <span className={`w-2 h-2 rounded-full ${isFirebaseConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></span>
                <span>Trạng thái Firebase:</span>
              </span>
              <span className="font-code-inline font-semibold text-on-surface">
                {isFirebaseConfigured ? "Đã nạp .env.local" : "Chưa cấu hình .env.local"}
              </span>
            </div>

            {/* Phân cách hoặc tài khoản test nhanh */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-surface-container-high"></div>
              <span className="flex-shrink mx-2 text-[11px] text-secondary uppercase tracking-wider font-semibold">
                Hoặc chọn tài khoản test nhanh
              </span>
              <div className="flex-grow border-t border-surface-container-high"></div>
            </div>

            {/* Danh sách tài khoản test */}
            <div className="space-y-2 pt-0.5">
              <button
                type="button"
                onClick={() => handleSelectGoogleAccount("tnhung106666@gmail.com", "Nguyễn Tuấn Hưng")}
                className="w-full p-2.5 rounded-xl border border-surface-container-high hover:border-primary/40 bg-surface-container-low hover:bg-surface-container flex items-center gap-3 transition-all text-left group cursor-pointer"
                disabled={isSigningIn}
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  H
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-body-sm font-bold text-on-surface truncate">
                    Nguyễn Tuấn Hưng
                  </span>
                  <span className="font-code-inline text-code-inline text-secondary truncate">
                    tnhung106666@gmail.com
                  </span>
                </div>
                <span className="material-symbols-outlined text-secondary text-[18px] group-hover:text-primary transition-colors">
                  login
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectGoogleAccount("sipcraft.guest@gmail.com", "Khách Bàn Nhậu")}
                className="w-full p-2.5 rounded-xl border border-surface-container-high hover:border-primary/40 bg-surface-container-low hover:bg-surface-container flex items-center gap-3 transition-all text-left group cursor-pointer"
                disabled={isSigningIn}
              >
                <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  S
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-body-sm font-bold text-on-surface truncate">
                    SipCraft Bạn Nhậu
                  </span>
                  <span className="font-code-inline text-code-inline text-secondary truncate">
                    sipcraft.guest@gmail.com
                  </span>
                </div>
                <span className="material-symbols-outlined text-secondary text-[18px] group-hover:text-primary transition-colors">
                  login
                </span>
              </button>
            </div>

            {isSigningIn && (
              <div className="flex items-center justify-center gap-2 py-2 text-primary font-body-sm font-medium">
                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                <span>Đang kết nối tài khoản Google...</span>
              </div>
            )}

            <div className="text-center pt-2 text-secondary text-[11px] leading-relaxed">
              Bằng việc đăng nhập, bạn đồng ý với Quy chế Bàn Nhậu &amp; Cam kết vui chơi có trách nhiệm 🍻
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP MODAL: QR CAMERA SCANNER                                            */}
      {/* ========================================================================= */}
      {isQRScannerOpen && (
        <div
          className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsQRScannerOpen(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-center border border-surface-container-high"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-surface-container-high pb-3">
              <span className="font-headline-sm text-base font-bold text-on-surface">
                Quét Mã QR Bàn Nhậu
              </span>
              <button
                onClick={() => setIsQRScannerOpen(false)}
                className="w-7 h-7 rounded-full bg-surface-container hover:bg-surface-container-highest flex items-center justify-center text-secondary"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Khung camera mô phỏng */}
            <div className="relative w-full h-56 bg-neutral-900 rounded-xl overflow-hidden flex flex-col items-center justify-center text-white">
              <div className="w-40 h-40 border-2 border-emerald-400 rounded-xl relative flex items-center justify-center animate-pulse">
                <span className="material-symbols-outlined text-4xl text-emerald-400">
                  qr_code_scanner
                </span>
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white"></div>
              </div>
              <span className="font-label-sm text-neutral-300 mt-3">
                Hướng camera vào mã QR tại bàn của bạn
              </span>
            </div>

            <button
              onClick={async () => {
                try {
                  if (navigator.clipboard) {
                    const text = await navigator.clipboard.readText();
                    const clean = text.trim().toUpperCase();
                    if (clean) {
                      setRoomCode(clean);
                      setIsQRScannerOpen(false);
                      triggerToast(`📋 Đã dán mã phòng: ${clean}!`);
                      return;
                    }
                  }
                } catch {}
                setIsQRScannerOpen(false);
              }}
              className="w-full py-2.5 rounded-lg bg-primary text-on-primary font-body-sm font-semibold transition-colors"
              type="button"
            >
              Dán mã phòng từ Clipboard
            </button>
          </div>
        </div>
      )}

      {/* Toast thông báo */}
      <div
        className={`fixed bottom-20 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-4 py-2.5 rounded-lg shadow-xl font-body-sm flex items-center gap-2 transition-all duration-300 z-50 ${
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
