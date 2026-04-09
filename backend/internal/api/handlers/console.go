package handlers

import (
	"bufio"
	"log"

	"github.com/gofiber/contrib/websocket"
)

type ConsoleInput struct {
	Token   string `json:"token"`
	Command string `json:"input"`
}

func ConsoleWebSocketHandler(c *websocket.Conn) {
	cmd, err := SetupCmd(c, "bash")
	if err != nil {
		log.Printf("SetupCmd error: %v", err)
		_ = c.WriteMessage(websocket.TextMessage, []byte("Error: Could not setup command\n"))
		return
	}
	stdinPipe, err := cmd.StdinPipe()
	if err != nil {
		log.Printf("Stdin pipe error: %v", err)
		return
	}
	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		log.Printf("Stdout pipe error: %v", err)
		return
	}
	stderrPipe, err := cmd.StderrPipe()
	if err != nil {
		log.Printf("Stderr pipe error: %v", err)
		return
	}

	if err := cmd.Start(); err != nil {
		log.Printf("Command start failed: %v", err)
		if writeErr := c.WriteMessage(websocket.TextMessage, []byte("Error: Could not start command\n")); writeErr != nil {
			log.Printf("Failed to write to websocket: %v", writeErr)
		}
		return
	}

	go func() {
		scanner := bufio.NewScanner(stdoutPipe)
		for scanner.Scan() {
			err := c.WriteMessage(websocket.TextMessage, []byte(scanner.Text()+"\n"))
			if err != nil {
				return
			}
		}
	}()

	go func() {
		scanner := bufio.NewScanner(stderrPipe)
		for scanner.Scan() {
			err := c.WriteMessage(websocket.TextMessage, []byte("ERROR: "+scanner.Text()+"\n"))
			if err != nil {
				return
			}
		}
	}()

	for {
		messageType, msg, err := c.ReadMessage()
		if err != nil {
			break // WebSocket closed or error
		}
		if messageType == websocket.TextMessage || messageType == websocket.BinaryMessage {
			// Ensure commands end with newline to execute directly
			if len(msg) > 0 && msg[len(msg)-1] != '\n' {
				msg = append(msg, '\n')
			}
			_, err = stdinPipe.Write(msg)
			if err != nil {
				break // Pipe closed or error
			}
		}
	}

	_ = cmd.Process.Kill()
	_ = cmd.Wait()
}
