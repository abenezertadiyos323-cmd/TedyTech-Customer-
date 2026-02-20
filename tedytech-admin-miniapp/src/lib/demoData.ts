import type { Activity } from "@/types/admin";
import type { HotLead } from "@/types/hotLead";

const demoModeEnv = import.meta.env.VITE_DEMO_MODE;

export const DEMO_MODE =
  demoModeEnv === "true" ? true : demoModeEnv === "false" ? false : false;

export function getDemoModeLabel() {
  return DEMO_MODE ? "DEMO" : "";
}

const NOW = Date.now();

const demoHotLeads: HotLead[] = [
  {
    id: "demo-lead-1",
    type: "action",
    score: 3,
    priority: "",
    title: "Abel T. - iPhone 13 Pro",
    description: "Ready to buy today if battery health is above 85%",
    timestamp: NOW - 1000 * 60 * 12,
    waitTime: "Waiting 12m",
    sessionId: "tg_8319120114",
    metadata: { status: "new", actionType: "reserve" },
  },
  {
    id: "demo-lead-2",
    type: "action",
    score: 2,
    priority: "",
    title: "Hana M. - Samsung S23 Ultra",
    description: "Asked for cash+exchange option from iPhone 12",
    timestamp: NOW - 1000 * 60 * 26,
    waitTime: "Waiting 26m",
    sessionId: "tg_6221900341",
    metadata: { status: "new", actionType: "ask" },
  },
  {
    id: "demo-lead-3",
    type: "action",
    score: 2,
    priority: "",
    title: "Kalkidan G. - Tecno Camon 30",
    description: "Needs installment details and same-day delivery in Addis",
    timestamp: NOW - 1000 * 60 * 47,
    waitTime: "Waiting 47m",
    sessionId: "tg_7315021890",
    metadata: { status: "new", actionType: "ask" },
  },
  {
    id: "demo-lead-4",
    type: "action",
    score: 1,
    priority: "",
    title: "Meron S. - iPhone 11",
    description: "Budget ETB 88,000, requested clean body condition",
    timestamp: NOW - 1000 * 60 * 70,
    waitTime: "Waiting 1h",
    sessionId: "tg_5027108433",
    metadata: { status: "contacted", actionType: "reserve" },
  },
  {
    id: "demo-lead-5",
    type: "action",
    score: 1,
    priority: "",
    title: "Robel D. - Redmi Note 13 Pro",
    description: "Wants best price for cash payment this evening",
    timestamp: NOW - 1000 * 60 * 95,
    waitTime: "Waiting 1h",
    sessionId: "tg_9135602478",
    metadata: { status: "contacted", actionType: "ask" },
  },
];

const demoProductStats = {
  totalProducts: 62,
  activeProducts: 49,
  draftProducts: 9,
  archivedProducts: 4,
  featuredProducts: 11,
  newArrivals: 7,
};

const demoPhoneActionStats = {
  totalActions: 37,
  reserveActions: 16,
  askActions: 14,
  viewActions: 7,
  todayActions: 13,
};

const demoExchangeStats = {
  totalExchanges: 18,
  newExchanges: 5,
  pendingExchanges: 6,
  completedExchanges: 4,
  rejectedExchanges: 3,
  todayExchanges: 6,
};

const demoActivities: Activity[] = [
  {
    id: "demo-act-1",
    type: "phone_action",
    description: "Reservation for iPhone 13 Pro 256GB (ETB 118,000)",
    timestamp: NOW - 1000 * 60 * 9,
  },
  {
    id: "demo-act-2",
    type: "exchange_request",
    description: "Exchange request: iPhone 12 -> Samsung S23 Ultra",
    timestamp: NOW - 1000 * 60 * 18,
  },
  {
    id: "demo-act-3",
    type: "phone_action",
    description: "Question on Tecno Camon 30 warranty and accessories",
    timestamp: NOW - 1000 * 60 * 32,
  },
  {
    id: "demo-act-4",
    type: "search",
    description: 'Searched for "iPhone 11 128GB Addis"',
    timestamp: NOW - 1000 * 60 * 48,
  },
  {
    id: "demo-act-5",
    type: "exchange_request",
    description: "Exchange request: Redmi Note 12 -> iPhone 11",
    timestamp: NOW - 1000 * 60 * 65,
  },
];

export function getDashboardDemoHotLeads(limit: number = 10): HotLead[] {
  return demoHotLeads.slice(0, limit);
}

export function getDashboardDemoProductStats() {
  return demoProductStats;
}

export function getDashboardDemoPhoneActionStats() {
  return demoPhoneActionStats;
}

export function getDashboardDemoExchangeStats() {
  return demoExchangeStats;
}

export function getDashboardDemoActivities(limit: number = 5): Activity[] {
  return demoActivities.slice(0, limit);
}
