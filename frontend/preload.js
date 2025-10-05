// frontend/preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // runCode uses backend HTTP (Flask). We keep this on renderer to use fetch.
  runCode: async (code) => {
    const resp = await fetch("http://localhost:5000/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    return resp.json();
  },

  // file dialogs / writes via IPC to main
  openFile: async () => {
    return await ipcRenderer.invoke("dialog:openFile");
  },

  askSaveFilePath: async ({ defaultName }) => {
    return await ipcRenderer.invoke("dialog:saveFileAs", { defaultName });
  },

  writeFile: async ({ path, content }) => {
    return await ipcRenderer.invoke("file:write", { path, content });
  },
});
