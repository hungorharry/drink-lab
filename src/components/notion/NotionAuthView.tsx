"use client";

import React, { useState } from "react";
import { sounds } from "@/utils/soundEffects";
import { loginWithGoogle, loginOrRegisterWithEmail, logoutFirebase, isFirebaseConfigured } from "@/lib/firebase";

export interface GoogleUser {
  name: string;
  email: string;
  avatar: string;
  uid?: string;
}

interface NotionAuthViewProps {
  initialRoomCode?: string;
  isInvited?: boolean;
  onJoinRoom?: (roomCode: string, playerName: string, tolerance: string, user: GoogleUser) => void;
  onCreateRoom?: (user: GoogleUser) => void;
}

export const NotionAuthView: React.FC<NotionAuthViewProps> = ({
  initialRoomCode = "ALCH88",
  isInvited = false,
  onJoinRoom,
  onCreateRoom,
}) => {
  // Mặc định chưa đăng nhập để hiển thị giao diện yêu cầu đăng nhập rõ ràng, chỉn chu
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState<boolean>(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  // Phương thức đăng nhập: Google hoặc Email
  const [authMode, setAuthMode] = useState<"google" | "email">("google");
  const [emailInput, setEmailInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");

  const [playerName, setPlayerName] = useState<string>("Hải Đếm Ngụm");
  const [tolerance, setTolerance] = useState<string>("toi-ben");
  const [roomCode, setRoomCode] = useState<string>(initialRoomCode);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [showToast, setShowToast] = useState<boolean>(false);

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

  const handleJoin = () => {
    if (!googleUser) {
      triggerToast("🔒 Bắt buộc đăng nhập Google trước khi vào bàn nhậu!");
      setIsGoogleModalOpen(true);
      return;
    }
    sounds.playBeerClink();
    const code = roomCode.trim() || "ALCH88";
    const name = playerName.trim() || googleUser.name;
    triggerToast(`🎉 Đang kết nối bàn [${code}] với danh tính "${name}"...`);
    if (onJoinRoom) {
      onJoinRoom(code, name, tolerance, googleUser);
    }
  };

  const handleCreate = () => {
    if (!googleUser) {
      triggerToast("🔒 Bắt buộc đăng nhập Google để làm Host tạo phòng!");
      setIsGoogleModalOpen(true);
      return;
    }
    sounds.playBeerClink();
    triggerToast("✨ Đang khởi tạo phòng mới cùng tài khoản Google...");
    if (onCreateRoom) {
      onCreateRoom(googleUser);
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
              Đăng Nhập Để Vào Chơi
            </h1>
          </div>
        </div>
        <p className="font-body-sm text-body-sm text-secondary pt-0.5">
          Đồng bộ thời gian thực đa thiết bị • Lưu vết lịch sử từng ngụm bia trong 2-3 tiếng.
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
      {/* KHỐI 1: YÊU CẦU ĐĂNG NHẬP GOOGLE BẮT BUỘC (AUTH GATE)                      */}
      {/* ========================================================================= */}
      {!googleUser ? (
        <div className="bg-surface-container-lowest border-2 border-primary/20 rounded-2xl p-4 shadow-md space-y-3 relative overflow-hidden">
          {/* Badge trạng thái */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-label-sm font-semibold border border-amber-300">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span>Yêu cầu đăng nhập</span>
            </span>
            <span className="font-code-inline text-[11px] text-secondary font-medium">
              Google OAuth 2.0
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="font-headline-sm text-base font-bold text-on-surface">
              Đăng Nhập Tài Khoản Google
            </h2>
            <p className="font-body-sm text-body-sm text-secondary leading-snug">
              Để bảo vệ danh tính bàn nhậu, đếm ngụm chính xác và ghi nhớ lịch sử bốc thẻ của từng người, bạn cần đăng nhập tài khoản Google để tiếp tục.
            </p>
          </div>

          {/* Lợi ích khi đăng nhập trong Notion Callout style */}
          <div className="bg-surface-container-low rounded-xl p-3 space-y-2 border border-surface-container-high">
            <div className="flex items-start gap-2 text-on-surface-variant font-label-sm">
              <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0 mt-0.5">
                verified_user
              </span>
              <span>Lưu lại toàn bộ lịch sử câu hỏi &amp; ngụm bia phạt trong 2-3 tiếng.</span>
            </div>
            <div className="flex items-start gap-2 text-on-surface-variant font-label-sm">
              <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">
                devices
              </span>
              <span>Tự động nhận diện thiết bị khi quét mã QR vào bàn nhậu.</span>
            </div>
            <div className="flex items-start gap-2 text-on-surface-variant font-label-sm">
              <span className="material-symbols-outlined text-[16px] text-amber-600 shrink-0 mt-0.5">
                military_tech
              </span>
              <span>Vinh danh trên Bảng Phong Thần cuối ván nhậu.</span>
            </div>
          </div>

          {/* Chuyển đổi phương thức: Google vs Email */}
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
              <span>Google 1-Chạm</span>
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
              <span>Đăng nhập Email</span>
            </button>
          </div>

          {/* GIAO DIỆN 1: GOOGLE SIGN-IN */}
          {authMode === "google" && (
            <button
              type="button"
              onClick={handleOpenGoogleAuth}
              className="w-full bg-primary hover:bg-neutral-800 text-on-primary py-3 px-4 rounded-xl font-body-md font-semibold flex items-center justify-center gap-3 shadow-md active:scale-[0.98] transition-all cursor-pointer group"
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
              <span>Tiếp Tục Với Google</span>
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform ml-auto">
                arrow_forward
              </span>
            </button>
          )}

          {/* GIAO DIỆN 2: EMAIL / PASSWORD SIGN-IN */}
          {authMode === "email" && (
            <form onSubmit={handleEmailLogin} className="space-y-2.5 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-secondary uppercase tracking-wider block">
                  Địa chỉ Email
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-secondary text-[18px]">
                    alternate_email
                  </span>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="ban.nhau@gmail.com"
                    className="w-full bg-surface-container-low text-on-surface font-body-sm rounded-xl py-2.5 pl-10 pr-3 border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-secondary uppercase tracking-wider block">
                  Mật khẩu (tối thiểu 6 ký tự)
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-secondary text-[18px]">
                    key
                  </span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-surface-container-low text-on-surface font-body-sm rounded-xl py-2.5 pl-10 pr-3 border border-surface-container-high focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full bg-primary hover:bg-neutral-800 text-on-primary py-2.5 px-4 rounded-xl font-body-md font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer mt-1"
              >
                {isSigningIn ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">login</span>
                    <span>Đăng Nhập / Tạo Tài Khoản</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-secondary leading-snug">
                Hệ thống tự động đăng nhập nếu đã có tài khoản, hoặc tự tạo mới nếu là lần đầu nhập tiệc!
              </p>
            </form>
          )}
        </div>
      ) : (
        /* KHI ĐÃ ĐĂNG NHẬP GOOGLE THÀNH CÔNG */
        <div className="bg-surface-container-lowest border border-emerald-500/40 rounded-2xl p-4 shadow-sm space-y-3 bg-gradient-to-br from-surface-container-lowest to-surface-container-low">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-label-sm font-semibold">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              <span>Đã xác thực Google</span>
            </span>
            <button
              onClick={handleGoogleSignOut}
              className="text-secondary hover:text-error font-label-sm transition-colors"
              type="button"
            >
              Đổi tài khoản
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center font-headline-sm font-bold shadow-sm shrink-0">
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
      )}

      {/* ========================================================================= */}
      {/* KHỐI 2: THIẾT LẬP DANH TÍNH BÀN NHẬU (TÊN GỌI & TỬU LƯỢNG NGỤM)            */}
      {/* ========================================================================= */}
      <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container-high space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-on-surface">
            <span className="material-symbols-outlined text-[18px] text-primary">tune</span>
            <span className="font-label-md font-semibold tracking-tight uppercase">
              Thiết Lập Trên Bàn Nhậu
            </span>
          </div>
          <span className="font-code-inline text-code-inline text-secondary bg-surface-container px-2 py-0.5 rounded">
            Tính theo ngụm
          </span>
        </div>

        {/* Biệt danh khi cụng ngụm */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center justify-between text-secondary font-label-md">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">badge</span>
              <span>Biệt danh khi cụng ngụm</span>
            </span>
            <span className="text-[11px] text-secondary">Hiện trên bàn chơi</span>
          </label>
          <div className="relative flex items-center">
            <input
              className="w-full bg-surface-container-low text-on-surface font-body-md rounded-lg py-2.5 pl-3 pr-10 focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all border border-surface-container-high"
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

        {/* Tửu lượng ngụm */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-1.5 text-secondary font-label-md">
            <span className="material-symbols-outlined text-[15px]">local_bar</span>
            <span>Tửu lượng ngụm của bạn</span>
          </label>
          <div className="grid grid-cols-1 gap-2" id="tolerance-pills">
            <label
              className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors border ${
                tolerance === "cam-chung"
                  ? "bg-surface-container border-primary/40 text-on-surface font-medium"
                  : "bg-surface-container-low border-transparent hover:bg-surface-container text-secondary"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  className="accent-primary w-4 h-4 cursor-pointer"
                  name="tolerance"
                  type="radio"
                  value="cam-chung"
                  checked={tolerance === "cam-chung"}
                  onChange={() => setTolerance("cam-chung")}
                />
                <span className="font-body-sm text-on-surface">Uống cầm chừng</span>
              </div>
              <span className="font-code-inline text-code-inline">🍺 1-2 ngụm/lượt</span>
            </label>

            <label
              className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors border ${
                tolerance === "toi-ben"
                  ? "bg-surface-container border-primary/40 text-on-surface font-medium"
                  : "bg-surface-container-low border-transparent hover:bg-surface-container text-secondary"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  className="accent-primary w-4 h-4 cursor-pointer"
                  name="tolerance"
                  type="radio"
                  value="toi-ben"
                  checked={tolerance === "toi-ben"}
                  onChange={() => setTolerance("toi-ben")}
                />
                <span className="font-body-sm text-on-surface font-medium">Chiến tới bến</span>
              </div>
              <span className="font-code-inline text-code-inline">🍻 Không say không về</span>
            </label>

            <label
              className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors border ${
                tolerance === "tra-sua"
                  ? "bg-surface-container border-primary/40 text-on-surface font-medium"
                  : "bg-surface-container-low border-transparent hover:bg-surface-container text-secondary"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  className="accent-primary w-4 h-4 cursor-pointer"
                  name="tolerance"
                  type="radio"
                  value="tra-sua"
                  checked={tolerance === "tra-sua"}
                  onChange={() => setTolerance("tra-sua")}
                />
                <span className="font-body-sm text-on-surface">Nạn nhân trà sữa</span>
              </div>
              <span className="font-code-inline text-code-inline">🧋 Uống nước ngọt</span>
            </label>
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
            className={`px-5 rounded-lg font-headline-sm text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer shrink-0 ${
              googleUser
                ? "bg-primary text-on-primary hover:bg-neutral-800"
                : "bg-surface-container-high text-secondary hover:bg-surface-container-highest"
            }`}
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
          className={`w-full py-3 px-4 rounded-xl font-body-md font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all cursor-pointer ${
            googleUser
              ? "bg-primary text-on-primary hover:bg-neutral-800"
              : "bg-surface-container-high text-secondary hover:bg-surface-container-highest"
          }`}
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

      {/* Bàn đang mở gần bạn */}
      <div className="bg-surface-container-low rounded-xl p-3 shadow-sm border border-surface-container-high">
        <div className="flex items-center justify-between mb-2">
          <span className="font-label-sm text-secondary font-semibold uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
            <span>Bàn đang chơi gần bạn</span>
          </span>
          <span className="font-label-sm text-secondary">2 phòng mở</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <div
            className="flex items-center justify-between p-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high transition-colors cursor-pointer border border-surface-container-high/60"
            onClick={() => quickFillRoom("BKDRNK")}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-code-inline font-bold bg-surface-container px-1.5 py-0.5 rounded text-xs">
                # BKDRNK
              </span>
              <span className="font-body-sm text-on-surface truncate font-medium">
                Bách Khoa Không Say Không Về (100 câu)
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0 text-secondary font-label-sm">
              <span className="material-symbols-outlined text-[14px]">group</span>
              <span>6/8</span>
            </div>
          </div>

          <div
            className="flex items-center justify-between p-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high transition-colors cursor-pointer border border-surface-container-high/60"
            onClick={() => quickFillRoom("FTU999")}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-code-inline font-bold bg-surface-container px-1.5 py-0.5 rounded text-xs">
                # FTU999
              </span>
              <span className="font-body-sm text-on-surface truncate font-medium">
                K59 Hội Quán Phố Cổ (200 câu)
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0 text-secondary font-label-sm">
              <span className="material-symbols-outlined text-[14px]">group</span>
              <span>4/6</span>
            </div>
          </div>
        </div>
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
              onClick={() => {
                setRoomCode("ALCH88");
                setIsQRScannerOpen(false);
                triggerToast("📷 Đã nhận diện mã bàn: ALCH88!");
              }}
              className="w-full py-2.5 rounded-lg bg-primary text-on-primary font-body-sm font-semibold transition-colors"
              type="button"
            >
              Mô phỏng quét trúng bàn ALCH88
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
