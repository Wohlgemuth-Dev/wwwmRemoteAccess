package systemmanager

import (
	"github.com/gofiber/fiber/v2"
	"github.com/shirou/gopsutil/v3/mem"
)

type MemoryResponse struct {
	Virtual *mem.VirtualMemoryStat `json:"virtual"`
	Swap    *mem.SwapMemoryStat    `json:"swap"`
}

func MemoryHandler(c *fiber.Ctx) error {
	v, err := mem.VirtualMemory()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to get memory stats"})
	}

	s, err := mem.SwapMemory()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to get swap memory stats"})
	}

	return c.JSON(MemoryResponse{
		Virtual: v,
		Swap:    s,
	})
}
