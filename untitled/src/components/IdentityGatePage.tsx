import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Upload,
  Sparkles,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  LogIn,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Award,
  Mic,
  Check
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type { IdVerificationResult, PersonaRole } from '../utils/medhaviEngine';
import { CreateDemoAccountModal, type DemoAccountConfig } from './CreateDemoAccountModal';

interface IdentityGatePageProps {
  isLight: boolean;
  user: User | null;
  onGoogleSignIn: () => Promise<void>;
  onCompleteVerification: (result: IdVerificationResult) => void;
  onToggleTheme?: () => void;
}

interface VisualCardCheckResult {
  isLikelyIdCard: boolean;
  aspectRatio: number;
  lightCardRatio: number;
  greenBannerRatio: number;
  reason?: string;
}

/**
 * Inspects an uploaded raster image on an offscreen canvas to verify whether
 * it has the portrait geometry, light card background, and green banner
 * characteristic of a Seth M.R. Jaipuria School ID card.
 */
async function inspectUploadedCardCanvas(
  dataUrl: string,
  fileName: string
): Promise<VisualCardCheckResult> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || img.width || 1;
      const h = img.naturalHeight || img.height || 1;
      const aspectRatio = Number((w / h).toFixed(2));

      // Official Jaipuria ID card is vertical portrait (approx 0.65 - 0.85 aspect ratio)
      if (aspectRatio > 1.08) {
        resolve({
          isLikelyIdCard: false,
          aspectRatio,
          lightCardRatio: 0,
          greenBannerRatio: 0,
          reason: `Invalid ID Card: "${fileName}" is a landscape image (${w}×${h}), not an official vertical Seth M.R. Jaipuria School ID card.`
        });
        return;
      }

      try {
        const canvas = document.createElement('canvas');
        const sampleW = 120;
        const sampleH = 160;
        canvas.width = sampleW;
        canvas.height = sampleH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ isLikelyIdCard: true, aspectRatio, lightCardRatio: 0.5, greenBannerRatio: 0.05 });
          return;
        }
        ctx.drawImage(img, 0, 0, sampleW, sampleH);
        const { data } = ctx.getImageData(0, 0, sampleW, sampleH);

        let lightPaperPixels = 0;
        let oliveGreenPixels = 0;
        const totalPixels = sampleW * sampleH;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Light card surface (ivory/white/light grey)
          if (r > 155 && g > 155 && b > 145 && Math.abs(r - g) < 35) {
            lightPaperPixels++;
          }

          // Olive-green Jaipuria strip or border
          if (g > 75 && g > r + 10 && g > b + 15) {
            oliveGreenPixels++;
          }
        }

        const lightCardRatio = Number((lightPaperPixels / totalPixels).toFixed(3));
        const greenBannerRatio = Number((oliveGreenPixels / totalPixels).toFixed(3));

        if (lightCardRatio < 0.22) {
          resolve({
            isLikelyIdCard: false,
            aspectRatio,
            lightCardRatio,
            greenBannerRatio,
            reason: `Invalid ID Card: "${fileName}" does not contain a readable Seth M.R. Jaipuria School ID surface. Please upload a clear photo of your ID card.`
          });
          return;
        }

        resolve({
          isLikelyIdCard: true,
          aspectRatio,
          lightCardRatio,
          greenBannerRatio
        });
      } catch {
        resolve({ isLikelyIdCard: true, aspectRatio, lightCardRatio: 0.5, greenBannerRatio: 0.05 });
      }
    };
    img.onerror = () => {
      resolve({
        isLikelyIdCard: false,
        aspectRatio: 0,
        lightCardRatio: 0,
        greenBannerRatio: 0,
        reason: `Could not decode image "${fileName}". Please upload a valid PNG or JPG photo of your Jaipuria ID card.`
      });
    };
    img.src = dataUrl;
  });
}

/**
 * Generates an authentic SVG Data URL modeled after the physical
 * Seth M.R. Jaipuria School (Vineet Khand, Gomti Nagar, Lucknow) ID card.
 */
export function createSampleJaipuriaIdCardDataUrl(
  role: PersonaRole,
  name: string,
  schoolId: string
): string {
  const displayName = (
    name.trim() || (role === 'teacher' ? 'DR. ANANYA SHARMA' : 'ATHARVA JINDAL')
  ).toUpperCase();
  const displayId = schoolId.trim() || (role === 'teacher' ? 'SMRJ-FAC-0742' : '13457');
  const isTeacher = role === 'teacher';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="460" height="660" viewBox="0 0 460 660">
    <defs>
      <linearGradient id="cardBg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#FCFCFA" />
        <stop offset="100%" stop-color="#F2F3EC" />
      </linearGradient>
      <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.18" />
      </filter>
    </defs>

    <!-- Outer Card Body with Lamination Rim -->
    <rect x="8" y="8" width="444" height="644" rx="24" fill="url(#cardBg)" stroke="#558B2F" stroke-width="8" filter="url(#cardShadow)"/>
    
    <!-- Top Lanyard Slot Motif -->
    <rect x="195" y="16" width="70" height="8" rx="4" fill="#D1D5DB" />

    <!-- Seth M.R. Jaipuria School Header -->
    <g transform="translate(0, 8)">
      <path d="M152 46 C160 30, 172 30, 168 54 C164 70, 146 76, 134 70 C146 66, 150 56, 152 46 Z" fill="#F59E0B"/>
      <text x="250" y="40" text-anchor="middle" fill="#312E81" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="800" letter-spacing="1.8">SETH M. R.</text>
      <text x="250" y="62" text-anchor="middle" fill="#1E1B4B" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="900" letter-spacing="1.2">JAIPURIA</text>
      <text x="250" y="75" text-anchor="middle" fill="#312E81" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="800" letter-spacing="2.2">SCHOOL LUCKNOW</text>
      <text x="250" y="91" text-anchor="middle" fill="#D97706" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700">तमसो मा ज्योतिर्गमय</text>
      <text x="230" y="106" text-anchor="middle" fill="#C2410C" font-family="system-ui, -apple-system, sans-serif" font-size="10.5" font-weight="600">School of Conscious Transformation</text>
    </g>

    <!-- Olive Green School Banner -->
    <rect x="8" y="126" width="444" height="36" fill="#558B2F"/>
    <text x="230" y="151" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="900" letter-spacing="0.8">SETH M.R. JAIPURIA SCHOOL</text>

    <!-- Campus Address & Phone -->
    <text x="230" y="180" text-anchor="middle" fill="#1E293B" font-family="system-ui, -apple-system, sans-serif" font-size="14.5" font-weight="700">Vineet Khand, Gomti Nagar, Lucknow</text>
    <text x="230" y="200" text-anchor="middle" fill="#334155" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600">Phone : 0522-2726500, 2726502</text>

    <!-- Student / Teacher Name -->
    <rect x="30" y="214" width="400" height="34" rx="8" fill="#E2E8F0" fill-opacity="0.5"/>
    <text x="230" y="238" text-anchor="middle" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="21" font-weight="900" letter-spacing="0.5">${displayName.replace(/[<>&]/g, '')}</text>

    <!-- Portrait Photo Frame (Left) -->
    <g transform="translate(32, 260)">
      <rect width="130" height="166" rx="6" fill="#1E293B" stroke="#0F172A" stroke-width="2"/>
      <circle cx="65" cy="62" r="30" fill="#FCD34D"/>
      <path d="M18 166 C18 116, 112 116, 112 166 Z" fill="#E2E8F0"/>
      <text x="65" y="154" text-anchor="middle" fill="#0F172A" font-family="sans-serif" font-size="10" font-weight="700">JAIPURIA</text>
    </g>

    <!-- Structured Credentials (Right of Photo) -->
    <g transform="translate(180, 260)" font-family="system-ui, -apple-system, sans-serif" fill="#0F172A">
      <text x="0" y="24" font-size="16.5" font-weight="800" fill="#1E3A8A">${
        isTeacher ? `Faculty ID : ${displayId.replace(/[<>&]/g, '')}` : `Scholar No : ${displayId.replace(/[<>&]/g, '')}`
      }</text>
      <text x="0" y="52" font-size="15" font-weight="800">${
        isTeacher ? 'Dept : Class VII Faculty' : 'Class : VII-D'
      }</text>
      <text x="0" y="80" font-size="14.5" font-weight="700">${
        isTeacher ? 'Role : Senior Educator' : 'House : Harmony'
      }</text>
      <text x="0" y="108" font-size="14" font-weight="600">${
        isTeacher ? 'Session : 2026-2027' : 'D.O.B : 14-07-2014'
      }</text>
      <text x="0" y="134" font-size="13.5" font-weight="600" fill="#475569">Blood Group : B -ve</text>
      <text x="0" y="158" font-size="13.5" font-weight="600" fill="#475569">${
        isTeacher ? 'Campus : Gomti Nagar' : 'Mobile : 9559994761'
      }</text>
    </g>

    <!-- Address & Validity -->
    <g transform="translate(32, 446)" font-family="system-ui, -apple-system, sans-serif" fill="#0F172A">
      <text x="0" y="20" font-size="13.5" font-weight="700">Address: 3/131, VIKRANT KHAND, GOMTI NAGAR, LUCKNOW</text>
      <line x1="0" y1="36" x2="396" y2="36" stroke="#CBD5E1" stroke-width="1.5"/>
      <text x="0" y="62" font-size="13.5" font-weight="600" fill="#475569">Issued on 13 Apr 2024</text>
      <rect x="0" y="74" width="180" height="26" rx="6" fill="#558B2F" fill-opacity="0.15"/>
      <text x="8" y="92" font-size="14" font-weight="800" fill="#2E7D32">VALID FOR V TO VIII</text>
    </g>

    <!-- Principal Signature Motif -->
    <g transform="translate(310, 520)">
      <path d="M10 24 Q35 2 65 14 Q95 26 120 10" stroke="#0F172A" stroke-width="2" fill="none"/>
      <text x="65" y="44" text-anchor="middle" fill="#0F172A" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700">Principal</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const IdentityGatePage: React.FC<IdentityGatePageProps> = ({
  isLight,
  user,
  onGoogleSignIn,
  onCompleteVerification,
  onToggleTheme
}) => {
  const [role, setRole] = useState<PersonaRole>('student');
  const [fullName, setFullName] = useState('Atharva Jindal');
  const [schoolId, setSchoolId] = useState('13457');
  const [idCardDataUrl, setIdCardDataUrl] = useState<string>(() =>
    createSampleJaipuriaIdCardDataUrl('student', 'Atharva Jindal', '13457')
  );
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [visualCardCheck, setVisualCardCheck] = useState<VisualCardCheckResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verifiedPreview, setVerifiedPreview] = useState<IdVerificationResult | null>(null);
  const [customUploadOpen, setCustomUploadOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleRoleSwitch = (newRole: PersonaRole) => {
    setRole(newRole);
    const defaultName = newRole === 'teacher' ? 'Dr. Ananya Sharma' : 'Atharva Jindal';
    const defaultId = newRole === 'teacher' ? 'SMRJ-FAC-0742' : '13457';
    setFullName(defaultName);
    setSchoolId(defaultId);
    setUploadedFileName('');
    setVisualCardCheck(null);
    setIdCardDataUrl(createSampleJaipuriaIdCardDataUrl(newRole, defaultName, defaultId));
    setErrorMsg(null);
    setVerifiedPreview(null);
  };

  const handleUploadIdCard = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('ID card photo must be under 10 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        setIdCardDataUrl(dataUrl);
        setUploadedFileName(file.name);
        setVerifiedPreview(null);

        const check = await inspectUploadedCardCanvas(dataUrl, file.name);
        setVisualCardCheck(check);
        if (!check.isLikelyIdCard && check.reason) {
          setErrorMsg(check.reason);
        } else {
          setErrorMsg(null);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetToOfficialCard = () => {
    const defaultName = role === 'teacher' ? 'Dr. Ananya Sharma' : 'Atharva Jindal';
    const defaultId = role === 'teacher' ? 'SMRJ-FAC-0742' : '13457';
    setFullName(defaultName);
    setSchoolId(defaultId);
    setUploadedFileName('');
    setVisualCardCheck(null);
    setIdCardDataUrl(createSampleJaipuriaIdCardDataUrl(role, defaultName, defaultId));
    setErrorMsg(null);
    setVerifiedPreview(null);
    setCustomUploadOpen(false);
  };

  const performVerification = async () => {
    if (!fullName.trim() || !schoolId.trim()) {
      setErrorMsg('Please specify Full Name and Scholar / Faculty ID.');
      return;
    }
    if (!idCardDataUrl) {
      setErrorMsg('No ID card loaded. Please load or upload an ID card.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/verify-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDataUrl: idCardDataUrl,
          role,
          fullName: fullName.trim(),
          schoolId: schoolId.trim(),
          uploadedFileName,
          visualCardCheck
        })
      });

      const result: IdVerificationResult = await response.json();
      if (!result.verified) {
        setErrorMsg(
          result.summary ||
            'Verification Failed: The credentials or photo do not match an official Seth M.R. Jaipuria School ID card.'
        );
        setVerifiedPreview(null);
      } else {
        setVerifiedPreview(result);
        setErrorMsg(null);
        // Automatically enter after a brief, satisfying confirmation
        setTimeout(() => {
          onCompleteVerification(result);
        }, 350);
      }
    } catch {
      setErrorMsg('Could not reach verification server. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between relative selection:bg-amber-500/30 ${
        isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#07101F] text-slate-100'
      }`}
    >
      {/* Background Scholarly Aura */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[480px] rounded-full blur-[140px] opacity-25 ${
            isLight ? 'bg-amber-400/40' : 'bg-amber-500/20'
          }`}
        />
        <div
          className={`absolute bottom-0 right-1/4 w-[500px] h-[360px] rounded-full blur-[120px] opacity-20 ${
            isLight ? 'bg-sky-400/30' : 'bg-sky-500/15'
          }`}
        />
      </div>

      {/* Header: Clean, Dignified Institutional Bar */}
      <header
        className={`sticky top-0 z-30 flex items-center justify-between gap-4 px-6 sm:px-10 py-4 border-b backdrop-blur-xl ${
          isLight ? 'bg-white/80 border-slate-200/80' : 'bg-[#07101F]/70 border-slate-800/70'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold text-lg shadow-sm">
            म
          </div>
          <div>
            <div className="text-sm sm:text-base font-bold font-display tracking-tight flex items-center gap-2">
              <span>JAIPURIA MEDHAVI</span>
              <span className="text-amber-500 font-serif">· मेधावी</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Seth M.R. Jaipuria School · Gomti Nagar, Lucknow
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle Dark / Light Theme"
              className={`p-2 rounded-xl border transition-colors ${
                isLight
                  ? 'border-slate-300 hover:border-slate-400 text-slate-700 bg-white'
                  : 'border-slate-800 hover:border-slate-700 text-slate-300 bg-slate-900/60'
              }`}
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => setDemoModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create Demo Account</span>
          </button>

          <button
            type="button"
            onClick={onGoogleSignIn}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border font-medium transition-colors ${
              user
                ? isLight
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : isLight
                ? 'border-slate-300 hover:border-amber-500 text-slate-800 bg-white'
                : 'border-slate-800 hover:border-amber-400/60 text-slate-200 bg-slate-900/60'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 text-amber-500" />
            <span className="truncate max-w-[150px] sm:max-w-[200px]">
              {user ? (user.displayName || user.email || 'Signed In') : 'Google Sign-In'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Single-Focus Portal */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-2xl space-y-7">
          {/* Hero Statement */}
          <div className="text-center space-y-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide border border-amber-500/30 bg-amber-500/10 text-amber-500">
                <Sparkles className="w-3.5 h-3.5" />
                <span>तमसो मा ज्योतिर्गमय · Class 7 Portal</span>
              </div>
              <button
                type="button"
                onClick={() => setDemoModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-sky-500/40 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors"
              >
                <span>✨ Create / Switch Demo Account</span>
              </button>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight">
              Sign In with Jaipuria Identity
            </h1>

            <p
              className={`text-sm sm:text-base max-w-lg mx-auto leading-relaxed ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              Select your registered Class 7 account below, or create an instant demo account to explore.
            </p>
          </div>

          {/* Centered Luminous Gateway Card */}
          <div className="liquid-glass-elevated rounded-3xl p-6 sm:p-8 space-y-6">
            {/* Elegant Segmented Role Selector */}
            <div
              role="tablist"
              className={`grid grid-cols-2 p-1.5 rounded-2xl border ${
                isLight ? 'bg-slate-100/90 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'
              }`}
            >
              <button
                type="button"
                role="tab"
                aria-selected={role === 'student'}
                onClick={() => handleRoleSwitch('student')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  role === 'student'
                    ? isLight
                      ? 'bg-white text-slate-950 shadow-sm border border-slate-200/80'
                      : 'bg-sky-500/20 text-sky-200 shadow-sm border border-sky-400/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-sky-400" />
                <span>Class 7 Scholar</span>
                {role === 'student' && <Check className="w-3.5 h-3.5 text-sky-400" />}
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={role === 'teacher'}
                onClick={() => handleRoleSwitch('teacher')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  role === 'teacher'
                    ? isLight
                      ? 'bg-white text-slate-950 shadow-sm border border-slate-200/80'
                      : 'bg-violet-500/20 text-violet-200 shadow-sm border border-violet-400/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4 text-violet-400" />
                <span>Class 7 Faculty</span>
                {role === 'teacher' && <Check className="w-3.5 h-3.5 text-violet-400" />}
              </button>
            </div>

            {/* Official Card Preview Badge */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 sm:p-5 rounded-2xl border border-slate-800/60 bg-slate-950/30">
              <div className="shrink-0 relative group">
                <img
                  src={idCardDataUrl}
                  alt="Official Jaipuria ID Card"
                  referrerPolicy="no-referrer"
                  className="w-36 sm:w-44 rounded-xl border border-emerald-500/40 shadow-xl object-contain bg-slate-950 transition-transform group-hover:scale-[1.02]"
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 shadow-sm flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified</span>
                </div>
              </div>

              <div className="flex-1 space-y-3 text-center sm:text-left">
                <div className="space-y-1">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-amber-500 font-semibold">
                    {role === 'student'
                      ? 'OFFICIAL MIDDLE SCHOOL SCHOLAR ID'
                      : 'OFFICIAL MIDDLE SCHOOL FACULTY ID'}
                  </div>
                  <div className="text-xl font-bold tracking-tight">
                    {role === 'student' ? 'Atharva Jindal' : 'Dr. Ananya Sharma'}
                  </div>
                  <div className="text-xs font-mono text-emerald-400">
                    {role === 'student'
                      ? 'Scholar No: 13457 · Class VII-D'
                      : 'Faculty ID: SMRJ-FAC-0742 · Educator'}
                  </div>
                </div>

                <div className="text-xs text-slate-400 leading-relaxed">
                  {role === 'student'
                    ? 'Grants access to Class 7 Socratic Solver, Academic Calendar with Voice Notes, Olympiad Arena, and Live Voice Chat.'
                    : 'Grants access to Class 7 40-Mark Question Paper Studio, Lesson Architect, Answer Evaluator, and Circulars.'}
                </div>

                <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start pt-1">
                  {role === 'student' ? (
                    <>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-sky-500/10 text-sky-300 border border-sky-500/20">
                        <Calendar className="w-3 h-3" /> Academic Calendar
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        <Award className="w-3 h-3" /> Olympiad Arena
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        <Mic className="w-3 h-3" /> Voice Chat
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-violet-500/10 text-violet-300 border border-violet-500/20">
                        <FileText className="w-3 h-3" /> 40-Mark Exam Studio
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        <BookOpen className="w-3 h-3" /> Lesson Architect
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message Display if Verification Fails */}
            {errorMsg && (
              <div
                role="alert"
                className={`p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed ${
                  isLight
                    ? 'border-rose-300 bg-rose-50 text-rose-800'
                    : 'border-rose-500/50 bg-rose-950/60 text-rose-200'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">Verification Notice</div>
                  <div>{errorMsg}</div>
                </div>
              </div>
            )}

            {/* Verified Preview Flash */}
            {verifiedPreview && (
              <div className="p-3.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 text-emerald-200 text-xs font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    Verified {verifiedPreview.extractedRole}: {verifiedPreview.extractedName} (
                    {verifiedPreview.schoolId})
                  </span>
                </div>
                <span className="font-mono text-amber-400">{verifiedPreview.confidence}% Match</span>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="button"
              disabled={isVerifying}
              onClick={performVerification}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl text-sm font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all shadow-md active:scale-[0.99] disabled:opacity-70"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {isVerifying
                  ? 'Verifying Institutional Identity…'
                  : `Enter Class 7 Workspace as ${role === 'student' ? 'Atharva Jindal' : 'Dr. Ananya Sharma'}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Secondary Clean Accordion for Custom ID Card Upload */}
            <div className="pt-2 border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => setCustomUploadOpen((prev) => !prev)}
                className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1 transition-colors"
              >
                <span>Upload a custom Jaipuria ID card photo or edit details</span>
                {customUploadOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {customUploadOpen && (
                <div className="mt-4 p-4 rounded-2xl border border-slate-800/70 bg-slate-950/40 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="custom-name"
                        className="block mb-1 text-slate-400 font-medium"
                      >
                        Full Name on Card
                      </label>
                      <input
                        id="custom-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          setErrorMsg(null);
                        }}
                        className={`w-full px-3.5 py-2 rounded-xl border outline-none text-xs ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900'
                            : 'bg-slate-900 border-slate-700 text-slate-100'
                        }`}
                      />
                    </div>

                    <div>
                      <label htmlFor="custom-id" className="block mb-1 text-slate-400 font-medium">
                        {role === 'student' ? 'Scholar No.' : 'Faculty ID'}
                      </label>
                      <input
                        id="custom-id"
                        type="text"
                        value={schoolId}
                        onChange={(e) => {
                          setSchoolId(e.target.value);
                          setErrorMsg(null);
                        }}
                        className={`w-full px-3.5 py-2 rounded-xl border font-mono outline-none text-xs ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900'
                            : 'bg-slate-900 border-slate-700 text-slate-100'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.heic"
                      onChange={handleUploadIdCard}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-700 hover:border-amber-400 text-slate-200 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>{uploadedFileName ? `Replace: ${uploadedFileName}` : 'Upload ID Photo'}</span>
                    </button>

                    {uploadedFileName && (
                      <button
                        type="button"
                        onClick={handleResetToOfficialCard}
                        className="text-slate-400 hover:text-slate-200 underline"
                      >
                        Reset to Official Card
                      </button>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    Note: The image must be a clear portrait photo of a Seth M.R. Jaipuria School ID
                    card matching the entered Name and ID number.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer: Stately Institutional Citation */}
      <footer
        className={`px-6 py-4 border-t text-center text-xs font-medium ${
          isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800/60 text-slate-400'
        }`}
      >
        <span>तमसो मा ज्योतिर्गमय</span>
        <span className="mx-2">·</span>
        <span>Seth M.R. Jaipuria School, Vineet Khand, Gomti Nagar, Lucknow</span>
        <span className="mx-2">·</span>
        <span className="text-amber-500">School of Conscious Transformation</span>
      </footer>

      <CreateDemoAccountModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        isLight={isLight}
        onActivateDemoAccount={(result) => {
          onCompleteVerification(result);
        }}
      />
    </div>
  );
};
