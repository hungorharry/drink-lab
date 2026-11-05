import { DrinkingCard, Player } from "@/types/game";
import rawQuestions from "./questions.json";

export const INITIAL_PLAYERS: Player[] = [
  { id: 0, uid: "user_nam", name: "Hoàng Nam", initial: "HN", isHost: true, color: "bg-amber-600" },
  { id: 1, uid: "user_maianh", name: "Mai Anh", initial: "MA", isHost: false, color: "bg-sky-600" },
  { id: 2, uid: "user_hai", name: "Tuấn Hải", initial: "TH", isHost: false, color: "bg-emerald-600" },
  { id: 3, uid: "user_trang", name: "Minh Trang", initial: "MT", isHost: false, color: "bg-purple-600" }
];

// Chuyển đổi 1000 câu hỏi sang định dạng DrinkingCard
export const CARD_DECK: DrinkingCard[] = rawQuestions.map((q: any) => ({
  id: `SIP-${String(q.id).padStart(4, "0")}`,
  type: q.type,
  typeLabel: q.typeLabel,
  title: q.title,
  description: q.content,
  penalty: q.penalty,
  difficulty: `Độ khó: ${q.difficulty}/5`,
  badgeBg: q.badgeBg
}));
