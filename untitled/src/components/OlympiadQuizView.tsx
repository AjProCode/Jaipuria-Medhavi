import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  ArrowUpRight,
  Clock,
  Sparkles,
  BookOpen
} from 'lucide-react';
import {
  calculateOlympiadScore,
  type QuizData,
  type OlympiadPerformanceReport
} from '../utils/medhaviEngine';

interface OlympiadQuizViewProps {
  quiz: QuizData;
  isLight: boolean;
  onChallengeAgain: (difficulty?: QuizData['difficulty']) => void;
  onSaveAttempt?: (report: OlympiadPerformanceReport, quiz: QuizData) => void;
}

export const OlympiadQuizView: React.FC<OlympiadQuizViewProps> = ({
  quiz,
  isLight,
  onChallengeAgain,
  onSaveAttempt
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | null>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [reviewMistakesOnly, setReviewMistakesOnly] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setReviewMistakesOnly(false);
    setElapsedSeconds(0);
  }, [quiz]);

  useEffect(() => {
    if (isSubmitted) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted]);

  const answeredCount = Object.values(selectedAnswers).filter(
    (v) => v !== undefined && v !== null
  ).length;
  const totalQuestions = quiz.questions.length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const currentReport = calculateOlympiadScore(selectedAnswers, quiz.questions, elapsedSeconds);

  const handleSelectOption = (qIndex: number, optIndex: number) => {
    if (isSubmitted) return;
    // Lock selection once chosen per Olympiad Arena specification
    if (selectedAnswers[qIndex] !== undefined && selectedAnswers[qIndex] !== null) return;
    const updated = { ...selectedAnswers, [qIndex]: optIndex };
    setSelectedAnswers(updated);

    // If all questions are answered, auto-complete or let user click Finish
    const nowAnswered = Object.values(updated).filter((v) => v !== undefined && v !== null).length;
    if (nowAnswered === totalQuestions) {
      const finalRep = calculateOlympiadScore(updated, quiz.questions, elapsedSeconds);
      setIsSubmitted(true);
      onSaveAttempt?.(finalRep, quiz);
    }
  };

  const handleFinishEarly = () => {
    if (isSubmitted) return;
    setIsSubmitted(true);
    onSaveAttempt?.(currentReport, quiz);
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setReviewMistakesOnly(false);
    setElapsedSeconds(0);
  };

  const nextDifficultyMap: Record<QuizData['difficulty'], QuizData['difficulty']> = {
    Foundation: 'Competitive',
    Competitive: 'Olympiad',
    Olympiad: 'Extreme Logic',
    'Extreme Logic': 'Extreme Logic'
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div
      className={`rounded-xl border p-6 transition-all ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
          : 'bg-[#0B1120]/90 border-amber-500/25 text-slate-100'
      }`}
    >
      {/* Top Arena Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-700/30">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
            <span>Olympiad Arena</span>
            <span aria-hidden="true">·</span>
            <span>{quiz.difficulty} Tier</span>
            <span aria-hidden="true">·</span>
            <span>+2 Correct / -1 Incorrect / 0 Skipped</span>
          </div>
          <h3 className="text-xl font-bold font-display mt-1">{quiz.title}</h3>
        </div>

        <div className="flex items-center gap-5 tabular-nums">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400">Live Score</div>
            <div className="text-lg font-bold font-mono text-amber-400">
              {currentReport.score} / {currentReport.maxScore}
            </div>
          </div>

          {/* Progress Ring */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-700/40"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-400 transition-all duration-300"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${progressPercent}, 100`}
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="text-xs font-mono font-semibold">
              {answeredCount}/{totalQuestions}
            </span>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="mt-6 space-y-6">
        {quiz.questions.map((q, qIdx) => {
          const userChoice = selectedAnswers[qIdx];
          const isLocked = userChoice !== undefined && userChoice !== null;
          const isCorrect = userChoice === q.correctIndex;

          if (reviewMistakesOnly && isCorrect) {
            return null;
          }

          return (
            <div
              key={q.id || qIdx}
              className={`rounded-lg border p-5 transition-colors ${
                isLight
                  ? 'bg-slate-50/70 border-slate-200'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="text-xs font-mono text-slate-400">
                  Question 0{qIdx + 1} · {q.conceptTag}
                </div>
                {isLocked && (
                  <span
                    className={`text-xs font-mono font-semibold ${
                      isCorrect ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isCorrect ? '+2 Marks (Verified)' : '-1 Mark (Incorrect)'}
                  </span>
                )}
              </div>

              <p className="mt-2 font-medium text-base leading-relaxed">{q.question}</p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {q.options.map((opt, optIdx) => {
                  const isSelected = userChoice === optIdx;
                  const isAnswer = q.correctIndex === optIdx;

                  let btnClass = isLight
                    ? 'border-slate-300 bg-white hover:border-amber-500 text-slate-800'
                    : 'border-slate-700/80 bg-slate-950/60 hover:border-amber-400/60 text-slate-200';

                  if (isLocked || isSubmitted) {
                    if (isAnswer) {
                      btnClass =
                        'border-emerald-500/80 bg-emerald-500/15 text-emerald-300 font-medium';
                    } else if (isSelected && !isAnswer) {
                      btnClass = 'border-rose-500/80 bg-rose-500/15 text-rose-300';
                    } else {
                      btnClass = 'border-slate-800 bg-slate-900/30 text-slate-500 opacity-75';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={isLocked || isSubmitted}
                      onClick={() => handleSelectOption(qIdx, optIdx)}
                      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border text-left text-sm transition-all ${btnClass}`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="font-mono text-xs opacity-70">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        <span>{opt}</span>
                      </span>
                      {(isLocked || isSubmitted) && isAnswer && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      {(isLocked || isSubmitted) && isSelected && !isAnswer && (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {(isLocked || isSubmitted) && (
                <div
                  className={`mt-4 p-3.5 rounded-lg border text-xs leading-relaxed ${
                    isLight
                      ? 'bg-amber-50/70 border-amber-200 text-slate-700'
                      : 'bg-amber-500/5 border-amber-500/20 text-slate-300'
                  }`}
                >
                  <span className="font-semibold text-amber-400">Medhavi Proof & Explanation: </span>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit or Performance Report */}
      {!isSubmitted ? (
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800/60">
          <span className="text-xs text-slate-400">
            Select an option to lock your answer immediately, or submit early to view your report.
          </span>
          <button
            type="button"
            onClick={handleFinishEarly}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            Complete & Evaluate Arena
          </button>
        </div>
      ) : (
        <div
          className={`mt-8 rounded-xl border p-6 ${
            isLight
              ? 'bg-slate-100 border-slate-300 text-slate-900'
              : 'bg-gradient-to-br from-slate-900 via-[#0F172A] to-slate-950 border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-amber-400" />
              <div>
                <div className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                  Medhavi Performance Report
                </div>
                <h4 className="text-lg font-bold font-display">
                  Concept Mastery: {currentReport.conceptMastery}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-6 tabular-nums">
              <div>
                <div className="text-xs text-slate-400">Score</div>
                <div className="text-xl font-bold font-mono text-amber-400">
                  {currentReport.score} / {currentReport.maxScore}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Accuracy</div>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {currentReport.accuracy}%
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Speed</div>
                <div className="text-sm font-semibold text-sky-400">{currentReport.speedRating}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700/40 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-300">
              <span className="text-slate-400 font-medium">Needs Review: </span>
              {currentReport.needsReview.join(' · ')}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleResetQuiz}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-700 hover:border-amber-400/60 transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Challenge Me Again</span>
              </button>

              {currentReport.incorrectCount + currentReport.skippedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setReviewMistakesOnly((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-700 hover:border-sky-400/60 transition-colors whitespace-nowrap shrink-0"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{reviewMistakesOnly ? 'Show All Questions' : 'Review Mistakes'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onChallengeAgain(nextDifficultyMap[quiz.difficulty])}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Increase Difficulty</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
