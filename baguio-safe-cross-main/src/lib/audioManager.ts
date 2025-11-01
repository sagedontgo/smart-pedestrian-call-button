// Audio utility for generating beeps and text-to-speech
export class AudioManager {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    // Initialize AudioContext on user interaction
    this.initializeAudio();
  }

  private async initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext not supported:', error);
    }
  }

  async ensureAudioContext() {
    if (!this.audioContext) {
      await this.initializeAudio();
    }
    
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  async playBeep(frequency: number = 800, duration: number = 200, fast: boolean = false) {
    if (!this.isEnabled) return;
    
    await this.ensureAudioContext();
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'sine';

    // Set volume
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration / 1000);

    // If fast beep pattern, play multiple beeps
    if (fast) {
      setTimeout(() => this.playBeep(frequency, duration * 0.6), duration * 0.8);
      setTimeout(() => this.playBeep(frequency, duration * 0.6), duration * 1.6);
    }
  }

  async speakText(text: string, language: string = 'en-US') {
    if (!this.isEnabled) return;
    
    // Check if browser supports speech synthesis
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language
    utterance.lang = language === 'fil' ? 'fil-PH' : 'en-US';
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    // Try to find appropriate voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith(language === 'fil' ? 'fil' : 'en')
    ) || voices.find(voice => voice.default);
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);

    return new Promise<void>((resolve) => {
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
    });
  }

  async playWaitSignal(language: string = 'en') {
    // Slow beep pattern for "do not cross"
    await this.playBeep(400, 500, false);
    setTimeout(() => this.playBeep(400, 500, false), 1000);
  }

  async playCrossSignal(language: string = 'en') {
    // Fast beep pattern for "safe to cross"
    await this.playBeep(800, 200, true);
  }

  async playAudioCue(message: string, language: string = 'en', isCrossingSignal: boolean = false) {
    if (!this.isEnabled) return;

    try {
      // Play beep pattern first
      if (isCrossingSignal) {
        await this.playCrossSignal(language);
        // Wait a bit before speech
        setTimeout(async () => {
          await this.speakText(message, language);
        }, 800);
      } else {
        await this.playWaitSignal(language);
        // Wait a bit before speech
        setTimeout(async () => {
          await this.speakText(message, language);
        }, 1200);
      }
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      window.speechSynthesis?.cancel();
    }
  }

  isAudioEnabled(): boolean {
    return this.isEnabled;
  }
}

// Create singleton instance
export const audioManager = new AudioManager();