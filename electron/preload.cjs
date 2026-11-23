const { contextBridge, ipcRenderer } = require('electron');

// Expose only the specific browser and agent operations used by the UI.
contextBridge.exposeInMainWorld('afterclick', {
  getDemoUrl: () => ipcRenderer.invoke('app:get-demo-url'),
  getBrowserState: () => ipcRenderer.invoke('browser:get-state'),
  openTab: (url) => ipcRenderer.invoke('browser:open-tab', url),
  navigate: (url) => ipcRenderer.invoke('browser:navigate', url),
  back: () => ipcRenderer.invoke('browser:back'),
  forward: () => ipcRenderer.invoke('browser:forward'),
  reload: () => ipcRenderer.invoke('browser:reload'),
  activateTab: (id) => ipcRenderer.invoke('browser:activate-tab', id),
  closeTab: (id) => ipcRenderer.invoke('browser:close-tab', id),
  setBrowserBounds: (bounds) => ipcRenderer.send('browser:set-bounds', bounds),
  runResearch: (goal) => ipcRenderer.invoke('agent:run-research', goal),
  searchWeb: (query) => ipcRenderer.invoke('agent:web-search', query),
  approveBooking: (taskId, providerId, paymentInfo) => ipcRenderer.invoke('agent:approve-booking', { taskId, providerId, paymentInfo }),
  reconcileBooking: (taskId, providerId) => ipcRenderer.invoke('agent:reconcile-booking', { taskId, providerId }),
  simulateHistoryOutage: (taskId, providerId) => ipcRenderer.invoke('agent:simulate-history-outage', { taskId, providerId }),
  retryBooking: (taskId, providerId, paymentInfo) => ipcRenderer.invoke('agent:retry-booking', { taskId, providerId, paymentInfo }),
  summarizePage: () => ipcRenderer.invoke('agent:summarize-page'),
  openLedger: () => ipcRenderer.invoke('browser:open-ledger'),
  resetDemo: () => ipcRenderer.invoke('agent:reset-demo'),
  onAgentCommand: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on('agent:command', listener);
    return () => ipcRenderer.removeListener('agent:command', listener);
  },
  onTabs: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('browser:tabs', listener);
    return () => ipcRenderer.removeListener('browser:tabs', listener);
  },
  onBrowserEvent: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('browser:event', listener);
    return () => ipcRenderer.removeListener('browser:event', listener);
  }
});
