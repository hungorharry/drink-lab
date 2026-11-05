"use client";

import React from "react";
import { X, Code, Database, Radio, Check } from "lucide-react";

interface FirebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseModal: React.FC<FirebaseModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#181817] border border-[#383734] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#2e2d2a] flex items-center justify-between bg-[#1f1e1c]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-black flex items-center justify-center font-bold font-cinzel">
              ✦
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Code Firebase Firestore Realtime (Đúng 100% Kịch Bản Bàn Nhậu)
              </h3>
              <p className="text-xs text-zinc-400">
                Sử dụng onSnapshot() và updateDoc() đồng bộ tức thì ~0.1s
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto font-mono text-xs text-zinc-300 space-y-4">
          
          <div>
            <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1 font-sans text-sm">
              <Database className="w-4 h-4" />
              <span>1. Schema tài liệu Firestore (rooms/&#123;roomId&#125;):</span>
            </div>
            <pre className="bg-[#10100f] p-3 rounded-xl border border-[#2a2926] text-amber-200 overflow-x-auto">
{`{
  "roomCode": "ALCH88",
  "currentTurnIndex": 0,           // 0: Nam, 1: Mai Anh, 2: Hải, 3: Trang
  "isFlipping": true,              // Trạng thái lá bài đang lật mở hay úp
  "currentCard": {
    "id": "SIP-018",
    "type": "DARE",
    "title": "Đọc Tin Nhắn Bất Ngờ!",
    "description": "Mở Messenger hoặc Zalo đọc 3 tin nhắn gần nhất với crush!",
    "penalty": "Uống cạn 1 ly bia (100% dung tích) ngay tại chỗ."
  },
  "players": [
    { "uid": "user_nam", "name": "Hoàng Nam", "initial": "HN", "isHost": true },
    { "uid": "user_maianh", "name": "Mai Anh", "initial": "MA", "isHost": false },
    { "uid": "user_hai", "name": "Tuấn Hải", "initial": "TH", "isHost": false },
    { "uid": "user_trang", "name": "Minh Trang", "initial": "MT", "isHost": false }
  ],
  "updatedAt": 1720000000000
}`}
            </pre>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-sky-400 font-bold mb-1 font-sans text-sm">
              <Radio className="w-4 h-4" />
              <span>2. Lắng nghe Đồng Bộ Tức Thì (`onSnapshot`):</span>
            </div>
            <pre className="bg-[#10100f] p-3 rounded-xl border border-[#2a2926] text-sky-200 overflow-x-auto">
{`import { doc, onSnapshot, updateDoc } from "firebase/firestore";

// TẤT CẢ các máy người chơi cùng lắng nghe phòng này:
const roomRef = doc(db, "rooms", roomId);

onSnapshot(roomRef, (snapshot) => {
  const data = snapshot.data();
  if (!data) return;

  const currentTurnPlayer = data.players[data.currentTurnIndex];
  const isMyTurn = (myAuthUid === currentTurnPlayer.uid);

  // 1. Cả bàn cùng thấy dòng thông báo lượt:
  updateTurnBanner("Đang là lượt của " + currentTurnPlayer.name);

  // 2. Kiểm soát quyền bấm:
  if (isMyTurn && !data.isFlipping) {
    unlockDrawButton(); // Máy tới lượt: Bật nút rút bài
  } else {
    lockDrawButton();   // Máy người khác: Khóa nút, chuyển sang chế độ Khán giả
  }

  // 3. Đồng bộ hiệu ứng lật bài 180 độ & Hạt sáng khi có người rút:
  if (data.isFlipping && !localCardState.isFlipped) {
    triggerCelestialParticles(); // Bung hạt sáng phép thuật
    rotateCard180Degrees();       // Xoay bài 180 độ
    renderCardContent(data.currentCard); // Hiện đúng câu hỏi
  } else if (!data.isFlipping && localCardState.isFlipped) {
    rotateCardBackToDeck();      // Cả bàn cùng úp bài khi qua lượt
  }
});`}
            </pre>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1 font-sans text-sm">
              <Code className="w-4 h-4" />
              <span>3. Khi Người Tới Lượt Bấm "Rút Bài":</span>
            </div>
            <pre className="bg-[#10100f] p-3 rounded-xl border border-[#2a2926] text-emerald-200 overflow-x-auto">
{`async function onDrawCardClicked() {
  if (!isMyTurn) return; // Bảo mật client

  const nextCard = getRandomCardFromDeck();

  // Bắn tín hiệu lên Firebase trong 0.1s:
  await updateDoc(roomRef, {
    isFlipping: true,
    currentCard: nextCard,
    updatedAt: Date.now()
  });
}`}
            </pre>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1 font-sans text-sm">
              <Check className="w-4 h-4" />
              <span>4. Khi Bấm "Đã Xong • Qua Lượt":</span>
            </div>
            <pre className="bg-[#10100f] p-3 rounded-xl border border-[#2a2926] text-amber-200 overflow-x-auto">
{`async function onNextTurnClicked() {
  if (!isMyTurn) return;

  const nextIndex = (currentData.currentTurnIndex + 1) % currentData.players.length;

  await updateDoc(roomRef, {
    isFlipping: false,
    currentTurnIndex: nextIndex,
    updatedAt: Date.now()
  });
}`}
            </pre>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#2e2d2a] bg-[#1f1e1c] flex items-center justify-end">
          <button
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-1.5 rounded-lg font-bold text-xs font-sans transition-colors"
          >
            Đã Hiểu, Quay Lại Test
          </button>
        </div>

      </div>
    </div>
  );
};
