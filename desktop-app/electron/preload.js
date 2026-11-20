// Electron Preload Script
// Vai trò: Cầu nối an toàn giữa Main process và Renderer (React)
// Chỉ expose những API cần thiết — không expose toàn bộ Node

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  // Dashboard data
  getDashboardData: (params) => ipcRenderer.invoke('get-dashboard-data', params),

  // Pipeline control
  runPipeline: (params) => ipcRenderer.invoke('run-pipeline', params),
  onPipelineProgress: (callback) => {
    ipcRenderer.on('pipeline-progress', (event, data) => callback(data))
    // Trả về cleanup function
    return () => ipcRenderer.removeAllListeners('pipeline-progress')
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
