// Main process — electron-vite ESM layout (Electron v28+ với "type": "module")
// Electron v28+ hỗ trợ native ESM nhưng 'electron' là CJS module
// Phải dùng default import, sau đó destructure

import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { spawn } from 'child_process'
import { existsSync } from 'fs'

// ===== CONFIG =====
// electron-vite dev mode sets ELECTRON_RENDERER_URL
// production mode: load from out/renderer/index.html
const isDev = !!process.env.ELECTRON_RENDERER_URL
const PROJECT_ROOT = join(__dirname, '../../..')  // desktop-app/../.. = Pr_Vy

// ===== TẠO CỬA SỔ =====
function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0f0f0f',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    show: false,
  })

  if (isDev) {
    // electron-vite sets ELECTRON_RENDERER_URL in dev mode
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  win.once('ready-to-show', () => win.show())
  return win
}

// ===== APP LIFECYCLE =====
app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ===== IPC: Window controls =====
ipcMain.on('window-minimize', e => BrowserWindow.fromWebContents(e.sender)?.minimize())
ipcMain.on('window-maximize', e => {
  const w = BrowserWindow.fromWebContents(e.sender)
  w?.isMaximized() ? w.unmaximize() : w.maximize()
})
ipcMain.on('window-close', e => BrowserWindow.fromWebContents(e.sender)?.close())

// ===== IPC: Dashboard data =====
ipcMain.handle('get-dashboard-data', async (e, { tab, dateRange, snapshot }) => {
  try {
    // TODO: query SQLite với better-sqlite3 khi pipeline xong
    return { success: true, data: [] }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// ===== IPC: Pipeline control =====
ipcMain.handle('run-pipeline', async (event, { stage }) => {
  return new Promise(resolve => {
    const scriptMap = {
      bronze: join(PROJECT_ROOT, 'data-pipeline/jobs/01_ingest_bronze.py'),
      silver: join(PROJECT_ROOT, 'data-pipeline/jobs/02_bronze_to_silver.py'),
      gold:   join(PROJECT_ROOT, 'data-pipeline/jobs/03_silver_to_gold.py'),
      sqlite: join(PROJECT_ROOT, 'data-pipeline/jobs/04_gold_to_sqlite.py'),
      all:    join(PROJECT_ROOT, 'data-pipeline/run_all.py'),
      ml:     join(PROJECT_ROOT, 'ml-pipeline/predict_bestsellers.py'),
    }

    const script = scriptMap[stage]
    if (!script || !existsSync(script)) {
      return resolve({ success: false, error: `Script "${stage}" khong tim thay` })
    }

    const proc = spawn('python', [script], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    })

    let stdout = '', stderr = ''
    proc.stdout.on('data', d => {
      stdout += d
      event.sender.send('pipeline-progress', { stage, log: d.toString() })
    })
    proc.stderr.on('data', d => { stderr += d })
    proc.on('close', code => resolve({ success: code === 0, stdout, stderr, exitCode: code }))
  })
})

ipcMain.handle('get-snapshots', async () => ({ success: true, snapshots: [] }))
ipcMain.handle('open-folder', async (e, p) => shell.openPath(p))

