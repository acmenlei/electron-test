import {
  app,
  BrowserWindow,
  shell,
  Notification,
  ipcMain,
  clipboard,
  screen,
  globalShortcut,
  dialog,
  Menu,
} from "electron";
import { release } from "node:os";
import { join } from "node:path";
import fs from "fs";
import User from "../../db"
import clipBoardEvent from "clipboard-event";
// console.log(clipBoardEvent)
// import util from 'util'
// import robot from "robotjs"
// console.log(robot)
// import appInfo from "appinfo"
// const stat = util.promisify(fs.stat);

import { exec } from "child_process";

function getActiveApplication() {
  return new Promise((resolve, reject) => {
    if (process.platform === "darwin") {
      exec(
        'osascript -e "tell application \\"System Events\\" to get name of first process whose frontmost is true"',
        (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve(stdout.trim());
          }
        }
      );
    } else if (process.platform === "win32") {
      exec("tasklist /fo csv /v", (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          const processes = stdout
            .split("\n")
            .map((line) => line.split('","'))
            .map((fields) => ({
              name: fields[0].replace(/"/g, ""),
              title: fields[7].replace(/"/g, ""),
              status: fields[8].replace(/"/g, ""),
            }));

          const activeProcess = processes.find(
            (process) =>
              process.status === "Running" && process.title === "Console"
          );

          if (activeProcess) {
            resolve(activeProcess.name);
          } else {
            resolve(null);
          }
        }
      });
    }
  });
}
process.env.DIST_ELECTRON = join(__dirname, "..");
process.env.DIST = join(process.env.DIST_ELECTRON, "../dist");
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, "../public")
  : process.env.DIST;

// Disable GPU Acceleration for Windows 7
if (release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win: BrowserWindow | null = null;
let lastClipboardHTML = clipboard.readText(),
  lastImageInfo = "";
// Here, you can also use other preload
const preload = join(__dirname, "../preload/index.js");
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, "index.html");

async function createWindow() {
  // const value = await User.User.createOne({ username: 'username' + Math.floor(Math.random() * 99999),  email: Math.floor(Math.random() * 99999) + 'username@qq.com'  })
  const value = await User.User.findAll()
  console.log(value.length)

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  // console.log(height)
  win = new BrowserWindow({
    width: Math.floor(width),
    height: 320,
    resizable: false,
    frame: false,
    title: "CopyPro",
    icon: join(process.env.VITE_PUBLIC, "favicon.ico"),
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
    show: false,
  });
  // console.log(clipBoardEvent.startListening())
  clipBoardEvent.startListening();
  clipBoardEvent.on("change", getClipBoardContent);
  // win.setBounds({ x: 0, y: height - 200 });
  const max = height - 200;
  let curr = height + 300;
  let timer = setInterval(() => {
    if (win.isClosable()) {
      win.show();
    }
    if (curr === max) {
      clearInterval(timer);
      return;
    }
    curr -= 10;
    win.setBounds({ x: 0, y: curr });
  });
  // win.setAlwaysOnTop(true);
  // 隐藏 macOS 应用图标
  if (app.dock) {
    app.dock.hide();
  }
  // win.setSkipTaskbar(true);
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(url);
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }
  /* 文件转base64 */
  function fileToBase64(filePath) {
    try {
      // 剔除file:// 前缀
      console.log(filePath.slice(7));
      // 读取文件内容
      const fileContent = fs.readFileSync(filePath.slice(7));
      // 将文件内容转换为 base64 格式
      const base64Data = fileContent.toString("base64");
      // 构建 data URI
      const dataUri = `data:image/jpeg;base64,${base64Data}`;
      // yu copy
      return dataUri;
    } catch (error) {
      console.error("Error reading file:", error.message);
      return "";
    }
  }

  async function getClipBoardContent() {
    {
      const currentClipboardHTML = clipboard.readHTML();
      const availableFormats = clipboard.availableFormats();
      const allWindows = BrowserWindow.getAllWindows();
      const active = await getActiveApplication();

      // 截图 / 复制图片？
      if (
        availableFormats.includes("image/png") ||
        availableFormats.includes("text/uri-list")
      ) {
        // console.log(clipboard.read('NSFilenamesPboardType'))
        const url = availableFormats.includes("image/png")
          ? clipboard.readImage().toDataURL()
          : fileToBase64(clipboard.read("public.file-url"));
        if (!allWindows.length || lastImageInfo === url) return;
        lastImageInfo = url;
        allWindows[0].webContents.send("clipboard-changed", {
          type: "image",
          url,
          active,
        });
      } else {
        // 走复制内容
        if (currentClipboardHTML !== lastClipboardHTML) {
          lastClipboardHTML = currentClipboardHTML;
          // 数据发送给渲染进程
          if (!allWindows.length) return;
          allWindows[0].webContents.send("clipboard-changed", {
            type: "plain",
            text: clipboard.readText(),
            html: currentClipboardHTML,
            active,
          });
        }
      }
    }
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });

  app.on("browser-window-focus", () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      console.log("Focused Window:", focusedWindow.getTitle());
    }
  });
  const contextMenuTemplate = [
    { label: "菜单项1", click: () => console.log("点击了菜单项1") },
    { label: "菜单项2", click: () => console.log("点击了菜单项2") },
    {
      label: "添加标签",
      submenu: [
        { label: "标签 1", click: () => console.log("点击了标签 1") },
        { label: "标签 2", click: () => console.log("点击了标签 2") },
      ],
    },
    { type: "separator" },
    { label: "退出应用", role: "quit" },
  ];
  // @ts-ignore
  const contextMenu = Menu.buildFromTemplate(contextMenuTemplate);

  ipcMain.on("show-context-menu", (event, position) => {
    contextMenu.popup({ window: win, ...position });
  });

  // console.log("init")
  
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}

app.whenReady().then(createWindow);

ipcMain.on("use-copy-content", (_event, copied) => {
  // console.log(copied)
  clipboard.writeText(copied);
});

ipcMain.on("open-application", (event) => {
  // robotjs.typeString('我是内容')
  // console.log('open', robot)
  clipboard.writeText("我是内容");
  // 获取应用焦点
  const NOTIFICATION_TITLE = "Basic Notification";
  const NOTIFICATION_BODY = "Notification from the Main process";

  new Notification({
    title: NOTIFICATION_TITLE,
    body: NOTIFICATION_BODY,
  }).show();
  // 插入内容

  // dialog.showOpenDialog({
  //   properties: ['openFile'],
  //   filters: [
  //     { name: 'Applications', extensions: ['exe', 'app'] }
  //   ]
  // }).then(async result => {
  //   // result.filePaths 包含用户选择的文件路径
  //   if (!result.canceled && result.filePaths.length > 0) {
  //     const filePath = result.filePaths[0];
  //     const info = getAppInformation(filePath)
  //     event.reply('selected-file', info);
  //   }
  // }).catch(err => {
  //   console.log(err);
  // });
});

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// New window example arg: new windows url
ipcMain.handle("open-win", (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});
