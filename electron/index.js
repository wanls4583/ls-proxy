const { app, protocol, BrowserWindow, Menu } = require('electron');
const path = require('node:path');
const main = require('@electron/remote/main');

const wins = {};
let mainWin = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
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


function createWindow(name, url, type, parent) {
  const win = new BrowserWindow({
    backgroundColor: '#2b2b2b',
    titleBarStyle: 'hidden',
    // titleBarOverlay: {
    //   height: 46
    // },
    trafficLightPosition: { x: 10, y: 14 },
    show: false,
    parent: parent,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  main.enable(win.webContents);
  win.setMinimumSize(700, 500)
  wins[name] = win;

  if (type === 'remote') {
    win.loadURL(url);
  } else {
    win.loadFile(url);
  }

  win.on('enter-full-screen', (e) => {
    win.webContents.send('enter-full-screen')
  })
  win.on('leave-full-screen', (e) => {
    win.webContents.send('leave-full-screen')
  })

  // win.webContents.openDevTools();

  return win;
}

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

// const { spawn } = require('node:child_process');
// const ls = spawn('./server', [], {
//   shell: true,
//   cwd: path.join(app.getAppPath(), 'electron/proxy')
// });

// ls.stdout.on('data', (data) => {
//   console.log(`stdout: ${data}`);
// });

// ls.stderr.on('data', (data) => {
//   console.error(`stderr: ${data}`);
// });

// ls.on('close', (code) => {
//   console.log(`child process exited with code ${code}`);
// });