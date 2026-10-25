import React, { useState } from 'react';
import {
  X,
  Sparkles,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Check,
  ArrowRight,
  UserCheck,
  RefreshCw,
  Award,
  Calendar,
  Layers
} from 'lucide-react';
import {
  LOCKED_GRADE,
  type PersonaRole,
  type IdVerificationResult
} from '../utils/medhaviEngine';
import { createSampleJaipuriaIdCardDataUrl } from './IdentityGatePage';

export interface DemoAccountConfig {
  role: PersonaRole;
  fullName: string;
  schoolId: string;
  section: string;
  house: string;
  seedSampleChats: boolean;
  seedQuizHistory: boolean;
}

interface CreateDemoAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight: boolean;
  onActivateDemoAccount: (result: IdVerificationResult, config: DemoAccountConfig) => void;
}

export const DEMO_PRESETS: Array<{
  id: string;
  role: PersonaRole;
  name: string;
  schoolId: string;
  section: string;
  house: string;
  tagline: string;
  features: string[];
}> = [
  {
    id: 'student-atharva',
    role: 'student',
    name: 'Atharva Jindal',
    schoolId: '13457',
    section: 'VII-D',
    house: 'Harmony',
    tagline: 'Class 7 Scholar · Middle School (V–VIII)',
    features: [
      'Socratic Solver (Guided Problem Solving)',
      'Class 7 Academic Calendar & Voice Notes',
      'Olympiad Arena (+2 / -1 High-Logic Scoring)',
      'Live Two-Way Voice Chat with ElevenLabs'
    ]
  },
  {
    id: 'teacher-ananya',
    role: 'teacher',
    name: 'Dr. Ananya Sharma',
    schoolId: 'SMRJ-FAC-0742',
    section: 'Class VII Faculty',
    house: 'Wisdom',
    tagline: 'Class 7 Senior Faculty · Middle School Educator',
    features: [
      '40-Mark Class 7 Question Paper Studio',
      '40-Minute NEP-2020 Pedagogical Lesson Architect',
      'Descriptive AI Answer Evaluator & Rubrics',
      'Bilingual English & Hindi Parent Circulars'
    ]
  },
  {
    id: 'student-aarav',
    role: 'student',
    name: 'Aarav Verma',
    schoolId: 'SMRJ-CL7-2026-108',
    section: 'VII-A',
    house: 'Courage',
    tagline: 'Class 7 Scholar · Section A',
    features: [
      'Full Student Dock Access',
      'Science & Mathematics Olympiad Practice',
      'Revision Flashcards & Code Lab'
    ]
  }
];

export const CreateDemoAccountModal: React.FC<CreateDemoAccountModalProps> = ({
  isOpen,
  onClose,
  isLight,
  onActivateDemoAccount
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  // Custom Demo Account Form State
  const [role, setRole] = useState<PersonaRole>('student');
  const [fullName, setFullName] = useState('Reshu Agarwal');
  const [schoolId, setSchoolId] = useState(() => `SMRJ-7${Math.floor(1000 + Math.random() * 9000)}`);
  const [section, setSection] = useState('VII-B');
  const [house, setHouse] = useState('Harmony');
  const [seedSampleChats, setSeedSampleChats] = useState(true);
  const [seedQuizHistory, setSeedQuizHistory] = useState(true);

  if (!isOpen) return null;

  const handleLaunchPreset = (preset: typeof DEMO_PRESETS[0]) => {
    const cardDataUrl = createSampleJaipuriaIdCardDataUrl(
      preset.role,
      preset.name,
      preset.schoolId
    );

    const verificationResult: IdVerificationResult = {
      verified: true,
      confidence: 99,
      extractedName: preset.name,
      extractedRole: preset.role,
      schoolId: preset.schoolId,
      schoolName: 'Seth M.R. Jaipuria School, Lucknow',
      grade: LOCKED_GRADE,
      badgeId: `JM-DEMO-${preset.schoolId.slice(-4)}`,
      summary: `Verified official Seth M.R. Jaipuria School ${
        preset.role === 'teacher' ? 'Faculty' : 'Class 7 Scholar'
      } Demo ID (${preset.schoolId}) for ${preset.name}.`,
      checks: {
        institutionMatch: true,
        roleMatch: true,
        gradeSevenAuthorized: true,
        visualSealDetected: true
      }
    };

    onActivateDemoAccount(verificationResult, {
      role: preset.role,
      fullName: preset.name,
      schoolId: preset.schoolId,
      section: preset.section,
      house: preset.house,
      seedSampleChats: true,
      seedQuizHistory: true
    });
    onClose();
  };

  const handleCreateCustomDemo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fullName.trim() || (role === 'teacher' ? 'Demo Teacher' : 'Demo Scholar');
    const cleanId = schoolId.trim() || `DEMO-${Math.floor(1000 + Math.random() * 9000)}`;

    const cardDataUrl = createSampleJaipuriaIdCardDataUrl(role, cleanName, cleanId);

    const verificationResult: IdVerificationResult = {
      verified: true,
      confidence: 99,
      extractedName: cleanName,
      extractedRole: role,
      schoolId: cleanId,
      schoolName: 'Seth M.R. Jaipuria School, Lucknow',
      grade: LOCKED_GRADE,
      badgeId: `JM-DEMO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      summary: `Verified custom Seth M.R. Jaipuria School ${
        role === 'teacher' ? 'Faculty' : 'Class 7 Scholar'
      } Demo ID (${cleanId}) for ${cleanName}.`,
      checks: {
        institutionMatch: true,
        roleMatch: true,
        gradeSevenAuthorized: true,
        visualSealDetected: true
      }
    };

    onActivateDemoAccount(verificationResult, {
      role,
      fullName: cleanName,
      schoolId: cleanId,
      section,
      house,
      seedSampleChats,
      seedQuizHistory
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm no-print animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-account-title"
    >
      <div
        className={`w-full max-w-2xl rounded-3xl border p-6 sm:p-7 shadow-2xl overflow-hidden relative ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#0B1120] border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-amber-500 font-semibold">
                Seth M.R. Jaipuria School · Class 7
              </div>
              <h2 id="demo-account-title" className="text-lg sm:text-xl font-bold font-display">
                Create &amp; Launch Demo Account
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Demo Account Modal"
            className="p-2 rounded-xl border border-slate-700/60 hover:border-amber-400/60 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: 1-Click Presets vs Custom Creator */}
        <div
          role="tablist"
          className={`grid grid-cols-2 p-1 rounded-xl border my-5 ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'presets'}
            onClick={() => setActiveTab('presets')}
            className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'presets'
                ? isLight
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Official Presets (Instant 1-Click)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'custom'}
            onClick={() => setActiveTab('custom')}
            className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'custom'
                ? isLight
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Custom Demo Account
          </button>
        </div>

        {/* Tab 1: Official Presets */}
        {activeTab === 'presets' && (
          <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Select any pre-verified Jaipuria School identity below to launch directly into that role’s exclusive Class 7 workspace.
            </p>

            {DEMO_PRESETS.map((preset) => (
              <div
                key={preset.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isLight
                    ? 'border-slate-200 hover:border-amber-400 bg-slate-50/80 hover:bg-amber-50/20'
                    : 'border-slate-800 hover:border-amber-500/50 bg-slate-900/40 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        preset.role === 'student'
                          ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                          : 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                      }`}
                    >
                      {preset.role === 'student' ? (
                        <GraduationCap className="w-4 h-4" />
                      ) : (
                        <BookOpen className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-sm flex items-center gap-2">
                        <span>{preset.name}</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {preset.schoolId}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {preset.tagline} · House: {preset.house}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLaunchPreset(preset)}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all shadow-xs"
                  >
                    <span>Launch {preset.role === 'student' ? 'Student' : 'Faculty'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-slate-800/40 text-[11px] text-slate-400">
                  {preset.features.map((f, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Custom Demo Creator */}
        {activeTab === 'custom' && (
          <form onSubmit={handleCreateCustomDemo} className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Account Role (Class 7 Locked)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                    role === 'student'
                      ? 'border-sky-400 bg-sky-500/15 text-sky-300'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-sky-400" />
                  <span>Student (Grade 7)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                    role === 'teacher'
                      ? 'border-violet-400 bg-violet-500/15 text-violet-300'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-violet-400" />
                  <span>Teacher (Faculty)</span>
                </button>
              </div>
            </div>

            {/* Name & ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="custom-demo-name" className="block text-xs text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  id="custom-demo-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Reshu Agarwal"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-slate-900/80 border-slate-700 text-slate-100'
                  }`}
                />
              </div>

              <div>
                <label htmlFor="custom-demo-id" className="block text-xs text-slate-400 mb-1">
                  {role === 'student' ? 'Scholar No.' : 'Faculty ID'}
                </label>
                <div className="flex gap-2">
                  <input
                    id="custom-demo-id"
                    type="text"
                    required
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                    placeholder="e.g., SMRJ-7421"
                    className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-mono outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-slate-900/80 border-slate-700 text-slate-100'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSchoolId(
                        role === 'teacher'
                          ? `SMRJ-FAC-${Math.floor(1000 + Math.random() * 9000)}`
                          : `SMRJ-7${Math.floor(1000 + Math.random() * 9000)}`
                      )
                    }
                    title="Generate new ID"
                    className="p-2.5 rounded-xl border border-slate-700 hover:border-amber-400 text-amber-400"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Section & House */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="custom-demo-section" className="block text-xs text-slate-400 mb-1">
                  Class Section / Dept
                </label>
                <select
                  id="custom-demo-section"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-slate-900/80 border-slate-700 text-slate-100'
                  }`}
                >
                  <option value="VII-A">Class VII-A</option>
                  <option value="VII-B">Class VII-B</option>
                  <option value="VII-C">Class VII-C</option>
                  <option value="VII-D">Class VII-D (Atharva's Section)</option>
                  <option value="Middle School Faculty">Middle School Faculty</option>
                </select>
              </div>

              <div>
                <label htmlFor="custom-demo-house" className="block text-xs text-slate-400 mb-1">
                  Jaipuria House
                </label>
                <select
                  id="custom-demo-house"
                  value={house}
                  onChange={(e) => setHouse(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-slate-900/80 border-slate-700 text-slate-100'
                  }`}
                >
                  <option value="Harmony">Harmony House (Green)</option>
                  <option value="Wisdom">Wisdom House (Yellow)</option>
                  <option value="Courage">Courage House (Red)</option>
                  <option value="Hope">Hope House (Blue)</option>
                </select>
              </div>
            </div>

            {/* Sample Data Toggles */}
            <div className="p-3.5 rounded-2xl border border-slate-800/80 bg-slate-950/40 space-y-2 text-xs">
              <div className="font-semibold text-amber-400 text-[11px] uppercase tracking-wider">
                Demo Account Initialization Options
              </div>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seedSampleChats}
                  onChange={(e) => setSeedSampleChats(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span>Preload sample Jaipuria Medhavi Socratic chat session</span>
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seedQuizHistory}
                  onChange={(e) => setSeedQuizHistory(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span>Preload Class 7 Olympiad Arena performance attempt (+2 / -1 scoring)</span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl text-xs sm:text-sm font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all shadow-md active:scale-[0.99]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Generate &amp; Activate Demo Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="mt-4 pt-3 border-t border-slate-800/60 text-center text-[11px] text-slate-500 font-mono">
          तमसो मा ज्योतिर्गमय · Seth M.R. Jaipuria School Lucknow Demo Portal
        </div>
      </div>
    </div>
  );
};
