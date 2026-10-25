import React from 'react';
import type { PersonaRole } from '../utils/medhaviEngine';

export type OrbStatus = 'idle' | 'preparing' | 'analysing' | 'verifying' | 'completed';

const STATUS_LABELS: Record<OrbStatus, string> = {
  idle: 'Ready to illuminate.',
  preparing: 'Understanding your question…',
  analysing: 'Mapping concepts…',
  verifying: 'Checking logic…',
  completed: 'Another concept illuminated.'
};

export const JyotiKnowledgeField: React.FC<{ isLight: boolean; persona: PersonaRole }> = ({
  isLight,
  persona
}) => {
  const strokeColor = isLight ? 'rgba(30, 41, 59, 0.055)' : 'rgba(251, 191, 36, 0.065)';
  const accentStroke =
    persona === 'student'
      ? isLight
        ? 'rgba(37, 99, 235, 0.06)'
        : 'rgba(56, 189, 248, 0.07)'
      : isLight
      ? 'rgba(139, 92, 246, 0.06)'
      : 'rgba(167, 139, 250, 0.07)';

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden z-0 no-print"
      aria-hidden="true"
    >
      {/* Layered radial scholarly lighting */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: isLight
            ? 'radial-gradient(circle at 50% 0%, rgba(251, 191, 36, 0.08), transparent 55%), radial-gradient(circle at 85% 20%, rgba(37, 99, 235, 0.05), transparent 45%)'
            : persona === 'student'
            ? 'radial-gradient(circle at 50% -10%, rgba(251, 191, 36, 0.11), transparent 52%), radial-gradient(circle at 15% 25%, rgba(56, 189, 248, 0.07), transparent 45%), radial-gradient(circle at 85% 75%, rgba(16, 185, 129, 0.05), transparent 50%)'
            : 'radial-gradient(circle at 50% -10%, rgba(251, 191, 36, 0.11), transparent 52%), radial-gradient(circle at 15% 25%, rgba(139, 92, 246, 0.09), transparent 45%), radial-gradient(circle at 85% 75%, rgba(245, 158, 11, 0.05), transparent 50%)'
        }}
      />

      {/* Constellation & geometric orbital SVG field */}
      <svg className="w-full h-full opacity-80" viewBox="0 0 1440 900" fill="none">
        <circle cx="720" cy="190" r="240" stroke={strokeColor} strokeWidth="1" strokeDasharray="4 8" />
        <circle cx="720" cy="190" r="390" stroke={accentStroke} strokeWidth="1" />
        <circle cx="720" cy="190" r="560" stroke={strokeColor} strokeWidth="0.75" strokeDasharray="2 10" />
        <line x1="120" y1="190" x2="1320" y2="190" stroke={strokeColor} strokeWidth="0.75" />
        <line x1="720" y1="0" x2="720" y2="900" stroke={strokeColor} strokeWidth="0.75" />
        <path
          d="M 220 140 L 360 220 L 490 150 L 640 250"
          stroke={accentStroke}
          strokeWidth="1"
        />
        <path
          d="M 1220 160 L 1080 240 L 940 170 L 810 260"
          stroke={accentStroke}
          strokeWidth="1"
        />
        <circle cx="360" cy="220" r="3" fill={strokeColor} />
        <circle cx="490" cy="150" r="2.5" fill={strokeColor} />
        <circle cx="1080" cy="240" r="3" fill={strokeColor} />
        <circle cx="940" cy="170" r="2.5" fill={strokeColor} />
      </svg>
    </div>
  );
};

export const JyotiOrb: React.FC<{
  status: OrbStatus;
  persona: PersonaRole;
  compact?: boolean;
}> = ({ status, persona, compact = false }) => {
  const isThinking = status === 'preparing' || status === 'analysing' || status === 'verifying';
  const isDone = status === 'completed';

  const ringColor = isDone
    ? 'border-emerald-400/60'
    : persona === 'student'
    ? 'border-amber-400/50'
    : 'border-violet-400/50';

  return (
    <div
      className={`flex items-center gap-3 ${compact ? '' : 'flex-col text-center'}`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`relative flex items-center justify-center ${
          compact ? 'w-8 h-8' : 'w-16 h-16'
        }`}
      >
        {/* Outer orbital ring */}
        <div
          className={`absolute inset-0 rounded-full border ${ringColor} transition-transform duration-700 ${
            isThinking ? 'animate-spin' : 'scale-100'
          }`}
          style={{ borderStyle: isThinking ? 'dashed' : 'solid' }}
        />
        {/* Inner glowing core */}
        <div
          className={`rounded-full transition-all duration-500 ${
            compact ? 'w-4 h-4' : 'w-8 h-8'
          } ${
            isDone
              ? 'bg-gradient-to-tr from-emerald-500 to-amber-300 shadow-[0_0_24px_rgba(16,185,129,0.5)]'
              : persona === 'student'
              ? 'bg-gradient-to-tr from-amber-500 via-amber-300 to-sky-300 shadow-[0_0_28px_rgba(251,191,36,0.45)]'
              : 'bg-gradient-to-tr from-amber-500 via-amber-300 to-violet-300 shadow-[0_0_28px_rgba(167,139,250,0.45)]'
          } ${isThinking ? 'scale-110' : 'scale-100'}`}
        />
      </div>
      <span
        className={`${
          compact ? 'text-xs' : 'text-xs mt-1.5'
        } font-medium tracking-wide text-slate-400`}
      >
        {STATUS_LABELS[status]}
      </span>
    </div>
  );
};
