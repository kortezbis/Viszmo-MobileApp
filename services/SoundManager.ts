import { Audio } from 'expo-av';

const SOUNDS: any = {
    // correct: require('../assets/sounds/correct.mp3'),
};

export const playSound = async (soundName: string) => {
    try {
        if (!SOUNDS[soundName]) return;

        const { sound } = await Audio.Sound.createAsync(SOUNDS[soundName]);
        await sound.playAsync();

        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
                sound.unloadAsync();
            }
        });
    } catch (error) {
        console.log('Error playing sound:', error);
    }
};
