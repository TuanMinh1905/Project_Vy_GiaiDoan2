// Preload script — electron-vite layout
// Cầu nối an toàn giữa Main process và Renderer (React)

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  // Dashboard data
  getDashboardData: (params) => ipcRenderer.invoke('get-dashboard-data', params),

  // Reload database (sau khi pipeline chạy xong)
  reloadDatabase: () => ipcRenderer.invoke('reload-database'),

  // Pipeline control
  runPipeline: (params) => ipcRenderer.invoke('run-pipeline', params),
  onPipelineProgress: (callback) => {
    const handler = (event, data) => callback(data)
    ipcRenderer.on('pipeline-progress', handler)
    return () => ipcRenderer.removeListener('pipeline-progress', handler)
  },

  // Snapshots
  getSnapshots: () => ipcRenderer.invoke('get-snapshots'),

  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // Utilities
  openFolder: (path) => ipcRenderer.invoke('open-folder', path),
})
