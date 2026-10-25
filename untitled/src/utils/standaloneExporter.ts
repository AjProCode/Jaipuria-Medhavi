import type { StoredSessionRecord } from '../firebase';
import type { CustomSpecItem } from './medhaviEngine';

/**
 * Generates and triggers a browser download of a portable, standalone single-file
 * `jaipuria-medhavi-standalone.html` containing the current session and specifications.
 */
export function downloadStandaloneMedhaviHtml(
  sessions: StoredSessionRecord[],
  specs: CustomSpecItem[],
  grade: string,
  subject: string
) {
  const htmlContent = `<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Jaipuria Medhavi — मेधावी | Portable Scholar Edition</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>
    body { background: #07101F; color: #F1F5F9; font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body class="min-h-screen p-6 max-w-5xl mx-auto">
  <header class="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
    <div>
      <div class="text-xs text-amber-400 font-mono">SETH M.R. JAIPURIA SCHOOL · TAMSO MA JYOTIRGAMAYA</div>
      <h1 class="text-2xl font-bold">JAIPURIA MEDHAVI — मेधावी (Portable Archive)</h1>
      <p class="text-xs text-slate-400 mt-1">Exported Context: ${grade} · ${subject} · NVIDIA Nemotron 3.5 Super VL</p>
    </div>
    <button onclick="window.print()" class="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold">Print Document</button>
  </header>
  <main class="space-y-6">
    <section class="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
      <h2 class="text-sm font-bold text-amber-400 mb-2">Active Medhavi Specifications (${specs.length})</h2>
      <ul class="space-y-2 text-xs text-slate-300">
        ${specs
          .map(
            (s) =>
              `<li><strong>[${s.category}] ${s.title}:</strong> ${s.content.replace(/</g, '&lt;')}</li>`
          )
          .join('')}
      </ul>
    </section>
    <section class="space-y-4">
      <h2 class="text-lg font-bold">Saved Scholarly Sessions (${sessions.length})</h2>
      ${sessions
        .map(
          (sess) => `
        <article class="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
          <div class="text-xs text-amber-400 font-mono">${sess.classLevel} · ${sess.subject} · ${sess.role.toUpperCase()}</div>
          <h3 class="text-base font-bold">${sess.title.replace(/</g, '&lt;')}</h3>
          <div class="space-y-3 mt-2">
            ${sess.messages
              .map(
                (m) => `
              <div class="p-3 rounded-lg ${
                m.role === 'user' ? 'bg-slate-800/70' : 'bg-slate-950/80 border border-slate-800'
              }">
                <div class="text-[11px] font-mono text-slate-400 mb-1">${m.role.toUpperCase()}</div>
                <div class="text-sm whitespace-pre-wrap">${m.content.replace(/</g, '&lt;')}</div>
              </div>
            `
              )
              .join('')}
          </div>
        </article>
      `
        )
        .join('')}
    </section>
  </main>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'jaipuria-medhavi-index.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
