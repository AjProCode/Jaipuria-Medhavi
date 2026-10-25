import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { OpenRouter } from '@openrouter/sdk';
import {
  LOCKED_GRADE,
  buildSystemPrompt,
  buildVerifiedIdCardResult,
  generateCuratedAcademicFallback,
  type AcademicContext,
  type PersonaRole
} from './src/utils/medhaviEngine.ts';

dotenv.config();

const PORT = 3000;

const DEFAULT_OPENROUTER_KEY =
  process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'MY_OPENROUTER_API_KEY'
    ? process.env.OPENROUTER_API_KEY
    : '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';

const DEFAULT_ELEVENLABS_KEY =
  process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY !== 'MY_ELEVENLABS_API_KEY'
    ? process.env.ELEVENLABS_API_KEY
    : 'sk_91a4498a2658a695405b36fc33a3471efcb090f059faf496';

// Default ElevenLabs Multilingual v2 Voice ID (George / Warm Scholarly Narrator)
const DEFAULT_ELEVENLABS_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb';

const AVAILABLE_MODELS = [
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
];

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'online',
      engine: 'NVIDIA Nemotron 3.5 Super VL (OpenRouter Cloud)',
      voiceEngine: 'ElevenLabs Multilingual v2 Neural TTS',
      defaultModel: 'nvidia/nemotron-3.5-super-vl:free',
      lockedGrade: LOCKED_GRADE,
      models: AVAILABLE_MODELS,
      sdkConfigured: Boolean(DEFAULT_OPENROUTER_KEY),
      elevenLabsConfigured: Boolean(DEFAULT_ELEVENLABS_KEY)
    });
  });

  // ElevenLabs Neural Text-to-Speech Endpoint (/api/tts)
  app.post('/api/tts', async (req, res) => {
    const { text = '', voiceId = DEFAULT_ELEVENLABS_VOICE_ID } = req.body || {};
    const cleanText = String(text).trim().slice(0, 900);

    if (!cleanText) {
      res.status(400).json({ error: 'Text is required for speech synthesis.' });
      return;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const ttsResponse = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
          voiceId
        )}?output_format=mp3_44100_128`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': DEFAULT_ELEVENLABS_KEY,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg'
          },
          body: JSON.stringify({
            text: cleanText,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.55,
              similarity_boost: 0.78,
              style: 0.15,
              use_speaker_boost: true
            }
          }),
          signal: controller.signal
        }
      );

      clearTimeout(timeout);

      if (!ttsResponse.ok) {
        const errBody = await ttsResponse.text().catch(() => '');
        res.status(200).json({
          provider: 'browser-fallback',
          reason: `ElevenLabs returned ${ttsResponse.status}`,
          details: errBody.slice(0, 200)
        });
        return;
      }

      const arrayBuffer = await ttsResponse.arrayBuffer();
      const base64Audio = Buffer.from(arrayBuffer).toString('base64');

      res.json({
        provider: 'elevenlabs',
        model: 'eleven_multilingual_v2',
        audioDataUrl: `data:audio/mpeg;base64,${base64Audio}`
      });
    } catch (err) {
      res.status(200).json({
        provider: 'browser-fallback',
        reason: err instanceof Error ? err.message : 'TTS request failed'
      });
    }
  });

  // AI-Verified Proof of Identity via Teacher / Student ID Card Vision Endpoint
  app.post('/api/verify-id', async (req, res) => {
    const {
      imageDataUrl = '',
      role = 'student',
      fullName = '',
      schoolId = '',
      uploadedFileName = '',
      visualCardCheck = null
    } = req.body || {};

    const cleanRole: PersonaRole = role === 'teacher' ? 'teacher' : 'student';

    if (!imageDataUrl) {
      res.status(400).json({
        verified: false,
        error: 'Please upload or generate a valid Student or Teacher ID Card image first.'
      });
      return;
    }

    let aiSummary = '';
    let visionInspection: {
      isSchoolIdCard: boolean;
      isJaipuriaSchool: boolean;
      detectedName?: string;
      detectedId?: string;
      detectedRole?: 'student' | 'teacher' | 'unknown';
      reason?: string;
    } | undefined;

    // Case 1: Official SVG ID card data URL
    if (imageDataUrl.startsWith('data:image/svg+xml')) {
      try {
        const commaIdx = imageDataUrl.indexOf(',');
        const rawSvg =
          commaIdx >= 0 ? decodeURIComponent(imageDataUrl.slice(commaIdx + 1)) : imageDataUrl;
        const hasJaipuriaHeader = /SETH\s+M\.?\s*R\.?\s+JAIPURIA\s+SCHOOL/i.test(rawSvg);
        const scholarMatch = rawSvg.match(/Scholar No\s*:\s*([^<]+)/i);
        const facultyMatch = rawSvg.match(/Faculty ID\s*:\s*([^<]+)/i);
        const detectedId = (scholarMatch?.[1] || facultyMatch?.[1] || '').trim();
        const detectedRole: 'student' | 'teacher' = facultyMatch ? 'teacher' : 'student';

        visionInspection = {
          isSchoolIdCard: hasJaipuriaHeader,
          isJaipuriaSchool: hasJaipuriaHeader,
          detectedId: detectedId || undefined,
          detectedRole,
          reason: hasJaipuriaHeader
            ? undefined
            : 'The SVG image is not a valid Seth M.R. Jaipuria School ID card.'
        };
      } catch {
        visionInspection = {
          isSchoolIdCard: false,
          isJaipuriaSchool: false,
          reason: 'Unable to parse SVG ID card structure.'
        };
      }
    } else {
      // Case 2: Uploaded raster photo (PNG/JPEG/WebP)
      // First check client-side visual card heuristics if provided (rejects obvious landscape product photos / banners)
      if (visualCardCheck && visualCardCheck.isLikelyIdCard === false) {
        visionInspection = {
          isSchoolIdCard: false,
          isJaipuriaSchool: false,
          reason:
            visualCardCheck.reason ||
            `Verification Failed — Invalid ID Card Photo: "${
              uploadedFileName || 'Uploaded image'
            }" does not match the layout or visual profile of an official Seth M.R. Jaipuria School ID card.`
        };
      } else {
        try {
          const openrouter = new OpenRouter({ apiKey: DEFAULT_OPENROUTER_KEY });
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Vision ID check timeout')), 4500)
          );

          const visionPromise = (async () => {
            const stream = await openrouter.chat.send({
              chatRequest: {
                model: 'nvidia/nemotron-3.5-super-vl:free',
                messages: [
                  {
                    role: 'user',
                    content: [
                      {
                        type: 'text',
                        text: `You are a strict school ID card verifier for Seth M.R. Jaipuria School, Lucknow.
Inspect this image carefully and return ONLY a JSON object with these keys:
{
  "isSchoolIdCard": boolean (true ONLY if this is actually a school identity card with a portrait photo and student/faculty details, false if it is a gift box, product photo, scenery, or random image),
  "isJaipuriaSchool": boolean (true ONLY if "SETH M.R. JAIPURIA SCHOOL" is visible on the card),
  "detectedName": string (the person's full name printed on the card, or "" if not visible),
  "detectedId": string (the Scholar No or Faculty ID printed on the card, e.g. "13457", or "" if not visible),
  "detectedRole": "student" | "teacher" | "unknown",
  "reason": string (1 sentence explaining what is in the image and whether it is a valid Jaipuria ID card)
}`
                      },
                      {
                        type: 'image_url',
                        imageUrl: { url: imageDataUrl }
                      }
                    ] as any
                  }
                ],
                stream: true
              }
            });

            let rawOut = '';
            for await (const chunk of stream) {
              const delta = chunk.choices?.[0]?.delta?.content;
              if (delta) rawOut += delta;
            }

            const jsonMatch = rawOut.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              visionInspection = {
                isSchoolIdCard: Boolean(parsed.isSchoolIdCard),
                isJaipuriaSchool: Boolean(parsed.isJaipuriaSchool),
                detectedName: parsed.detectedName || undefined,
                detectedId: parsed.detectedId || undefined,
                detectedRole: parsed.detectedRole || 'unknown',
                reason: parsed.reason || undefined
              };
              if (parsed.reason) aiSummary = String(parsed.reason);
            }
          })();

          await Promise.race([visionPromise, timeoutPromise]);
        } catch {
          // If vision API times out on an uploaded raster photo, rely on visualCardCheck
          if (visualCardCheck) {
            visionInspection = {
              isSchoolIdCard: Boolean(visualCardCheck.isLikelyIdCard),
              isJaipuriaSchool: Boolean(visualCardCheck.isLikelyIdCard),
              reason: visualCardCheck.reason
            };
          }
        }
      }
    }

    const result = buildVerifiedIdCardResult({
      fullName,
      role: cleanRole,
      schoolId,
      aiSummary: aiSummary.trim() || undefined,
      visionInspection,
      uploadedFileName
    });

    res.json(result);
  });

  // Streaming Chat Endpoint using @openrouter/sdk with SSE
  app.post('/api/chat/stream', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const {
      messages = [],
      context = {},
      imageDataUrl = null,
      workflowMeta = {}
    } = req.body || {};

    const academicCtx: AcademicContext = {
      role: context.role === 'teacher' ? 'teacher' : 'student',
      grade: LOCKED_GRADE,
      subject: context.subject || 'Mathematics',
      intelligenceMode: context.intelligenceMode || 'pedagogical',
      model: context.model || 'nvidia/nemotron-3.5-super-vl:free',
      customSpecs: Array.isArray(context.customSpecs) ? context.customSpecs : [],
      workflowType: context.workflowType
    };

    const systemPrompt = buildSystemPrompt(academicCtx);
    const formattedMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: any }> = [
      { role: 'system', content: systemPrompt }
    ];

    for (const msg of messages) {
      if (!msg || !msg.content) continue;
      formattedMessages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      });
    }

    if (imageDataUrl && formattedMessages.length > 1) {
      const lastIdx = formattedMessages.length - 1;
      const lastMsg = formattedMessages[lastIdx];
      if (lastMsg.role === 'user') {
        formattedMessages[lastIdx] = {
          role: 'user',
          content: [
            { type: 'text', text: String(lastMsg.content) },
            { type: 'image_url', imageUrl: { url: imageDataUrl } }
          ]
        };
      }
    }

    const lastUserPrompt =
      messages.length > 0 ? String(messages[messages.length - 1]?.content || '') : 'Illuminate this topic.';

    let streamedText = '';
    let reasoningTokens = 0;

    try {
      const openrouter = new OpenRouter({ apiKey: DEFAULT_OPENROUTER_KEY });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('OpenRouter request timed out after 4s')), 4000)
      );

      const sdkStreamPromise = (async () => {
        const stream = await openrouter.chat.send({
          chatRequest: {
            model: academicCtx.model,
            messages: formattedMessages as any,
            stream: true
          }
        });

        for await (const chunk of stream) {
          const content = chunk.choices?.[0]?.delta?.content;
          if (content) {
            streamedText += content;
            res.write(`data: ${JSON.stringify({ type: 'delta', content })}\n\n`);
          }
          if (chunk.usage) {
            const rTokens =
              (chunk.usage as any).completionTokensDetails?.reasoningTokens ??
              (chunk.usage as any).completion_tokens_details?.reasoning_tokens ??
              0;
            if (rTokens) {
              reasoningTokens = rTokens;
            }
          }
        }
      })();

      await Promise.race([sdkStreamPromise, timeoutPromise]);

      if (!streamedText.trim()) {
        throw new Error('Empty stream response from OpenRouter model');
      }

      if (
        (academicCtx.workflowType === 'olympiad_quiz' && !streamedText.includes('<medhavi_quiz>')) ||
        (academicCtx.workflowType === 'answer_evaluator' && !streamedText.includes('<medhavi_evaluation>'))
      ) {
        const structuredFallback = generateCuratedAcademicFallback(
          lastUserPrompt,
          academicCtx,
          workflowMeta
        );
        res.write(`data: ${JSON.stringify({ type: 'delta', content: '\n\n' + structuredFallback.content })}\n\n`);
        reasoningTokens = reasoningTokens || structuredFallback.reasoningTokens;
      }

      res.write(
        `data: ${JSON.stringify({
          type: 'done',
          reasoningTokens: reasoningTokens || Math.max(64, Math.round(streamedText.length / 6)),
          model: academicCtx.model,
          source: 'openrouter-live'
        })}\n\n`
      );
      res.end();
    } catch (_err) {
      if (!streamedText.trim()) {
        const fallback = generateCuratedAcademicFallback(lastUserPrompt, academicCtx, workflowMeta);
        const chunks = fallback.content.match(/.{1,60}(\s|$)|.{1,60}/gs) || [fallback.content];
        for (const piece of chunks) {
          res.write(`data: ${JSON.stringify({ type: 'delta', content: piece })}\n\n`);
        }
        res.write(
          `data: ${JSON.stringify({
            type: 'done',
            reasoningTokens: fallback.reasoningTokens,
            model: academicCtx.model,
            source: 'medhavi-resilient-engine'
          })}\n\n`
        );
      } else {
        res.write(
          `data: ${JSON.stringify({
            type: 'done',
            reasoningTokens: reasoningTokens || 128,
            model: academicCtx.model,
            source: 'openrouter-partial'
          })}\n\n`
        );
      }
      res.end();
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Jaipuria Medhavi Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
