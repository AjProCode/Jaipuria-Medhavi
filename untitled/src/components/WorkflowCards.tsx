import React, { useState } from 'react';
import {
  Compass,
  Zap,
  Clock,
  Code2,
  FileSpreadsheet,
  BookOpenCheck,
  Scale,
  Languages,
  Upload,
  ArrowRight
} from 'lucide-react';
import {
  normalizeDifficultyDistribution,
  type PersonaRole,
  type QuizData
} from '../utils/medhaviEngine';

export interface WorkflowTriggerPayload {
  prompt: string;
  workflowType?: string;
  workflowMeta?: Record<string, unknown>;
  openUploadPicker?: boolean;
}

interface WorkflowCardsProps {
  persona: PersonaRole;
  grade: string;
  subject: string;
  isLight: boolean;
  onTriggerWorkflow: (payload: WorkflowTriggerPayload) => void;
}

export const WorkflowCards: React.FC<WorkflowCardsProps> = ({
  persona,
  grade,
  subject,
  isLight,
  onTriggerWorkflow
}) => {
  // Student Card 1: Socratic Solver
  const [socraticProblem, setSocraticProblem] = useState('');

  // Student Card 2: Olympiad Arena
  const [olympiadTopic, setOlympiadTopic] = useState('');
  const [olympiadDiff, setOlympiadDiff] = useState<QuizData['difficulty']>('Olympiad');
  const [olympiadCount, setOlympiadCount] = useState<number>(5);
  const [olympiadTimerOn, setOlympiadTimerOn] = useState<boolean>(true);

  // Student Card 3: 5-Minute Mastery
  const [revisionTopic, setRevisionTopic] = useState('');

  // Student Card 4: Language & Code Lab
  const [labTab, setLabTab] = useState<'code' | 'english' | 'hindi' | 'sanskrit'>('code');
  const [codeLang, setCodeLang] = useState('Python');
  const [codeAction, setCodeAction] = useState('Debug & Explain');
  const [labInput, setLabInput] = useState('');

  // Teacher Card 1: Question Paper Studio
  const [paperTopic, setPaperTopic] = useState('');
  const [paperMarks, setPaperMarks] = useState('40');
  const [paperDuration, setPaperDuration] = useState('90 mins');
  const [easyPct, setEasyPct] = useState(30);
  const [modPct, setModPct] = useState(50);
  const [hotsPct, setHotsPct] = useState(20);
  const [questionTypes, setQuestionTypes] = useState<string[]>([
    'MCQ',
    'Short Answer',
    'Long Answer',
    'Case Study',
    'Assertion–Reason',
    'Competency-Based'
  ]);

  // Teacher Card 2: 40-Minute Classroom Architect
  const [lessonTopic, setLessonTopic] = useState('');
  const [priorKnowledge, setPriorKnowledge] = useState('Foundational NCERT concepts');
  const [learningLevel, setLearningLevel] = useState('Mixed Ability Classroom');
  const [resources, setResources] = useState('Smartboard, Chalkboard, NCERT Lab Kit');

  // Teacher Card 3: Answer Evaluator
  const [evalQuestion, setEvalQuestion] = useState('');
  const [evalMaxMarks, setEvalMaxMarks] = useState('10');
  const [evalExpected, setEvalExpected] = useState('');
  const [evalStudentAns, setEvalStudentAns] = useState('');

  // Teacher Card 4: Bilingual Communication
  const [commType, setCommType] = useState('Parent Circular');
  const [commTone, setCommTone] = useState('Formal');
  const [commDetails, setCommDetails] = useState('');

  const cardSurface = isLight
    ? 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
    : 'bg-[#0B1120]/85 border-slate-800/90 text-slate-100';

  const inputSurface = isLight
    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500'
    : 'bg-slate-950/70 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-amber-400/70';

  const toggleQuestionType = (qType: string) => {
    setQuestionTypes((prev) =>
      prev.includes(qType) ? prev.filter((item) => item !== qType) : [...prev, qType]
    );
  };

  if (persona === 'student') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* STUDENT CARD 01 — SOCRATIC SOLVER */}
        <section className={`rounded-xl border p-6 flex flex-col justify-between ${cardSurface}`}>
          <div>
            <div className="flex items-center justify-between text-xs text-sky-400 font-medium">
              <span>01. Socratic Solver</span>
              <span>Guided Reasoning · Concept Check</span>
            </div>
            <h2 className="text-xl font-bold font-display mt-1.5 flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Think With Medhavi</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Don&apos;t just get the answer. Understand why the answer works through progressive hints,
              step verification, and common mistake checks.
            </p>

            <label htmlFor="socratic-input" className="sr-only">
              Paste or describe your problem
            </label>
            <textarea
              id="socratic-input"
              rows={3}
              value={socraticProblem}
              onChange={(e) => setSocraticProblem(e.target.value)}
              placeholder={`Paste or describe your ${grade} ${subject} problem (e.g., "Prove that the sum of angles in a triangle is 180°" or "Why is √9 = 3?")...`}
              className={`mt-4 w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors ${inputSurface}`}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/40">
            <button
              type="button"
              onClick={() =>
                onTriggerWorkflow({
                  prompt:
                    socraticProblem.trim() ||
                    `Guide me step-by-step using the Socratic method on an essential ${grade} ${subject} problem.`,
                  openUploadPicker: true
                })
              }
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-700 hover:border-amber-400/60 transition-colors whitespace-nowrap shrink-0"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Upload Question</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const q =
                  socraticProblem.trim() ||
                  `Explain why the square root of 9 is 3 and how principal square roots work in ${grade} ${subject}.`;
                onTriggerWorkflow({
                  prompt: `[SOCRATIC SOLVER — THINK WITH MEDHAVI]\nProblem: ${q}\n\nPlease follow the 7-step Socratic Solver protocol:\n1. Understand the problem\n2. Identify the core ${subject} concept\n3. Give a strategic hint before the full derivation\n4. Explain steps clearly with LaTeX notation\n5. Verify the final result\n6. Highlight common student mistakes\n7. End with "💡 MEDHAVI CONCEPT CHECK" and one follow-up question.`
                });
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0"
            >
              <span>Solve Together</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* STUDENT CARD 02 — OLYMPIAD ARENA */}
        <section className={`rounded-xl border p-6 flex flex-col justify-between ${cardSurface}`}>
          <div>
            <div className="flex items-center justify-between text-xs text-amber-400 font-medium">
              <span>02. Competitive Practice</span>
              <span>+2 Correct · -1 Incorrect · 0 Skipped</span>
            </div>
            <h2 className="text-xl font-bold font-display mt-1.5 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Olympiad Arena</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Interactive high-logic MCQ challenge with real-time negative marking, locked selections,
              and a Medhavi Performance Report.
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="olympiad-topic" className="block text-xs text-slate-400 mb-1">
                  Topic / Chapter
                </label>
                <input
                  id="olympiad-topic"
                  type="text"
                  value={olympiadTopic}
                  onChange={(e) => setOlympiadTopic(e.target.value)}
                  placeholder={`e.g., ${subject} Olympiad Logic`}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${inputSurface}`}
                />
              </div>

              <div>
                <label htmlFor="olympiad-diff" className="block text-xs text-slate-400 mb-1">
                  Difficulty Tier
                </label>
                <select
                  id="olympiad-diff"
                  value={olympiadDiff}
                  onChange={(e) => setOlympiadDiff(e.target.value as QuizData['difficulty'])}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${inputSurface}`}
                >
                  <option value="Foundation">Foundation</option>
                  <option value="Competitive">Competitive</option>
                  <option value="Olympiad">Olympiad</option>
                  <option value="Extreme Logic">Extreme Logic</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Questions:</span>
                {[3, 5].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setOlympiadCount(cnt)}
                    className={`px-2.5 py-1 rounded border font-mono transition-colors ${
                      olympiadCount === cnt
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-semibold'
                        : 'border-slate-700 text-slate-400'
                    }`}
                  >
                    {cnt} Qs
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setOlympiadTimerOn((prev) => !prev)}
                className={`px-2.5 py-1 rounded border font-mono transition-colors ${
                  olympiadTimerOn
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-700 text-slate-400'
                }`}
              >
                Timer: {olympiadTimerOn ? 'On' : 'Off'}
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/40">
            <span className="text-xs text-slate-400 font-mono">
              Target: {grade} · {olympiadDiff}
            </span>
            <button
              type="button"
              onClick={() => {
                const chosenTopic = olympiadTopic.trim() || `${subject} Core & Olympiad Reasoning`;
                onTriggerWorkflow({
                  workflowType: 'olympiad_quiz',
                  workflowMeta: {
                    topic: chosenTopic,
                    difficulty: olympiadDiff,
                    questionCount: olympiadCount,
                    timerOn: olympiadTimerOn
                  },
                  prompt: `Generate a ${olympiadCount}-question ${olympiadDiff}-level Olympiad Arena MCQ challenge for ${grade} ${subject} on the topic "${chosenTopic}". Return the structured quiz inside <medhavi_quiz>...</medhavi_quiz> JSON tags.`
                });
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0"
            >
              <span>Enter Olympiad Arena</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* STUDENT CARD 03 — 5-MINUTE MASTERY */}
        <section className={`rounded-xl border p-6 flex flex-col justify-between ${cardSurface}`}>
          <div>
            <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
              <span>03. Rapid Exam Revision</span>
              <span>7-Panel Structured Vault</span>
            </div>
            <h2 className="text-xl font-bold font-display mt-1.5 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400 shrink-0" />
              <span>5-Minute Mastery</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Synthesize any chapter or class notes into a high-yield revision sheet with Formula Vault,
              Exam Traps, Mnemonic Hooks, and 60-Second Recall.
            </p>

            <label htmlFor="revision-input" className="sr-only">
              Chapter, Topic, or Paste Notes
            </label>
            <textarea
              id="revision-input"
              rows={3}
              value={revisionTopic}
              onChange={(e) => setRevisionTopic(e.target.value)}
              placeholder={`Enter ${grade} ${subject} chapter or paste notes (e.g., "Quadratic Equations & Nature of Roots" or "Light: Reflection and Refraction")...`}
              className={`mt-4 w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors ${inputSurface}`}
            />
          </div>

          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/40">
            <span className="text-xs text-slate-400">
              Includes 3 High-Probability Board Questions
            </span>
            <button
              type="button"
              onClick={() => {
                const topic = revisionTopic.trim() || `Core Chapter in ${grade} ${subject}`;
                onTriggerWorkflow({
                  prompt: `[5-MINUTE MASTERY REVISION SHEET]\nCreate a comprehensive 5-Minute Mastery sheet for ${grade} ${subject} on: "${topic}".\n\nStructure the output with these exact 7 sections:\n### 1. Chapter Snapshot\n### 2. Essential Concepts\n### 3. Formula / Definition Vault\n### 4. Common Exam Traps\n### 5. Mnemonic Memory Hooks\n### 6. 3 High-Probability Questions (with brief answer keys)\n### 7. 60-Second Final Recall`
                });
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0"
            >
              <span>Generate 5-Min Sheet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* STUDENT CARD 04 — LANGUAGE & CODE LAB */}
        <section className={`rounded-xl border p-6 flex flex-col justify-between ${cardSurface}`}>
          <div>
            <div className="flex items-center justify-between text-xs text-sky-400 font-medium">
              <span>04. Computational & Classical Lab</span>
              <span>Code · English · हिन्दी · संस्कृतम्</span>
            </div>
            <h2 className="text-xl font-bold font-display mt-1.5 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Language &amp; Code Lab</span>
            </h2>

            {/* 4 Mode Tabs */}
            <div className="mt-3 flex items-center gap-1 p-1 rounded-lg bg-slate-900/60 border border-slate-800">
              {[
                { id: 'code', label: '</> CODE' },
                { id: 'english', label: 'A ENGLISH' },
                { id: 'hindi', label: 'ह HINDI' },
                { id: 'sanskrit', label: 'सं SANSKRIT' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setLabTab(t.id as typeof labTab)}
                  className={`flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                    labTab === t.id
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {labTab === 'code' && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <select
                  aria-label="Programming Language"
                  value={codeLang}
                  onChange={(e) => setCodeLang(e.target.value)}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs outline-none ${inputSurface}`}
                >
                  <option value="Python">Python</option>
                  <option value="JavaScript">JavaScript</option>
                  <option value="HTML">HTML</option>
                  <option value="CSS">CSS</option>
                </select>
                <select
                  aria-label="Code Action"
                  value={codeAction}
                  onChange={(e) => setCodeAction(e.target.value)}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs outline-none ${inputSurface}`}
                >
                  <option value="Debug">Debug</option>
                  <option value="Explain">Explain</option>
                  <option value="Improve">Improve</option>
                  <option value="Predict Output">Predict Output</option>
                  <option value="Create Practice Challenge">Create Practice Challenge</option>
                </select>
              </div>
            )}

            <label htmlFor="lab-input" className="sr-only">
              Lab Input
            </label>
            <textarea
              id="lab-input"
              rows={2}
              value={labInput}
              onChange={(e) => setLabInput(e.target.value)}
              placeholder={
                labTab === 'code'
                  ? `Paste ${codeLang} code or describe algorithm (e.g., "for i in range(5): print(i*i)")...`
                  : labTab === 'hindi'
                  ? 'विषय लिखें: निबंध, औपचारिक पत्र, भाषण, व्याकरण या दोहे का अर्थ...'
                  : labTab === 'sanskrit'
                  ? 'संस्कृत अनुवाद, विभक्ति, धातुरूप, शब्दरूप अथवा श्लोक अन्वय लिखें...'
                  : 'Enter sentence or topic for English essay, rhetorical refinement, or grammar analysis...'
              }
              className={`mt-3 w-full rounded-lg border px-3 py-2 text-sm outline-none font-mono ${inputSurface}`}
            />
          </div>

          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/40">
            <span className="text-xs text-slate-400">
              {labTab === 'code'
                ? 'Includes Bug Found, Corrected Version & Concept'
                : labTab === 'hindi'
                ? 'शुद्ध साहित्यिक एवं व्याकरणिक हिन्दी'
                : labTab === 'sanskrit'
                ? 'विभक्ति-धातु-प्रत्यय विश्लेषण सहित'
                : 'Editorial Grammar & Composition'}
            </span>
            <button
              type="button"
              onClick={() => {
                if (labTab === 'code') {
                  const snippet =
                    labInput.trim() ||
                    `def factorial(n):\n    if n == 0: return 1\n    return n * factorial(n - 1)`;
                  onTriggerWorkflow({
                    prompt: `[CODE LAB — ${codeLang.toUpperCase()} (${codeAction.toUpperCase()})]\nInput:\n\`\`\`${codeLang.toLowerCase()}\n${snippet}\n\`\`\`\n\nPlease analyze for ${grade} using these exact sections:\n### WHAT THE CODE DOES\n### WHY IT WORKS\n### BUG FOUND (or Edge-Case Vulnerability)\n### CORRECTED VERSION\n### CONCEPT TO REMEMBER`
                  });
                } else if (labTab === 'hindi') {
                  const text = labInput.trim() || 'विज्ञान के चमत्कार और नैतिक उत्तरदायित्व पर अनुच्छेद एवं व्याकरण विश्लेषण';
                  onTriggerWorkflow({
                    prompt: `[हिन्दी भाषा प्रयोगशाला — ${grade}]\nविषय: "${text}"\nकृपया शुद्ध देवनागरी लिपि में संरचित रूपरेखा, औपचारिक संयोजक (connectors), प्रासंगिक दोहा/सूक्ति और व्याकरण टिप्पणी प्रस्तुत करें।`
                  });
                } else if (labTab === 'sanskrit') {
                  const text = labInput.trim() || 'विद्या ददाति विनयं विनयाद्याति पात्रताम् — पदच्छेद, विभक्ति, धातु लकार एवं हिन्दी/अंग्रेजी अनुवाद';
                  onTriggerWorkflow({
                    prompt: `[संस्कृतम् प्रयोगशाला — ${grade}]\nविषय: "${text}"\nकृपया देवनागरी लिपि में वाक्य रचना, अनुवाद, विभक्ति-वचन, मूल धातु-लकार और शब्दरूप विश्लेषण स्पष्ट तालिका में प्रस्तुत करें।`
                  });
                } else {
                  const text = labInput.trim() || 'Analytical essay structure on Artificial Intelligence and Human Creativity';
                  onTriggerWorkflow({
                    prompt: `[ENGLISH LANGUAGE LAB — ${grade}]\nTopic / Text: "${text}"\nProvide a polished academic composition, vocabulary elevation table, rhetorical structure breakdown, and grammar commentary.`
                  });
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0"
            >
              <span>Run {labTab.toUpperCase()} Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      </div>
    );
  }

  // TEACHER STUDIO WORKFLOW CARDS
  const normalizedDist = normalizeDifficultyDistribution(easyPct, modPct, hotsPct);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* TEACHER CARD 01 — QUESTION PAPER STUDIO */}
      <section className={`rounded-xl border p-6 flex flex-col justify-between ${cardSurface}`}>
        <div>
          <div className="flex items-center justify-between text-xs text-violet-400 font-medium">
            <span>01. Assessment Architecture</span>
            <span>Paper + Answer Key + Marking Scheme</span>
          </div>
          <h2 className="text-xl font-bold font-display mt-1.5 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Question Paper Studio</span>
          </h2>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-1">
              <label htmlFor="paper-topic" className="block text-xs text-slate-400 mb-1">
                Topic / Chapter
              </label>
              <input
                id="paper-topic"
                type="text"
                value={paperTopic}
                onChange={(e) => setPaperTopic(e.target.value)}
                placeholder={`e.g., Force & Pressure`}
                className={`w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none ${inputSurface}`}
              />
            </div>

            <div>
              <label htmlFor="paper-marks" className="block text-xs text-slate-400 mb-1">
                Total Marks
              </label>
              <select
                id="paper-marks"
                value={paperMarks}
                onChange={(e) => setPaperMarks(e.target.value)}
                className={`w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none ${inputSurface}`}
              >
                <option value="10">10 Marks</option>
                <option value="20">20 Marks</option>
                <option value="40">40 Marks</option>
                <option value="50">50 Marks</option>
                <option value="80">80 Marks</option>
              </select>
            </div>

            <div>
              <label htmlFor="paper-duration" className="block text-xs text-slate-400 mb-1">
                Duration
              </label>
              <input
                id="paper-duration"
                type="text"
                value={paperDuration}
                onChange={(e) => setPaperDuration(e.target.value)}
                className={`w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none ${inputSurface}`}
              />
            </div>
          </div>

          {/* Difficulty Distribution Sliders */}
          <div className="mt-3 p-3 rounded-lg bg-slate-900/40 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Difficulty Balance:</span>
              <span className="text-amber-400">
                Easy {normalizedDist.easy}% · Moderate {normalizedDist.moderate}% · HOTS{' '}
                {normalizedDist.hots}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="slider-easy" className="block text-[11px] text-slate-400">
                  Easy ({easyPct}%)
                </label>
                <input
                  id="slider-easy"
                  type="range"
                  min={10}
                  max={70}
                  value={easyPct}
                  onChange={(e) => setEasyPct(Number(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </div>
              <div>
                <label htmlFor="slider-mod" className="block text-[11px] text-slate-400">
                  Moderate ({modPct}%)
                </label>
                <input
                  id="slider-mod"
                  type="range"
                  min={20}
                  max={70}
                  value={modPct}
                  onChange={(e) => setModPct(Number(e.target.value))}
                  className="w-full accent-sky-400"
                />
              </div>
              <div>
                <label htmlFor="slider-hots" className="block text-[11px] text-slate-400">
                  HOTS ({hotsPct}%)
                </label>
                <input
                  id="slider-hots"
                  type="range"
                  min={10}
                  max={60}
                  value={hotsPct}
                  onChange={(e) => setHotsPct(Number(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Question Types Checkboxes */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              'MCQ',
              'Very Short Answer',
              'Short Answer',
              'Long Answer',
              'Case Study',
              'Assertion–Reason',
              'Competency-Based',
              'Numerical'
            ].map((qType) => {
              const active = questionTypes.includes(qType);
              return (
                <button
                  key={qType}
                  type="button"
                  onClick={() => toggleQuestionType(qType)}
                  className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                    active
                      ? 'border-violet-400/70 bg-violet-500/15 text-violet-200'
                      : 'border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {active ? '✓ ' : ''}
                  {qType}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/40">
          <span className="text-xs text-slate-400">
            Bloom Taxonomy: Remember → Create
          </span>
          <button
            type="button"
            onClick={() => {
              const chap = paperTopic.trim() || `${subject} Core Syllabus`;
              onTriggerWorkflow({
                prompt: `[QUESTION PAPER STUDIO — SETH M.R. JAIPURIA SCHOOL]\nDesign a formal, print-ready CBSE/NEP-2020 examination for:\n- Class: ${grade}\n- Subject: ${subject}\n- Topic / Chapter: ${chap}\n- Total Marks: ${paperMarks}\n- Duration: ${paperDuration}\n- Difficulty Distribution: Easy ${normalizedDist.easy}%, Moderate ${normalizedDist.moderate}%, HOTS ${normalizedDist.hots}%\n- Question Types Included: ${questionTypes.join(', ')}\n- Bloom's Taxonomy Mapping: Remember, Understand, Apply, Analyse, Evaluate, Create\n\nPlease generate three clearly separated sections:\n# 1. STUDENT QUESTION PAPER (with general instructions, section-wise marks, and Bloom/Competency tag per question)\n# 2. TEACHER ANSWER KEY (complete step-by-step solutions)\n# 3. MARKING SCHEME & COMPETENCY RUBRIC`
              });
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            <span>Generate Paper &amp; Key</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* TEACHER CARD 02 — 40-MINUTE CLASSROOM ARCHITECT */}
      <section className={`rounded-xl border p-6 flex flex-col justify-between ${cardSurface}`}>
        <div>
          <div className="flex items-center justify-between text-xs text-violet-400 font-medium">
            <span>02. Lesson Architect</span>
            <span>NEP-2020 · Minute-by-Minute Plan</span>
          </div>
          <h2 className="text-xl font-bold font-display mt-1.5 flex items-center gap-2">
            <BookOpenCheck className="w-5 h-5 text-amber-400 shrink-0" />
            <span>40-Minute Classroom Architect</span>
          </h2>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="lesson-topic" className="block text-xs text-slate-400 mb-1">
                Lesson Topic
              </label>
              <input
                id="lesson-topic"
                type="text"
                value={lessonTopic}
                onChange={(e) => setLessonTopic(e.target.value)}
                placeholder={`e.g., Photosynthesis / Pythagoras`}
                className={`w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none ${inputSurface}`}
              />
            </div>

            <div>
              <label htmlFor="lesson-prior" className="block text-xs text-slate-400 mb-1">
                Prior Knowledge
              </label>
              <input
                id="lesson-prior"
                type="text"
                value={priorKnowledge}
                onChange={(e) => setPriorKnowledge(e.target.value)}
                className={`w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none ${inputSurface}`}
              />
            </div>

            <div>
              <label htmlFor="lesson-level" className="block text-xs text-slate-400 mb-1">
                Learning Level
              </label>
              <select
                id="lesson-level"
                value={learningLevel}
                onChange={(e) => setLearningLevel(e.target.value)}
                className={`w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none ${inputSurface}`}
              >
                <option value="Mixed Ability Classroom">Mixed Ability Classroom</option>
                <option value="Foundational / Remedial Support">Foundational / Remedial Support</option>
                <option value="Accelerated / Enrichment">Accelerated / Enrichment</option>
              </select>
            </div>

            <div>
              <label htmlFor="lesson-res" className="block text-xs text-slate-400 mb-1">
                Available Resources
              </label>
              <input
                id="lesson-res"
                type="text"
                value={resources}
                onChange={(e) => setResources(e.target.value)}
                className={`w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none ${inputSurface}`}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/40">
          <span className="text-xs text-slate-400">
            0–5 Hook · 5–12 Prior · 12–25 Core · 25–32 Activity · 37–40 Exit
          </span>
          <button
            type="button"
            onClick={() => {
              const top = lessonTopic.trim() || `Core Topic in ${grade} ${subject}`;
              onTriggerWorkflow({
                prompt: `[40-MINUTE CLASSROOM ARCHITECT — NEP-2020 LESSON PLAN]\nDesign a complete 40-minute pedagogical plan for:\n- Class: ${grade}\n- Subject: ${subject}\n- Topic: ${top}\n- Prior Knowledge: ${priorKnowledge}\n- Classroom Profile: ${learningLevel}\n- Available Resources: ${resources}\n\nInclude these exact sections:\n### Learning Outcomes & NEP-2020 Competencies\n### 0–5 min — Curiosity Hook\n### 5–12 min — Prior Knowledge Activation\n### 12–25 min — Core Teaching\n### 25–32 min — Student Activity\n### 32–37 min — Real-World Application\n### 37–40 min — Exit Ticket\n### Teacher Questions & Expected Student Responses\n### Misconceptions to Watch & Differentiation Strategy\n### Home Extension`
              });
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            <span>Architect Lesson</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* TEACHER CARD 03 — ANSWER EVALUATOR */}
      <section className={`rounded-xl border p-6 flex flex-col justify-between ${cardSurface}`}>
        <div>
          <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
            <span>03. AI-Assisted Rubric Grading</span>
            <span>Visual Rubric · Advisory Evaluation</span>
          </div>
          <h2 className="text-xl font-bold font-display mt-1.5 flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Answer Evaluator</span>
          </h2>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <label htmlFor="eval-q" className="block text-xs text-slate-400 mb-1">
                Question Prompt
              </label>
              <input
                id="eval-q"
                type="text"
                value={evalQuestion}
                onChange={(e) => setEvalQuestion(e.target.value)}
                placeholder={`Enter the examination question...`}
                className={`w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none ${inputSurface}`}
              />
            </div>

            <div>
              <label htmlFor="eval-marks" className="block text-xs text-slate-400 mb-1">
                Maximum Marks
              </label>
              <select
                id="eval-marks"
                value={evalMaxMarks}
                onChange={(e) => setEvalMaxMarks(e.target.value)}
                className={`w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none ${inputSurface}`}
              >
                <option value="3">3 Marks</option>
                <option value="5">5 Marks</option>
                <option value="10">10 Marks</option>
                <option value="20">20 Marks</option>
              </select>
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="eval-exp" className="block text-xs text-slate-400 mb-1">
                Optional Expected Key Points
              </label>
              <input
                id="eval-exp"
                type="text"
                value={evalExpected}
                onChange={(e) => setEvalExpected(e.target.value)}
                placeholder="Key formula, theorem, or diagram..."
                className={`w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none ${inputSurface}`}
              />
            </div>
            <div>
              <label htmlFor="eval-ans" className="block text-xs text-slate-400 mb-1">
                Student Response Text
              </label>
              <input
                id="eval-ans"
                type="text"
                value={evalStudentAns}
                onChange={(e) => setEvalStudentAns(e.target.value)}
                placeholder="Paste student answer or attach photo..."
                className={`w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none ${inputSurface}`}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/40">
          <button
            type="button"
            onClick={() =>
              onTriggerWorkflow({
                workflowType: 'answer_evaluator',
                workflowMeta: { maxMarks: Number(evalMaxMarks) || 10 },
                openUploadPicker: true,
                prompt: `[MEDHAVI ANSWER EVALUATOR]\nQuestion: ${
                  evalQuestion.trim() || `Standard ${grade} ${subject} descriptive question`
                }\nMaximum Marks: ${evalMaxMarks}\nExpected Key Points: ${
                  evalExpected.trim() || 'Standard CBSE marking scheme'
                }\nStudent Response: ${
                  evalStudentAns.trim() || '(Inspect attached handwritten response)'
                }\nEvaluate with a structured rubric inside <medhavi_evaluation>...</medhavi_evaluation> tags.`
              })
            }
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-700 hover:border-amber-400/60 transition-colors whitespace-nowrap shrink-0"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Upload Handwritten Response</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onTriggerWorkflow({
                workflowType: 'answer_evaluator',
                workflowMeta: { maxMarks: Number(evalMaxMarks) || 10 },
                prompt: `[MEDHAVI ANSWER EVALUATOR]\nClass: ${grade} • Subject: ${subject}\nQuestion: ${
                  evalQuestion.trim() ||
                  `Explain the law of conservation of energy with a mathematical derivation.`
                }\nMaximum Marks: ${evalMaxMarks}\nExpected Answer: ${
                  evalExpected.trim() || 'Definition, mathematical proof KE + PE = constant, and SI units.'
                }\nStudent Response: ${
                  evalStudentAns.trim() ||
                  'Energy cannot be created or destroyed, it only changes from one form to another like potential energy turning into kinetic energy when a ball falls.'
                }\n\nReturn the structured evaluation inside <medhavi_evaluation>...</medhavi_evaluation> JSON tags followed by sections: What the Student Did Well, Missing Concepts, Logical / Factual Errors, Presentation Feedback, How to Improve to Full Marks, Suggested Teacher Comment, and "Teacher review recommended before marks are finalized."`
              })
            }
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            <span>Evaluate Answer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* TEACHER CARD 04 — BILINGUAL COMMUNICATION */}
      <section className={`rounded-xl border p-6 flex flex-col justify-between ${cardSurface}`}>
        <div>
          <div className="flex items-center justify-between text-xs text-violet-400 font-medium">
            <span>04. Institutional Correspondence</span>
            <span>Parallel English &amp; हिन्दी</span>
          </div>
          <h2 className="text-xl font-bold font-display mt-1.5 flex items-center gap-2">
            <Languages className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Bilingual Communication Studio</span>
          </h2>

          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="comm-type" className="block text-xs text-slate-400 mb-1">
                Document Type
              </label>
              <select
                id="comm-type"
                value={commType}
                onChange={(e) => setCommType(e.target.value)}
                className={`w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none ${inputSurface}`}
              >
                <option value="Parent Circular">Parent Circular</option>
                <option value="Event Notice">Event Notice</option>
                <option value="Competition Rules">Competition Rules</option>
                <option value="Field-Trip Consent Notice">Field-Trip Consent Notice</option>
                <option value="Academic PTM Reminder">Academic PTM Reminder</option>
              </select>
            </div>

            <div>
              <label htmlFor="comm-tone" className="block text-xs text-slate-400 mb-1">
                Institutional Tone
              </label>
              <select
                id="comm-tone"
                value={commTone}
                onChange={(e) => setCommTone(e.target.value)}
                className={`w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none ${inputSurface}`}
              >
                <option value="Formal">Formal</option>
                <option value="Warm">Warm</option>
                <option value="Urgent">Urgent</option>
                <option value="Celebratory">Celebratory</option>
              </select>
            </div>
          </div>

          <label htmlFor="comm-details" className="sr-only">
            Circular Details
          </label>
          <textarea
            id="comm-details"
            rows={2}
            value={commDetails}
            onChange={(e) => setCommDetails(e.target.value)}
            placeholder="Enter event date, venue, or announcement details (e.g., Annual Science & AI Exhibition on 14th November in the Jaipuria Auditorium)..."
            className={`mt-2.5 w-full rounded-lg border px-3 py-2 text-xs outline-none ${inputSurface}`}
          />
        </div>

        <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/40">
          <span className="text-xs text-slate-400">
            Seth M.R. Jaipuria School Letterhead Format
          </span>
          <button
            type="button"
            onClick={() => {
              const info =
                commDetails.trim() ||
                `Annual Inter-House Science, Mathematics & AI Exhibition for ${grade} students at Seth M.R. Jaipuria School.`;
              onTriggerWorkflow({
                prompt: `[BILINGUAL SCHOOL COMMUNICATION — SETH M.R. JAIPURIA SCHOOL]\nDocument Type: ${commType}\nTone: ${commTone}\nTarget Class: ${grade}\nKey Details: ${info}\n\nPlease draft a dignified, warm, school-ready communication in BOTH languages with formal headings:\n## 1. ENGLISH VERSION (Seth M.R. Jaipuria School Official Circular)\n## 2. हिन्दी संस्करण (सेठ एम.आर. जयपुरिया विद्यालय — आधिकारिक सूचना पत्र)`
              });
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            <span>Draft Bilingual Notice</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
};
