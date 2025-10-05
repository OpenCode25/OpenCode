# backend/interpreter.py
import os
import importlib.util
import sys
import io
from pathlib import Path

def load_commands(functions_dir: Path = None):
    """
    Load all .py modules from functions_dir and return a dict {name: module}.
    If functions_dir is None, default to backend/functions.
    """
    if functions_dir is None:
        functions_dir = Path(__file__).parent / "functions"

    cmds = {}
    if not functions_dir.exists():
        print(f"[Interpreter] functions directory not found: {functions_dir}")
        return cmds

    for filename in os.listdir(functions_dir):
        if not filename.endswith(".py"):
            continue
        cmd_name = filename[:-3]
        file_path = functions_dir / filename
        try:
            spec = importlib.util.spec_from_file_location(cmd_name, str(file_path))
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            cmds[cmd_name] = module
        except Exception as e:
            print(f"[Load Error] Failed to load {cmd_name}: {e}")
    return cmds

def run_code(code_text: str, cmds: dict):
    """
    Execute OpenCode code_text line-by-line.
    Each line: command args...
    Commands map to modules in cmds dict which must implement run(args:list).
    Returns combined stdout (string).
    """
    output_lines = []
    # variables can be used by functions if you pass it; currently kept simple
    for line in code_text.splitlines():
        parts = line.strip().split()
        if not parts:
            continue
        cmd, args = parts[0], parts[1:]
        if cmd in cmds:
            try:
                old_stdout = sys.stdout
                sys.stdout = io.StringIO()
                # call run(args) from module
                cmds[cmd].run(args)
                out = sys.stdout.getvalue()
                sys.stdout = old_stdout
                output_lines.append(out)
            except Exception as e:
                # restore stdout if exception
                try:
                    sys.stdout = old_stdout
                except Exception:
                    pass
                output_lines.append(f"[Error] in {cmd}: {e}\n")
        else:
            output_lines.append(f"[Unknown Command] {cmd}\n")
    return "".join(output_lines)
