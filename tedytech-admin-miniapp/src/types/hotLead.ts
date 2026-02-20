export type HotLeadSource = "bot" | "miniapp" | "unknown";
export type HotLeadStatus = "new" | "contacted";

export interface AdminHotLead {
  _id: string;
  _creationTime: number;
  sellerId: string;
  createdAt: number;
  updatedAt: number;
  source: HotLeadSource;
  customerName?: string;
  customerPhone?: string;
  telegramUserId?: string;
  interestSummary?: string;
  message?: string;
  status: HotLeadStatus;
  adminNote?: string;
}

export interface HotLead {
  id: string;
  type: 'exchange' | 'action';
  score: number; // 3, 2, 1, 0
  priority: '🔥🔥🔥' | '🔥🔥' | '🔥' | '';
  title: string;
  description: string;
  budgetETB?: number;
  timestamp: number;
  waitTime: string; // "Waiting 8m" or "Waiting 3h"
  sessionId: string;
  metadata: {
    actionType?: string;
    desiredPhoneName?: string;
    offeredModel?: string;
    status?: string;
  };
}
