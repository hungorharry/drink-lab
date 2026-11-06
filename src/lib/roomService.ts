import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  collection,
  Unsubscribe,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { DrinkingCard, Player, CardHistoryItem } from "@/types/game";
import rawQuestions from "@/data/questions.json";

export interface RoomState {
  code: string;
  hostEmail: string;
  hostName: string;
  status: "lobby" | "playing" | "summary";
  totalCards: number;
  deck: DrinkingCard[];
  currentCardIndex: number;
  isFlipped: boolean;
  currentTurnIdx: number;
  players: Player[];
  beerConsumed: number;
  history: CardHistoryItem[];
  reactions: { id: number; emoji: string; left: number; timestamp: number }[];
  votes?: Record<string, string>;
  voteStartedAt?: number | null;
  designatedPlayer?: {
    playerName: string;
    chosenBy: string;
    timestamp: number;
    direction?: "left" | "right";
  } | null;
  endGameRequest?: {
    requesterName: string;
    requestedAt: number;
    approvals: string[];
  } | null;
  updatedAt: number;
}

// Map questions
const ALL_CARDS: DrinkingCard[] = (rawQuestions as any[]).map((q: any) => ({
  id: `SIP-${String(q.id).padStart(4, "0")}`,
  type: q.type,
  typeLabel: q.typeLabel,
  title: q.title,
  description: q.content,
  penalty: q.penalty,
  difficulty: `Độ khó: ${q.difficulty}/5`,
  badgeBg: q.badgeBg || "bg-primary text-on-primary",
}));

// Fisher-Yates unbiased shuffle
export function getShuffledDeck(count: number): DrinkingCard[] {
  const pool = [...ALL_CARDS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

// Room code generator
export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SIP-${randomPart}`;
}

// In-memory fallback if offline
const localFallbackRooms = new Map<string, RoomState>();

/**
 * Creates a new room in Cloud Firestore
 */
export async function createRoom(
  user: { name: string; email: string; avatar?: string; uid?: string },
  totalCards: number = 100
): Promise<{ roomCode: string; room: RoomState }> {
  const roomCode = generateRoomCode();
  const deck = getShuffledDeck(totalCards);

  const initialRoom: RoomState = {
    code: roomCode,
    hostEmail: user.email || "",
    hostName: user.name || "Chủ Xị",
    status: "lobby",
    totalCards,
    deck,
    currentCardIndex: 0,
    isFlipped: false,
    currentTurnIdx: 0,
    players: [
      {
        id: 0,
        uid: user.uid || `user_${Date.now()}`,
        name: user.name || "Chủ Xị",
        initial: (user.name || "CX").substring(0, 2).toUpperCase(),
        isHost: true,
        color: "bg-amber-600",
        email: user.email,
        tolerance: "toi-ben",
        drinksCount: 0,
      },
    ],
    beerConsumed: 0,
    history: [],
    reactions: [],
    updatedAt: Date.now(),
  };

  localFallbackRooms.set(roomCode, initialRoom);

  if (isFirebaseConfigured && db) {
    try {
      const roomRef = doc(db, "rooms", roomCode);
      await setDoc(roomRef, initialRoom);
    } catch (err) {
      console.warn("Firestore write error, falling back to local memory:", err);
    }
  }

  return { roomCode, room: initialRoom };
}

/**
 * Joins an existing room in Cloud Firestore
 */
export async function joinRoom(
  roomCode: string,
  playerName: string,
  tolerance: string = "toi-ben",
  user?: { name: string; email: string; avatar?: string; uid?: string }
): Promise<{ success: boolean; room?: RoomState; error?: string }> {
  const cleanCode = roomCode.toUpperCase().trim();

  // Try Firestore first
  if (isFirebaseConfigured && db) {
    try {
      const roomRef = doc(db, "rooms", cleanCode);
      const snap = await getDoc(roomRef);
      if (snap.exists()) {
        const room = snap.data() as RoomState;
        const existingIdx = room.players.findIndex(
          (p) =>
            (user?.email && p.email === user.email) ||
            p.name.toLowerCase() === playerName.toLowerCase()
        );

        const colors = [
          "bg-amber-600",
          "bg-sky-600",
          "bg-emerald-600",
          "bg-purple-600",
          "bg-rose-600",
          "bg-indigo-600",
        ];

        let updatedPlayers = [...room.players];
        if (existingIdx >= 0) {
          updatedPlayers[existingIdx] = {
            ...updatedPlayers[existingIdx],
            name: playerName,
            tolerance,
          };
        } else {
          updatedPlayers.push({
            id: updatedPlayers.length,
            uid: user?.uid || `user_${Date.now()}`,
            name: playerName,
            initial: playerName.substring(0, 2).toUpperCase(),
            isHost: false,
            color: colors[updatedPlayers.length % colors.length],
            email: user?.email,
            tolerance,
            drinksCount: 0,
          });
        }

        await updateDoc(roomRef, {
          players: updatedPlayers,
          updatedAt: Date.now(),
        });

        const updatedRoom = { ...room, players: updatedPlayers, updatedAt: Date.now() };
        localFallbackRooms.set(cleanCode, updatedRoom);
        return { success: true, room: updatedRoom };
      }
    } catch (e) {
      console.warn("Firestore join error, checking fallback:", e);
    }
  }

  // Local fallback
  const room = localFallbackRooms.get(cleanCode);
  if (!room) {
    return { success: false, error: "Không tìm thấy phòng chơi!" };
  }

  const existingIdx = room.players.findIndex(
    (p) => p.name.toLowerCase() === playerName.toLowerCase()
  );

  const colors = [
    "bg-amber-600",
    "bg-sky-600",
    "bg-emerald-600",
    "bg-purple-600",
    "bg-rose-600",
  ];

  if (existingIdx >= 0) {
    room.players[existingIdx].name = playerName;
    room.players[existingIdx].tolerance = tolerance;
  } else {
    room.players.push({
      id: room.players.length,
      uid: user?.uid || `user_${Date.now()}`,
      name: playerName,
      initial: playerName.substring(0, 2).toUpperCase(),
      isHost: false,
      color: colors[room.players.length % colors.length],
      email: user?.email,
      tolerance,
      drinksCount: 0,
    });
  }
  room.updatedAt = Date.now();
  return { success: true, room };
}

/**
 * Subscribes to real-time room updates via Firestore onSnapshot
 */
export function subscribeToRoom(
  roomCode: string,
  onUpdate: (room: RoomState) => void
): Unsubscribe {
  const cleanCode = roomCode.toUpperCase().trim();

  // If Firebase configured, listen directly in real-time!
  if (isFirebaseConfigured && db) {
    try {
      const roomRef = doc(db, "rooms", cleanCode);
      const unsubscribe = onSnapshot(
        roomRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as RoomState;
            localFallbackRooms.set(cleanCode, data);
            onUpdate(data);
          }
        },
        (err) => {
          console.warn("Firestore snapshot listener error:", err);
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn("Firestore subscribe exception:", e);
    }
  }

  // Local fallback polling
  const interval = setInterval(() => {
    const r = localFallbackRooms.get(cleanCode);
    if (r) onUpdate(r);
  }, 2000);

  return () => clearInterval(interval);
}

/**
 * Updates room state in Firestore
 */
export async function updateRoom(
  roomCode: string,
  partialData: Partial<RoomState>
): Promise<void> {
  const cleanCode = roomCode.toUpperCase().trim();

  // Update local
  const current = localFallbackRooms.get(cleanCode);
  if (current) {
    Object.assign(current, partialData, { updatedAt: Date.now() });
  }

  if (isFirebaseConfigured && db) {
    try {
      const roomRef = doc(db, "rooms", cleanCode);
      await updateDoc(roomRef, {
        ...partialData,
        updatedAt: Date.now(),
      });
    } catch (e) {
      console.warn("Firestore updateDoc error:", e);
    }
  }
}


export interface OnlineUser {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  lastActive: number;
  currentRoomCode?: string | null;
  incomingInvite?: {
    roomCode: string;
    fromName: string;
    fromAvatar?: string;
    timestamp: number;
  } | null;
}

/**
 * Chuẩn hóa UID đồng bộ giữa Google Auth UID và Email fallback
 */
export function getCanonicalUid(user?: { uid?: string; email?: string } | null): string {
  if (!user) return "";
  if (user.uid && user.uid.trim()) return user.uid.trim();
  if (user.email && user.email.trim()) {
    return user.email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");
  }
  return "";
}

/**
 * Updates current user's online presence in Firestore
 */
export async function updatePresence(
  user: { uid?: string; name: string; email: string; avatar?: string },
  currentRoomCode?: string | null
): Promise<void> {
  const uid = getCanonicalUid(user);
  if (!isFirebaseConfigured || !db || !uid) return;
  try {
    const userRef = doc(db, "online_users", uid);
    await setDoc(
      userRef,
      {
        uid: uid,
        name: user.name || "Bạn Nhậu",
        email: user.email || "",
        avatar: user.avatar || "",
        lastActive: Date.now(),
        currentRoomCode: currentRoomCode || null,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Presence update error:", err);
  }
}

/**
 * Sends a real-time invitation to an online user
 */
export async function sendRoomInvite(
  targetUid: string,
  invite: { roomCode: string; fromName: string; fromAvatar?: string }
): Promise<void> {
  const cleanUid = (targetUid || "").trim();
  if (!isFirebaseConfigured || !db || !cleanUid) return;
  try {
    const userRef = doc(db, "online_users", cleanUid);
    await setDoc(
      userRef,
      {
        uid: cleanUid,
        incomingInvite: {
          roomCode: invite.roomCode || "",
          fromName: invite.fromName || "Bạn Nhậu",
          fromAvatar: invite.fromAvatar || "",
          timestamp: Date.now(),
        },
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Send room invite error:", err);
  }
}

/**
 * Clears an incoming invitation for the current user
 */
export async function clearRoomInvite(myUid: string): Promise<void> {
  const cleanUid = (myUid || "").trim();
  if (!isFirebaseConfigured || !db || !cleanUid) return;
  try {
    const userRef = doc(db, "online_users", cleanUid);
    await setDoc(
      userRef,
      {
        uid: cleanUid,
        incomingInvite: null,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Clear room invite error:", err);
  }
}

/**
 * Subscribes to changes on the current user's document (for listening to real-time incoming invites)
 */
export function subscribeToUserDoc(
  uid: string,
  callback: (user: OnlineUser | null) => void
): Unsubscribe {
  if (!isFirebaseConfigured || !db || !uid) {
    return () => {};
  }
  try {
    const userRef = doc(db, "online_users", uid);
    return onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          callback(snap.data() as OnlineUser);
        } else {
          callback(null);
        }
      },
      (err) => {
        console.warn("User doc listener error:", err);
      }
    );
  } catch (e) {
    console.warn("User doc subscription error:", e);
    return () => {};
  }
}

/**
 * Listens to active users currently online in DrinkLab
 */
export function subscribeToOnlineUsers(
  callback: (users: OnlineUser[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured || !db) {
    callback([]);
    return () => {};
  }

  try {
    const usersCol = collection(db, "online_users");
    const unsubscribe = onSnapshot(
      usersCol,
      (snap) => {
        const now = Date.now();
        const activeUsers: OnlineUser[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as OnlineUser;
          // Người dùng online trong vòng 10 phút
          if (data && data.lastActive && now - data.lastActive < 10 * 60 * 1000) {
            activeUsers.push(data);
          }
        });
        callback(activeUsers);
      },
      (err) => {
        console.warn("Online users snapshot error:", err);
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn("Subscribe online users error:", e);
    return () => {};
  }
}

/**
 * Listens to all active rooms in DrinkLab (so players can discover and join).
 * Tự động xóa các phòng không ai kích hoạt hoặc không hoạt động quá 5 phút.
 */
export function subscribeToActiveRooms(
  callback: (rooms: RoomState[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured || !db) {
    callback([]);
    return () => {};
  }

  try {
    const roomsCol = collection(db, "rooms");
    const unsubscribe = onSnapshot(
      roomsCol,
      (snap) => {
        const now = Date.now();
        const activeList: RoomState[] = [];
        const FIVE_MINUTES_MS = 5 * 60 * 1000;

        snap.forEach((docSnap) => {
          const data = docSnap.data() as RoomState;
          if (data && data.code) {
            const updatedAt = data.updatedAt || 0;
            const isExpired = now - updatedAt > FIVE_MINUTES_MS;

            if (isExpired) {
              // Phòng không kích hoạt chơi hoặc không ai tương tác trong 5 phút -> Tự động xóa dọn dẹp Firestore
              deleteDoc(doc(db, "rooms", data.code)).catch(() => {});
            } else if (
              data.status !== "summary" &&
              data.players &&
              data.players.length > 0
            ) {
              activeList.push(data);
            }
          }
        });
        // Sắp xếp phòng mới nhất lên đầu
        activeList.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        callback(activeList);
      },
      (err) => {
        console.warn("Active rooms snapshot error:", err);
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn("Subscribe active rooms error:", e);
    return () => {};
  }
}
