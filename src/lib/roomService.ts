import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
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
