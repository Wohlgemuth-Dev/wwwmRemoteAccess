package systemmanager

import (
	"github.com/gofiber/fiber/v2"
	"github.com/shirou/gopsutil/v3/disk"
)

type DiskResponse struct {
	Partitions []disk.PartitionStat `json:"partitions"`
	Usages     []disk.UsageStat     `json:"usages"`
}

func DiskHandler(c *fiber.Ctx) error {
	parts, err := disk.Partitions(false)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to get disk partitions"})
	}

	var usages []disk.UsageStat
	for _, part := range parts {
		usage, err := disk.Usage(part.Mountpoint)
		if err == nil {
			usages = append(usages, *usage)
		}
	}

	return c.JSON(DiskResponse{
		Partitions: parts,
		Usages:     usages,
	})
}
