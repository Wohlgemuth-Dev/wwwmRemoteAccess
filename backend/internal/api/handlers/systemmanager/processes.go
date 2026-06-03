package systemmanager

import (
	"github.com/gofiber/fiber/v2"
	"github.com/shirou/gopsutil/v3/process"
)

type ProcessInfo struct {
	Pid           int32   `json:"pid"`
	Ppid          int32   `json:"ppid"`
	Name          string  `json:"name"`
	Username      string  `json:"username"`
	MemoryPercent float32 `json:"memoryPercent"`
	CPUPercent    float64 `json:"cpuPercent"`
	Status        string  `json:"status"` // using string, we'll format it if it's []string
}

type killProcessRequest struct {
	Pid int32 `json:"pid"`
}

func ProcessesHandler(c *fiber.Ctx) error {
	procs, err := process.Processes()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to get processes"})
	}

	var processList []ProcessInfo

	for _, p := range procs {
		name, _ := p.Name()
		username, _ := p.Username()
		mem, _ := p.MemoryPercent()
		cpu, _ := p.CPUPercent()
		ppid, _ := p.Ppid()

		var statusStr string
		status, err := p.Status()
		if err == nil {
			if len(status) > 0 {
				statusStr = status[0]
			}
		}

		processList = append(processList, ProcessInfo{
			Pid:           p.Pid,
			Ppid:          ppid,
			Name:          name,
			Username:      username,
			MemoryPercent: mem,
			CPUPercent:    cpu,
			Status:        statusStr,
		})
	}

	return c.JSON(processList)
}

func KillProcessHandler(c *fiber.Ctx) error {
	var req killProcessRequest
	if err := c.BodyParser(&req); err != nil || req.Pid <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid pid"})
	}

	p, err := process.NewProcess(req.Pid)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "process not found"})
	}

	if err := p.Kill(); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to kill process"})
	}

	return c.JSON(fiber.Map{"ok": true, "pid": req.Pid})
}
