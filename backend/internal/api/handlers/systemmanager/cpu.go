package systemmanager

import (
	"io/ioutil"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/shirou/gopsutil/v3/cpu"
)

type CPUResponse struct {
	Percentage  float64        `json:"percentage"`
	Percentages []float64      `json:"percentages"`
	Info        []cpu.InfoStat `json:"info"`
	CurrentMHz  float64        `json:"current_mhz,omitempty"`
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
		Percentage:  percentage,
		Percentages: percents,
		Info:        info,
		CurrentMHz:  getCurrentMHzFallback(info),
	})
}

// getCurrentMHzFallback attempts to read per-core current frequency from
// sysfs (/sys/devices/system/cpu/cpu*/cpufreq/scaling_cur_freq) and returns
// the average in MHz. If it cannot read values, it falls back to the first
// entry in cpu.Info (which is typically the base MHz reported by the OS).
func getCurrentMHzFallback(info []cpu.InfoStat) float64 {
	matches, err := filepath.Glob("/sys/devices/system/cpu/cpu[0-9]*/cpufreq/scaling_cur_freq")
	if err == nil && len(matches) > 0 {
		var sum int64
		var count int64
		for _, p := range matches {
			data, rerr := ioutil.ReadFile(p)
			if rerr != nil {
				continue
			}
			s := strings.TrimSpace(string(data))
			if s == "" {
				continue
			}
			// scaling_cur_freq is in kHz
			v, perr := strconv.ParseInt(s, 10, 64)
			if perr != nil {
				continue
			}
			sum += v
			count++
		}
		if count > 0 {
			// convert kHz -> MHz
			return float64(sum) / float64(count) / 1000.0
		}
	}

	// fallback to static info if available
	if len(info) > 0 {
		return info[0].Mhz
	}
	return 0
}
