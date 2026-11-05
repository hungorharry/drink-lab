export interface DrinkingCard {
  id: string;
  type: "DARE" | "TRUTH" | "ALL_DRINK" | "KING";
  typeLabel: string;
  title: string;
  description: string;
  penalty: string;
  difficulty: string;
  badgeBg: string;
}

export interface Player {
  id: number;
  uid: string;
  name: string;
  initial: string;
  isHost: boolean;
  color: string;
}

export interface HelpRequest {
  fromPlayerId: number;
  fromPlayerName: string;
  targetPlayerId: number;
  targetPlayerName: string;
  status: "pending" | "accepted" | "rejected";
}

export interface DrinkVerificationRequest {
  drinkingPlayerId: number;
  drinkingPlayerName: string;
  verifierPlayerId: number;
  verifierPlayerName: string;
  status: "pending" | "confirmed" | "rejected";
}

export interface GameState {
  roomCode: string;
  currentTurnIndex: number;
  isFlipping: boolean;
  currentCard: DrinkingCard;
  cardDeckIndex: number;
  round: number;
  lastUpdated: number;
  helpRequest?: HelpRequest | null;
  usedHelpByUser: Record<number, boolean>;
  verificationRequest?: DrinkVerificationRequest | null; // 1 người ngẫu nhiên xác nhận đã uống xong
  penaltyBannerMessage?: string | null; // Báo động đổi lá bài bắt uống phạt
  lastActionMessage?: string | null;
}
