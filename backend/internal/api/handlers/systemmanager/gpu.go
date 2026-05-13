package systemmanager

import (
	"bytes"
	"os/exec"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
)

// GPUStat struct holds basic GPU metrics
type GPUStat struct {
	Name        string  `json:"name"`
	Utilization float64 `json:"utilization"`
	MemoryTotal uint64  `json:"memoryTotal"`
	MemoryUsed  uint64  `json:"memoryUsed"`
	MemoryFree  uint64  `json:"memoryFree"`
	Temperature float64 `json:"temperature"`
}

type GPUResponse struct {
	GPUs  []GPUStat `json:"gpus"`
	Error string    `json:"error,omitempty"`
}

func GPUHandler(c *fiber.Ctx) error {
	cmd := exec.Command("nvidia-smi", "--query-gpu=name,utilization.gpu,memory.total,memory.used,memory.free,temperature.gpu", "--format=csv,noheader,nounits")
	
	var out bytes.Buffer
	cmd.Stdout = &out

	err := cmd.Run()
	if err != nil {
		
		return c.JSON(GPUResponse{
			GPUs:  []GPUStat{},
			Error: "nvidia-smi not available or failed",
		})
	}

	lines := strings.Split(strings.TrimSpace(out.String()), "\n")
	var gpus []GPUStat

	for _, line := range lines {
		if line == "" {
			continue
		}

		parts := strings.Split(line, ",")
		if len(parts) >= 6 {
			util, _ := strconv.ParseFloat(strings.TrimSpace(parts[1]), 64)
			memTotal, _ := strconv.ParseUint(strings.TrimSpace(parts[2]), 10, 64)
			memUsed, _ := strconv.ParseUint(strings.TrimSpace(parts[3]), 10, 64)
			memFree, _ := strconv.ParseUint(strings.TrimSpace(parts[4]), 10, 64)
			temp, _ := strconv.ParseFloat(strings.TrimSpace(parts[5]), 64)

			gpus = append(gpus, GPUStat{
				Name:        strings.TrimSpace(parts[0]),
				Utilization: util,
				MemoryTotal: memTotal,
				MemoryUsed:  memUsed,
				MemoryFree:  memFree,
				Temperature: temp,
			})
		}
	}

	return c.JSON(GPUResponse{
		GPUs: gpus,
	})
}
