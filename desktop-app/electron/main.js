// Electron Main Process
// Vai trò: Entry point của Electron, quản lý cửa sổ app, IPC với Python

const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const fs = require('fs')

// ===== CONFIG =====
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
const PROJECT_ROOT = path.join(__dirname, '..')

// ===== TẠO CỬA SỔ =====
function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    frame: false,         // Custom titlebar
    titleBarStyle: 'hidden',
    backgroundColor: '#0f0f0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    show: false,          // Ẩn cho đến khi ready-to-show
  })

  // Load app
  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Hiện window sau khi load xong (tránh flash trắng)
  win.once('ready-to-show', () => {
    win.show()
  })

  return win
}

// ===== APP LIFECYCLE =====
app.whenReady().then(() => {
  const win = createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ===== IPC HANDLERS =====

// Window controls (vì dùng frameless)
ipcMain.on('window-minimize', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize()
})
ipcMain.on('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  win?.isMaximized() ? win.unmaximize() : win.maximize()
})
ipcMain.on('window-close', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close()
})

// Lấy dữ liệu từ SQLite
ipcMain.handle('get-dashboard-data', async (event, { tab, dateRange, snapshot }) => {
  try {
    // TODO: Import và query better-sqlite3
    // const db = require('better-sqlite3')(DB_PATH)
    // const data = db.prepare('SELECT ...').all()
    return { success: true, data: [] }
  } catch (err) {
    console.error('[IPC] get-dashboard-data error:', err)
    return { success: false, error: err.message }
  }
})

// Chạy Python pipeline
ipcMain.handle('run-pipeline', async (event, { stage }) => {
  return new Promise((resolve) => {
    const scriptMap = {
      'bronze': path.join(PROJECT_ROOT, 'data-pipeline/jobs/01_ingest_bronze.py'),
      'silver': path.join(PROJECT_ROOT, 'data-pipeline/jobs/02_bronze_to_silver.py'),
      'gold':   path.join(PROJECT_ROOT, 'data-pipeline/jobs/03_silver_to_gold.py'),
      'sqlite': path.join(PROJECT_ROOT, 'data-pipeline/jobs/04_gold_to_sqlite.py'),
      'all':    path.join(PROJECT_ROOT, 'data-pipeline/run_all.py'),
      'ml':     path.join(PROJECT_ROOT, 'ml-pipeline/predict_bestsellers.py'),
    }

    const script = scriptMap[stage]
    if (!script || !fs.existsSync(script)) {
      return resolve({ success: false, error: `Script "${stage}" khong tim thay` })
    }

    const proc = spawn('python', [script], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    })

    let stdout = '', stderr = ''
    proc.stdout.on('data', (d) => {
      stdout += d.toString()
      // Gửi progress realtime về renderer
      event.sender.send('pipeline-progress', { stage, log: d.toString() })
    })
    proc.stderr.on('data', (d) => { stderr += d.toString() })
    proc.on('close', (code) => {
      resolve({ success: code === 0, stdout, stderr, exitCode: code })
    })
  })
})

// Lấy danh sách snapshots
ipcMain.handle('get-snapshots', async () => {
  try {
    // TODO: Query MinIO hoặc local folder snapshots
    return { success: true, snapshots: [] }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Mở thư mục trong Explorer
ipcMain.handle('open-folder', async (event, folderPath) => {
  shell.openPath(folderPath)
})
