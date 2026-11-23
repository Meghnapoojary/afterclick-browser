import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Activity, ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, Check, CheckCircle2,
  CircleAlert, Clock3, ExternalLink, FileCheck2, Globe2, History, LoaderCircle,
  LockKeyhole, MessageSquareText, Plus, Printer, RefreshCw, Search, ShieldCheck, Sparkles, WifiOff, X
} from 'lucide-react';

type LogItem = { id: string; text: string; tone: 'neutral' | 'success' | 'warning' };
type PaymentMethod = 'DEMO_UPI' | 'DEMO_CARD';
type BookingStage = 'idle' | 'preflight' | 'submitting' | 'signal-lost' | 'response-received' | 'checking-history' | 'booked' | 'not-booked' | 'uncertain' | 'duplicate';

function BookingJourney({
  stage, receipt, mascotBot, mascotStar, mascotExplorer
}: {
  stage: BookingStage;
  receipt: BookingReceipt | null;
  mascotBot: string;
  mascotStar: string;
  mascotExplorer: string;
}) {
  if (stage === 'idle' && !receipt) return null;

  const lost = stage === 'signal-lost' || receipt?.browserResponse === 'LOST';
  const finalStatus = receipt?.status ?? (stage === 'booked' ? 'VERIFIED' : stage === 'not-booked' ? 'NOT_BOOKED' : stage === 'uncertain' ? 'UNCERTAIN' : stage === 'duplicate' ? 'DUPLICATE_DETECTED' : undefined);
  const final = !!finalStatus;
  const mascot = finalStatus === 'VERIFIED' ? mascotExplorer
    : finalStatus === 'UNCERTAIN' ? mascotStar : mascotBot;
  const outcomeTitle = finalStatus === 'VERIFIED' ? 'BOOKED · VERIFIED'
    : finalStatus === 'NOT_BOOKED' ? 'NOT BOOKED'
      : finalStatus === 'DUPLICATE_DETECTED' ? 'DUPLICATE DETECTED'
        : finalStatus === 'UNCERTAIN' ? 'OUTCOME UNCERTAIN' : 'Waiting for verification';
  const outcomeDetail = finalStatus === 'VERIFIED'
    ? `The independent history found ${receipt?.verifiedCount ?? 1} matching confirmed booking. No repeat request was sent.`
    : finalStatus === 'NOT_BOOKED' ? 'The provider history authoritatively returned zero matching bookings. A new attempt requires your approval.'
      : finalStatus === 'DUPLICATE_DETECTED' ? 'More than one matching record exists. Further submissions are blocked.'
        : finalStatus === 'UNCERTAIN' ? 'The history could not be checked. The task remains on hold; nothing was resubmitted.'
          : 'AFTERCLICK will verify the provider record before calling this task complete.';
  const current = stage === 'preflight' ? 0 : stage === 'submitting' ? 1
    : stage === 'signal-lost' || stage === 'response-received' ? 2
      : stage === 'checking-history' ? 3
        : final ? 4 : 0;

  const notSent = receipt?.browserResponse === 'NOT_SENT';
  const steps = [
    { title: 'Pre-check', detail: 'Check existing history before any new submission' },
    { title: notSent ? 'Booking request was not sent' : stage === 'submitting' ? 'Sending booking request' : 'Booking request sent', detail: notSent ? 'The pre-check did not allow a safe submission.' : 'The approved request was sent to the provider page' },
    { title: lost ? 'Confirmation signal lost' : notSent ? 'Submission safely held' : 'Provider response received', detail: lost ? 'The response did not reach the browser. The booking may still have been committed.' : notSent ? 'No booking action was repeated while the pre-check was unavailable.' : 'The provider page returned a response to the browser.' },
    { title: 'Independent history check', detail: 'Read-only lookup using the same task and provider' },
    { title: outcomeTitle, detail: outcomeDetail }
  ];

  return <section className={`booking-journey ${finalStatus === 'VERIFIED' ? 'journey-verified' : finalStatus === 'UNCERTAIN' ? 'journey-uncertain' : finalStatus === 'NOT_BOOKED' ? 'journey-not-booked' : finalStatus === 'DUPLICATE_DETECTED' ? 'journey-duplicate' : ''}`} aria-live="polite">
    <div className="journey-head">
      <div className="journey-mascot-wrap">{mascot && <img src={mascot} alt="AFTERCLICK helper" className={`journey-mascot ${!final ? 'journey-mascot-working' : ''}`} />}</div>
      <div className="journey-heading-copy">
        <span className="journey-kicker">AFTERCLICK · OUTCOME ASSURANCE</span>
        <b>{finalStatus === 'VERIFIED' ? 'We found your booking.' : finalStatus === 'NOT_BOOKED' ? 'No booking was created.' : finalStatus === 'UNCERTAIN' ? 'We need one more check.' : finalStatus === 'DUPLICATE_DETECTED' ? 'A duplicate needs review.' : stage === 'signal-lost' ? 'Confirmation signal interrupted' : stage === 'checking-history' ? 'Checking booking history' : stage === 'booked' ? 'Booking verified · preparing receipt' : 'Working through your booking'}</b>
        <small>{finalStatus === 'VERIFIED' ? 'The provider record confirms one appointment.' : lost ? 'No second booking request will be sent while we verify.' : finalStatus === 'UNCERTAIN' ? 'Safe hold is active. Retrying is disabled.' : 'Each step is recorded in the action journal.'}</small>
      </div>
      {finalStatus === 'VERIFIED' && <span className="journey-final-pill"><CheckCircle2 size={12} /> VERIFIED</span>}
    </div>
    <div className="journey-track">
      {steps.map((step, index) => {
        const completed = final ? (index < 4 || index === 4) : index < current;
        const active = !final && index === current;
        const warn = index === 2 && lost;
        const isOutcome = index === 4;
        return <div className={`journey-step ${completed ? 'done' : ''} ${active ? 'current' : ''} ${warn ? 'signal-warning' : ''} ${isOutcome && finalStatus === 'VERIFIED' ? 'outcome-success' : ''} ${isOutcome && (finalStatus === 'UNCERTAIN' || finalStatus === 'NOT_BOOKED' || finalStatus === 'DUPLICATE_DETECTED') ? 'outcome-alert' : ''}`} key={step.title}>
          <div className="journey-step-marker">{warn ? <WifiOff size={13} /> : completed ? <Check size={13} /> : active ? <LoaderCircle size={13} className="spin" /> : <span>{String(index + 1).padStart(2, '0')}</span>}</div>
          <div className="journey-step-copy"><b>{step.title}</b><small>{step.detail}</small></div>
          {warn && <span className="signal-chip">LOST</span>}
        </div>;
      })}
    </div>
    {lost && <div className="signal-explainer"><div className="signal-explainer-icon"><WifiOff size={17} /></div><div><b>Confirmation signal was lost</b><span>The browser did not receive the provider's confirmation. AFTERCLICK paused and checked the independent booking history instead of submitting again.</span></div></div>}
    {finalStatus === 'VERIFIED' && receipt?.booking && <div className="journey-booking-found"><div className="found-check"><CheckCircle2 size={17} /></div><div><b>Appointment found in booking history</b><span>{receipt.booking.providerName} · {receipt.booking.customerName} · {receipt.booking.slot} · {money(receipt.booking.price)}</span><small>Reference: {receipt.booking.reference}</small></div></div>}
    {finalStatus === 'UNCERTAIN' && <div className="journey-hold-note"><ShieldCheck size={15} /><span>Safe hold active · Check the same booking history again. Do not resubmit.</span></div>}
  </section>;
}

function money(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}
function looksLikeAddress(value: string) {
  const text = value.trim();
  return /^(https?:\/\/|localhost(?::\d+)?|127\.0\.0\.1(?::\d+)?|[\w.-]+\.[a-z]{2,})([/:?#].*)?$/i.test(text);
}
function isLocalStartPage(value: string) {
  return /^https?:\/\/127\.0\.0\.1:\d+\/?$/i.test(value) || /^https?:\/\/localhost:\d+\/?$/i.test(value);
}
function isAppointmentTask(value: string) {
  return /\b(appointment|consultation|medical visit)\b/i.test(value)
    && /\b(find|book|schedule|appointment|compare|available|slot)\b/i.test(value);
}

export default function App() {
  const [tabs, setTabs] = useState<BrowserTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [research, setResearch] = useState<AgentResearchResult | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<BookingReceipt | null>(null);
  const [isResearching, setIsResearching] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [bookingStage, setBookingStage] = useState<BookingStage>('idle');
  const [rightTab, setRightTab] = useState<'agent' | 'receipt'>('agent');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [retryMode, setRetryMode] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('DEMO_UPI');
  const [logs, setLogs] = useState<LogItem[]>([
    { id: 'welcome', text: 'Ready. Search the web or enter a supported task in the browser search bar.', tone: 'neutral' }
  ]);
  const [summary, setSummary] = useState<{ title: string; summary: string } | null>(null);
  const [webSearch, setWebSearch] = useState<WebSearchResponse | null>(null);
  const [isWebSearching, setIsWebSearching] = useState(false);
  const [mascotBaseUrl, setMascotBaseUrl] = useState('');
  const [addressFocused, setAddressFocused] = useState(false);
  const browserSurfaceRef = useRef<HTMLDivElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const commandHandlerRef = useRef<(value: string) => void>(() => {});

  const activeTab = useMemo(() => tabs.find((tab) => tab.id === activeTabId) ?? null, [tabs, activeTabId]);
  const taskComplete = receipt?.status === 'VERIFIED';
  const mascotSrc = (name: 'bot' | 'star' | 'explorer') => mascotBaseUrl ? `${mascotBaseUrl}mascot-${name}.png` : '';
  const selectedProvider = useMemo(
    () => research?.providers.find((provider) => provider.id === selectedProviderId) ?? null,
    [research, selectedProviderId]
  );

  const addLog = useCallback((text: string, tone: LogItem['tone'] = 'neutral') => {
    setLogs((current) => [{ id: `${Date.now()}-${Math.random()}`, text, tone }, ...current].slice(0, 16));
  }, []);

  useEffect(() => {
    const api = window.afterclick;
    if (!api) {
      addLog('Launch AFTERCLICK from the desktop app to use browser and agent controls.', 'warning');
      return;
    }
    api.getDemoUrl().then((url) => setMascotBaseUrl(`${url.replace(/\/$/, '')}/assets/`)).catch(() => {});
    api.getBrowserState().then((state) => {
      setTabs(state.tabs);
      setActiveTabId(state.activeTabId);
      const current = state.tabs.find((tab) => tab.active);
      if (current?.url) setAddress(isLocalStartPage(current.url) ? '' : current.url);
    }).catch(() => addLog('Could not connect to the browser process.', 'warning'));
    const removeTabs = api.onTabs((state) => {
      setTabs(state.tabs);
      setActiveTabId(state.activeTabId);
      const current = state.tabs.find((tab) => tab.active);
      if (current?.url && !addressFocused) setAddress(isLocalStartPage(current.url) ? '' : current.url);
    });
    const removeEvents = api.onBrowserEvent((event) => {
      if (event.type === 'agent-log' && event.message) addLog(event.message, event.message.toLowerCase().includes('verified') || event.message.toLowerCase().includes('confirmed') ? 'success' : 'neutral');
      if (event.type === 'navigation-error') addLog(`Navigation issue: ${event.message || 'Unknown error'}`, 'warning');
      if (event.type === 'crash') addLog('A page stopped responding. Reload the tab to try again.', 'warning');
      if (event.type === 'agent-stage' && event.phase) {
        setBookingStage(event.phase as BookingStage);
        if (event.message) addLog(event.message, ['signal-lost', 'uncertain', 'not-booked', 'duplicate'].includes(event.phase) ? 'warning' : ['booked'].includes(event.phase) ? 'success' : 'neutral');
      }
    });
    const removeCommands = api.onAgentCommand((value) => { void commandHandlerRef.current(value); });
    return () => { removeTabs(); removeEvents(); removeCommands(); };
  }, [addLog, addressFocused]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        addressInputRef.current?.focus();
        addressInputRef.current?.select();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 't') {
        event.preventDefault();
        void window.afterclick?.openTab();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    const node = browserSurfaceRef.current;
    const api = window.afterclick;
    if (!node || !api) return;
    const updateBounds = () => {
      const rect = node.getBoundingClientRect();
      api.setBrowserBounds({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
    };
    const observer = new ResizeObserver(updateBounds);
    observer.observe(node);
    window.addEventListener('resize', updateBounds);
    requestAnimationFrame(updateBounds);
    return () => { observer.disconnect(); window.removeEventListener('resize', updateBounds); };
  }, []);

  useEffect(() => {
    if (activeTab?.url) setAddress(isLocalStartPage(activeTab.url) ? '' : activeTab.url);
  }, [activeTab?.url]);

  const navigate = async (value: string) => {
    if (!window.afterclick || !value.trim()) return;
    setIsNavigating(true);
    try {
      await window.afterclick.navigate(value.trim());
      addLog(`Opened ${value.trim()}.`, 'success');
    } finally {
      setIsNavigating(false);
    }
  };

  const runResearch = async (goal: string) => {
    if (!window.afterclick || !goal.trim()) return;
    setIsResearching(true);
    setReceipt(null);
    setBookingStage('idle');
    setCheckoutOpen(false);
    setRetryMode(false);
    setSummary(null);
    setWebSearch(null);
    setResearch(null);
    setSelectedProviderId(null);
    setRightTab('agent');
    setLogs([]);
    addLog('Understanding your request and creating a Goal Contract…');
    try {
      const result = await window.afterclick.runResearch(goal.trim());
      setResearch(result);
      if (result.recommended) setSelectedProviderId(result.recommended.id);
      addLog(`Compared ${result.providers.length} provider pages against your time and price constraints.`, 'success');
      addLog(result.recommended ? `Best match: ${result.recommended.name}, ${result.recommended.slot}, ${money(result.recommended.price)}.` : 'No provider satisfied every constraint.', result.recommended ? 'success' : 'warning');
      if (result.recommended) addLog('Review the provider options, then continue to the demo checkout when ready.');
    } catch (error) {
      addLog(error instanceof Error ? error.message : 'Research could not be completed.', 'warning');
    } finally {
      setIsResearching(false);
    }
  };

  const summarizePage = async () => {
    if (!window.afterclick) return;
    setWebSearch(null);
    addLog('Reading the active page…');
    try {
      const result = await window.afterclick.summarizePage();
      setSummary(result);
      addLog(`Page summary ready: ${result.title || 'Current page'}.`, 'success');
    } catch {
      addLog('Could not summarize the active page.', 'warning');
    }
  };

  const runWebSearch = async (query: string) => {
    if (!window.afterclick || !query.trim()) return;
    setIsWebSearching(true);
    setResearch(null);
    setReceipt(null);
    setBookingStage('idle');
    setSummary(null);
    setWebSearch(null);
    setCheckoutOpen(false);
    setRightTab('agent');
    setLogs([]);
    addLog(`Searching the web for “${query.trim()}” with AFTERCLICK Search…`);
    try {
      const result = await window.afterclick.searchWeb(query.trim());
      setWebSearch(result);
      if (result.results.length) {
        addLog(`Found ${result.results.length} web sources through ${result.provider}.`, 'success');
        addLog('Formatted the results in the AFTERCLICK search workspace. Open a source to continue browsing.');
      } else {
        addLog(`Structured search is unavailable: ${result.error || 'No results returned.'}`, 'warning');
        addLog('You can open the provider’s full results page as a fallback.');
      }
      await navigate(result.pageUrl);
    } catch (error) {
      addLog(error instanceof Error ? error.message : 'Web search could not be completed.', 'warning');
    } finally {
      setIsWebSearching(false);
    }
  };

  const submitCommand = async (raw: string) => {
    const value = String(raw || '').trim();
    if (!value) return;
    setAddress(value);
    if (looksLikeAddress(value)) {
      setWebSearch(null);
      setSummary(null);
      await navigate(value);
      return;
    }
    if (/^(summari[sz]e|explain|read)\s+(this|the|current)\s+page/i.test(value) || /summari[sz]e\s+current\s+page/i.test(value)) {
      setWebSearch(null);
      await summarizePage();
      return;
    }
    if (/^(help|what can you do|capabilities)$/i.test(value)) {
      setWebSearch(null);
      addLog('Search is available for general web queries. Guided task execution in this MVP currently supports the controlled appointment-booking demonstration; page summarization is also available.', 'neutral');
      return;
    }
    if (isAppointmentTask(value)) {
      setWebSearch(null);
      await runResearch(value);
      return;
    }
    await runWebSearch(value);
  };
  commandHandlerRef.current = submitCommand;

  const beginCheckout = (asRetry = false) => {
    if (asRetry && receipt) setSelectedProviderId(receipt.providerId);
    setRetryMode(asRetry);
    setCheckoutOpen(true);
    setRightTab('agent');
    addLog(asRetry ? 'Opening a fresh demo checkout after the ledger confirmed no booking.' : 'Opening checkout. No booking will be submitted until you confirm the demo payment.');
  };

  const confirmDemoPaymentAndBook = async () => {
    if (!window.afterclick || !research || !selectedProvider || !customerName.trim()) return;
    if (retryMode && !receipt?.retryAllowed) return;
    setIsApproving(true);
    setBookingStage('preflight');
    addLog(`Demo payment authorization requested for ${money(selectedProvider.price)}. No real money will be charged.`, 'neutral');
    const paymentInfo = { customerName: customerName.trim(), method: paymentMethod };
    try {
      const result = retryMode
        ? await window.afterclick.retryBooking(research.taskId, selectedProvider.id, paymentInfo)
        : await window.afterclick.approveBooking(research.taskId, selectedProvider.id, paymentInfo);
      // Main-process stage events expose the actual request / response / ledger sequence.
      setReceipt(result);
      setCheckoutOpen(false);
      setRetryMode(false);
      setRightTab('receipt');
      if (result.status === 'VERIFIED') {
        setBookingStage('booked');
        addLog('Appointment confirmed in the independent ledger. The demo payment record is attached to the booking.', 'success');
      } else if (result.status === 'NOT_BOOKED') {
        setBookingStage('not-booked');
        addLog('No appointment exists. The unused demo payment authorization was voided; review before another attempt.', 'warning');
      } else if (result.status === 'DUPLICATE_DETECTED') {
        setBookingStage('duplicate');
        addLog('Multiple matching bookings found. Further submissions are blocked.', 'warning');
      } else {
        setBookingStage('uncertain');
        addLog('The outcome is still uncertain. No second booking request was sent.', 'warning');
      }
    } catch (error) {
      setBookingStage('uncertain');
      addLog(error instanceof Error ? error.message : 'Checkout or booking could not be completed.', 'warning');
    } finally {
      setIsApproving(false);
    }
  };

  const checkBookingHistoryAgain = async () => {
    if (!window.afterclick || !receipt || isReconciling) return;
    setIsReconciling(true);
    setBookingStage('checking-history');
    addLog('Checking the same task in independent booking history. This is read-only; no booking request will be sent.');
    try {
      const result = await window.afterclick.reconcileBooking(receipt.taskId, receipt.providerId);
      setReceipt(result);
      addLog(result.status === 'VERIFIED' ? 'History confirms the appointment. No new submission was made.' : result.status === 'NOT_BOOKED' ? 'Authoritative history confirms zero bookings. Any pending demo payment authorization was voided.' : result.status === 'DUPLICATE_DETECTED' ? 'Multiple matching bookings found. Further submissions remain blocked.' : 'History is still unavailable or inconclusive. Task remains safely on hold.', result.status === 'VERIFIED' || result.status === 'NOT_BOOKED' ? 'success' : 'warning');
      setRightTab('receipt');
      setBookingStage(result.status === 'VERIFIED' ? 'booked' : result.status === 'NOT_BOOKED' ? 'not-booked' : result.status === 'DUPLICATE_DETECTED' ? 'duplicate' : 'uncertain');
    } catch (error) {
      addLog(error instanceof Error ? error.message : 'Could not check booking history.', 'warning');
    } finally {
      setIsReconciling(false);
    }
  };

  const simulateHistoryOutage = async () => {
    if (!window.afterclick || !receipt) return;
    setIsReconciling(true);
    setBookingStage('checking-history');
    addLog('Demo test: simulating one temporary history-read failure. No booking request will be sent.');
    try {
      const result = await window.afterclick.simulateHistoryOutage(receipt.taskId, receipt.providerId);
      setReceipt(result);
      setBookingStage('uncertain');
      setRightTab('receipt');
      addLog('History is unavailable. AFTERCLICK held the task and offered a read-only recheck.', 'warning');
    } catch (error) {
      addLog(error instanceof Error ? error.message : 'Could not run the recovery test.', 'warning');
    } finally {
      setIsReconciling(false);
    }
  };

  const resetDemo = async () => {
    await window.afterclick?.resetDemo();
    setResearch(null);
    setSelectedProviderId(null);
    setReceipt(null);
    setBookingStage('idle');
    setCheckoutOpen(false);
    setRetryMode(false);
    setCustomerName('');
    setPaymentMethod('DEMO_UPI');
    setSummary(null);
    setWebSearch(null);
    setRightTab('agent');
    setLogs([{ id: `${Date.now()}`, text: 'New session ready. Search or enter a supported task in the command bar.', tone: 'success' }]);
    const home = await window.afterclick?.getDemoUrl();
    if (home) await window.afterclick?.navigate(home);
  };

  const openNewTab = async () => {
    const homeUrl = await window.afterclick?.getDemoUrl();
    const id = await window.afterclick?.openTab(homeUrl || 'about:blank');
    if (typeof id === 'string') addLog('Opened a clean new tab.');
  };

  const openLedger = async () => { await window.afterclick?.openLedger(); };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <div className="brand-mark"><Sparkles size={17} strokeWidth={2.1} /></div>
          <div className="brand-name">AFTER<span>CLICK</span><small>BROWSE · UNDERSTAND · ACT · VERIFY</small></div>
        </div>
        <div className="header-center"><span className="header-pulse" /> {isResearching || isApproving || isReconciling || isWebSearching ? 'AGENT WORKING' : taskComplete ? 'OUTCOME VERIFIED' : 'READY WHEN YOU ARE'} <i /> <span className="header-muted">MVP 0.6.1</span></div>
        <div className="header-actions"><div className="privacy-chip"><LockKeyhole size={12} /> LOCAL DEMO</div><button className="icon-button" title="New tab" onClick={openNewTab}><Plus size={16} /></button><button className="icon-button" title="Reset demo session" onClick={resetDemo}><RefreshCw size={15} /></button></div>
      </header>

      <section className="browser-chrome">
        <div className="nav-row">
          <div className="nav-controls">
            <button className="chrome-icon" title="Back" disabled={!activeTab?.canGoBack} onClick={() => window.afterclick?.back()}><ArrowLeft size={17} /></button>
            <button className="chrome-icon" title="Forward" disabled={!activeTab?.canGoForward} onClick={() => window.afterclick?.forward()}><ArrowRight size={17} /></button>
            <button className="chrome-icon" title="Refresh" onClick={() => window.afterclick?.reload()}><RefreshCw size={16} className={activeTab?.loading ? 'spin' : ''} /></button>
          </div>
          <form className="address-form" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void submitCommand(address); }}>
            <Search size={17} className="address-search" />
            <input ref={addressInputRef} value={address} onChange={(event: ChangeEvent<HTMLInputElement>) => setAddress(event.target.value)} onFocus={() => setAddressFocused(true)} onBlur={() => setAddressFocused(false)} spellCheck={false} aria-label="Search the web or ask AFTERCLICK" title="Search or ask AFTERCLICK · Ctrl+L" placeholder="Search the web or ask AFTERCLICK to do something…" />
            {activeTab?.loading || isNavigating || isResearching || isWebSearching ? <LoaderCircle className="address-spinner spin" size={16} /> : <button className="address-go" type="submit">Go <ArrowUpRight size={13} /></button>}
          </form>
          <button className="chrome-icon new-tab-button" title="New tab" onClick={openNewTab}><Plus size={18} /></button>
        </div>
        <div className="tabs-row">
          <div className="tabs-list">{tabs.map((tab) => (
            <div className={`browser-tab ${tab.active ? 'active' : ''}`} key={tab.id}>
              <button className="tab-main" onClick={() => window.afterclick?.activateTab(tab.id)} title={tab.url}>
                <span className={`tab-favicon ${tab.url.includes('127.0.0.1') ? 'local' : ''}`}><Globe2 size={12} /></span>
                <span className="tab-title">{tab.title || 'New tab'}</span>
              </button>
              <button className="tab-close" title="Close tab" onClick={() => window.afterclick?.closeTab(tab.id)}><X size={12} /></button>
            </div>
          ))}</div>
          <div className="tabs-end"><span>{tabs.length} {tabs.length === 1 ? 'TAB' : 'TABS'}</span></div>
        </div>
      </section>

      <main className="workspace">
        <section className="browser-column"><div className="browser-surface-wrap">
          <div className="browser-surface" ref={browserSurfaceRef}>
            {!activeTab && <div className="browser-empty"><Globe2 size={26} /><b>Open a page to begin</b><span>Search or ask AFTERCLICK in the bar above.</span></div>}
          </div>
          <div className="browser-bottom-line"><span><span className="secure-dot" /> CHROMIUM BROWSER</span><span>{activeTab?.loading ? 'LOADING PAGE…' : activeTab?.title?.toUpperCase() || 'NEW TAB'}</span></div>
        </div></section>

        <aside className="copilot-panel">
          <div className="panel-topline">
            <div className="copilot-title"><div className={`copilot-icon ${taskComplete ? 'copilot-icon-complete' : ''}`}>{taskComplete ? <CheckCircle2 size={17} /> : <Sparkles size={16} />}</div><div><b>AGENT ACTIVITY</b><small>{isResearching || isApproving || isReconciling || isWebSearching ? 'Searching and organising sources'  : taskComplete ? 'Task complete · evidence saved' : 'Your request, plan and results'}</small></div></div>
            <div className="agent-status-pill"><span className="live-dot" /> {isResearching || isApproving || isReconciling || isWebSearching ? 'ACTIVE' : taskComplete ? 'DONE' : 'IDLE'}</div>
          </div>
          <div className="panel-tabs"><button className={rightTab === 'agent' ? 'selected' : ''} onClick={() => setRightTab('agent')}><Activity size={13} /> Activity</button><button className={rightTab === 'receipt' ? 'selected' : ''} onClick={() => setRightTab('receipt')}><FileCheck2 size={13} /> Receipt {receipt && <span className="tab-indicator" />}</button></div>

          {rightTab === 'agent' ? <div className="panel-scroll agent-scroll">
            {(isResearching || isWebSearching) && <div className="agent-working-card">{mascotSrc('bot') && <img src={mascotSrc('bot')} alt="AFTERCLICK helper working" />}<div><b>{isResearching ? 'Comparing appointment options' : 'Looking across the web'}</b><span>{isResearching ? 'Checking time, price and availability…' : 'Gathering useful sources for your query…'}</span></div><LoaderCircle size={16} className="spin working-spinner" /></div>}
            {(isApproving || (bookingStage !== 'idle' && !receipt)) && <BookingJourney stage={bookingStage} receipt={null} mascotBot={mascotSrc('bot')} mascotStar={mascotSrc('star')} mascotExplorer={mascotSrc('explorer')} />}
            {!research && !receipt && !summary && !webSearch && <div className="agent-empty-state">
              <div className="agent-mascot-row"><div className="empty-orbit"><Sparkles size={24} /></div>{mascotSrc('star') && <img className="agent-guide-mascot" src={mascotSrc('star')} alt="The AFTERCLICK guide mascot" />}</div>
              <span className="intro-kicker">ONE COMMAND BAR · TWO WAYS TO USE IT</span>
              <h1>What can I<br /><em>help you do?</em></h1>
              <p>Search anything from one command bar. I'll organise the sources here, and show the full results in your browser.</p>
              <div className="capability-list"><div><Search size={14} /><span><b>Web search</b><small>Branded results, no Google detour</small></span></div><div><MessageSquareText size={14} /><span><b>Page understanding</b><small>Summarize the current page from the command bar</small></span></div><div><ShieldCheck size={14} /><span><b>Verified task demo</b><small>Appointment research, checkout and outcome verification</small></span></div></div>
              <p className="agent-tip">Try: “Best cafés in Bengaluru for studying” or “Find an appointment tomorrow under ₹500.”</p>
            </div>}

            {webSearch && <div className="web-search-agent-view">
              <div className="web-search-agent-head"><div className="web-search-agent-icon"><Search size={17} /></div><div><span>AFTERCLICK SEARCH</span><h2>{webSearch.results.length} {webSearch.results.length === 1 ? 'source' : 'sources'} found</h2><p>“{webSearch.query}”</p></div>{mascotSrc('explorer') && <img className="search-mascot" src={mascotSrc('explorer')} alt="Search explorer mascot" />}</div>
              {webSearch.results.length > 0 ? <div className="agent-source-list">{webSearch.results.slice(0, 5).map((result, index) => <button key={`${result.url}-${index}`} className="agent-source" onClick={() => void navigate(result.url)}><span className="agent-source-number">{String(index + 1).padStart(2, '0')}</span><span className="agent-source-copy"><b>{result.title}</b><small>{result.domain || result.url}</small></span><ArrowUpRight size={13} /></button>)}</div> : <div className="search-unavailable"><b>Search results aren't available right now.</b><span>{webSearch.error || 'The search provider did not return readable results.'}</span><button className="primary-action" onClick={() => void navigate(webSearch.fallbackUrl)}>Open full web results <ArrowUpRight size={13} /></button></div>}
              <div className="search-agent-foot"><span><span className="live-dot" /> {webSearch.provider} · {new Date(webSearch.searchedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span><button onClick={() => void navigate(webSearch.pageUrl)}>View search page</button></div>
            </div>}

            {summary && <div className="summary-card"><div className="summary-title"><MessageSquareText size={14} /> PAGE SUMMARY</div><b>{summary.title}</b><p>{summary.summary}</p></div>}

            {research && <>
              <div className="task-summary-card"><div className="task-kicker"><span className="live-dot" /> GOAL CONTRACT {research.contract.id}</div><h2>Appointment search</h2><p>{research.contract.goal}</p><div className="task-guard"><ShieldCheck size={14} /> One booking maximum · Approval before payment · Verify before retry</div></div>
              <div className="panel-section-head"><span>PROVIDER COMPARISON</span><span>{research.providers.length} REVIEWED</span></div>
              <div className="provider-list">{research.providers.map((provider) => (
                <button key={provider.id} className={`provider-option ${selectedProviderId === provider.id ? 'chosen' : ''}`} onClick={() => { setSelectedProviderId(provider.id); setCheckoutOpen(false); setRetryMode(false); }}>
                  <div className="provider-option-top"><div className="provider-name-wrap"><span className={`provider-radio ${selectedProviderId === provider.id ? 'checked' : ''}`}>{selectedProviderId === provider.id && <Check size={9} />}</span><b>{provider.name}</b></div><span className="provider-price">{money(provider.price)}</span></div>
                  <div className="provider-option-meta"><span><Clock3 size={11} /> {provider.slot}</span><span><Globe2 size={11} /> {provider.area}</span><span>★ {provider.rating}</span></div>
                  {research.recommended?.id === provider.id && <span className="recommend-tag">BEST MATCH</span>}
                </button>
              ))}</div>
              {!checkoutOpen && <div className="checkout-intro"><div><b>{selectedProvider ? selectedProvider.name : 'Select a provider'}</b><span>{selectedProvider ? `${selectedProvider.slot} · ${selectedProvider.area} · ${money(selectedProvider.price)}` : 'Choose an option to continue'}</span></div><button className="primary-action" onClick={() => beginCheckout(false)} disabled={!selectedProvider || isResearching || !!receipt}>Continue <ArrowUpRight size={14} /></button></div>}
            </>}

            {checkoutOpen && selectedProvider && <div className="checkout-card">
              <div className="checkout-head"><div><span className="task-kicker">{retryMode ? 'FRESH APPROVAL REQUIRED' : 'SECURE DEMO CHECKOUT'}</span><h2>Confirm your details</h2></div><button className="quiet-icon" onClick={() => setCheckoutOpen(false)} title="Close checkout"><X size={15} /></button></div>
              <div className="checkout-summary"><div><span>PROVIDER</span><b>{selectedProvider.name}</b></div><div><span>APPOINTMENT</span><b>Tomorrow · {selectedProvider.slot}</b></div><div><span>LOCATION</span><b>{selectedProvider.area}</b></div><div><span>AMOUNT DUE</span><b className="amount-due">{money(selectedProvider.price)}</b></div></div>
              <label className="field-label" htmlFor="booking-name">APPOINTMENT UNDER</label>
              <input id="booking-name" className="checkout-input" value={customerName} onChange={(event: ChangeEvent<HTMLInputElement>) => setCustomerName(event.target.value)} placeholder="Enter the patient's full name" maxLength={100} />
              <label className="field-label">PAYMENT METHOD · SIMULATION</label>
              <div className="payment-methods"><button className={paymentMethod === 'DEMO_UPI' ? 'payment-selected' : ''} onClick={() => setPaymentMethod('DEMO_UPI')}><span className="payment-radio" /> UPI demo</button><button className={paymentMethod === 'DEMO_CARD' ? 'payment-selected' : ''} onClick={() => setPaymentMethod('DEMO_CARD')}><span className="payment-radio" /> Card demo</button></div>
              <div className="demo-payment-note"><LockKeyhole size={13} /><span><b>Demo checkout only.</b> No real money is charged. Do not enter a UPI PIN, card number or banking credentials.</span></div>
              <button className="primary-action pay-action" onClick={confirmDemoPaymentAndBook} disabled={!customerName.trim() || isApproving}>{isApproving ? <><LoaderCircle size={14} className="spin" /> Authorizing & confirming…</> : <>Authorize demo payment & confirm <span>{money(selectedProvider.price)}</span></>}</button>
              <button className="checkout-back" onClick={() => setCheckoutOpen(false)} disabled={isApproving}>Back to comparison</button>
            </div>}

            {receipt && receipt.status !== 'VERIFIED' && <div className={`inline-outcome ${receipt.status.toLowerCase()}`}><div className="inline-outcome-title">{receipt.status === 'NOT_BOOKED' ? 'NOT BOOKED' : receipt.status === 'UNCERTAIN' ? 'OUTCOME UNCERTAIN' : 'DUPLICATE DETECTED'}</div><p>{receipt.explanation}</p>{receipt.status === 'UNCERTAIN' && <button className="primary-action" onClick={checkBookingHistoryAgain} disabled={isReconciling}>{isReconciling ? 'Checking…' : 'Check booking history again'}</button>}{receipt.status === 'NOT_BOOKED' && <button className="primary-action" onClick={() => beginCheckout(true)}>Review a new approved attempt</button>}</div>}

            <div className="activity-block"><div className="panel-section-head"><span>AGENT TRACE</span><span>{logs.length} EVENTS</span></div><div className="activity-list">{logs.slice(0, 8).map((log, index) => <div className={`activity-item ${log.tone}`} key={log.id}><span className="activity-mark">{log.tone === 'success' ? <CheckCircle2 size={13} /> : log.tone === 'warning' ? <CircleAlert size={13} /> : <Activity size={13} />}</span><span>{log.text}</span><time>{index === 0 ? 'NOW' : ''}</time></div>)}</div></div>
            <div className="agent-tools"><button onClick={summarizePage}><MessageSquareText size={13} /> Summarize current page</button><button onClick={openLedger}><History size={13} /> Booking ledger</button></div>
            <div className="agent-disclaimer">MVP SCOPE · WEB SEARCH + CONTROLLED APPOINTMENT WORKFLOW</div>
          </div> : <div className="panel-scroll evidence-panel">
            {!receipt ? <div className="evidence-empty"><div className="evidence-empty-icon"><FileCheck2 size={23} /></div><h2>No receipt yet</h2><p>After an approved task, AFTERCLICK will show the provider record, payment status and independent verification here.</p><button className="secondary-button" onClick={() => setRightTab('agent')}>Back to activity</button></div> : <>
              <div className="receipt-print-actions no-print"><div><b>Appointment acknowledgement</b><span>Print it or save a PDF copy for your records.</span></div><button className="print-acknowledgement" onClick={() => window.print()} disabled={receipt.status !== 'VERIFIED' || !receipt.booking}><Printer size={14} /> Print / Save PDF</button></div>
              <BookingJourney stage={bookingStage} receipt={receipt} mascotBot={mascotSrc('bot')} mascotStar={mascotSrc('star')} mascotExplorer={mascotSrc('explorer')} />
              <div className="receipt-print-area">
              <div className="receipt-print-brand"><div className="print-brand-mark"><Sparkles size={17} /></div><div><b>AFTERCLICK</b><small>VERIFIED APPOINTMENT ACKNOWLEDGEMENT</small></div><span>LOCAL DEMO RECORD</span></div>
              <div className={`receipt-banner ${receipt.status === 'UNCERTAIN' || receipt.status === 'NOT_BOOKED' ? 'receipt-banner-warning' : receipt.status === 'DUPLICATE_DETECTED' ? 'receipt-banner-danger' : ''}`}>
                <div className="receipt-status-icon">{receipt.status === 'VERIFIED' ? <ShieldCheck size={22} /> : <CircleAlert size={22} />}</div>
                <div><span>OUTCOME ASSURANCE</span><h2>{receipt.status === 'VERIFIED' ? 'Demo appointment verified' : receipt.status === 'NOT_BOOKED' ? 'Not booked — safe to review retry' : receipt.status === 'DUPLICATE_DETECTED' ? 'Duplicate booking detected' : 'Outcome uncertain — task on hold'}</h2><p>{receipt.explanation}</p></div>
              </div>
              <div className="receipt-card"><div className="receipt-card-head"><span>APPOINTMENT ACKNOWLEDGEMENT</span><span className="receipt-id">{receipt.id}</span></div>
                {receipt.booking ? <>
                  <div className="booking-success"><CheckCircle2 size={15} /> VERIFIED IN LOCAL DEMO LEDGER</div>
                  <h3>{receipt.booking.providerName}</h3>
                  <div className="receipt-detail-grid">
                    <div><span>BOOKED UNDER</span><b>{receipt.booking.customerName}</b></div>
                    <div><span>DATE</span><b>{receipt.booking.appointmentDate}</b></div>
                    <div><span>TIME</span><b>{receipt.booking.slot}</b></div>
                    <div><span>LOCATION</span><b>{receipt.booking.area}</b></div>
                    <div><span>BOOKING REFERENCE</span><b>{receipt.booking.reference}</b></div>
                    <div><span>AMOUNT</span><b>{money(receipt.booking.price)}</b></div>
                    <div><span>PAYMENT METHOD</span><b>{receipt.booking.paymentMethod === 'DEMO_UPI' ? 'UPI · DEMO' : 'CARD · DEMO'}</b></div>
                    <div><span>PAYMENT STATUS</span><b>{receipt.booking.paymentStatus}</b></div>
                    <div><span>PAYMENT REFERENCE</span><b>{receipt.booking.paymentReference}</b></div>
                  </div>
                  <div className="demo-receipt-note">DEMO TRANSACTION · No real payment was collected and no real-world appointment was created.</div>
                </> : <div className="empty-receipt">{receipt.status === 'NOT_BOOKED' ? 'The authoritative history contains zero bookings. Any pending demo payment authorization was voided.' : receipt.status === 'DUPLICATE_DETECTED' ? 'More than one matching record exists. AFTERCLICK has blocked further submissions.' : 'The booking history could not be confirmed. No new request was sent; the task remains on hold.'}</div>}
              </div>
              <div className="receipt-print-footer">Generated by AFTERCLICK · This is a controlled demo record, not a real-world clinic appointment or payment receipt.</div>
              </div>
              {receipt.payment && <div className="evidence-card"><div className="evidence-head"><span>PAYMENT STATUS</span><BadgeCheck size={15} /></div><div className="evidence-row"><span>Payment reference</span><b>{receipt.payment.reference}</b></div><div className="evidence-row"><span>Method</span><b>{receipt.payment.method === 'DEMO_UPI' ? 'UPI DEMO' : 'CARD DEMO'}</b></div><div className="evidence-row"><span>Status</span><b className={receipt.payment.status === 'CAPTURED_DEMO' ? 'verified' : 'warning-text'}>{receipt.payment.status}</b></div><div className="evidence-row"><span>Amount</span><b>{money(receipt.payment.amount)}</b></div><small className="demo-disclaimer-small">Simulation only — no money moved.</small></div>}
              <div className="evidence-card"><div className="evidence-head"><span>VERIFICATION EVIDENCE</span><BadgeCheck size={15} /></div><div className="evidence-row"><span>Independent history</span><b className={receipt.ledgerState === 'AVAILABLE' ? 'verified' : 'warning-text'}>{receipt.ledgerState === 'AVAILABLE' ? 'REACHABLE' : receipt.ledgerState}</b></div><div className="evidence-row"><span>Matching records</span><b>{receipt.verifiedCount}</b></div><div className="evidence-row"><span>Duplicate prevention</span><b className="verified">ENFORCED</b></div><div className="evidence-row"><span>Automatic resubmission</span><b className="verified">NEVER</b></div>{receipt.ledgerSource && <div className="evidence-row"><span>Evidence source</span><b>{receipt.ledgerSource}</b></div>}<div className="evidence-row"><span>Last checked</span><b>{new Date(receipt.checkedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</b></div></div>
              {receipt.status === 'UNCERTAIN' && <div className="recovery-panel recovery-uncertain"><div className="recovery-panel-title"><CircleAlert size={15} /> SAFE RECOVERY · NO RESUBMISSION</div><p>Check the same booking history again. This is read-only. If it stays unavailable, keep the task on hold and confirm directly with the provider. The demo payment authorization is not captured unless a booking is committed.</p>{receipt.ledgerReason && <small>Last check: {receipt.ledgerReason}</small>}<button className="recovery-primary" onClick={checkBookingHistoryAgain} disabled={isReconciling}>{isReconciling ? <><LoaderCircle size={13} className="spin" /> Checking same booking…</> : <><RefreshCw size={13} /> Check booking history again</>}</button></div>}
              {receipt.status === 'NOT_BOOKED' && <div className="recovery-panel recovery-not-booked"><div className="recovery-panel-title"><CheckCircle2 size={15} /> HISTORY CHECK PASSED · ZERO MATCHES</div><p>The unused demo payment authorization was voided. A new attempt needs fresh payment authorization and your explicit approval.</p><button className="recovery-primary" onClick={() => { setRightTab('agent'); beginCheckout(true); }} disabled={isApproving}>Review a new attempt</button></div>}
              {receipt.status === 'DUPLICATE_DETECTED' && <div className="recovery-panel recovery-duplicate"><div className="recovery-panel-title"><CircleAlert size={15} /> HUMAN REVIEW REQUIRED</div><p>Multiple bookings were found. Further submissions are blocked. Review the history and resolve the duplicate with the provider.</p></div>}
              <div className="evidence-row simple-evidence"><span>Browser response</span><b>{receipt.browserResponse === 'LOST' && receipt.status === 'VERIFIED' ? 'LOST · RECOVERED' : receipt.browserResponse}</b></div>
              <div className="journal-card"><div className="evidence-head"><span>ACTION JOURNAL</span><span>{receipt.actions.length} EVENTS</span></div>{receipt.actions.map((action, index) => <div className="journal-row" key={`${action.type}-${index}`}><span className="journal-index">{String(index + 1).padStart(2, '0')}</span><div><b>{action.type.replaceAll('_', ' ')}</b><small>{action.detail}</small></div></div>)}</div>
              <button className="secondary-button full-width" onClick={simulateHistoryOutage} disabled={isReconciling}><CircleAlert size={13} /> Test temporary history outage (demo)</button>
              <button className="secondary-button full-width" onClick={openLedger}><History size={14} /> Open independent booking ledger <ExternalLink size={12} /></button>
              <button className="secondary-button full-width" onClick={resetDemo}><Plus size={14} /> Start a new task · Reset demo data</button>
            </>}
          </div>}
        </aside>
      </main>
    </div>
  );
}
