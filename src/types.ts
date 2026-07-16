/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TradeEntry {
  id: string;
  coin: string;
  action: 'BUY' | 'SELL'; // BUY = Ko'pkon, SELL = Slvon
  price: number;
  amount: number;
  leverage: number;
  status: 'WIN' | 'LOSS' | 'HOLD';
  timestamp: string;
  notes: string;
  aiAnalysis?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface PriceAlert {
  id: string;
  coin: 'BTC' | 'ETH' | 'SOL';
  condition: 'ABOVE' | 'BELOW';
  targetPrice: number;
  triggered: boolean;
  createdAt: string;
}

export interface JournalStats {
  totalTrades: number;
  totalBuys: number;
  totalSells: number;
  winRate: number;
  averagePrice: Record<string, number>;
  totalVolume: number;
  winCount: number;
  lossCount: number;
}
