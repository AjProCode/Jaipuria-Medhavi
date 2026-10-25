import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  Sparkles,
  Square
} from 'lucide-react';
import {
  playScholarlyChime,
  speakScholarlyText,
  stopAllScholarlySpeech
} from '../utils/voiceAudioEngine';

interface VoiceChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight: boolean;
  subject: string;
  scholarName: string;
  onSendVoiceMessage: (spokenText: string, onResponseReady?: (replyText: string) => void) => void;
}

type VoiceChatState = 'idle' | 'listening' | 'reasoning' | 'speaking';

const VOICE_STARTER_PROMPTS = [
  'Who are you? Introduce yourself as Jaipuria Medhavi.',
  'Explain why the sum of angles in a Class 7 triangle is 180 degrees.',
  'Give me a quick 60-second revision of heat transfer by conduction, convection, and radiation.',
  "How many r's are in the word strawberry? Walk through it step by step."
];

export const VoiceChatModal: React.FC<VoiceChatModalProps> = ({
  isOpen,
  onClose,
  isLight,
  subject,
  scholarName,
  onSendVoiceMessage
}) => {
  const [voiceState, setVoiceState] = useState<VoiceChatState>('idle');
  const [spokenDraft, setSpokenDraft] = useState<string>('');
  const [lastAssistantReply, setLastAssistantReply] = useState<string>(
    `Namaste ${scholarName}! I am Jaipuria Medhavi (मेधावी), your Class 7 High-Logic AI Scholar. Tap the microphone or pick a spoken question below to converse with me.`
  );
  const [voiceMuted, setVoiceMuted] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1.05);
  const [waveBars, setWaveBars] = useState<number[]>([
    24, 48, 72, 36, 84, 62, 40, 90, 56, 38, 76, 50, 32, 68, 44, 28
  ]);

  const recognitionRef = useRef<any>(null);
  const stopSpeakRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopAllScholarlySpeech();
      setVoiceState('idle');
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (voiceState === 'idle') return;
    const timer = window.setInterval(() => {
      setWaveBars((prev) =>
        prev.map((_, idx) => {
          const swing = 22 + ((idx * 23 + Date.now()) % 72);
          return Math.min(96, Math.max(18, swing));
        })
      );
    }, 280);
    return () => window.clearInterval(timer);
  }, [voiceState]);

  if (!isOpen) return null;

  const handleStartListening = () => {
    stopAllScholarlySpeech();
    playScholarlyChime('start');
    setVoiceState('listening');
    setSpokenDraft('');

    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        const rec = new SpeechRec();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = 'en-IN';
        rec.onresult = (event: any) => {
          let text = '';
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript + ' ';
          }
          if (text.trim()) {
            setSpokenDraft(text.trim());
          }
        };
        rec.onerror = () => {
          setSpokenDraft((curr) =>
            curr.trim()
              ? curr
              : `Explain the core Class 7 ${subject} concepts for my upcoming unit test.`
          );
        };
        rec.start();
        recognitionRef.current = rec;
      } catch {
        // Fallback below
      }
    }

    setTimeout(() => {
      setSpokenDraft((curr) =>
        curr.trim()
          ? curr
          : `Explain the core Class 7 ${subject} concepts for my upcoming unit test.`
      );
    }, 900);
  };

  const handleStopAndAsk = (overridePrompt?: string) => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    const finalPrompt = (overridePrompt ?? spokenDraft).trim();
    if (!finalPrompt) {
      setVoiceState('idle');
      return;
    }

    playScholarlyChime('stop');
    setSpokenDraft(finalPrompt);
    setVoiceState('reasoning');

    onSendVoiceMessage(finalPrompt, (replyText: string) => {
      setLastAssistantReply(replyText);
      if (!voiceMuted) {
        setVoiceState('speaking');
        stopSpeakRef.current = speakScholarlyText(replyText, {
          rate: speechRate,
          onEnd: () => setVoiceState('idle')
        });
      } else {
        setVoiceState('idle');
      }
    });
  };

  const handleStopSpeaking = () => {
    stopSpeakRef.current?.();
    stopAllScholarlySpeech();
    setVoiceState('idle');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Live Voice Chat with Jaipuria Medhavi"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xl"
    >
      <div
        className={`liquid-glass-elevated w-full max-w-2xl rounded-2xl p-6 sm:p-8 space-y-6 relative ${
          isLight ? 'text-slate-900' : 'text-slate-100'
        }`}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-amber-400">
              ELEVENLABS NEURAL VOICE · CLASS 7 {subject.toUpperCase()}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display">
              Jaipuria Medhavi Voice Studio
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!voiceMuted) {
                  handleStopSpeaking();
                }
                setVoiceMuted((prev) => !prev);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-700/70 hover:border-amber-400/60"
            >
              {voiceMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  <span>Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Voice On</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setSpeechRate((prev) => (prev === 1.05 ? 1.2 : 1.05));
              }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-mono border border-slate-700/70 hover:border-amber-400/60"
            >
              {speechRate === 1.05 ? '1.0x' : '1.2x'}
            </button>

            <button
              type="button"
              onClick={() => {
                handleStopSpeaking();
                onClose();
              }}
              aria-label="Close Voice Chat"
              className="p-2 rounded-xl border border-slate-700/70 hover:border-rose-400/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Liquid Glass Acoustic Orb & Waveform Centerpiece */}
        <div className="liquid-glass rounded-2xl p-6 flex flex-col items-center text-center space-y-5">
          <div className="relative flex items-center justify-center">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center border transition-all duration-500 ${
                voiceState === 'listening'
                  ? 'border-rose-400 bg-rose-500/20 shadow-[0_0_45px_rgba(244,63,94,0.45)] scale-105'
                  : voiceState === 'reasoning'
                  ? 'border-sky-400 bg-sky-500/20 shadow-[0_0_45px_rgba(56,189,248,0.45)] animate-pulse'
                  : voiceState === 'speaking'
                  ? 'border-amber-400 bg-amber-500/25 shadow-[0_0_50px_rgba(251,191,36,0.5)] scale-105'
                  : 'border-amber-400/50 bg-amber-500/10 shadow-[0_0_25px_rgba(251,191,36,0.2)]'
              }`}
            >
              {voiceState === 'listening' ? (
                <Mic className="w-9 h-9 text-rose-400" />
              ) : voiceState === 'speaking' ? (
                <Volume2 className="w-9 h-9 text-amber-400" />
              ) : (
                <Sparkles className="w-9 h-9 text-amber-400" />
              )}
            </div>
          </div>

          <div className="text-xs font-mono uppercase tracking-widest text-amber-400">
            {voiceState === 'listening'
              ? 'LISTENING TO YOUR CLASS 7 QUESTION...'
              : voiceState === 'reasoning'
              ? 'NEMOTRON 3.5 SUPER VL HIGH-LOGIC REASONING...'
              : voiceState === 'speaking'
              ? 'JAIPURIA MEDHAVI SPEAKING STEP-BY-STEP...'
              : 'TAP MICROPHONE OR SELECT A VOICE PROMPT'}
          </div>

          {/* Dynamic 16-Bar Acoustic Spectrum */}
          <div className="flex items-end justify-center gap-1.5 h-10 w-full max-w-md">
            {waveBars.map((h, i) => (
              <div
                key={i}
                className={`w-1.5 rounded-full transition-all duration-200 ${
                  voiceState === 'listening'
                    ? 'bg-rose-400'
                    : voiceState === 'speaking'
                    ? 'bg-amber-400'
                    : voiceState === 'reasoning'
                    ? 'bg-sky-400'
                    : 'bg-slate-600/50'
                }`}
                style={{
                  height: `${voiceState === 'idle' ? 22 : h}%`
                }}
              />
            ))}
          </div>

          {/* Live Transcript / Response Readout */}
          <div
            className={`w-full rounded-xl border p-4 text-left text-xs sm:text-sm max-h-40 overflow-y-auto leading-relaxed ${
              isLight
                ? 'bg-white/80 border-slate-200 text-slate-800'
                : 'bg-slate-950/65 border-slate-800/90 text-slate-200'
            }`}
          >
            <div className="text-[11px] font-mono uppercase text-amber-400 mb-1">
              {voiceState === 'listening' ? 'YOUR SPOKEN INPUT' : 'MEDHAVI VOICE TRANSCRIPT'}
            </div>
            <div>
              {voiceState === 'listening'
                ? spokenDraft || 'Speak now...'
                : lastAssistantReply.slice(0, 460) +
                  (lastAssistantReply.length > 460 ? '...' : '')}
            </div>
          </div>

          {/* Primary Voice Control Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full">
            {voiceState !== 'listening' ? (
              <button
                type="button"
                onClick={handleStartListening}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all"
              >
                <Mic className="w-4 h-4" />
                <span>Start Speaking</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleStopAndAsk()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-rose-500 text-white hover:bg-rose-400 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Send Spoken Question</span>
              </button>
            )}

            {voiceState === 'speaking' && (
              <button
                type="button"
                onClick={handleStopSpeaking}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-rose-500/50 bg-rose-500/15 text-rose-300"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Reading Aloud</span>
              </button>
            )}

            {voiceState === 'idle' && lastAssistantReply && (
              <button
                type="button"
                onClick={() => {
                  setVoiceState('speaking');
                  stopSpeakRef.current = speakScholarlyText(lastAssistantReply, {
                    rate: speechRate,
                    onEnd: () => setVoiceState('idle')
                  });
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium border border-slate-700 hover:border-amber-400/60"
              >
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span>Replay Voice Response</span>
              </button>
            )}
          </div>
        </div>

        {/* Manual / Spoken Draft Input + Instant Voice Prompts */}
        <div className="space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleStopAndAsk(spokenDraft);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={spokenDraft}
              onChange={(e) => setSpokenDraft(e.target.value)}
              placeholder={`Speak or type a Class 7 ${subject} voice prompt...`}
              aria-label="Voice chat question input"
              className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs border outline-none ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900'
                  : 'bg-slate-950/70 border-slate-800 text-slate-100'
              }`}
            />
            <button
              type="submit"
              disabled={!spokenDraft.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-40"
            >
              <span>Ask Voice</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="space-y-1.5">
            <div className="text-[11px] font-mono uppercase text-slate-400">
              INSTANT CLASS 7 VOICE PROMPTS
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VOICE_STARTER_PROMPTS.map((vp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleStopAndAsk(vp)}
                  className={`text-left px-3 py-2 rounded-xl text-xs border transition-colors truncate ${
                    isLight
                      ? 'bg-white/75 border-slate-300 hover:border-amber-500 text-slate-700'
                      : 'bg-slate-900/60 border-slate-800 hover:border-amber-400/60 text-slate-300'
                  }`}
                >
                  &ldquo;{vp}&rdquo;
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
