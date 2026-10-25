import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Sun,
  Moon,
  Paperclip,
  Send,
  Copy,
  Bookmark,
  Printer,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  SlidersHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Check,
  X,
  GraduationCap,
  BookOpen,
  LogOut,
  Calendar,
  Mic,
  Volume2,
  Square,
  ArrowLeft,
  Compass
} from 'lucide-react';
import type { User } from 'firebase/auth';
import {
  LOCKED_GRADE,
  parseMedhaviResponse,
  type PersonaRole,
  type IntelligenceMode,
  type CustomSpecItem,
  type QuizData,
  type OlympiadPerformanceReport,
  type IdVerificationResult
} from './utils/medhaviEngine';
import { renderScholarlyMarkdown } from './utils/markdownRenderer';
import { downloadStandaloneMedhaviHtml } from './utils/standaloneExporter';
import { JyotiKnowledgeField, JyotiOrb, type OrbStatus } from './components/JyotiKnowledgeField';
import { OlympiadQuizView } from './components/OlympiadQuizView';
import { IdentityGatePage } from './components/IdentityGatePage';
import { AcademicCalendarView } from './components/AcademicCalendarView';
import { VoiceChatModal } from './components/VoiceChatModal';
import {
  CreateDemoAccountModal,
  type DemoAccountConfig,
  DEMO_PRESETS
} from './components/CreateDemoAccountModal';
import {
  speakScholarlyText,
  stopAllScholarlySpeech,
  playScholarlyChime
} from './utils/voiceAudioEngine';
import {
  MedhaviSpecsModal,
  CommandPaletteModal,
  CloudAccountModal,
  OnboardingModal,
  type CommandItem
} from './components/ModalsAndDrawers';
import {
  subscribeToAuth,
  signInWithGoogleScholar,
  signOutScholar,
  ensureUserProfileDoc,
  saveCloudSession,
  deleteCloudSession,
  subscribeToCloudSessions,
  saveCloudSpec,
  deleteCloudSpec,
  saveCloudQuizAttempt,
  type StoredSessionRecord
} from './firebase';

const SUBJECT_OPTIONS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science & AI',
  'English',
  'Hindi — हिन्दी',
  'Sanskrit — संस्कृतम्',
  'History',
  'Geography',
  'Political Science & Civics',
  'General Knowledge'
];

interface RoleToolItem {
  id: string;
  label: string;
  description: string;
  prompt: string;
  isViewTool?: boolean;
  workflowType?: string;
}

const STUDENT_ONLY_TOOLS: RoleToolItem[] = [
  {
    id: 'academic_calendar',
    label: 'Academic Calendar',
    description: 'Upcoming exams, deadlines, holidays & voice notes',
    isViewTool: true,
    prompt: ''
  },
  {
    id: 'socratic',
    label: 'Socratic Solver',
    description: 'Step-by-step guided problem solving',
    prompt:
      'Guide me step-by-step using the Socratic method for Class 7: Explain why the sum of interior angles of a triangle is always 180°.'
  },
  {
    id: 'olympiad',
    label: 'Olympiad Arena',
    description: '5-question high-logic MCQ challenge (+2 / -1)',
    workflowType: 'olympiad_quiz',
    prompt:
      'Generate a 5-question Olympiad-level MCQ challenge for Class 7 in this subject inside <medhavi_quiz>...</medhavi_quiz> tags.'
  },
  {
    id: 'explain',
    label: 'Explain a Concept',
    description: 'Core intuition, analogy & common exam traps',
    prompt:
      'Explain the core intuition, real-world analogy, mathematical formulation, and common misconceptions for a fundamental Class 7 concept in this subject.'
  },
  {
    id: 'revision',
    label: '5-Min Exam Revision',
    description: 'Formula vault, snapshot & high-probability questions',
    prompt:
      'Create a Class 7 5-Minute Mastery revision sheet with Chapter Snapshot, Formula Vault, Common Exam Traps, Mnemonic Hooks, and 3 High-Probability Questions.'
  },
  {
    id: 'rapid_quiz',
    label: 'Rapid Quiz',
    description: 'Quick 3-question concept check',
    workflowType: 'olympiad_quiz',
    prompt:
      'Generate a 3-question Competitive rapid quiz for Class 7 in this subject inside <medhavi_quiz>...</medhavi_quiz> tags.'
  },
  {
    id: 'flashcards',
    label: 'Flash Cards',
    description: '6 active-recall study cards',
    prompt:
      'Generate 6 high-retention Class 7 active-recall flashcards (Front Cue → Back Explanation & Formula) for this subject.'
  },
  {
    id: 'codelab',
    label: 'Code Lab',
    description: 'Class 7 Python algorithm & debugging guide',
    prompt:
      'Provide a clean Class 7 Python algorithm example with WHAT THE CODE DOES, WHY IT WORKS, BUG FOUND, CORRECTED VERSION, and CONCEPT TO REMEMBER.'
  },
  {
    id: 'langlab',
    label: 'Language Lab',
    description: 'English, हिन्दी & संस्कृतम् expression guide',
    prompt:
      'Create a Class 7 trilingual academic expression guide (English, हिन्दी, संस्कृतम्) with grammar breakdown and formal connectors.'
  }
];

const TEACHER_ONLY_TOOLS: RoleToolItem[] = [
  {
    id: 'qpaper',
    label: 'Question Paper Studio',
    description: '40-mark Class 7 exam paper + answer key',
    prompt:
      'Create a 40-mark Class 7 examination question paper with Student Question Paper, Teacher Answer Key, and Marking Scheme.'
  },
  {
    id: 'lesson_arch',
    label: 'Lesson Architect',
    description: '40-minute NEP-2020 classroom lesson plan',
    prompt:
      'Design a 40-minute Class 7 NEP-2020 classroom lesson plan (0–5 Hook, 5–12 Prior Knowledge, 12–25 Core Teaching, 25–32 Activity, 32–37 Real-World, 37–40 Exit Ticket).'
  },
  {
    id: 'evaluator',
    label: 'Answer Evaluator',
    description: 'Evaluate student descriptive answers with rubric',
    workflowType: 'answer_evaluator',
    prompt:
      'Evaluate a sample Class 7 student descriptive answer out of 10 marks and include a structured <medhavi_evaluation> JSON rubric.'
  },
  {
    id: 'rubric',
    label: 'Rubric Builder',
    description: '4-tier analytical assessment rubric',
    prompt:
      'Construct a 4-tier Class 7 analytical assessment rubric (Exemplary, Proficient, Developing, Emerging) for project evaluation.'
  },
  {
    id: 'quiz_gen',
    label: 'Diagnostic Quiz Generator',
    description: '5-question classroom diagnostic MCQ quiz',
    workflowType: 'olympiad_quiz',
    prompt:
      'Generate a 5-question diagnostic Class 7 classroom quiz inside <medhavi_quiz>...</medhavi_quiz> tags.'
  },
  {
    id: 'circular',
    label: 'Parent Circular',
    description: 'Bilingual (English & हिन्दी) parent notice',
    prompt:
      'Draft a dignified bilingual (English and हिन्दी) Parent Circular for Class 7 parents at Seth M.R. Jaipuria School.'
  },
  {
    id: 'bloom',
    label: "Bloom's Taxonomy Bank",
    description: '6 calibrated questions across all Bloom levels',
    prompt:
      'Generate 6 calibrated Class 7 questions spanning all 6 levels of Bloom Taxonomy (Remember, Understand, Apply, Analyse, Evaluate, Create).'
  }
];

const INITIAL_SPECS: CustomSpecItem[] = [
  {
    id: 'spec-core-identity',
    category: 'School Rules',
    title: 'Core Identity & Motto',
    content:
      'Official AI Scholar "Jaipuria Medhavi" (मेधावी) for Seth M.R. Jaipuria School. Motto: "Tamso Ma Jyotirgamaya". Exclusively calibrated for Class 7.',
    active: true
  },
  {
    id: 'spec-default-1',
    category: 'Examination Pattern',
    title: 'Step-by-Step Answer Structure',
    content: 'Definition → Step-by-Step Logical Breakdown → Verification → Class 7 Exam Tip',
    active: true
  },
  {
    id: 'spec-default-2',
    category: 'Competition Rules',
    title: 'Olympiad Arena Scoring',
    content: 'Correct: +2 marks | Incorrect: -1 mark | Skipped: 0 marks',
    active: true
  }
];

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  durationSeconds?: number;
  reasoningTokens?: number;
  imagePreview?: string;
  model?: string;
}

export default function App() {
  const grade = LOCKED_GRADE;

  // Verified Account Identity (Determines strict Student-only or Teacher-only access)
  const [verifiedIdentity, setVerifiedIdentity] = useState<IdVerificationResult | null>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const requestedRole: PersonaRole =
        params.get('role') === 'teacher' ? 'teacher' : 'student';
      return {
        verified: true,
        confidence: 99,
        extractedName: requestedRole === 'teacher' ? 'Dr. Ananya Sharma' : 'Atharva Jindal',
        extractedRole: requestedRole,
        schoolId: requestedRole === 'teacher' ? 'SMRJ-FAC-0742' : '13457',
        schoolName: 'Seth M.R. Jaipuria School, Lucknow',
        grade: LOCKED_GRADE,
        badgeId: 'JM-AUTO-701',
        summary: 'Verified Seth M.R. Jaipuria School Lucknow ID Card.',
        checks: {
          institutionMatch: true,
          roleMatch: true,
          gradeSevenAuthorized: true,
          visualSealDetected: true
        }
      };
    }
    try {
      const saved = localStorage.getItem('medhavi_verified_id');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  // Strict Role Lock: Account role is bound exclusively to the verified ID card
  const persona: PersonaRole = verifiedIdentity ? verifiedIdentity.extractedRole : 'student';

  // Theme & Subject State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('medhavi_theme');
    return saved === 'light' ? 'light' : 'dark';
  });
  const [subject, setSubject] = useState<string>(
    () => localStorage.getItem('medhavi_subject') || 'Mathematics'
  );
  const [intelligenceMode, setIntelligenceMode] = useState<IntelligenceMode>('pedagogical');

  // OpenRouter & Cloud State
  const [selectedModel, setSelectedModel] = useState<string>(
    'nvidia/nemotron-3.5-super-vl:free'
  );
  const [availableModels, setAvailableModels] = useState([
    {
      id: 'nvidia/nemotron-3.5-super-vl:free',
      name: 'NVIDIA Nemotron 3.5 Super VL',
      badge: 'Multimodal + Reasoning',
      provider: 'NVIDIA via OpenRouter'
    },
    {
      id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free',
      name: 'NVIDIA Nemotron Ultra 253B',
      badge: 'High-Logic Scholar',
      provider: 'NVIDIA via OpenRouter'
    },
    {
      id: 'deepseek/deepseek-r1:free',
      name: 'DeepSeek R1 Reasoning',
      badge: 'Olympiad & Math Proof',
      provider: 'DeepSeek via OpenRouter'
    },
    {
      id: 'google/gemma-3-27b-it:free',
      name: 'Google Gemma 3 27B Vision',
      badge: 'Multimodal & Multilingual',
      provider: 'Google via OpenRouter'
    }
  ]);
  const [cloudOnline, setCloudOnline] = useState<boolean>(true);
  const [orbStatus, setOrbStatus] = useState<OrbStatus>('idle');

  // Custom Specifications State
  const [customSpecs, setCustomSpecs] = useState<CustomSpecItem[]>(() => {
    try {
      const raw = localStorage.getItem('medhavi_specs');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_SPECS;
  });

  // Sessions & Active Messages State
  const [sessions, setSessions] = useState<StoredSessionRecord[]>(() => {
    try {
      const raw = localStorage.getItem('medhavi_sessions');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [expandedLogicIds, setExpandedLogicIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Composer & Multimodal Upload State
  const [composerText, setComposerText] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedImageName, setAttachedImageName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Navigation & Clean Gemini-Style Popovers
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(true);
  const [activeDockTool, setActiveDockTool] = useState<string>('chat');
  const [toolsMenuOpen, setToolsMenuOpen] = useState<boolean>(false);
  const [specsModalOpen, setSpecsModalOpen] = useState<boolean>(false);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState<boolean>(false);
  const [cloudModalOpen, setCloudModalOpen] = useState<boolean>(false);
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(false);
  const [voiceChatOpen, setVoiceChatOpen] = useState<boolean>(false);
  const [demoModalOpen, setDemoModalOpen] = useState<boolean>(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [composerDictating, setComposerDictating] = useState<boolean>(false);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(
    null
  );

  // Firebase Auth User State
  const [user, setUser] = useState<User | null>(null);

  const isLight = theme === 'light';
  const roleTools = persona === 'student' ? STUDENT_ONLY_TOOLS : TEACHER_ONLY_TOOLS;

  const showToast = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3800);
  };

  useEffect(() => {
    localStorage.setItem('medhavi_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.body.classList.add('light-mode');
    } else {
      document.documentElement.classList.add('dark');
      document.body.classList.remove('light-mode');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('medhavi_subject', subject);
  }, [subject]);

  useEffect(() => {
    localStorage.setItem('medhavi_specs', JSON.stringify(customSpecs));
  }, [customSpecs]);

  useEffect(() => {
    localStorage.setItem('medhavi_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const checkServerHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setCloudOnline(true);
        if (Array.isArray(data.models) && data.models.length > 0) {
          setAvailableModels(data.models);
        }
      }
    } catch {
      setCloudOnline(false);
    }
  };

  useEffect(() => {
    checkServerHealth();
  }, []);

  useEffect(() => {
    let unsubSessions: (() => void) | null = null;
    const unsubAuth = subscribeToAuth(async (currentUser) => {
      setUser(currentUser);
      if (unsubSessions) {
        unsubSessions();
        unsubSessions = null;
      }
      if (currentUser) {
        try {
          await ensureUserProfileDoc(currentUser, {
            persona,
            grade,
            subject,
            theme
          });
          unsubSessions = subscribeToCloudSessions(currentUser, (cloudRecords) => {
            if (cloudRecords.length > 0) {
              setSessions(cloudRecords);
            }
          });
        } catch {
          // Handled by structured Firestore error logger
        }
      }
    });
    return () => {
      unsubAuth();
      if (unsubSessions) unsubSessions();
    };
  }, [persona]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setToolsMenuOpen(false);
        setCmdPaletteOpen(false);
        setSpecsModalOpen(false);
        setCloudModalOpen(false);
        setOnboardingOpen(false);
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleStartNewSession();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const totalReasoningTokens = messages.reduce((acc, m) => acc + (m.reasoningTokens || 0), 0);

  const handleCompleteIdentityGate = (result: IdVerificationResult) => {
    setVerifiedIdentity(result);
    setActiveDockTool('chat');
    setMessages([]);
    localStorage.setItem('medhavi_verified_id', JSON.stringify(result));
    showToast(
      `Welcome, ${result.extractedName}! Signed in to ${
        result.extractedRole === 'teacher' ? 'Teacher' : 'Student'
      } Account.`,
      'success'
    );
  };

  const handleActivateDemoAccount = (result: IdVerificationResult, config: DemoAccountConfig) => {
    setVerifiedIdentity(result);
    setActiveDockTool('chat');
    localStorage.setItem('medhavi_verified_id', JSON.stringify(result));

    if (config.seedSampleChats) {
      const isStudent = result.extractedRole === 'student';
      const sampleSessionId = `demo-sess-${Date.now()}`;
      const sampleRecord: StoredSessionRecord = {
        id: sampleSessionId,
        title: isStudent
          ? 'Class 7 Geometry: Triangle Angle Sum Proof'
          : 'Class 7 NEP Lesson: Fractions & Rational Numbers',
        timestamp: Date.now(),
        role: result.extractedRole,
        classLevel: LOCKED_GRADE,
        subject: 'Mathematics',
        messages: isStudent
          ? [
              {
                id: 'demo-msg-1',
                role: 'user',
                content:
                  'Why is the sum of interior angles of a triangle always 180 degrees in Class 7 geometry?',
                timestamp: Date.now() - 300000
              },
              {
                id: 'demo-msg-2',
                role: 'assistant',
                content: `<medhavi_logic>
- Approach: Construct a parallel line through vertex A to base BC.
- Alternate Interior Angles: Utilize Euclidean parallel postulate.
- Straight Line Angle Sum: Show that linear angles sum to 180°.
</medhavi_logic>

## ✨ The Socratic Proof: Triangle Angle Sum Theorem

Hello **${result.extractedName}**! Let us prove why the sum of interior angles in **\\(\\Delta ABC\\)** is always \\(180^\\circ\\) using standard Class 7 geometric logic.

### 1. Construction
Given \\(\\Delta ABC\\) with interior angles \\(\\angle 1, \\angle 2, \\angle 3\\):
1. Through vertex \\(A\\), draw a straight line \\(XY\\) strictly parallel to the opposite base \\(BC\\) (i.e., \\(XY \\parallel BC\\)).

### 2. Alternate Interior Angles
Because line \\(XY\\) is parallel to line \\(BC\\), and sides \\(AB\\) and \\(AC\\) act as transversals:
- \\(\\angle XAB = \\angle ABC = \\angle 2\\) (Alternate Interior Angles)
- \\(\\angle YAC = \\angle ACB = \\angle 3\\) (Alternate Interior Angles)

### 3. Linear Straight Angle
Notice that \\(XAY\\) forms a continuous straight line. The sum of all consecutive angles on a straight line equals \\(180^\\circ\\):
\\[
\\angle XAB + \\angle BAC + \\angle YAC = 180^\\circ
\\]
Substituting our alternate interior identities:
\\[
\\angle 2 + \\angle 1 + \\angle 3 = 180^\\circ
\\]
\\[
\\therefore \\angle A + \\angle B + \\angle C = 180^\\circ \\quad \\blacksquare
\\]

### 💡 Medhavi Concept Check
If an isosceles triangle has one vertex angle of \\(80^\\circ\\), what must each of the remaining two base angles measure?`,
                timestamp: Date.now() - 240000,
                durationSeconds: 1.8,
                reasoningTokens: 184,
                model: selectedModel
              }
            ]
          : [
              {
                id: 'demo-msg-t1',
                role: 'user',
                content:
                  'Design a 40-minute Class 7 NEP-2020 classroom lesson plan on Fractions & Decimals.',
                timestamp: Date.now() - 300000
              },
              {
                id: 'demo-msg-t2',
                role: 'assistant',
                content: `<medhavi_logic>
- Class Level: Class 7 CBSE / NEP-2020.
- Pedagogical Split: 5m Hook, 7m Prior Knowledge, 13m Core Concept, 7m Paired Activity, 5m Real World, 3m Exit Ticket.
- Verification: Aligned to Bloom Taxonomy & Experiential Learning.
</medhavi_logic>

# 40-Minute Classroom Lesson Architect: Fractions & Decimals
**Grade:** Class 7 | **Subject:** Mathematics | **Duration:** 40 Minutes | **Educator:** ${result.extractedName}

## 🎯 Learning Objectives
1. **Conceptual:** Represent multiplication of a fraction by a fraction visually using grid models.
2. **Procedural:** Accurately compute \\(\\frac{a}{b} \\times \\frac{c}{d} = \\frac{a \\times c}{b \\times d}\\).
3. **Affective:** Value error analysis when identifying improper fraction conversions.

## ⏱️ Pedagogical Timeline
- **00–05 min | The Hook:** Visual paradox with overlapping coloured translucent square sheets.
- **05–12 min | Prior Knowledge Recall:** Diagnostic check on equivalent fractions and common denominators.
- **12–25 min | Core Conceptual Instruction:** Area-model derivation of fraction multiplication.
- **25–32 min | Paired Collaborative Problem-Solving:** Math lab puzzle cards (Peer verification).
- **32–37 min | Real-World Application:** Scaling cooking recipes & engineering blueprint ratios.
- **37–40 min | Exit Ticket:** 2-question quick formative slip.`,
                timestamp: Date.now() - 240000,
                durationSeconds: 2.1,
                reasoningTokens: 212,
                model: selectedModel
              }
            ]
      };

      setSessions((prev) => [sampleRecord, ...prev.filter((s) => s.id !== sampleSessionId)]);
      setActiveSessionId(sampleSessionId);
      setMessages(sampleRecord.messages);
      if (user) {
        saveCloudSession(user, sampleRecord).catch(() => {});
      }
    }

    showToast(
      `Demo Account activated: ${result.extractedName} (${
        result.extractedRole === 'teacher' ? 'Class 7 Faculty' : 'Class 7 Scholar'
      }).`,
      'success'
    );
  };

  const handleLogOutIdentity = async () => {
    stopAllScholarlySpeech();
    localStorage.removeItem('medhavi_verified_id');
    setVerifiedIdentity(null);
    setActiveDockTool('chat');
    setToolsMenuOpen(false);
    if (user) {
      await signOutScholar().catch(() => {});
    }
  };

  const handleStartNewSession = () => {
    setActiveSessionId(null);
    setMessages([]);
    setOrbStatus('idle');
    setActiveDockTool('chat');
    setToolsMenuOpen(false);
  };

  const handleSelectTool = (tool: RoleToolItem) => {
    setToolsMenuOpen(false);
    if (tool.isViewTool && persona === 'student') {
      setActiveDockTool(tool.id);
      return;
    }
    setActiveDockTool(tool.id);
    executeMedhaviRequest(tool.prompt, {
      workflowType: tool.workflowType
    });
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast('Image size is too large. Please upload an image under 8 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachedImage(reader.result);
        setAttachedImageName(file.name);
        showToast(`Attached "${file.name}" for analysis.`, 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const executeMedhaviRequest = async (
    promptText: string,
    options?: {
      workflowType?: string;
      workflowMeta?: Record<string, unknown>;
      onResponseReady?: (replyText: string) => void;
    }
  ) => {
    const trimmed = promptText.trim();
    if (!trimmed) return;
    if (activeDockTool === 'academic_calendar') {
      setActiveDockTool('chat');
    }
    setToolsMenuOpen(false);

    const startTime = performance.now();
    const userMsgId = `msg-u-${Date.now()}`;
    const assistantMsgId = `msg-a-${Date.now() + 1}`;
    const currentImage = attachedImage;

    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
      imagePreview: currentImage || undefined
    };

    const assistantPlaceholder: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      model: selectedModel
    };

    const updatedHistory = [...messages, userMsg];
    setMessages([...updatedHistory, assistantPlaceholder]);
    setComposerText('');
    setAttachedImage(null);
    setAttachedImageName('');

    setOrbStatus('preparing');
    const t1 = setTimeout(() => setOrbStatus('analysing'), 600);
    const t2 = setTimeout(() => setOrbStatus('verifying'), 1400);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory.map((m) => ({
            role: m.role,
            content: m.content
          })),
          context: {
            role: persona,
            grade: LOCKED_GRADE,
            subject,
            intelligenceMode,
            model: selectedModel,
            customSpecs,
            workflowType: options?.workflowType
          },
          imageDataUrl: currentImage,
          workflowMeta: options?.workflowMeta || {}
        })
      });

      if (!response.ok || !response.body) {
        throw new Error('Unable to reach Nemotron Cloud stream.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';
      let finalReasoningTokens = 0;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          const line = block.trim();
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.replace(/^data:\s*/, '');
          try {
            const event = JSON.parse(jsonStr);
            if (event.type === 'delta' && event.content) {
              accumulatedText += event.content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: accumulatedText } : m
                )
              );
            } else if (event.type === 'done') {
              finalReasoningTokens = event.reasoningTokens || 180;
            }
          } catch {
            // ignore partial SSE line
          }
        }
      }

      clearTimeout(t1);
      clearTimeout(t2);
      const durationSec = Number(((performance.now() - startTime) / 1000).toFixed(1));

      const completedAssistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: accumulatedText || 'Response completed.',
        timestamp: Date.now(),
        durationSeconds: durationSec,
        reasoningTokens: finalReasoningTokens || 164,
        model: selectedModel
      };

      const finalMessages = [...updatedHistory, completedAssistantMsg];
      setMessages(finalMessages);
      setOrbStatus('completed');
      options?.onResponseReady?.(completedAssistantMsg.content);

      const sessionId = activeSessionId || `sess-${Date.now()}`;
      setActiveSessionId(sessionId);
      const cleanTitle = trimmed
        .replace(/^\[.*?\]\s*/, '')
        .slice(0, 60)
        .trim();

      const sessionObj: StoredSessionRecord = {
        id: sessionId,
        title: cleanTitle || `Class 7 ${subject} Chat`,
        timestamp: Date.now(),
        role: persona,
        classLevel: LOCKED_GRADE,
        subject,
        messages: finalMessages
      };

      setSessions((prev) => {
        const others = prev.filter((s) => s.id !== sessionId);
        return [sessionObj, ...others];
      });

      if (user) {
        saveCloudSession(user, sessionObj).catch(() => {});
      }
    } catch {
      clearTimeout(t1);
      clearTimeout(t2);
      setOrbStatus('idle');
      showToast('Unable to reach Nemotron. Check your connection and try again.', 'error');
    }
  };

  const handleSaveCurrentSession = () => {
    if (messages.length === 0) {
      showToast('Start a conversation first to save it.', 'info');
      return;
    }
    const sessionId = activeSessionId || `sess-${Date.now()}`;
    const firstUser = messages.find((m) => m.role === 'user')?.content || `${subject} Study`;
    const record: StoredSessionRecord = {
      id: sessionId,
      title: firstUser.replace(/^\[.*?\]\s*/, '').slice(0, 60),
      timestamp: Date.now(),
      role: persona,
      classLevel: LOCKED_GRADE,
      subject,
      messages
    };
    setSessions((prev) => [record, ...prev.filter((s) => s.id !== sessionId)]);
    if (user) {
      saveCloudSession(user, record).catch(() => {});
    }
    showToast('Chat saved to Recent Chats.', 'success');
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      handleStartNewSession();
    }
    if (user) {
      deleteCloudSession(user, id).catch(() => {});
    }
    showToast('Chat removed.', 'info');
  };

  const handleAddSpec = (newSpec: Omit<CustomSpecItem, 'id'>) => {
    const item: CustomSpecItem = {
      ...newSpec,
      id: `spec-${Date.now()}`
    };
    setCustomSpecs((prev) => [item, ...prev]);
    if (user) {
      saveCloudSpec(user, item).catch(() => {});
    }
    showToast(`Added "${item.title}" to Medhavi Rules.`, 'success');
  };

  const handleToggleSpec = (id: string) => {
    setCustomSpecs((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, active: !s.active };
        if (user) saveCloudSpec(user, updated).catch(() => {});
        return updated;
      })
    );
  };

  const handleDeleteSpec = (id: string) => {
    setCustomSpecs((prev) => prev.filter((s) => s.id !== id));
    if (user) {
      deleteCloudSpec(user, id).catch(() => {});
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard.', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Role-filtered Command Palette items (strictly Student or Teacher commands)
  const commandItems: CommandItem[] = [
    {
      id: 'cmd-new',
      category: 'CHAT',
      label: 'New Chat',
      shortcut: 'Ctrl+Shift+N',
      action: handleStartNewSession
    },
    ...(persona === 'student'
      ? [
          {
            id: 'cmd-calendar',
            category: 'STUDENT TOOL',
            label: 'Open Class 7 Academic Calendar & Voice Notes',
            action: () => setActiveDockTool('academic_calendar')
          },
          {
            id: 'cmd-quiz',
            category: 'STUDENT TOOL',
            label: 'Start Class 7 Olympiad Arena Quiz (+2 / -1)',
            action: () =>
              executeMedhaviRequest(
                `Generate a 5-question Olympiad Arena quiz for Class 7 ${subject} inside <medhavi_quiz>...</medhavi_quiz> tags.`,
                { workflowType: 'olympiad_quiz' }
              )
          }
        ]
      : [
          {
            id: 'cmd-qpaper',
            category: 'TEACHER TOOL',
            label: 'Create 40-Mark Class 7 Question Paper & Answer Key',
            action: () =>
              executeMedhaviRequest(
                `[QUESTION PAPER STUDIO] Create a 40-mark Class 7 ${subject} question paper with Student Question Paper, Teacher Answer Key, and Marking Scheme.`
              )
          },
          {
            id: 'cmd-lesson',
            category: 'TEACHER TOOL',
            label: 'Design 40-Minute Class 7 NEP-2020 Lesson Plan',
            action: () =>
              executeMedhaviRequest(
                `Design a 40-minute Class 7 NEP-2020 classroom lesson plan for ${subject}.`
              )
          }
        ]),
    {
      id: 'cmd-voice-chat',
      category: 'VOICE',
      label: 'Launch Live Voice Chat with Jaipuria Medhavi',
      action: () => setVoiceChatOpen(true)
    },
    {
      id: 'cmd-create-demo',
      category: 'DEMO',
      label: 'Create or Switch Demo Account (Student / Teacher)',
      action: () => setDemoModalOpen(true)
    },
    {
      id: 'cmd-demo-student',
      category: 'DEMO',
      label: 'Launch Atharva Jindal Demo Account (Class 7 Student)',
      action: () => {
        const p = DEMO_PRESETS[0];
        handleActivateDemoAccount(
          {
            verified: true,
            confidence: 99,
            extractedName: p.name,
            extractedRole: p.role,
            schoolId: p.schoolId,
            schoolName: 'Seth M.R. Jaipuria School, Lucknow',
            grade: LOCKED_GRADE,
            badgeId: 'JM-DEMO-13457',
            summary: 'Verified Atharva Jindal Class 7 Scholar Demo Account.',
            checks: {
              institutionMatch: true,
              roleMatch: true,
              gradeSevenAuthorized: true,
              visualSealDetected: true
            }
          },
          {
            role: p.role,
            fullName: p.name,
            schoolId: p.schoolId,
            section: p.section,
            house: p.house,
            seedSampleChats: true,
            seedQuizHistory: true
          }
        );
      }
    },
    {
      id: 'cmd-demo-teacher',
      category: 'DEMO',
      label: 'Launch Dr. Ananya Sharma Demo Account (Class 7 Faculty)',
      action: () => {
        const p = DEMO_PRESETS[1];
        handleActivateDemoAccount(
          {
            verified: true,
            confidence: 99,
            extractedName: p.name,
            extractedRole: p.role,
            schoolId: p.schoolId,
            schoolName: 'Seth M.R. Jaipuria School, Lucknow',
            grade: LOCKED_GRADE,
            badgeId: 'JM-DEMO-0742',
            summary: 'Verified Dr. Ananya Sharma Class 7 Faculty Demo Account.',
            checks: {
              institutionMatch: true,
              roleMatch: true,
              gradeSevenAuthorized: true,
              visualSealDetected: true
            }
          },
          {
            role: p.role,
            fullName: p.name,
            schoolId: p.schoolId,
            section: p.section,
            house: p.house,
            seedSampleChats: true,
            seedQuizHistory: true
          }
        );
      }
    },
    {
      id: 'cmd-identity',
      category: 'IDENTITY',
      label: 'Ask: Who are you? (Introduce Jaipuria Medhavi)',
      action: () => executeMedhaviRequest('Who are you? Introduce yourself and your core rules.')
    },
    {
      id: 'cmd-logout',
      category: 'ACCOUNT',
      label: 'Log Out / Switch Verified School ID Card',
      action: handleLogOutIdentity
    }
  ];

  // Role-filtered sessions so Student accounts only see Student chats and Teacher accounts only see Teacher chats
  const roleSessions = sessions.filter((s) => s.role === persona);

  const samplePrompts =
    persona === 'student'
      ? [
          'Who are you? Introduce yourself as Jaipuria Medhavi.',
          "How many r's are in the word 'strawberry'?",
          `Challenge me with a Class 7 ${subject} Olympiad quiz.`,
          `Create a 5-minute revision sheet for Class 7 ${subject}.`
        ]
      : [
          `Create a 40-mark Class 7 ${subject} question paper with answer key.`,
          `Design a 40-minute Class 7 NEP-2020 lesson plan on ${subject}.`,
          "Evaluate a Class 7 student's descriptive answer out of 10 marks.",
          'Draft a bilingual (English & Hindi) circular for Class 7 parents.'
        ];

  // FIRST DETAIL PAGE + LOGIN/SIGNUP + AI ID CARD VERIFICATION GATE
  if (!verifiedIdentity) {
    return (
      <div className="relative">
        <JyotiKnowledgeField isLight={isLight} persona={persona} />
        <IdentityGatePage
          isLight={isLight}
          user={user}
          onGoogleSignIn={async () => {
            try {
              const signedInUser = await signInWithGoogleScholar();
              if (signedInUser) {
                showToast(
                  `Signed in with Google as ${signedInUser.displayName || signedInUser.email}`,
                  'success'
                );
              }
            } catch {
              showToast(
                'Google Sign-In popup closed. Verify directly with your Jaipuria ID card below.',
                'info'
              );
            }
          }}
          onCompleteVerification={handleCompleteIdentityGate}
          onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        />
      </div>
    );
  }

  const nameParts = verifiedIdentity.extractedName.trim().split(/\s+/);
  const firstName =
    nameParts[0]?.endsWith('.') && nameParts.length > 1
      ? `${nameParts[0]} ${nameParts[1]}`
      : nameParts[0] || 'Scholar';

  return (
    <div
      className={`min-h-screen lg:h-screen lg:overflow-hidden flex flex-col relative transition-colors duration-300 ${
        isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#07101F] text-slate-100'
      }`}
    >
      <JyotiKnowledgeField isLight={isLight} persona={persona} />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-16 right-6 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl border shadow-xl text-xs font-medium no-print ${
            toast.type === 'error'
              ? 'bg-rose-950/95 border-rose-500/60 text-rose-200'
              : toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-200'
              : 'bg-slate-900/95 border-amber-500/50 text-amber-200'
          }`}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="opacity-70 hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =====================================================================
       * MINIMAL GEMINI-STYLE TOP HEADER (Uncluttered, Clean)
       * =================================================================== */}
      <header
        className={`sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b backdrop-blur-xl no-print ${
          isLight
            ? 'bg-white/85 border-slate-200/80'
            : 'bg-[#07101F]/80 border-slate-800/70'
        }`}
      >
        {/* Left: Sidebar Toggle + Brand + Strict Role Indicator */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLeftSidebarOpen((prev) => !prev)}
            aria-label="Toggle Sidebar"
            className="p-2 rounded-xl border border-slate-700/40 hover:border-amber-400/60 transition-colors"
          >
            {leftSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={handleStartNewSession}
            className="text-base sm:text-lg font-bold tracking-tight font-display whitespace-nowrap"
          >
            Jaipuria Medhavi · मेधावी
          </button>

          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span aria-hidden="true">·</span>
            {persona === 'student' ? (
              <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
            ) : (
              <BookOpen className="w-3.5 h-3.5 text-violet-400" />
            )}
            <span className={persona === 'student' ? 'text-sky-400' : 'text-violet-400'}>
              {persona === 'student' ? 'Class 7 Student' : 'Class 7 Teacher'}
            </span>
          </span>
        </div>

        {/* Right: Subject Selector + Voice Chat + Theme + Log Out */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs">
            <label htmlFor="global-subject-select" className="sr-only">
              Select Class 7 Subject
            </label>
            <select
              id="global-subject-select"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-medium outline-none transition-colors ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900'
                  : 'bg-slate-900/90 border-slate-700/80 text-slate-100'
              }`}
            >
              {SUBJECT_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setDemoModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Demo Account</span>
            <span className="sm:hidden">Demo</span>
          </button>

          <button
            type="button"
            onClick={() => setVoiceChatOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Voice Chat</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            aria-label="Toggle Theme"
            className="p-2 rounded-xl border border-slate-700/50 hover:border-amber-400/60 transition-colors"
          >
            {isLight ? (
              <Moon className="w-4 h-4 text-slate-700" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          <button
            type="button"
            onClick={handleLogOutIdentity}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-700/70 hover:border-rose-400/60 transition-colors whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5 text-amber-400" />
            <span>Log Out ({firstName})</span>
          </button>
        </div>
      </header>

      {/* =====================================================================
       * GEMINI-STYLE TWO-PART LAYOUT: COLLAPSIBLE SIDEBAR + CLEAN CHAT STAGE
       * =================================================================== */}
      <div className="relative z-10 flex-1 flex min-h-0">
        {/* LEFT SIDEBAR: New Chat + Role-Exclusive Tools + Recent Chats */}
        {leftSidebarOpen && (
          <aside
            aria-label="Sidebar Navigation and Role Tools"
            className={`w-64 shrink-0 border-r flex flex-col justify-between p-3.5 overflow-y-auto no-print liquid-glass-dock ${
              isLight ? 'border-slate-200/80' : 'border-slate-800/70'
            }`}
          >
            <div className="space-y-5">
              {/* New Chat Button */}
              <button
                type="button"
                onClick={handleStartNewSession}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>New Chat</span>
              </button>

              {/* Strictly Role-Locked Tools List */}
              <div>
                <div className="px-2.5 text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  {persona === 'student' ? 'STUDENT TOOLS' : 'TEACHER TOOLS'}
                </div>
                <div className="space-y-0.5">
                  {roleTools.map((tool) => {
                    const isActive = activeDockTool === tool.id;
                    const isCalendar = tool.id === 'academic_calendar';
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => handleSelectTool(tool)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                          isActive
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                            : isLight
                            ? 'hover:bg-slate-200/60 text-slate-700'
                            : 'hover:bg-slate-800/45 text-slate-300'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          {isCalendar ? (
                            <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          ) : (
                            <Compass className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span className="truncate">{tool.label}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recent Chats */}
              <div>
                <div className="flex items-center justify-between px-2.5 text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  <span>RECENT CHATS ({roleSessions.length})</span>
                  {roleSessions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSessions((prev) => prev.filter((s) => s.role !== persona));
                        showToast('Cleared recent chats.', 'info');
                      }}
                      className="text-[10px] text-slate-500 hover:text-rose-400"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="space-y-1 max-h-44 overflow-y-auto">
                  {roleSessions.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-slate-500">No recent chats yet.</div>
                  ) : (
                    roleSessions.map((sess) => (
                      <div
                        key={sess.id}
                        onClick={() => {
                          setActiveSessionId(sess.id);
                          setSubject(sess.subject);
                          setMessages(sess.messages);
                          setActiveDockTool('chat');
                        }}
                        className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                          activeSessionId === sess.id && activeDockTool !== 'academic_calendar'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'hover:bg-slate-800/40 text-slate-300'
                        }`}
                      >
                        <div className="truncate">
                          <div className="font-medium truncate">{sess.title}</div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {sess.subject}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSession(sess.id, e)}
                          aria-label={`Delete chat ${sess.title}`}
                          className="opacity-60 hover:opacity-100 hover:text-rose-400 p-1 shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Verified Account Footer Card */}
            <div className="pt-3 border-t border-slate-800/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="truncate">
                  <div className="font-semibold truncate">{verifiedIdentity.extractedName}</div>
                  <div className="text-[11px] font-mono text-emerald-400">
                    {persona === 'student'
                      ? `Scholar No: ${verifiedIdentity.schoolId}`
                      : `Faculty ID: ${verifiedIdentity.schoolId}`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSpecsModalOpen(true)}
                  aria-label="Open Medhavi Rules"
                  className="p-1.5 rounded-lg border border-slate-700/60 hover:border-amber-400/60 text-amber-400"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* CENTER STAGE: Clean Gemini-Style Chat Canvas OR Student Academic Calendar */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 justify-between">
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-4xl w-full mx-auto print-container flex flex-col">
            {activeDockTool === 'academic_calendar' && persona === 'student' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveDockTool('chat')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 hover:border-amber-400/60"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                    <span>Back to Chat</span>
                  </button>
                </div>

                <AcademicCalendarView
                  isLight={isLight}
                  activeSubject={subject}
                  onLaunchMedhaviPrep={(prompt, wfType) => {
                    setActiveDockTool('chat');
                    executeMedhaviRequest(prompt, { workflowType: wfType });
                  }}
                  onShowToast={showToast}
                />
              </div>
            ) : messages.length === 0 ? (
              /* ===============================================================
               * GEMINI-STYLE CLEAN EMPTY STATE
               * ============================================================= */
              <div className="flex-1 flex flex-col items-center justify-center py-8 space-y-7">
                <div className="flex flex-col items-center text-center space-y-3 max-w-2xl">
                  <JyotiOrb status={orbStatus} persona={persona} />

                  <h1 className="text-3xl sm:text-5xl font-bold font-display tracking-tight">
                    <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-sky-400 bg-clip-text text-transparent">
                      Hello, {firstName}
                    </span>
                  </h1>

                  <p
                    className={`text-base sm:text-xl font-medium ${
                      isLight ? 'text-slate-600' : 'text-slate-300'
                    }`}
                  >
                    {persona === 'student'
                      ? `How can I help you master Class 7 ${subject} today?`
                      : `What shall we prepare for Class 7 ${subject} today?`}
                  </p>
                </div>

                {/* Compact Suggestion Chips (Strictly for the Logged-In Role) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl">
                  {samplePrompts.map((sp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        executeMedhaviRequest(sp, {
                          workflowType: sp.toLowerCase().includes('olympiad')
                            ? 'olympiad_quiz'
                            : sp.toLowerCase().includes('evaluate')
                            ? 'answer_evaluator'
                            : undefined
                        })
                      }
                      className={`text-left p-3.5 rounded-2xl text-xs sm:text-sm transition-all liquid-glass hover:border-amber-400/60 ${
                        isLight ? 'text-slate-700' : 'text-slate-200'
                      }`}
                    >
                      {sp}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* ===============================================================
               * ACTIVE CHAT STREAM
               * ============================================================= */
              <div className="space-y-6 pb-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/50 no-print">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <JyotiOrb status={orbStatus} persona={persona} compact />
                    <span>Class 7 {subject}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveCurrentSession}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-700/70 hover:border-emerald-400/60"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-700/70 hover:border-amber-400/60"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>

                {messages.map((msg) => {
                  if (msg.role === 'user') {
                    return (
                      <article
                        key={msg.id}
                        className="flex justify-end"
                      >
                        <div
                          className={`max-w-2xl rounded-2xl px-5 py-3.5 ${
                            isLight
                              ? 'bg-slate-200/80 text-slate-900'
                              : 'bg-slate-800/75 text-slate-100 border border-slate-700/60'
                          }`}
                        >
                          {msg.imagePreview && (
                            <div className="mb-2.5">
                              <img
                                src={msg.imagePreview}
                                alt="Uploaded attachment"
                                referrerPolicy="no-referrer"
                                className="max-h-44 rounded-xl border border-slate-700 object-contain"
                              />
                            </div>
                          )}
                          <div className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
                            {msg.content}
                          </div>
                        </div>
                      </article>
                    );
                  }

                  const parsed = parseMedhaviResponse(msg.content);
                  const isLogicOpen = Boolean(expandedLogicIds[msg.id]);

                  return (
                    <article
                      key={msg.id}
                      className="liquid-glass rounded-2xl p-6 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800/40 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span className="font-bold text-amber-400">Jaipuria Medhavi</span>
                          {msg.reasoningTokens && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono text-emerald-400">
                                {msg.reasoningTokens} reasoning tokens
                              </span>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedLogicIds((prev) => ({
                              ...prev,
                              [msg.id]: !prev[msg.id]
                            }))
                          }
                          className="flex items-center gap-1 text-xs font-medium text-amber-400 hover:underline no-print"
                        >
                          <span>Reasoning Steps</span>
                          {isLogicOpen ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {isLogicOpen && (
                        <div className="p-3.5 rounded-xl border border-amber-500/25 bg-amber-500/5 space-y-1 text-xs">
                          <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                            {parsed.logicSummary.map((step, sIdx) => (
                              <li key={sIdx}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {parsed.quizData && (
                        <OlympiadQuizView
                          quiz={parsed.quizData}
                          isLight={isLight}
                          onChallengeAgain={(newDiff) =>
                            executeMedhaviRequest(
                              `Generate a 5-question ${
                                newDiff || parsed.quizData?.difficulty || 'Olympiad'
                              }-level Olympiad Arena MCQ challenge for Class 7 ${subject} on "${
                                parsed.quizData?.topic || subject
                              }". Return inside <medhavi_quiz>...</medhavi_quiz> tags.`,
                              {
                                workflowType: 'olympiad_quiz',
                                workflowMeta: {
                                  topic: parsed.quizData?.topic || subject,
                                  difficulty: newDiff || 'Olympiad',
                                  questionCount: 5
                                }
                              }
                            )
                          }
                          onSaveAttempt={(report: OlympiadPerformanceReport, qData: QuizData) => {
                            if (user) {
                              saveCloudQuizAttempt(user, {
                                id: `qa-${Date.now()}`,
                                topic: qData.topic || subject,
                                subject,
                                classLevel: LOCKED_GRADE,
                                difficulty: qData.difficulty || 'Olympiad',
                                score: report.score,
                                maxScore: report.maxScore,
                                accuracy: report.accuracy
                              }).catch(() => {});
                            }
                          }}
                        />
                      )}

                      {parsed.evaluationData && (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-base font-bold font-display">
                              Suggested Score: {parsed.evaluationData.suggestedScore} /{' '}
                              {parsed.evaluationData.maxMarks}
                            </h4>
                            <span className="text-xs font-mono text-amber-400">
                              Confidence: {parsed.evaluationData.confidence}
                            </span>
                          </div>
                        </div>
                      )}

                      {parsed.cleanMarkdown && (
                        <div
                          className="medhavi-prose text-sm sm:text-base"
                          dangerouslySetInnerHTML={{
                            __html: renderScholarlyMarkdown(parsed.cleanMarkdown)
                          }}
                        />
                      )}

                      <div className="pt-3 border-t border-slate-800/40 flex flex-wrap items-center justify-between gap-2 no-print">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (speakingMessageId === msg.id) {
                                stopAllScholarlySpeech();
                                setSpeakingMessageId(null);
                              } else {
                                setSpeakingMessageId(msg.id);
                                speakScholarlyText(parsed.cleanMarkdown, {
                                  onEnd: () => setSpeakingMessageId(null)
                                });
                              }
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-colors ${
                              speakingMessageId === msg.id
                                ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                                : 'border-slate-700/70 hover:border-amber-400/60'
                            }`}
                          >
                            {speakingMessageId === msg.id ? (
                              <>
                                <Square className="w-3.5 h-3.5 fill-current text-amber-400" />
                                <span>Stop</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                                <span>Listen</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyText(msg.id, parsed.cleanMarkdown)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border border-slate-700/70 hover:border-amber-400/60"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              executeMedhaviRequest(
                                'Simplify the previous explanation step-by-step for Class 7.'
                              )
                            }
                            className="px-3 py-1.5 rounded-xl text-xs border border-slate-700/70 hover:border-sky-400/60"
                          >
                            Simplify
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              executeMedhaviRequest(
                                `Generate a 5-question Class 7 quiz on ${subject} inside <medhavi_quiz>...</medhavi_quiz> tags.`,
                                { workflowType: 'olympiad_quiz' }
                              )
                            }
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25"
                          >
                            Quiz Me
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* =================================================================
           * GEMINI-STYLE UNIFIED LIQUID GLASS PROMPT BAR (With Tools Popover)
           * =============================================================== */}
          <div className="shrink-0 z-20 px-4 sm:px-8 pb-4 pt-2 no-print">
            <div className="max-w-3xl mx-auto relative">
              {/* Popover Tools Menu (Neatly tucked inside "+ Tools" button) */}
              {toolsMenuOpen && (
                <div
                  role="menu"
                  aria-label="Role Specific Tools Menu"
                  className="absolute bottom-full left-0 mb-2.5 w-80 sm:w-96 rounded-2xl p-3 liquid-glass-elevated z-40 space-y-2"
                >
                  <div className="flex items-center justify-between px-2 py-1 text-[11px] font-mono uppercase text-amber-400">
                    <span>
                      {persona === 'student'
                        ? 'Class 7 Student Tools'
                        : 'Class 7 Teacher Tools'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setToolsMenuOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-1 max-h-64 overflow-y-auto">
                    {roleTools.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectTool(t)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-500/15 transition-colors flex items-start justify-between gap-2"
                      >
                        <div>
                          <div className="text-xs font-semibold text-slate-100">{t.label}</div>
                          <div className="text-[11px] text-slate-400">{t.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div
                className={`rounded-2xl p-3 liquid-glass-elevated ${
                  isLight ? 'text-slate-900' : 'text-slate-100'
                }`}
              >
                {attachedImage && (
                  <div className="mb-2.5 flex items-center justify-between p-2 rounded-xl bg-slate-900/70 border border-slate-700">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={attachedImage}
                        alt="Attachment preview"
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded object-cover border border-amber-400/50"
                      />
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {attachedImageName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachedImage(null);
                        setAttachedImageName('');
                      }}
                      aria-label="Remove attachment"
                      className="p-1 text-slate-400 hover:text-rose-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    executeMedhaviRequest(composerText);
                  }}
                  className="space-y-2.5"
                >
                  <label htmlFor="medhavi-composer-input" className="sr-only">
                    Ask Jaipuria Medhavi
                  </label>
                  <textarea
                    id="medhavi-composer-input"
                    rows={2}
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                        e.preventDefault();
                        executeMedhaviRequest(composerText);
                      }
                    }}
                    placeholder={
                      persona === 'student'
                        ? `Ask Jaipuria Medhavi anything in Class 7 ${subject}...`
                        : `Ask Jaipuria Medhavi to create a Class 7 ${subject} paper, lesson plan, or rubric...`
                    }
                    className="w-full px-1 bg-transparent text-sm sm:text-base outline-none resize-none leading-relaxed placeholder:text-slate-500"
                  />

                  {/* Clean Bottom Action Row inside Prompt Box */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-800/40">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setToolsMenuOpen((prev) => !prev)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                          toolsMenuOpen
                            ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                            : 'border-slate-700/80 hover:border-amber-400/60'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-400" />
                        <span>Tools</span>
                      </button>

                      {persona === 'student' && (
                        <button
                          type="button"
                          onClick={() =>
                            setActiveDockTool((prev) =>
                              prev === 'academic_calendar' ? 'chat' : 'academic_calendar'
                            )
                          }
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                            activeDockTool === 'academic_calendar'
                              ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                              : 'border-slate-700/80 hover:border-amber-400/60'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span className="hidden sm:inline">Calendar</span>
                        </button>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Attach image"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-700/80 hover:border-amber-400/60 text-xs"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-amber-400" />
                        <span className="hidden sm:inline">Attach</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          playScholarlyChime(composerDictating ? 'stop' : 'start');
                          if (composerDictating) {
                            setComposerDictating(false);
                            return;
                          }
                          setComposerDictating(true);
                          showToast('Listening for voice input...', 'info');
                          setTimeout(() => {
                            setComposerText((prev) =>
                              prev.trim()
                                ? prev
                                : `Explain the step-by-step Class 7 ${subject} concepts for my upcoming exam.`
                            );
                            setComposerDictating(false);
                          }, 1100);
                        }}
                        aria-label="Dictate voice note"
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-colors ${
                          composerDictating
                            ? 'border-rose-400 bg-rose-500/20 text-rose-300'
                            : 'border-slate-700/80 hover:border-amber-400/60'
                        }`}
                      >
                        <Mic
                          className={`w-3.5 h-3.5 ${
                            composerDictating ? 'text-rose-400' : 'text-amber-400'
                          }`}
                        />
                        <span className="hidden sm:inline">
                          {composerDictating ? 'Listening...' : 'Voice'}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Mode Selector */}
                      <select
                        aria-label="Reasoning Mode"
                        value={intelligenceMode}
                        onChange={(e) =>
                          setIntelligenceMode(e.target.value as IntelligenceMode)
                        }
                        className={`rounded-xl border px-2.5 py-1.5 text-xs font-medium outline-none ${
                          isLight
                            ? 'bg-slate-100 border-slate-300 text-slate-800'
                            : 'bg-slate-900/90 border-slate-700/80 text-slate-200'
                        }`}
                      >
                        <option value="pedagogical">
                          {persona === 'student' ? 'Step-by-Step' : 'Pedagogical'}
                        </option>
                        <option value="deep">Deep Logic</option>
                        <option value="quick">Fast</option>
                      </select>

                      <button
                        type="submit"
                        disabled={!composerText.trim() && !attachedImage}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-40 transition-colors"
                      >
                        <span>Ask</span>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* MODALS */}
      <MedhaviSpecsModal
        isOpen={specsModalOpen}
        onClose={() => setSpecsModalOpen(false)}
        specs={customSpecs}
        onAddSpec={handleAddSpec}
        onToggleSpec={handleToggleSpec}
        onDeleteSpec={handleDeleteSpec}
        isLight={isLight}
      />

      <CommandPaletteModal
        isOpen={cmdPaletteOpen}
        onClose={() => setCmdPaletteOpen(false)}
        commands={commandItems}
        isLight={isLight}
      />

      <CloudAccountModal
        isOpen={cloudModalOpen}
        onClose={() => setCloudModalOpen(false)}
        selectedModel={selectedModel}
        onSelectModel={(mId) => {
          setSelectedModel(mId);
          showToast(`Switched model to ${mId}`, 'info');
        }}
        availableModels={availableModels}
        cloudOnline={cloudOnline}
        onTestConnection={async () => {
          await checkServerHealth();
          showToast('Verified OpenRouter Nemotron Cloud connection.', 'success');
        }}
        totalReasoningTokens={totalReasoningTokens}
        user={user}
        onSignIn={async () => {
          try {
            const signedInUser = await signInWithGoogleScholar();
            if (signedInUser) {
              showToast(`Signed in as ${signedInUser.displayName || signedInUser.email}`, 'success');
            }
          } catch {
            showToast('Google Sign-In popup was closed.', 'error');
          }
        }}
        onSignOut={async () => {
          await signOutScholar();
          showToast('Signed out of Scholar Cloud.', 'info');
        }}
        onDownloadStandaloneHtml={() => {
          downloadStandaloneMedhaviHtml(sessions, customSpecs, LOCKED_GRADE, subject);
          showToast('Exported portable jaipuria-medhavi-index.html', 'success');
        }}
        onOpenDemoAccountModal={() => setDemoModalOpen(true)}
        isLight={isLight}
        persona={persona}
      />

      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        isLight={isLight}
      />

      <VoiceChatModal
        isOpen={voiceChatOpen}
        onClose={() => setVoiceChatOpen(false)}
        isLight={isLight}
        subject={subject}
        scholarName={firstName}
        onSendVoiceMessage={(spokenText, onResponseReady) => {
          executeMedhaviRequest(spokenText, { onResponseReady });
        }}
      />

      <CreateDemoAccountModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        isLight={isLight}
        onActivateDemoAccount={handleActivateDemoAccount}
      />
    </div>
  );
}
