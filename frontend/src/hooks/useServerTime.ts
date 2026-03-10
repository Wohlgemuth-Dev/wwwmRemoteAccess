import { useState, useEffect } from 'react';
import { apiClient } from '../service/api/client';

export interface ClockResponse {
    status: string;
    time: string;
}

const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};

export const useServerTime = (syncIntervalMs = 30000) => {
    const [systemTime, setSystemTime] = useState<string>('--:--:--');

    useEffect(() => {
        let currentLocalTime: Date | null = null;

        const fetchTime = async () => {
            try {
                const response = await apiClient.get<ClockResponse>('/api/clock');
                if (response.status === 'success') {
                    const [h, m, s] = response.time.split(':').map(Number);
                    const now = new Date();
                    now.setHours(h, m, s, 0);
                    currentLocalTime = now;
                    setSystemTime(formatTime(now));
                }
            } catch (error) {
                console.error('Error fetching system time:', error);
            }
        };

        fetchTime();
        const syncInterval = setInterval(fetchTime, syncIntervalMs);

        const tickInterval = setInterval(() => {
            if (currentLocalTime) {
                currentLocalTime = new Date(currentLocalTime.getTime() + 1000);
                setSystemTime(formatTime(currentLocalTime));
            }
        }, 1000);

        return () => {
            clearInterval(syncInterval);
            clearInterval(tickInterval);
        };
    }, [syncIntervalMs]);

    return systemTime;
};
