package systemmanager

import (
	"path/filepath"
	"regexp"

	"github.com/gofiber/fiber/v2"
	"github.com/shirou/gopsutil/v3/disk"
)

type DiskDeviceStat struct {
	Name        string  `json:"name"`
	Total       uint64  `json:"total"`
	UsedPercent float64 `json:"usedPercent"`
	ReadBytes   uint64  `json:"readBytes"`
	WriteBytes  uint64  `json:"writeBytes"`
}

type DiskResponse struct {
	Devices []DiskDeviceStat `json:"devices"`
}

// normalizeDevice extracts the base device name from a partition device string.
// Examples: /dev/sda1 -> sda, /dev/nvme0n1p1 -> nvme0n1
var deviceSuffixRe = regexp.MustCompile(`^(.*?)(p?\d+)?$`)

func normalizeDevice(devicePath string) string {
	name := filepath.Base(devicePath)
	matches := deviceSuffixRe.FindStringSubmatch(name)
	if len(matches) >= 2 && matches[1] != "" {
		return matches[1]
	}
	return name
}

func DiskHandler(c *fiber.Ctx) error {
	parts, err := disk.Partitions(false)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to get disk partitions"})
	}

	// collect usage per partition and map to base device
	deviceTotals := map[string]uint64{}
	deviceUsedBytes := map[string]uint64{}

	for _, part := range parts {
		usage, err := disk.Usage(part.Mountpoint)
		if err != nil {
			continue
		}
		base := normalizeDevice(part.Device)
		deviceTotals[base] += usage.Total
		// compute used bytes from percent * total
		usedBytes := uint64((usage.UsedPercent / 100.0) * float64(usage.Total))
		deviceUsedBytes[base] += usedBytes
	}

	// get IO counters per device
	ioCounters, _ := disk.IOCounters()

	var devices []DiskDeviceStat
	for base, total := range deviceTotals {
		used := deviceUsedBytes[base]
		usedPercent := 0.0
		if total > 0 {
			usedPercent = (float64(used) / float64(total)) * 100.0
		}

		// ioCounters key is typically the base device name (e.g., sda, nvme0n1)
		io := ioCounters[base]

		devices = append(devices, DiskDeviceStat{
			Name:        base,
			Total:       total,
			UsedPercent: usedPercent,
			ReadBytes:   io.ReadBytes,
			WriteBytes:  io.WriteBytes,
		})
	}

	return c.JSON(DiskResponse{Devices: devices})
}
