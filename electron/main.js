const { app, BrowserWindow, shell } = require('electron')
const path = require('path')

let mainWindow

// App loads from Vercel (internet required)
const APP_URL = 'https://tour-management-system-lilac.vercel.app'

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'icon.ico'),
    title: 'Tour Bill Management System',
    show: false,
    backgroundColor: '#1e40af',
  })

  // Remove menu bar
  mainWindow.setMenuBarVisibility(false)

  mainWindow.loadURL(APP_URL)

  // Show when loaded
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  // Show loading screen while app loads
  mainWindow.webContents.on('did-start-loading', () => {
    mainWindow.setTitle('Loading Tour Bill Management...')
  })

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.setTitle('Tour Bill Management System')
  })

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL)) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
