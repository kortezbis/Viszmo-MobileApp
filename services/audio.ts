import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export class AudioService {
    private recording: Audio.Recording | null = null;
    private isBackgroundModeEnabled = false;

    async requestPermissions(): Promise<boolean> {
        const { status } = await Audio.requestPermissionsAsync();
        return status === 'granted';
    }

    async startRecording() {
        try {
            // 1. Hardware Engagement & Audio Mode Setup
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
            });

            // 2. Configure for High-Quality AI Transcription (Mono, Optimized for Gemini)
            const recordingOptions = Audio.RecordingOptionsPresets.HIGH_QUALITY;

            const { recording } = await Audio.Recording.createAsync(recordingOptions);
            this.recording = recording;
            console.log('Recording started, temporary storage at:', recording.getURI());
        } catch (err) {
            console.error('Failed to start recording', err);
            throw new Error('Could not engage hardware for recording.');
        }
    }

    async stopRecording(): Promise<string | null> {
        try {
            if (!this.recording) return null;

            await this.recording.stopAndUnloadAsync();
            const uri = this.recording.getURI();

            // Clean up global audio mode
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                staysActiveInBackground: false,
            });

            this.recording = null;
            return uri;
        } catch (err) {
            console.error('Failed to stop recording', err);
            return null;
        }
    }

    async getBase64(uri: string): Promise<string> {
        return await FileSystem.readAsStringAsync(uri, {
            encoding: 'base64',
        });
    }

    async cleanup(uri: string) {
        try {
            await FileSystem.deleteAsync(uri, { idempotent: true });
        } catch (e) {
            console.warn('Failed to cleanup temp audio file', e);
        }
    }
}

export const audioService = new AudioService();
