/**
 * ============================================================================
 * CELESTIAL CHEERS - FIREBASE FIRESTORE REAL-TIME MULTIPLAYER SYNC ADAPTER
 * ============================================================================
 * 
 * Hướng dẫn tích hợp chính xác 100% kịch bản bàn nhậu thời gian thực.
 * Sử dụng Firebase Web SDK v9+ (Modular SDK: import { ... } from "firebase/firestore")
 */

import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";

// 1. Cấu hình Firebase Project của bạn
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * 2. LẮNG NGHE ĐỒNG BỘ THỜI GIAN THỰC (TẤT CẢ CÁC MÁY TRONG BÀN CÙNG CHẠY)
 * 
 * @param {string} roomId - ID phòng chơi (ví dụ: "ALCH88")
 * @param {string} currentUserId - ID người dùng hiện tại (UID của máy này)
 * @param {object} callbacks - Bộ hàm kích hoạt hiệu ứng giao diện
 */
export function listenToRoomRealtime(roomId, currentUserId, callbacks) {
  const roomRef = doc(db, "rooms", roomId);

  let lastFlippedState = false;

  const unsubscribe = onSnapshot(roomRef, (snapshot) => {
    if (!snapshot.exists()) {
      console.warn("Phòng chơi không tồn tại!");
      return;
    }

    const data = snapshot.data();
    const currentTurnPlayer = data.players[data.currentTurnIndex];
    const isMyTurn = (currentUserId === currentTurnPlayer.uid);

    // KỊCH BẢN 1: Tất cả màn hình cùng hiện chung thông báo lượt
    callbacks.onTurnChange({
      playerIndex: data.currentTurnIndex,
      player: currentTurnPlayer,
      isMyTurn: isMyTurn,
      round: data.round || 1
    });

    // KỊCH BẢN 2: Khóa/Mở nút rút bài
    if (isMyTurn && !data.isFlipping) {
      callbacks.enableDrawButton(); // Người tới lượt -> Mở khóa nút
    } else {
      callbacks.lockDrawButton(currentTurnPlayer.name); // Người khác -> Khóa mờ
    }

    // KỊCH BẢN 3: Đồng bộ lật bài 180° + Bung hạt sáng phép thuật
    if (data.isFlipping && !lastFlippedState) {
      // Có người vừa rút bài -> Cả bàn đồng loạt lật bài 180 độ
      callbacks.onCardFlip180({
        card: data.currentCard,
        drawnBy: currentTurnPlayer.name
      });
    } else if (!data.isFlipping && lastFlippedState) {
      // Qua lượt -> Cả bàn đồng loạt úp bài lại
      callbacks.onCardFlipBack();
    }

    lastFlippedState = data.isFlipping;
  }, (error) => {
    console.error("Lỗi đồng bộ Firebase Firestore:", error);
  });

  return unsubscribe;
}

/**
 * 3. HÀNH ĐỘNG RÚT BÀI (Chỉ máy của người giữ lượt mới gửi)
 * Bắn tín hiệu lên Firebase trong tích tắc (~0.1s)
 */
export async function drawCardAction(roomId, drawnCard) {
  const roomRef = doc(db, "rooms", roomId);
  
  await updateDoc(roomRef, {
    isFlipping: true,
    currentCard: drawnCard,
    drawnAt: serverTimestamp()
  });
}

/**
 * 4. HÀNH ĐỘNG QUA LƯỢT (Chuyển sang người tiếp theo)
 * Màn hình cả bàn sẽ đồng loạt úp bài lại và đổi sang người mới
 */
export async function nextTurnAction(roomId, currentTurnIndex, totalPlayers) {
  const roomRef = doc(db, "rooms", roomId);
  const nextIndex = (currentTurnIndex + 1) % totalPlayers;

  await updateDoc(roomRef, {
    isFlipping: false,
    currentTurnIndex: nextIndex,
    updatedAt: serverTimestamp()
  });
}
