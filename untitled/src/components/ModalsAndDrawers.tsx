import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  Search,
  Cloud,
  Sparkles,
  LogIn,
  LogOut,
  Download,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import type { CustomSpecItem, PersonaRole } from '../utils/medhaviEngine';
import type { User } from 'firebase/auth';

/* ============================================================================
 * 1. MEDHAVI SPECIFICATIONS SIDE-SHEET MODAL
 * ========================================================================== */
interface SpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
  specs: CustomSpecItem[];
  onAddSpec: (spec: Omit<CustomSpecItem, 'id'>) => void;
  onToggleSpec: (id: string) => void;
  onDeleteSpec: (id: string) => void;
  isLight: boolean;
}

const SPEC_CATEGORIES: CustomSpecItem['category'][] = [
  'Current Syllabus',
  'Examination Pattern',
  'Competition Rules',
  'School Rules',
  'Teacher Instructions',
  'Student Learning Goals'
];

export const MedhaviSpecsModal: React.FC<SpecsModalProps> = ({
  isOpen,
  onClose,
  specs,
  onAddSpec,
  onToggleSpec,
  onDeleteSpec,
  isLight
}) => {
  const [category, setCategory] = useState<CustomSpecItem['category']>('Current Syllabus');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onAddSpec({
      category,
      title: title.trim(),
      content: content.trim(),
      active: true
    });
    setTitle('');
    setContent('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="specs-modal-title"
    >
      <div
        className={`w-full max-w-lg h-full overflow-y-auto p-6 border-l flex flex-col justify-between ${
          isLight
            ? 'bg-[#F8FAFC] border-slate-200 text-slate-900'
            : 'bg-[#0B1120] border-slate-800 text-slate-100'
        }`}
      >
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/40">
            <div>
              <div className="text-xs font-mono text-amber-400">Dynamic System Prompt Engine</div>
              <h2 id="specs-modal-title" className="text-xl font-bold font-display">
                Medhavi Specifications
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Medhavi Specifications"
              className="p-2 rounded-lg border border-slate-700/60 hover:border-amber-400/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-3 leading-relaxed">
            Configure custom Seth M.R. Jaipuria School parameters, current CBSE/ICSE chapters, marking
            schemes, or Olympiad rules. Active blocks are injected into every Medhavi response.
          </p>

          {/* Add New Spec Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-3 p-4 rounded-xl border border-slate-800/80 bg-slate-900/30">
            <div className="text-xs font-semibold text-amber-400">Add Specification Block</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="spec-cat" className="block text-[11px] text-slate-400 mb-1">
                  Category
                </label>
                <select
                  id="spec-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CustomSpecItem['category'])}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-1.5 text-xs text-slate-100 outline-none"
                >
                  {SPEC_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="spec-title" className="block text-[11px] text-slate-400 mb-1">
                  Block Title
                </label>
                <input
                  id="spec-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., CBSE Unit Test II Pattern"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-1.5 text-xs text-slate-100 outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="spec-content" className="block text-[11px] text-slate-400 mb-1">
                Instructions / Context
              </label>
              <textarea
                id="spec-content"
                rows={3}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="e.g., Current chapter: Triangles. Structure answers as: Definition → Theorem → Worked Example → Exam Tip."
                className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Specification</span>
              </button>
            </div>
          </form>

          {/* Existing Spec Blocks */}
          <div className="mt-6 space-y-3">
            <div className="text-xs font-semibold text-slate-400">
              Configured Specifications ({specs.filter((s) => s.active).length} Active)
            </div>
            {specs.map((spec) => (
              <div
                key={spec.id}
                className={`p-3.5 rounded-xl border transition-colors ${
                  spec.active
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : 'border-slate-800 bg-slate-900/20 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-mono text-amber-400">
                    {spec.category} · <span className="font-sans font-semibold text-slate-200">{spec.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleSpec(spec.id)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                        spec.active
                          ? 'border-emerald-500/50 text-emerald-300 bg-emerald-500/10'
                          : 'border-slate-700 text-slate-400'
                      }`}
                    >
                      {spec.active ? 'Active' : 'Muted'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSpec(spec.id)}
                      aria-label={`Delete specification ${spec.title}`}
                      className="p-1 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {spec.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Saved locally &amp; synced with Scholar Cloud</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 2. COMMAND PALETTE MODAL (⌘K / Ctrl+K)
 * ========================================================================== */
export interface CommandItem {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
  isLight: boolean;
}

export const CommandPaletteModal: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands,
  isLight
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filtered = commands.filter(
    (c) =>
      c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cmd-palette-title"
    >
      <div
        className={`w-full max-w-xl rounded-xl border overflow-hidden shadow-2xl ${
          isLight
            ? 'bg-white border-slate-300 text-slate-900'
            : 'bg-[#0B1120] border-slate-700 text-slate-100'
        }`}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-700/40">
          <Search className="w-4 h-4 text-amber-400 shrink-0" />
          <label htmlFor="cmd-search-input" id="cmd-palette-title" className="sr-only">
            Medhavi Command Search
          </label>
          <input
            id="cmd-search-input"
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type a Medhavi command (e.g., Solve, Olympiad, Question Paper, Lesson, Theme)..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
          />
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-0.5 rounded text-xs font-mono border border-slate-700 text-slate-400"
          >
            Esc
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.map((cmd) => (
            <button
              key={cmd.id}
              type="button"
              onClick={() => {
                cmd.action();
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm hover:bg-amber-500/15 transition-colors"
            >
              <div>
                <span className="text-xs font-mono text-amber-400 mr-2">{cmd.category}</span>
                <span className="font-medium">{cmd.label}</span>
              </div>
              {cmd.shortcut && (
                <span className="text-xs font-mono text-slate-400">{cmd.shortcut}</span>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching Medhavi commands found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 3. NEMOTRON CLOUD & SCHOLAR ACCOUNT MODAL
 * ========================================================================== */
interface CloudModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  availableModels: Array<{ id: string; name: string; badge: string; provider: string }>;
  cloudOnline: boolean;
  onTestConnection: () => Promise<void>;
  totalReasoningTokens: number;
  user: User | null;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onDownloadStandaloneHtml: () => void;
  onOpenDemoAccountModal?: () => void;
  isLight: boolean;
  persona: PersonaRole;
}

export const CloudAccountModal: React.FC<CloudModalProps> = ({
  isOpen,
  onClose,
  selectedModel,
  onSelectModel,
  availableModels,
  cloudOnline,
  onTestConnection,
  totalReasoningTokens,
  user,
  onSignIn,
  onSignOut,
  onDownloadStandaloneHtml,
  onOpenDemoAccountModal,
  isLight
}) => {
  const [testing, setTesting] = useState(false);

  if (!isOpen) return null;

  const handleVerify = async () => {
    setTesting(true);
    await onTestConnection();
    setTesting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cloud-modal-title"
    >
      <div
        className={`w-full max-w-xl rounded-xl border p-6 shadow-2xl ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#0B1120] border-slate-800 text-slate-100'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/40">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-xs font-mono text-emerald-400">
                OpenRouter SDK · Firebase Cloud Sync
              </div>
              <h2 id="cloud-modal-title" className="text-lg font-bold font-display">
                Nemotron Intelligence &amp; Scholar Account
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Cloud Settings"
            className="p-1.5 rounded-lg border border-slate-700 hover:border-amber-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* OpenRouter Model Switcher */}
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active OpenRouter Reasoning Model
            </span>
            <span className="text-xs font-mono text-emerald-400">
              {cloudOnline ? '● NEMOTRON CLOUD ONLINE' : '○ RECONNECTING'}
            </span>
          </div>

          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {availableModels.map((m) => {
              const active = selectedModel === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectModel(m.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    active
                      ? 'border-amber-400 bg-amber-500/10'
                      : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{m.name}</span>
                    {active && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">
                    {m.badge} · {m.provider}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-2 text-xs">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>Session Reasoning Tokens Tracked:</span>
              <span className="font-mono font-bold text-amber-400 tabular-nums">
                {totalReasoningTokens.toLocaleString()} tokens
              </span>
            </div>

            <button
              type="button"
              onClick={handleVerify}
              disabled={testing}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10 transition-colors"
            >
              {testing ? 'Verifying Stream…' : 'Test Connection'}
            </button>
          </div>
        </div>

        {/* Firebase Authentication Account Section */}
        <div className="mt-5 pt-5 border-t border-slate-800">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Firebase Cloud Account &amp; Real-Time Firestore Sync
          </div>
          {user ? (
            <div className="mt-2.5 flex items-center justify-between p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-sm font-semibold">
                    {user.displayName || 'Jaipuria Scholar'}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {user.email} · Cloud Sync Active
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 hover:border-rose-400 text-slate-300"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg border border-slate-800 bg-slate-900/40">
              <div className="text-xs text-slate-300 max-w-xs">
                Sign in with Google to synchronize saved sessions, custom Medhavi specifications, and
                Olympiad Arena scores across devices via Firebase Firestore.
              </div>
              <div className="flex items-center gap-2">
                {onOpenDemoAccountModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDemoAccountModal();
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Create Demo Account</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onSignIn}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In with Google</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Portable Single-File Export */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onDownloadStandaloneHtml}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-700 hover:border-amber-400/60 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export Portable Single-File index.html</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 4. 3-STEP ONBOARDING GUIDE MODAL
 * ========================================================================== */
interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  isLight
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div
        className={`w-full max-w-lg rounded-xl border p-6 shadow-2xl ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#0B1120] border-amber-500/30 text-slate-100'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-amber-400">
            Seth M.R. Jaipuria School · Tamso Ma Jyotirgamaya
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Onboarding"
            className="p-1 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h2 id="onboarding-title" className="text-2xl font-bold font-display mt-2">
          Welcome to Jaipuria Medhavi (मेधावी)
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          The High-Logic AI Scholar &amp; Pedagogical Intelligence Laboratory.
        </p>

        <div className="mt-5 space-y-3">
          <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/40">
            <div className="text-xs font-mono text-amber-400">01. Welcome to Medhavi</div>
            <div className="text-sm font-semibold mt-0.5">
              Your intelligent academic workspace
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Calibrate Class (6 to 12) and Subject (Mathematics to Sanskrit &amp; AI) for curriculum-aligned
              reasoning and LaTeX mathematical proofs.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/40">
            <div className="text-xs font-mono text-sky-400">02. Choose Your Mode</div>
            <div className="text-sm font-semibold mt-0.5">
              Student Portal or Teacher Studio
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Switch seamlessly between the Socratic Solver &amp; Olympiad Arena for students, and the
              Question Paper Studio &amp; 40-Minute Lesson Architect for educators.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/40">
            <div className="text-xs font-mono text-emerald-400">03. Nemotron Cloud &amp; Accounts</div>
            <div className="text-sm font-semibold mt-0.5">
              Powered by NVIDIA Nemotron 3.5 Super VL &amp; Firebase
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time streaming with reasoning token telemetry and Google Account cloud synchronization.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Start Exploring</span>
          </button>
        </div>
      </div>
    </div>
  );
};
