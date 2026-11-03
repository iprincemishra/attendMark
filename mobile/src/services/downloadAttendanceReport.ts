import { api } from './api';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export const downloadAttendanceReport = async (year: string, subject: string) => {
    try {
        const response = await api.get(`/attendance/export`, {
            params: { year, subject },
            responseType: 'text',
        });

        const csvData = response.data;
        const filename = `${year}_${subject}_Attendance.csv`;
        const fileUri = `${FileSystem.documentDirectory}${filename}`;

        await FileSystem.writeAsStringAsync(fileUri, csvData, {
            encoding: FileSystem.EncodingType.UTF8,
        });

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
                mimeType: 'text/csv',
                dialogTitle: 'Download Attendance Report',
                UTI: 'public.comma-separated-values-text',
            });
        }
    } catch (error: any) {
        console.error('Download report error:', error.response?.data || error.message);
        throw error;
    }
};