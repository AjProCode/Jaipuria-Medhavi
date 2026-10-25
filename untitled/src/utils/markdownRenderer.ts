import { marked } from 'marked';
import katex from 'katex';
import DOMPurify from 'dompurify';

/**
 * Safely renders Markdown with embedded LaTeX expressions (\( ... \), \[ ... \], $$ ... $$)
 * using KaTeX + Marked + DOMPurify.
 */
export function renderScholarlyMarkdown(markdown: string): string {
  if (!markdown) return '';

  const mathBlocks: string[] = [];

  // Replace display math \[ ... \] and $$ ... $$ with placeholders first
  let processed = markdown.replace(/\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$/g, (_match, g1, g2) => {
    const tex = (g1 || g2 || '').trim();
    try {
      const html = katex.renderToString(tex, {
        displayMode: true,
        throwOnError: false
      });
      const idx = mathBlocks.length;
      mathBlocks.push(
        `<div class="my-3 py-2 px-3 rounded-lg bg-slate-900/40 border border-slate-700/40 overflow-x-auto flex items-center justify-between gap-2"><div>${html}</div></div>`
      );
      return `@@MATH_BLOCK_${idx}@@`;
    } catch {
      return `<code>${tex}</code>`;
    }
  });

  // Replace inline math \( ... \)
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (_match, g1) => {
    const tex = (g1 || '').trim();
    try {
      const html = katex.renderToString(tex, {
        displayMode: false,
        throwOnError: false
      });
      const idx = mathBlocks.length;
      mathBlocks.push(html);
      return `@@MATH_BLOCK_${idx}@@`;
    } catch {
      return `<code>${tex}</code>`;
    }
  });

  // Parse Markdown
  const rawHtml = marked.parse(processed, { async: false }) as string;

  // Restore math blocks
  const withMath = rawHtml.replace(/@@MATH_BLOCK_(\d+)@@/g, (_m, idxStr) => {
    const idx = Number(idxStr);
    return mathBlocks[idx] || '';
  });

  return DOMPurify.sanitize(withMath, {
    ADD_TAGS: [
      'math',
      'semantics',
      'mrow',
      'mi',
      'mo',
      'mn',
      'msup',
      'msub',
      'mfrac',
      'msqrt',
      'mtext',
      'annotation'
    ],
    ADD_ATTR: ['class', 'style', 'aria-hidden', 'encoding', 'xmlns']
  });
}
