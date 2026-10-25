import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  Mic,
  Square,
  Play,
  Pause,
  Sparkles,
  Check,
  Plus,
  Trash2,
  Search,
  Volume2,
  Send,
  BookOpen,
  FileText,
  Sun
} from 'lucide-react';
import {
  MOCK_SCHOOL_CALENDAR,
  getAllCalendarEvents,
  filterCalendarEvents,
  getDaysRemaining,
  type CalendarEventCategory,
  type CalendarEventItem,
  type VoiceNoteItem
} from '../data/schoolCalendarData';
import { playScholarlyChime, speakScholarlyText, stopAllScholarlySpeech } from '../utils/voiceAudioEngine';

interface AcademicCalendarViewProps {
  isLight: boolean;
  activeSubject: string;
  onLaunchMedhaviPrep: (prompt: string, workflowType?: string) => void;
  onShowToast: (message: string, type?: 'info' | 'error' | 'success') => void;
}

const SAMPLE_VOICE_MEMO_TRANSCRIPTS: Record<string, string> = {
  Mathematics:
    'Class 7 Maths Exam Reminder: Practice exterior angle theorem problems and verify linear equation transposition signs before Nov 2.',
  Physics:
    'Class 7 Physics Lab Note: Emphasize the difference between clinical thermometer range (35°C to 42°C) and laboratory thermometer range (-10°C to 110°C).',
  'Computer Science & AI':
    'Class 7 Python Practical Note: Review range(start, stop, step) syntax and indentation inside nested for loops.',
  Default:
    'Class 7 Medhavi Study Memo: Break down the chapter into core definitions, step-by-step derivations, and 3 Olympiad practice questions.'
};

export const AcademicCalendarView: React.FC<AcademicCalendarViewProps> = ({
  isLight,
  activeSubject,
  onLaunchMedhaviPrep,
  onShowToast
}) => {
  const [events, setEvents] = useState<CalendarEventItem[]>(() => {
    try {
      const saved = localStorage.getItem('medhavi_calendar_events_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return getAllCalendarEvents(MOCK_SCHOOL_CALENDAR);
  });

  const [voiceNotes, setVoiceNotes] = useState<VoiceNoteItem[]>(() => {
    try {
      const saved = localStorage.getItem('medhavi_voice_notes_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return MOCK_SCHOOL_CALENDAR.initialVoiceNotes;
  });

  const [categoryFilter, setCategoryFilter] = useState<'all' | CalendarEventCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string>('exam-math-ut2');

  // Voice Note Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [noteTranscript, setNoteTranscript] = useState<string>('');
  const [liveBars, setLiveBars] = useState<number[]>([
    28, 45, 64, 38, 80, 92, 54, 42, 76, 60, 48, 86, 58, 36, 68, 50
  ]);

  // Voice Note Playback State
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  const stopSpeechRef = useRef<(() => void) | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem('medhavi_calendar_events_v1', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('medhavi_voice_notes_v1', JSON.stringify(voiceNotes));
  }, [voiceNotes]);

  useEffect(() => {
    if (!isRecording) return;
    const interval = window.setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
      setLiveBars((prev) =>
        prev.map((_, idx) => {
          const base = 25 + ((idx * 17 + Date.now()) % 68);
          return Math.min(96, Math.max(18, base));
        })
      );
    }, 350);
    return () => window.clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      stopAllScholarlySpeech();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const filteredEvents = filterCalendarEvents(events, {
    category: categoryFilter,
    searchQuery
  });

  const selectedEvent =
    events.find((e) => e.id === selectedEventId) || filteredEvents[0] || events[0];

  const examCount = events.filter((e) => e.category === 'exam').length;
  const assignmentCount = events.filter((e) => e.category === 'assignment').length;
  const holidayCount = events.filter((e) => e.category === 'holiday').length;

  const handleToggleCompleted = (id: string) => {
    setEvents((prev) =>
      prev.map((ev) => (ev.id === id ? { ...ev, completed: !ev.completed } : ev))
    );
    onShowToast('Updated Class 7 schedule readiness status.', 'success');
  };

  const handleStartVoiceRecording = () => {
    playScholarlyChime('start');
    setIsRecording(true);
    setRecordingSeconds(0);

    const defaultTitle = selectedEvent
      ? `Voice Memo · ${selectedEvent.title.slice(0, 36)}`
      : `Class 7 ${activeSubject} Voice Note`;
    if (!noteTitle.trim()) {
      setNoteTitle(defaultTitle);
    }

    // Attempt browser SpeechRecognition if available
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        const rec = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-IN';
        rec.onresult = (event: any) => {
          let transcriptText = '';
          for (let i = 0; i < event.results.length; i++) {
            transcriptText += event.results[i][0].transcript + ' ';
          }
          if (transcriptText.trim()) {
            setNoteTranscript(transcriptText.trim());
          }
        };
        rec.onerror = () => {
          // Populate helpful scholarly transcript if mic is unavailable in sandbox
          if (!noteTranscript.trim()) {
            const fallback =
              SAMPLE_VOICE_MEMO_TRANSCRIPTS[selectedEvent?.subject || activeSubject] ||
              SAMPLE_VOICE_MEMO_TRANSCRIPTS.Default;
            setNoteTranscript(fallback);
          }
        };
        rec.start();
        recognitionRef.current = rec;
      } catch {
        // Fallback below
      }
    }

    // Also seed progressive transcript if user is in an environment without mic input
    setTimeout(() => {
      setNoteTranscript((curr) => {
        if (curr.trim()) return curr;
        return (
          SAMPLE_VOICE_MEMO_TRANSCRIPTS[selectedEvent?.subject || activeSubject] ||
          SAMPLE_VOICE_MEMO_TRANSCRIPTS.Default
        );
      });
    }, 1100);
  };

  const handleStopAndSaveVoiceRecording = () => {
    playScholarlyChime('stop');
    setIsRecording(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    const finalTranscript =
      noteTranscript.trim() ||
      SAMPLE_VOICE_MEMO_TRANSCRIPTS[selectedEvent?.subject || activeSubject] ||
      SAMPLE_VOICE_MEMO_TRANSCRIPTS.Default;

    const finalTitle =
      noteTitle.trim() ||
      (selectedEvent
        ? `Voice Memo: ${selectedEvent.title.slice(0, 38)}`
        : `Class 7 ${activeSubject} Audio Note`);

    const newNote: VoiceNoteItem = {
      id: `vn-${Date.now()}`,
      title: finalTitle,
      transcript: finalTranscript,
      durationSeconds: Math.max(4, recordingSeconds || 9),
      createdAt: 'Just now · Class 7 Scholar Studio',
      linkedEventId: selectedEvent?.id,
      linkedEventTitle: selectedEvent?.title,
      subject: selectedEvent?.subject || activeSubject,
      waveformHeights: [...liveBars]
    };

    setVoiceNotes((prev) => [newNote, ...prev]);
    setNoteTitle('');
    setNoteTranscript('');
    setRecordingSeconds(0);
    onShowToast(`Saved Voice Note "${newNote.title}" to Academic Calendar.`, 'success');
  };

  const handlePlayVoiceNote = (note: VoiceNoteItem) => {
    if (playingNoteId === note.id) {
      stopSpeechRef.current?.();
      stopAllScholarlySpeech();
      setPlayingNoteId(null);
      return;
    }

    stopSpeechRef.current?.();
    setPlayingNoteId(note.id);
    stopSpeechRef.current = speakScholarlyText(`${note.title}. ${note.transcript}`, {
      onEnd: () => setPlayingNoteId(null)
    });
  };

  const handleDeleteVoiceNote = (id: string) => {
    if (playingNoteId === id) {
      stopAllScholarlySpeech();
      setPlayingNoteId(null);
    }
    setVoiceNotes((prev) => prev.filter((n) => n.id !== id));
    onShowToast('Removed voice note.', 'info');
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  return (
    <section aria-label="Class 7 Academic Calendar and Voice Note Studio" className="space-y-6">
      {/* =====================================================================
       * LAYERED LIQUID GLASS HERO HEADER
       * =================================================================== */}
      <div
        className={`liquid-glass-elevated rounded-2xl p-6 transition-all ${
          isLight ? 'text-slate-900' : 'text-slate-100'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>{MOCK_SCHOOL_CALENDAR.schoolName}</span>
              <span aria-hidden="true">·</span>
              <span>{MOCK_SCHOOL_CALENDAR.academicSession}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
              Class 7 Academic Calendar &amp; Voice Note Studio
            </h2>

            <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Track upcoming Class 7 Unit Tests, Olympiad qualifiers, assignment submissions, and
              gazetted school holidays. Record personal audio study memos or launch one-click AI
              revision sheets.
            </p>
          </div>

          {/* Unboxed Tabular Summary Metrics */}
          <div className="flex items-center gap-6 text-right tabular-nums">
            <div>
              <div className="text-2xl font-bold font-display text-amber-400">{examCount}</div>
              <div className="text-xs text-slate-400">Upcoming Exams</div>
            </div>
            <div className="h-8 w-px bg-slate-700/40" aria-hidden="true" />
            <div>
              <div className="text-2xl font-bold font-display text-sky-400">{assignmentCount}</div>
              <div className="text-xs text-slate-400">Deadlines</div>
            </div>
            <div className="h-8 w-px bg-slate-700/40" aria-hidden="true" />
            <div>
              <div className="text-2xl font-bold font-display text-emerald-400">{holidayCount}</div>
              <div className="text-xs text-slate-400">Holidays</div>
            </div>
          </div>
        </div>

        {/* Interactive Segmented Filter Controls + Search */}
        <div className="mt-6 pt-5 border-t border-slate-700/30 flex flex-wrap items-center justify-between gap-4">
          <div
            role="group"
            aria-label="Filter calendar events by category"
            className={`flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl border ${
              isLight
                ? 'bg-slate-100/80 border-slate-300/80'
                : 'bg-slate-950/60 border-slate-800/90'
            }`}
          >
            {(
              [
                { id: 'all', label: `All Schedule (${events.length})` },
                { id: 'exam', label: `Upcoming Exams (${examCount})` },
                { id: 'assignment', label: `Assignment Deadlines (${assignmentCount})` },
                { id: 'holiday', label: `School Holidays (${holidayCount})` }
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  categoryFilter === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[230px] flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Class 7 exams, chapters..."
              aria-label="Search Class 7 calendar events"
              className={`w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border outline-none transition-colors ${
                isLight
                  ? 'bg-white/90 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500'
                  : 'bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-amber-400/70'
              }`}
            />
          </div>
        </div>
      </div>

      {/* =====================================================================
       * ASYMMETRIC TWO-COLUMN BENTO: SCHEDULE TIMELINE (LEFT) + VOICE NOTE STUDIO (RIGHT)
       * =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT 7 COLUMNS: UPCOMING EXAMS, ASSIGNMENTS & HOLIDAYS LIST */}
        <div className="lg:col-span-7 space-y-3.5">
          {filteredEvents.length === 0 ? (
            <div className="liquid-glass rounded-2xl p-8 text-center space-y-3">
              <p className="text-sm text-slate-400">
                No Class 7 schedule items match &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950"
              >
                Reset Calendar Filters
              </button>
            </div>
          ) : (
            filteredEvents.map((item) => {
              const daysLeft = getDaysRemaining(item.date);
              const isSelected = selectedEvent?.id === item.id;
              const linkedNotesCount = voiceNotes.filter((n) => n.linkedEventId === item.id).length;

              const categoryLabel =
                item.category === 'exam'
                  ? 'UPCOMING EXAM'
                  : item.category === 'assignment'
                  ? 'ASSIGNMENT DEADLINE'
                  : 'SCHOOL HOLIDAY';

              const categoryColor =
                item.category === 'exam'
                  ? 'text-amber-400'
                  : item.category === 'assignment'
                  ? 'text-sky-400'
                  : 'text-emerald-400';

              const CategoryIcon =
                item.category === 'exam'
                  ? BookOpen
                  : item.category === 'assignment'
                  ? FileText
                  : Sun;

              return (
                <article
                  key={item.id}
                  onClick={() => setSelectedEventId(item.id)}
                  className={`liquid-glass rounded-2xl p-5 transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-1 ring-amber-400/70 shadow-lg'
                      : 'hover:border-slate-600/80'
                  }`}
                >
                  {/* Unboxed Kicker Metadata Row (Strict Zero-Pill Discipline) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex flex-wrap items-center gap-2">
                      <CategoryIcon className={`w-3.5 h-3.5 ${categoryColor}`} />
                      <span className={`font-semibold ${categoryColor}`}>{categoryLabel}</span>
                      <span aria-hidden="true" className="text-slate-500">
                        ·
                      </span>
                      <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                        {item.subject}
                      </span>
                      <span aria-hidden="true" className="text-slate-500">
                        ·
                      </span>
                      <span className="text-slate-400">{item.weightageOrDuration}</span>
                    </div>

                    <div className="flex items-center gap-2 tabular-nums text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {daysLeft === 0 ? 'Today' : `In ${daysLeft} days`} · {item.date}
                      </span>
                    </div>
                  </div>

                  {/* Primary Event Title */}
                  <h3
                    className={`mt-2 text-base sm:text-lg font-bold font-display ${
                      item.completed ? 'line-through opacity-60' : ''
                    }`}
                  >
                    {item.title}
                  </h3>

                  {/* Syllabus / Holiday Details */}
                  <p
                    className={`mt-1.5 text-xs sm:text-sm leading-relaxed ${
                      isLight ? 'text-slate-600' : 'text-slate-300'
                    }`}
                  >
                    {item.syllabusOrDetails}
                  </p>

                  {/* Location & Time Unboxed Metadata */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                    <span>{item.timeLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.locationOrMode}</span>
                    {linkedNotesCount > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-400">
                          {linkedNotesCount} Voice {linkedNotesCount === 1 ? 'Note' : 'Notes'} Attached
                        </span>
                      </>
                    )}
                  </div>

                  {/* Interactive Action Controls */}
                  <div
                    className="mt-4 pt-3.5 border-t border-slate-700/30 flex flex-wrap items-center justify-between gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onLaunchMedhaviPrep(
                            item.aiPrepPrompt,
                            item.id === 'exam-sci-olympiad' ? 'olympiad_quiz' : undefined
                          )
                        }
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {item.category === 'holiday'
                            ? 'Plan Holiday Study'
                            : 'Prep with Medhavi'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEventId(item.id);
                          setNoteTitle(`Voice Memo · ${item.title.slice(0, 32)}`);
                          if (!isRecording) {
                            handleStartVoiceRecording();
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                          isLight
                            ? 'border-slate-300 hover:border-amber-500 text-slate-700'
                            : 'border-slate-700 hover:border-amber-400/70 text-slate-200'
                        }`}
                      >
                        <Mic className="w-3.5 h-3.5 text-amber-400" />
                        <span>Attach Voice Note</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleCompleted(item.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                        item.completed
                          ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                          : isLight
                          ? 'border-slate-300 text-slate-600 hover:text-slate-900'
                          : 'border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{item.completed ? 'Prepared' : 'Mark Ready'}</span>
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* RIGHT 5 COLUMNS: LAYERED LIQUID GLASS VOICE NOTE STUDIO */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-4">
          <div className="liquid-glass-elevated rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
                  LIQUID GLASS AUDIO RECORDER
                </div>
                <h3 className="text-lg font-bold font-display">
                  Class 7 Scholar Voice Notes
                </h3>
              </div>
              <div className="text-xs font-mono tabular-nums text-emerald-400">
                {isRecording ? `● REC ${formatDuration(recordingSeconds)}` : 'Ready'}
              </div>
            </div>

            {selectedEvent && (
              <div
                className={`p-3 rounded-xl border text-xs ${
                  isLight
                    ? 'bg-slate-100/80 border-slate-300 text-slate-700'
                    : 'bg-slate-950/60 border-slate-800/90 text-slate-300'
                }`}
              >
                <div className="text-[11px] font-mono text-slate-400">LINKED CALENDAR EVENT</div>
                <div className="font-semibold truncate mt-0.5">{selectedEvent.title}</div>
                <div className="text-[11px] text-amber-400 font-mono mt-0.5">
                  {selectedEvent.date} · {selectedEvent.subject}
                </div>
              </div>
            )}

            {/* Animated Acoustic Waveform Visualizer */}
            <div
              className={`rounded-xl border p-4 flex flex-col items-center justify-center gap-3 ${
                isRecording
                  ? 'border-rose-500/50 bg-rose-500/10'
                  : isLight
                  ? 'border-slate-300/80 bg-white/70'
                  : 'border-slate-800 bg-slate-950/50'
              }`}
            >
              <div className="flex items-end justify-center gap-1.5 h-12 w-full px-2">
                {liveBars.map((height, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 rounded-full transition-all duration-300 ${
                      isRecording
                        ? 'bg-gradient-to-t from-amber-500 to-rose-400'
                        : 'bg-amber-400/50'
                    }`}
                    style={{
                      height: `${isRecording ? height : Math.max(20, Math.round(height * 0.45))}%`
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-3 w-full">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={handleStartVoiceRecording}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Record Voice Note</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopAndSaveVoiceRecording}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-500 text-white hover:bg-rose-400 transition-all"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop &amp; Save Voice Note ({formatDuration(recordingSeconds)})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Editable Title & Live Voice-to-Text Transcript Box */}
            <div className="space-y-2.5">
              <div>
                <label
                  htmlFor="voice-note-title-input"
                  className="block text-[11px] font-mono uppercase text-slate-400 mb-1"
                >
                  Voice Note Title
                </label>
                <input
                  id="voice-note-title-input"
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder={
                    selectedEvent
                      ? `Memo for ${selectedEvent.title.slice(0, 28)}...`
                      : 'e.g., Triangle Proof Key Steps'
                  }
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-950/70 border-slate-800 text-slate-100'
                  }`}
                />
              </div>

              <div>
                <label
                  htmlFor="voice-note-transcript-input"
                  className="block text-[11px] font-mono uppercase text-slate-400 mb-1"
                >
                  Live Speech Transcript / Study Memo
                </label>
                <textarea
                  id="voice-note-transcript-input"
                  rows={3}
                  value={noteTranscript}
                  onChange={(e) => setNoteTranscript(e.target.value)}
                  placeholder="Speak into your microphone or type key revision formulas here..."
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none resize-none leading-relaxed ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-950/70 border-slate-800 text-slate-100'
                  }`}
                />
              </div>

              {!isRecording && noteTranscript.trim() && (
                <button
                  type="button"
                  onClick={handleStopAndSaveVoiceRecording}
                  className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-emerald-500/50 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Transcript as Voice Note</span>
                </button>
              )}
            </div>

            {/* Saved Voice Notes List */}
            <div className="pt-3 border-t border-slate-700/30 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>SAVED VOICE NOTES ({voiceNotes.length})</span>
                <span>Click Play to Listen</span>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {voiceNotes.map((note) => {
                  const isPlaying = playingNoteId === note.id;
                  return (
                    <div
                      key={note.id}
                      className={`p-3.5 rounded-xl border space-y-2 transition-all ${
                        isPlaying
                          ? 'border-amber-400/80 bg-amber-500/10'
                          : isLight
                          ? 'bg-white/80 border-slate-200'
                          : 'bg-slate-950/55 border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold font-display">{note.title}</h4>
                          <div className="text-[11px] font-mono text-slate-400">
                            {note.subject} · {formatDuration(note.durationSeconds)} · {note.createdAt}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteVoiceNote(note.id)}
                          aria-label={`Delete voice note ${note.title}`}
                          className="p-1 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p
                        className={`text-xs leading-relaxed ${
                          isLight ? 'text-slate-600' : 'text-slate-300'
                        }`}
                      >
                        &ldquo;{note.transcript}&rdquo;
                      </p>

                      <div className="pt-1 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handlePlayVoiceNote(note)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            isPlaying
                              ? 'bg-amber-500 text-slate-950'
                              : isLight
                              ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                              : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                          }`}
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="w-3.5 h-3.5" />
                              <span>Stop Audio</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span>Play Voice Note</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onLaunchMedhaviPrep(
                              `Based on my Class 7 ${note.subject} voice note ("${note.transcript}"), create a step-by-step revision guide and 3 practice questions.`
                            )
                          }
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-400 hover:underline"
                        >
                          <span>Expand with Medhavi</span>
                          <Send className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
