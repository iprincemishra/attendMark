import AsyncStorage from "@react-native-async-storage/async-storage"
import { api } from "./api"

const QUEUE_KEY = "offline_attendance_queue";

export interface PendingAttendance {
    sessionCode: string
    deviceId: string
    timestamp: number
    addedAt: number
}

export const attendanceQueue = {
    async enqueue(item: Omit<PendingAttendance, "addedAt">): Promise<void> {
        try {
            const existing = await this.getQueue();

            const alreadyQueued = existing.some((i: any) => i.sessionCode === item.sessionCode)
            if (alreadyQueued) return

            const updated = [...existing, { ...item, addedAt: Date.now() }]
            await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated))
        } catch (err) {
            console.error("Failed to enqueue offline attendance:", err)
        }
    },

    async getQueue(): Promise<PendingAttendance[]> {
        try {
            const raw = await AsyncStorage.getItem(QUEUE_KEY)
            return raw ? JSON.parse(raw) : [];
        } catch (error) {
            return []
        }
    },

    async processQueue(): Promise<{ synced: number; failed: number }> {
        const queue = await this.getQueue();
        if (queue.length === 0) return { synced: 0, failed: 0 }

        const remaining: PendingAttendance[] = []
        let synced = 0;
        let failed = 0;

        for (const record of queue) {
            try {
                const response = await api.post("/attendance/mark", {
                    sessionCode: record.sessionCode,
                    deviceId: record.deviceId,
                    timestamp: record.timestamp,
                })

                if (response.data.success) {
                    synced++;
                } else {
                    failed++;
                }
            } catch (err: any) {
                const status = err.response?.status;
                const errMsg = err.response?.data?.message || "";

                if (
                    status === 400 ||
                    status === 403 ||
                    status === 404 ||
                    errMsg.includes("already marked") ||
                    errMsg.includes("expired")
                ) {
                    failed++;
                } else {
                    remaining.push(record)
                }
            }
        }
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
        return { synced, failed };

    }
}