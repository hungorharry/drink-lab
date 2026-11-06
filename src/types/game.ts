export interface DrinkingCard {
  id: string;
  type: "DARE" | "TRUTH" | "ALL_DRINK" | "KING" | "POLL";
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
  email?: string;
  avatar?: string;
}

export interface CardHistoryItem {
  id: string;
  turnNumber: number;
  playerId: number;
  playerName: string;
  playerInitial: string;
  cardTitle: string;
  cardContent: string;
  cardType: string;
  cardTypeLabel: string;
  penalty: string;
  result: "drank" | "passed" | "rerolled";
  resultText: string;
  sips: number;
  timestamp: string;
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
  totalCards: number;
  lastUpdated: number;
  helpRequest?: HelpRequest | null;
  usedHelpByUser: Record<number, boolean>;
  verificationRequest?: DrinkVerificationRequest | null;
  penaltyBannerMessage?: string | null;
  lastActionMessage?: string | null;
  history?: CardHistoryItem[];
}
