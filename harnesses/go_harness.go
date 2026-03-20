// Gnosis polyglot execution harness for Go.
//
// Protocol: reads JSON request from stdin. For Go files, it shells out to
// `go run <file>` with the function call baked into a temporary wrapper,
// captures the output, and writes JSON response to stdout.
//
// Usage: go run go_harness.go < request.json
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type InvokeRequest struct {
	Action       string        `json:"action"`
	Language     string        `json:"language"`
	FilePath     string        `json:"filePath"`
	FunctionName string        `json:"functionName"`
	Args         []interface{} `json:"args"`
}

type InvokeResponse struct {
	Status string      `json:"status"`
	Value  interface{} `json:"value"`
	Stdout string      `json:"stdout"`
	Stderr string      `json:"stderr"`
}

func writeResponse(resp InvokeResponse) {
	data, _ := json.Marshal(resp)
	os.Stdout.Write(data)
}

func main() {
	input, err := io.ReadAll(os.Stdin)
	if err != nil {
		writeResponse(InvokeResponse{
			Status: "error",
			Value:  fmt.Sprintf("failed to read stdin: %v", err),
		})
		return
	}

	if len(strings.TrimSpace(string(input))) == 0 {
		writeResponse(InvokeResponse{
			Status: "error",
			Value:  "empty input",
		})
		return
	}

	var req InvokeRequest
	if err := json.Unmarshal(input, &req); err != nil {
		writeResponse(InvokeResponse{
			Status: "error",
			Value:  fmt.Sprintf("invalid JSON: %v", err),
		})
		return
	}

	if req.Action == "ping" {
		writeResponse(InvokeResponse{
			Status: "ok",
			Value:  "pong",
		})
		return
	}

	// For Go, we create a temporary wrapper that imports the target package
	// and calls the function, then run it with `go run`.
	absPath, _ := filepath.Abs(req.FilePath)
	dir := filepath.Dir(absPath)

	// Build args string for the function call.
	argParts := make([]string, len(req.Args))
	for i, arg := range req.Args {
		data, _ := json.Marshal(arg)
		argParts[i] = string(data)
	}

	// Simple approach: just `go run` the file directly.
	// The function must be in package main and we call it via a wrapper.
	wrapperSrc := fmt.Sprintf(`package main

import (
	"encoding/json"
	"fmt"
	"os"
)

func main() {
	result := %s(%s)
	data, err := json.Marshal(result)
	if err != nil {
		fmt.Fprintf(os.Stderr, "marshal error: %%v\n", err)
		os.Exit(1)
	}
	fmt.Print(string(data))
}
`, req.FunctionName, strings.Join(argParts, ", "))

	// Write wrapper to temp file in same directory.
	wrapperPath := filepath.Join(dir, fmt.Sprintf(".gnode_wrapper_%d.go", os.Getpid()))
	if err := os.WriteFile(wrapperPath, []byte(wrapperSrc), 0644); err != nil {
		writeResponse(InvokeResponse{
			Status: "error",
			Value:  fmt.Sprintf("failed to write wrapper: %v", err),
		})
		return
	}
	defer os.Remove(wrapperPath)

	// Run: go run <original_file> <wrapper>
	cmd := exec.Command("go", "run", absPath, wrapperPath)
	cmd.Dir = dir

	var stdout, stderr strings.Builder
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err = cmd.Run()
	if err != nil {
		writeResponse(InvokeResponse{
			Status: "error",
			Value:  fmt.Sprintf("go run failed: %v", err),
			Stdout: stdout.String(),
			Stderr: stderr.String(),
		})
		return
	}

	// Try to parse the output as JSON.
	var value interface{}
	if jsonErr := json.Unmarshal([]byte(stdout.String()), &value); jsonErr != nil {
		value = stdout.String()
	}

	writeResponse(InvokeResponse{
		Status: "ok",
		Value:  value,
		Stdout: stdout.String(),
		Stderr: stderr.String(),
	})
}
