const { app, protocol, BrowserWindow, Menu } = require('electron');
const path = require('node:path');
const main = require('@electron/remote/main');

const wins = {};
let mainWin = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

function createWindow(name, url, type, parent) {
  const win = new BrowserWindow({
    // transparent: true,
    frame: false,
    show: false,
    parent: parent,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  // win.maximize(); //最大化
  main.enable(win.webContents);
  wins[name] = win;
  if (type === 'remote') {
    win.loadURL(url);
  } else {
    win.loadFile(url);
  }
  if (process.argv[2] === 'development') {
    win.webContents.openDevTools();
  }
  return win;
}

app.whenReady().then(() => {
  initProtocol();
  initEvent();
  _createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      _createWindow();
    }
  });

  function _createWindow() {
    mainWin = createWindow('main', 'http://localhost:8080/', 'remote');
    // mainWin = createWindow('main', 'render/index.html');
    mainWin.show();
  }
});

function initEvent() {
  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
  });
}

function initProtocol() {
  protocol.registerFileProtocol('my-file', (request, callback) => {
    const url = request.url.substr('my-file://'.length);
    callback(decodeURI(path.normalize(url)));
  });
}