// ElevenLabs Neural TTS + Web Audio & Speech Synthesis / Recognition helper for Jaipuria Medhavi

let activeAudioElement: HTMLAudioElement | null = null;

export function playScholarlyChime(mode: 'start' | 'stop' | 'playback' = 'start'): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const frequencies =
      mode === 'start'
        ? [523.25, 659.25, 783.99] // C5 -> E5 -> G5
        : mode === 'stop'
        ? [783.99, 659.25, 523.25] // G5 -> E5 -> C5
        : [440, 554.37, 659.25, 880]; // A4 major triad

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.26);
    });
  } catch {
    // Ignore audio context autoplay restrictions
  }
}

export function stripMarkdownForSpeech(markdownText: string): string {
  return markdownText
    .replace(/<medhavi_logic>[\s\S]*?<\/medhavi_logic>/gi, '')
    .replace(/<medhavi_quiz>[\s\S]*?<\/medhavi_quiz>/gi, '')
    .replace(/<medhavi_evaluation>[\s\S]*?<\/medhavi_evaluation>/gi, '')
    .replace(/```[\s\S]*?```/g, 'Code block provided in the scholarly workspace.')
    .replace(/[#*_`>|~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function speakWithBrowserFallback(
  cleanText: string,
  options?: {
    rate?: number;
    onStart?: () => void;
    onEnd?: () => void;
  }
): () => void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 750));
      utterance.rate = options?.rate || 1.04;
      utterance.pitch = 1.02;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find((v) => v.lang.includes('en-IN') || v.name.toLowerCase().includes('india')) ||
        voices.find((v) => v.lang.startsWith('en-GB') || v.lang.startsWith('en-US')) ||
        voices[0];

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        options?.onEnd?.();
      };

      utterance.onstart = () => options?.onStart?.();
      utterance.onend = finish;
      utterance.onerror = finish;

      options?.onStart?.();
      window.speechSynthesis.speak(utterance);

      const fallbackDuration = Math.min(12000, Math.max(2500, cleanText.length * 42));
      const timer = window.setTimeout(finish, fallbackDuration);

      return () => {
        window.clearTimeout(timer);
        window.speechSynthesis.cancel();
        finish();
      };
    } catch {
      // Fallback below
    }
  }

  options?.onStart?.();
  const fallbackTimer = window.setTimeout(() => {
    options?.onEnd?.();
  }, 3000);

  return () => {
    window.clearTimeout(fallbackTimer);
    options?.onEnd?.();
  };
}

export function speakScholarlyText(
  text: string,
  options?: {
    rate?: number;
    onStart?: () => void;
    onEnd?: () => void;
  }
): () => void {
  const clean = stripMarkdownForSpeech(text);
  if (!clean) {
    options?.onEnd?.();
    return () => {};
  }

  stopAllScholarlySpeech();
  playScholarlyChime('playback');

  let cancelled = false;
  let cleanupFallback: (() => void) | null = null;

  options?.onStart?.();

  // Call server-side ElevenLabs Neural TTS proxy (/api/tts) first
  fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: clean.slice(0, 850) })
  })
    .then(async (res) => {
      if (cancelled) return;
      if (!res.ok) throw new Error('TTS HTTP error');
      const data = await res.json();
      if (cancelled) return;

      if (data.provider === 'elevenlabs' && data.audioDataUrl) {
        const audio = new Audio(data.audioDataUrl);
        audio.playbackRate = options?.rate || 1.0;
        activeAudioElement = audio;

        const finishAudio = () => {
          if (activeAudioElement === audio) {
            activeAudioElement = null;
          }
          if (!cancelled) {
            options?.onEnd?.();
          }
        };

        audio.onended = finishAudio;
        audio.onerror = () => {
          if (activeAudioElement === audio) activeAudioElement = null;
          if (!cancelled) {
            cleanupFallback = speakWithBrowserFallback(clean, options);
          }
        };

        await audio.play().catch(() => {
          if (!cancelled) {
            cleanupFallback = speakWithBrowserFallback(clean, options);
          }
        });
      } else {
        cleanupFallback = speakWithBrowserFallback(clean, options);
      }
    })
    .catch(() => {
      if (!cancelled) {
        cleanupFallback = speakWithBrowserFallback(clean, options);
      }
    });

  return () => {
    cancelled = true;
    if (activeAudioElement) {
      try {
        activeAudioElement.pause();
        activeAudioElement.src = '';
      } catch {
        // ignore
      }
      activeAudioElement = null;
    }
    cleanupFallback?.();
    options?.onEnd?.();
  };
}

export function stopAllScholarlySpeech(): void {
  try {
    if (activeAudioElement) {
      activeAudioElement.pause();
      activeAudioElement.src = '';
      activeAudioElement = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch {
    // ignore
  }
}
