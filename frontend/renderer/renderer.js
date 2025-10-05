// --- Load Monaco Editor ---
require.config({
  paths: { vs: "../node_modules/monaco-editor/min/vs" },
});

let editor;
let theme = "vs-dark";
let currentFile = "untitled.oc";

// Utility: logging output
function log(msg) {
  const bottom = document.getElementById("output");
  bottom.textContent = msg;
}

// --- Monaco Setup ---
require(["vs/editor/editor.main"], async function () {
  editor = monaco.editor.create(document.getElementById("editor"), {
    value: "# Welcome to OpenCode IDE\nprint hi",
    language: "opencode",
    theme,
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 15,
  });

  editor.focus();

  // --- Custom Language Definition ---
  monaco.languages.register({ id: "opencode" });

  monaco.languages.setMonarchTokensProvider("opencode", {
    tokenizer: {
      root: [
        [/\b(print|add|let|get|repeat|uppercase)\b/, "keyword"],
        [/#.*/, "comment"],
        [/"([^"\\]|\\.)*$/, "string.invalid"],
        [/"([^"\\]|\\.)*"/, "string"],
        [/\b\d+(\.\d+)?\b/, "number"],
        [/[a-zA-Z_][\w-]*/, "identifier"],
      ],
    },
  });

  monaco.languages.registerCompletionItemProvider("opencode", {
    provideCompletionItems: () => ({
      suggestions: [
        {
          label: "print",
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: "print ",
          documentation: "Print text to the output.",
        },
        {
          label: "add",
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: "add ",
          documentation: "Add two numbers: add 5 6",
        },
        {
          label: "repeat",
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: "repeat ",
          documentation: "Repeat a word multiple times: repeat hi 3",
        },
        {
          label: "uppercase",
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: "uppercase ",
          documentation: "Convert text to uppercase.",
        },
      ],
    }),
  });

  monaco.languages.registerHoverProvider("opencode", {
    provideHover: function (model, position) {
      const word = model.getWordAtPosition(position)?.word;
      if (word === "print") {
        return {
          contents: [{ value: "**print** — Outputs text to the console." }],
        };
      }
      if (word === "add") {
        return {
          contents: [{ value: "**add** — Adds two numbers. Usage: `add 5 6`" }],
        };
      }
      if (word === "repeat") {
        return {
          contents: [{ value: "**repeat** — Repeats a word multiple times." }],
        };
      }
      if (word === "uppercase") {
        return {
          contents: [{ value: "**uppercase** — Converts text to uppercase." }],
        };
      }
      return null;
    },
  });

  // --- Fetch Sidebar Functions ---
  async function loadFunctions() {
    try {
      const res = await fetch("http://127.0.0.1:5000/functions");
      const data = await res.json();
      const funcList = document.getElementById("funcList");
      funcList.innerHTML = "";
      data.forEach((f) => {
        const li = document.createElement("li");
        li.textContent = f;
        li.onclick = () => {
          const currentVal = editor.getValue();
          editor.setValue(`${currentVal}\n${f} `);
          editor.focus();
        };
        funcList.appendChild(li);
      });
    } catch (err) {
      console.error(err);
      document.getElementById("funcList").innerHTML =
        "<li style='color:red;'>Failed to load functions.</li>";
    }
  }

  await loadFunctions();

  // --- Button Handlers ---
  document.getElementById("runBtn").onclick = async () => {
    log("Running...");
    const code = editor.getValue();
    try {
      const res = await fetch("http://127.0.0.1:5000/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const result = await res.json();
      log(result.output || "[No output]");
    } catch (err) {
      log("[Error] " + err.message);
    }
  };

  document.getElementById("themeBtn").onclick = () => {
    theme = theme === "vs-dark" ? "vs" : "vs-dark";
    monaco.editor.setTheme(theme);
  };

  document.getElementById("newBtn").onclick = () => {
    editor.setValue("");
    currentFile = "untitled.oc";
    log("New file ready.");
  };

  document.getElementById("saveBtn").onclick = async () => {
    const content = editor.getValue();
    await window.api.saveFile({ content, defaultName: currentFile });
    log(`Saved ${currentFile}`);
  };

  document.getElementById("saveAsBtn").onclick = async () => {
    const content = editor.getValue();
    const result = await window.api.saveFileAs({
      content,
      defaultName: "untitled.oc",
    });
    if (!result.canceled && result.filePath) {
      currentFile = result.filePath;
      log(`Saved as ${currentFile}`);
    }
  };

  document.getElementById("openBtn").onclick = async () => {
    const res = await window.api.openFile();
    if (!res.canceled && res.content) {
      editor.setValue(res.content);
      currentFile = res.path;
      log(`Opened: ${res.path}`);
    } else {
      log("Open canceled.");
    }
  };

  editor.onDidChangeCursorPosition(() => {
    const pos = editor.getPosition();
    document.getElementById(
      "status"
    ).textContent = `Ln ${pos.lineNumber}, Col ${pos.column}`;
  });
});
