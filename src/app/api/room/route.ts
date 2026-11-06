import { NextRequest, NextResponse } from "next/server";
import { DrinkingCard, Player, CardHistoryItem } from "@/types/game";
import rawQuestions from "@/data/questions.json";

// Map to DrinkingCard format
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

// Fisher-Yates unbiased shuffle to guarantee 100% random and 0 duplicates
function getShuffledDeck(count: number): DrinkingCard[] {
  const pool = [...ALL_CARDS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

// Generate human-friendly room code (e.g. SIP-8492)
function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SIP-${randomPart}`;
}

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

// Global server memory store
declare global {
  var __drinkLabRooms: Map<string, RoomState> | undefined;
}

if (!globalThis.__drinkLabRooms) {
  globalThis.__drinkLabRooms = new Map<string, RoomState>();

  // Create default fallback room ALCH88 for quick testing
  const defaultDeck = getShuffledDeck(100);
  globalThis.__drinkLabRooms.set("ALCH88", {
    code: "ALCH88",
    hostEmail: "hungorharry@gmail.com",
    hostName: "Hoàng Nam",
    status: "lobby",
    totalCards: 100,
    deck: defaultDeck,
    currentCardIndex: 0,
    isFlipped: false,
    currentTurnIdx: 0,
    players: [
      { id: 0, uid: "user_nam", name: "Hoàng Nam", initial: "HN", isHost: true, color: "bg-amber-600", email: "hungorharry@gmail.com" },
      { id: 1, uid: "user_maianh", name: "Mai Anh", initial: "MA", isHost: false, color: "bg-sky-600" },
      { id: 2, uid: "user_hai", name: "Tuấn Hải", initial: "TH", isHost: false, color: "bg-emerald-600" },
      { id: 3, uid: "user_trang", name: "Minh Trang", initial: "MT", isHost: false, color: "bg-purple-600" },
    ],
    beerConsumed: 18,
    history: [],
    reactions: [],
    updatedAt: Date.now(),
  });
}

const rooms = globalThis.__drinkLabRooms;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = (searchParams.get("code") || "").toUpperCase().trim();

  if (!code) {
    return NextResponse.json({ error: "Missing room code" }, { status: 400 });
  }

  const room = rooms.get(code);
  if (!room) {
    return NextResponse.json({ error: "Room not found", code }, { status: 404 });
  }

  // Clean old reactions older than 4 seconds
  const now = Date.now();
  room.reactions = room.reactions.filter((r) => now - r.timestamp < 4000);

  return NextResponse.json({ success: true, room });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. TẠO PHÒNG MỚI (CREATE ROOM)
    if (action === "create") {
      const { user, totalCards = 100 } = body;
      const roomCode = generateRoomCode();
      const shuffledDeck = getShuffledDeck(totalCards);

      const hostPlayer: Player = {
        id: 0,
        uid: user?.email ? `usr_${user.email.replace(/[^a-zA-Z0-9]/g, "_")}` : `usr_${Date.now()}`,
        name: user?.name || "Chủ Phòng",
        initial: (user?.name || "CP").charAt(0).toUpperCase(),
        isHost: true,
        color: "bg-amber-600",
        email: user?.email,
        avatar: user?.picture,
      };

      const newRoom: RoomState = {
        code: roomCode,
        hostEmail: user?.email || "",
        hostName: hostPlayer.name,
        status: "lobby",
        totalCards,
        deck: shuffledDeck,
        currentCardIndex: 0,
        isFlipped: false,
        currentTurnIdx: 0,
        players: [hostPlayer],
        beerConsumed: 0,
        history: [],
        reactions: [],
        updatedAt: Date.now(),
      };

      rooms.set(roomCode, newRoom);
      return NextResponse.json({ success: true, room: newRoom, roomCode });
    }

    // 2. VÀO PHÒNG (JOIN ROOM)
    if (action === "join") {
      const { roomCode, user, nickname, tolerance } = body;
      const code = (roomCode || "").toUpperCase().trim();

      let room = rooms.get(code);
      if (!room) {
        // If room doesn't exist yet, auto-create it with this user as host so game is never blocked
        const shuffledDeck = getShuffledDeck(100);
        room = {
          code,
          hostEmail: user?.email || "",
          hostName: nickname || user?.name || "Người Chơi",
          status: "lobby",
          totalCards: 100,
          deck: shuffledDeck,
          currentCardIndex: 0,
          isFlipped: false,
          currentTurnIdx: 0,
          players: [],
          beerConsumed: 0,
          history: [],
          reactions: [],
          updatedAt: Date.now(),
        };
        rooms.set(code, room);
      }

      // Check if user already in players
      const userEmail = user?.email;
      const existingPlayerIdx = room.players.findIndex(
        (p) => (userEmail && p.email === userEmail) || p.name === (nickname || user?.name)
      );

      const colors = ["bg-sky-600", "bg-emerald-600", "bg-purple-600", "bg-rose-600", "bg-amber-600", "bg-indigo-600", "bg-teal-600"];

      if (existingPlayerIdx >= 0) {
        // Update existing player info
        if (nickname) room.players[existingPlayerIdx].name = nickname;
        if (user?.picture) room.players[existingPlayerIdx].avatar = user.picture;
      } else {
        // Add new player
        const newPlayer: Player = {
          id: room.players.length,
          uid: userEmail ? `usr_${userEmail.replace(/[^a-zA-Z0-9]/g, "_")}` : `usr_${Date.now()}`,
          name: nickname || user?.name || `Bạn Nhậu #${room.players.length + 1}`,
          initial: (nickname || user?.name || "BN").slice(0, 2).toUpperCase(),
          isHost: room.players.length === 0,
          color: colors[room.players.length % colors.length],
          email: userEmail,
          avatar: user?.picture,
        };
        room.players.push(newPlayer);
      }

      room.updatedAt = Date.now();
      return NextResponse.json({ success: true, room });
    }

    // Các action khác yêu cầu mã phòng
    const code = (body.roomCode || "").toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) {
      return NextResponse.json({ error: "Phòng không tồn tại", code }, { status: 404 });
    }

    // 3. THAY ĐỔI TỔNG SỐ CÂU HỎI & XÁO BỘ BÀI MỚI (CHANGE TOTAL CARDS)
    if (action === "set_total_cards") {
      const { totalCards } = body;
      room.totalCards = totalCards;
      room.deck = getShuffledDeck(totalCards); // 100% random, no duplicates
      room.currentCardIndex = 0;
      room.isFlipped = false;
      room.updatedAt = Date.now();
      return NextResponse.json({ success: true, room });
    }

    // 4. BẮT ĐẦU VÁN CHƠI (START GAME)
    if (action === "start_game") {
      room.status = "playing";
      room.currentCardIndex = 0;
      room.isFlipped = false;
      room.currentTurnIdx = 0;
      // Re-shuffle deck fresh for game start to ensure 100% uniqueness
      room.deck = getShuffledDeck(room.totalCards);
      room.updatedAt = Date.now();
      return NextResponse.json({ success: true, room });
    }

    // 5. LẬT BÀI (FLIP CARD)
    if (action === "flip_card") {
      room.isFlipped = true;
      room.updatedAt = Date.now();
      return NextResponse.json({ success: true, room });
    }

    // 6. CHUYỂN LƯỢT (NEXT TURN)
    if (action === "complete_turn") {
      const { resultType, sips = 0, historyItem } = body;
      if (sips > 0) {
        room.beerConsumed += sips;
      }
      if (historyItem) {
        room.history.unshift(historyItem);
      }
      room.currentCardIndex = (room.currentCardIndex + 1) % room.deck.length;
      room.currentTurnIdx = (room.currentTurnIdx + 1) % Math.max(room.players.length, 1);
      room.isFlipped = false;
      room.updatedAt = Date.now();
      return NextResponse.json({ success: true, room });
    }

    // 7. ĐỔI CÂU KHÁC (REROLL WITHOUT REPEATING)
    if (action === "reroll_card") {
      room.beerConsumed += 1;
      // Get an unpicked card from the remaining 1000 pool
      const usedIds = new Set(room.deck.map((c) => c.id));
      const unusedPool = ALL_CARDS.filter((c) => !usedIds.has(c.id));
      if (unusedPool.length > 0) {
        const replacement = unusedPool[Math.floor(Math.random() * unusedPool.length)];
        room.deck[room.currentCardIndex] = replacement;
      }
      room.isFlipped = true;
      room.updatedAt = Date.now();
      return NextResponse.json({ success: true, room });
    }

    // 8. TƯƠNG TÁC THẢ EMOJI (REACTION)
    if (action === "reaction") {
      const { emoji, sipsToAdd = 0 } = body;
      if (sipsToAdd > 0) {
        room.beerConsumed += sipsToAdd;
      }
      const newReaction = {
        id: Date.now() + Math.random(),
        emoji,
        left: Math.floor(Math.random() * 60) + 20,
        timestamp: Date.now(),
      };
      room.reactions.push(newReaction);
      room.updatedAt = Date.now();
      return NextResponse.json({ success: true, room });
    }

    // 9. KẾT THÚC VÁN (FINISH GAME)
    if (action === "finish_game") {
      room.status = "summary";
      room.updatedAt = Date.now();
      return NextResponse.json({ success: true, room });
    }

    // 10. CHƠI LẠI (REPLAY)
    if (action === "replay") {
      room.status = "lobby";
      room.deck = getShuffledDeck(room.totalCards);
      room.currentCardIndex = 0;
      room.isFlipped = false;
      room.currentTurnIdx = 0;
      room.beerConsumed = 0;
      room.history = [];
      room.updatedAt = Date.now();
      return NextResponse.json({ success: true, room });
    }

    return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Lỗi xử lý server" }, { status: 500 });
  }
}
