
let audioContext: AudioContext | null = null;
let isInitialized = false;

const initializeAudio = () => {
    if (isInitialized || typeof window === 'undefined') return;
    try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        isInitialized = true;
    } catch (e) {
        console.error("Web Audio API is not supported in this browser");
    }
};

export const initAudioOnInteraction = () => {
    if (!isInitialized) {
        initializeAudio();
    }
};

type SoundType = 'click' | 'toggleOn' | 'toggleOff' | 'open' | 'close' | 'delete' | 'success';

interface SoundConfig {
    frequency: number;
    type: OscillatorType;
    duration: number;
    volume: number;
    endFrequency?: number;
}

const sounds: Record<SoundType, SoundConfig> = {
    click: { frequency: 440, type: 'triangle', duration: 0.05, volume: 0.2 },
    toggleOn: { frequency: 660, type: 'sine', duration: 0.08, volume: 0.3 },
    toggleOff: { frequency: 330, type: 'sine', duration: 0.1, volume: 0.3 },
    open: { frequency: 300, endFrequency: 700, type: 'sine', duration: 0.1, volume: 0.25 },
    close: { frequency: 400, endFrequency: 200, type: 'sine', duration: 0.1, volume: 0.25 },
    delete: { frequency: 500, endFrequency: 200, type: 'sawtooth', duration: 0.15, volume: 0.15 },
    success: { frequency: 523, endFrequency: 880, type: 'sine', duration: 0.2, volume: 0.25 }
};

export const playSound = (sound: SoundType) => {
    if (!audioContext) {
        return;
    }

    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    const config = sounds[sound];
    if (!config) return;

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = config.type;
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(config.volume, now + 0.01);
    
    if (config.endFrequency) {
        oscillator.frequency.setValueAtTime(config.frequency, now);
        oscillator.frequency.exponentialRampToValueAtTime(config.endFrequency, now + config.duration);
    } else {
        oscillator.frequency.setValueAtTime(config.frequency, now);
    }
    
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);
    
    oscillator.start(now);
    oscillator.stop(now + config.duration);
};
