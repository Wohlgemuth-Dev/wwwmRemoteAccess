package systemmanager

import (
	"github.com/gofiber/fiber/v2"
	"github.com/shirou/gopsutil/v3/net"
)

type NetworkResponse struct {
	Counters   []net.IOCountersStat `json:"counters"`
	Interfaces []net.InterfaceStat  `json:"interfaces"`
}

func NetworkHandler(c *fiber.Ctx) error {
	counters, err := net.IOCounters(true)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to get network stats"})
	}

	interfaces, err := net.Interfaces()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to get network interfaces"})
	}

	return c.JSON(NetworkResponse{
		Counters:   counters,
		Interfaces: interfaces,
	})
}
