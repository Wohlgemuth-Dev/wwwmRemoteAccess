package handlers

import (
	"fmt"
	"os/exec"
	"syscall"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
)

func getLocalString(c any, key string) (string, error) {
	switch ctx := c.(type) {
	case *fiber.Ctx:
		val, ok := ctx.Locals(key).(string)
		if !ok {
			return "", fmt.Errorf("key '%s' not found or not a string", key)
		}
		return val, nil
	case *websocket.Conn:
		val, ok := ctx.Locals(key).(string)
		if !ok {
			return "", fmt.Errorf("key '%s' not found or not a string", key)
		}
		return val, nil
	default:
		return "", fmt.Errorf("unsupported context type: %T", c)
	}
}

func getLocalUint32(c any, key string) (uint32, error) {
	switch ctx := c.(type) {
	case *fiber.Ctx:
		val, ok := ctx.Locals(key).(uint32)
		if !ok {
			return 0, fmt.Errorf("key '%s' not found or not a uint32", key)
		}
		return val, nil
	case *websocket.Conn:
		val, ok := ctx.Locals(key).(uint32)
		if !ok {
			return 0, fmt.Errorf("key '%s' not found or not a uint32", key)
		}
		return val, nil
	default:
		return 0, fmt.Errorf("unsupported context type: %T", c)
	}
}

func SetupCmd(context any, cmdName string, args ...string) (*exec.Cmd, error) {
	username, err := getLocalString(context, "username")
	if err != nil {
		return nil, err
	}

	homedir, err := getLocalString(context, "homeDir")
	if err != nil {
		return nil, err
	}

	uid, err := getLocalUint32(context, "uid")
	if err != nil {
		return nil, err
	}

	gid, err := getLocalUint32(context, "gid")
	if err != nil {
		return nil, err
	}

	cmd := exec.Command(cmdName, args...)

	cmd.SysProcAttr = &syscall.SysProcAttr{
		Credential: &syscall.Credential{
			Uid: uid,
			Gid: gid,
		},
	}

	// Setup environment for the child process
	cmd.Env = []string{
		"HOME=" + homedir,
		"USER=" + username,
		"PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
	}

	return cmd, nil
}
