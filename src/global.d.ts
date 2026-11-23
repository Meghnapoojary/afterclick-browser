export {};

declare global {
  type BrowserTab = {
    id: string;
    title: string;
    url: string;
    loading: boolean;
    active: boolean;
    canGoBack: boolean;
    canGoForward: boolean;
  };

  type ProviderOption = {
    id: string;
    name: string;
    shortName?: string;
    area: string;
    price: number;
    rating: number;
    slot: string;
    minutes: number;
    available: boolean;
    tag?: string;
    description: string;
    sourceUrl: string;
    tabId: string;
  };

  type GoalContract = {
    id: string;
    goal: string;
    preconditions: string[];
    postconditions: string[];
    constraints: string[];
  };

  type AgentResearchResult = {
    taskId: string;
    contract: GoalContract;
    providers: ProviderOption[];
    recommended: ProviderOption | null;
    journal: { at: string; type: string; detail: string; taskId: string }[];
  };

  type PaymentInfo = { customerName: string; method: 'DEMO_UPI' | 'DEMO_CARD' };

  type BookingRecord = {
    reference: string;
    taskId: string;
    providerId: string;
    providerName: string;
    customerName: string;
    appointmentDate: string;
    price: number;
    slot: string;
    area: string;
    status: string;
    paymentStatus: string;
    paymentMethod: 'DEMO_UPI' | 'DEMO_CARD';
    paymentReference: string;
    paymentAuthorizationId: string;
    createdAt: string;
  };

  type PaymentRecord = {
    reference: string;
    method: 'DEMO_UPI' | 'DEMO_CARD';
    status: string;
    amount: number;
    customerName: string;
  };

  type BookingReceipt = {
    id: string;
    taskId: string;
    contractId: string;
    requested: string;
    provider: string;
    providerId: string;
    booking: BookingRecord | null;
    payment: PaymentRecord | null;
    status: 'VERIFIED' | 'NOT_BOOKED' | 'UNCERTAIN' | 'DUPLICATE_DETECTED';
    explanation: string;
    browserResponse: 'RECEIVED' | 'LOST' | 'NOT_SENT';
    verifiedCount: number;
    ledgerState: 'AVAILABLE' | 'UNAVAILABLE' | 'INCONCLUSIVE';
    ledgerSource: string | null;
    ledgerReason: string | null;
    retryAllowed: boolean;
    canCheckAgain: boolean;
    checkedAt: string;
    screenshotDataUrl: string | null;
    actions: { at: string; type: string; detail: string; taskId: string }[];
  };

  type BrowserState = { tabs: BrowserTab[]; activeTabId: string | null };

  type WebSearchResult = { title: string; url: string; domain: string; snippet: string };
  type WebSearchResponse = { id: string; query: string; results: WebSearchResult[]; provider: string; fallbackUrl: string; error: string | null; searchedAt: string; pageUrl: string };

  interface Window {
    afterclick?: {
      getDemoUrl: () => Promise<string>;
      getBrowserState: () => Promise<BrowserState>;
      openTab: (url?: string) => Promise<string>;
      navigate: (url: string) => Promise<boolean | string>;
      back: () => Promise<void>;
      forward: () => Promise<void>;
      reload: () => Promise<void>;
      activateTab: (id: string) => Promise<boolean>;
      closeTab: (id: string) => Promise<void>;
      setBrowserBounds: (bounds: { x: number; y: number; width: number; height: number }) => void;
      runResearch: (goal: string) => Promise<AgentResearchResult>;
      searchWeb: (query: string) => Promise<WebSearchResponse>;
      approveBooking: (taskId: string, providerId: string, paymentInfo: PaymentInfo) => Promise<BookingReceipt>;
      reconcileBooking: (taskId: string, providerId: string) => Promise<BookingReceipt>;
      simulateHistoryOutage: (taskId: string, providerId: string) => Promise<BookingReceipt>;
      retryBooking: (taskId: string, providerId: string, paymentInfo: PaymentInfo) => Promise<BookingReceipt>;
      summarizePage: () => Promise<{ title: string; url?: string; summary: string }>;
      openLedger: () => Promise<string>;
      resetDemo: () => Promise<boolean>;
      onAgentCommand: (callback: (value: string) => void) => () => void;
      onTabs: (callback: (state: BrowserState) => void) => () => void;
      onBrowserEvent: (callback: (event: { type: string; message?: string; taskId?: string; phase?: string }) => void) => () => void;
    };
  }
}
