// frontend/main.js
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const fsSync = require("fs"); // for sync reads where necessary

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
  // mainWindow.webContents.openDevTools();
}

// IPC: open file dialog
ipcMain.handle("dialog:openFile", async () => {
  const res = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
  { name: "OpenCode Files", extensions: ["oc", "opencode", "dev"] },
  { name: "All Files", extensions: ["*"] }
]

  });
  if (res.canceled) return { canceled: true };
  const filePath = res.filePaths[0];
  const content = await fs.readFile(filePath, { encoding: "utf8" });
  return { canceled: false, path: filePath, content };
});

// IPC: save file as
ipcMain.handle("dialog:saveFileAs", async (event, { defaultName }) => {
  const res = await dialog.showSaveDialog({
    defaultPath: defaultName || "untitled.oc",
    filters: [{ name: "Code", extensions: ["py", "oc", "txt"] }, { name: "All Files", extensions: ["*"] }]
  });
  if (res.canceled || !res.filePath) return { canceled: true };
  return { canceled: false, filePath: res.filePath };
});

// IPC: save file (write)
ipcMain.handle("file:write", async (event, { path: filePath, content }) => {
  try {
    await fs.writeFile(filePath, content, { encoding: "utf8" });
    return { ok: true, path: filePath };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});
