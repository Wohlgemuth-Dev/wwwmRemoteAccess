package systemmanager

import (
	"github.com/gofiber/fiber/v2"
	"github.com/shirou/gopsutil/v3/cpu"
)

type CPUResponse struct {
	Percentage float64        `json:"percentage"`
	Info       []cpu.InfoStat `json:"info"`
}

func CPUHandler(c *fiber.Ctx) error {
	percents, err := cpu.Percent(0, true)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to get cpu stats"})
	}

	info, err := cpu.Info()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to get cpu info"})
	}

	percentage := 0.0
	for _, p := range percents {
		percentage += p
	}
	if len(percents) > 0 {
		percentage /= float64(len(percents))
	}

	return c.JSON(CPUResponse{
		Percentage: percentage,
		Info:       info,
	})
}
