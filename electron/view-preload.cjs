const { contextBridge, ipcRenderer } = require('electron');

// The local start page receives a narrow command bridge. It is not exposed to public websites.
const isAfterclickStartPage = ['127.0.0.1', 'localhost'].includes(window.location.hostname)
  && window.location.pathname === '/';

if (isAfterclickStartPage) {
  contextBridge.exposeInMainWorld('afterclickHome', {
    submitCommand: (value) => {
      if (typeof value === 'string' && value.trim().length > 0 && value.length <= 1200) {
        ipcRenderer.send('home:command', value.trim());
      }
    }
  });
}
