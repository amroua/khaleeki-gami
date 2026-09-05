/**
 * Audio & Haptic Feedback for Notifications
 * Synthesizes a pleasant crystal-clear bell chime without relying on external MP3 downloads.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

/**
 * Plays a pleasant notification bell chime and vibrates on mobile device
 */
export function playNotificationSound(): void {
  try {
    // 1. Mobile vibration
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([180, 80, 180]);
      } catch (e) {
        // ignore vibration error
      }
    }

    // 2. Synthesized bell chime
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Harmonic frequencies for a bright, clean mobile notification chime
    const notes = [
      { freq: 880, start: 0, duration: 0.35, gain: 0.25 },     // A5
      { freq: 1318.51, start: 0.08, duration: 0.45, gain: 0.3 }, // E6
      { freq: 1760, start: 0.16, duration: 0.6, gain: 0.22 }    // A6
    ];

    notes.forEach(({ freq, start, duration, gain: peakGain }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(peakGain, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration);
    });
  } catch (err) {
    // Silent fail if audio is blocked
  }
}
