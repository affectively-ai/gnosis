#!/usr/bin/env python3
"""
Gnosis polyglot execution harness for Python.

Protocol: reads JSON request from stdin, executes the named function,
writes JSON response to stdout.

Request format:
{
  "action": "execute",
  "language": "python",
  "filePath": "/path/to/file.py",
  "functionName": "my_func",
  "args": [1, 2, 3],
  "sourceRange": {"startByte": 0, "endByte": 100}  // optional
}

Response format:
{
  "status": "ok" | "error",
  "value": <result>,
  "stdout": "<captured stdout>",
  "stderr": "<captured stderr>"
}
"""

import sys
import json
import importlib.util
import io
import traceback
import os


def execute_function(file_path, function_name, args):
    """Import a Python file and call the named function with args."""
    # Add the file's directory to sys.path so relative imports work.
    file_dir = os.path.dirname(os.path.abspath(file_path))
    if file_dir not in sys.path:
        sys.path.insert(0, file_dir)

    # Load the module from the file path.
    module_name = os.path.splitext(os.path.basename(file_path))[0]
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load module from {file_path}")

    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)

    # Get the function.
    if not hasattr(module, function_name):
        raise AttributeError(
            f"Module '{module_name}' has no function '{function_name}'"
        )

    func = getattr(module, function_name)
    if not callable(func):
        raise TypeError(f"'{function_name}' is not callable")

    # Call it.
    return func(*args)


def main():
    raw_input = sys.stdin.read()
    if not raw_input.strip():
        json.dump(
            {"status": "error", "value": "empty input", "stdout": "", "stderr": ""},
            sys.stdout,
        )
        return

    try:
        request = json.loads(raw_input)
    except json.JSONDecodeError as e:
        json.dump(
            {
                "status": "error",
                "value": f"invalid JSON input: {e}",
                "stdout": "",
                "stderr": "",
            },
            sys.stdout,
        )
        return

    action = request.get("action", "execute")
    if action == "ping":
        json.dump(
            {"status": "ok", "value": "pong", "stdout": "", "stderr": ""},
            sys.stdout,
        )
        return

    file_path = request.get("filePath", "")
    function_name = request.get("functionName", "main")
    args = request.get("args", [])

    # Capture stdout/stderr during execution.
    captured_stdout = io.StringIO()
    captured_stderr = io.StringIO()
    old_stdout = sys.stdout
    old_stderr = sys.stderr

    try:
        sys.stdout = captured_stdout
        sys.stderr = captured_stderr

        result = execute_function(file_path, function_name, args)

        sys.stdout = old_stdout
        sys.stderr = old_stderr

        # Serialize the result.
        try:
            json.dumps(result)
            value = result
        except (TypeError, ValueError):
            value = str(result)

        json.dump(
            {
                "status": "ok",
                "value": value,
                "stdout": captured_stdout.getvalue(),
                "stderr": captured_stderr.getvalue(),
            },
            sys.stdout,
        )

    except Exception:
        sys.stdout = old_stdout
        sys.stderr = old_stderr

        json.dump(
            {
                "status": "error",
                "value": traceback.format_exc(),
                "stdout": captured_stdout.getvalue(),
                "stderr": captured_stderr.getvalue(),
            },
            sys.stdout,
        )


if __name__ == "__main__":
    main()
