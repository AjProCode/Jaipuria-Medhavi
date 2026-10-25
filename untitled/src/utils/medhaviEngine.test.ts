import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LOCKED_GRADE,
  normalizeDifficultyDistribution,
  calculateOlympiadScore,
  buildSystemPrompt,
  buildVerifiedIdCardResult,
  parseMedhaviResponse,
  generateCuratedAcademicFallback,
  type QuizQuestion,
  type AcademicContext
} from './medhaviEngine';
import {
  MOCK_SCHOOL_CALENDAR,
  getAllCalendarEvents,
  filterCalendarEvents,
  getDaysRemaining
} from '../data/schoolCalendarData';
import { stripMarkdownForSpeech } from './voiceAudioEngine';

test('LOCKED_GRADE is exclusively Class 7', () => {
  assert.equal(LOCKED_GRADE, 'Class 7');
});

test('normalizeDifficultyDistribution always sums to 100%', () => {
  const dist1 = normalizeDifficultyDistribution(30, 50, 20);
  assert.equal(dist1.easy + dist1.moderate + dist1.hots, 100);
  assert.deepEqual(dist1, { easy: 30, moderate: 50, hots: 20 });
});

test('calculateOlympiadScore enforces +2 correct, -1 incorrect, 0 skipped', () => {
  const questions: QuizQuestion[] = [
    {
      id: 'q1',
      question: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctIndex: 1,
      explanation: '2 + 2 = 4',
      conceptTag: 'Arithmetic'
    },
    {
      id: 'q2',
      question: 'What is sqrt(9)?',
      options: ['2', '3', '4', '9'],
      correctIndex: 1,
      explanation: '3 * 3 = 9',
      conceptTag: 'Radicals'
    },
    {
      id: 'q3',
      question: 'Value of x^0 for x != 0?',
      options: ['0', '1', 'x', '-1'],
      correctIndex: 1,
      explanation: 'Any non-zero number to power 0 is 1',
      conceptTag: 'Exponents'
    }
  ];

  const report = calculateOlympiadScore({ 0: 1, 1: 0, 2: null }, questions, 45);
  assert.equal(report.score, 1);
  assert.equal(report.maxScore, 6);
  assert.equal(report.correctCount, 1);
  assert.equal(report.incorrectCount, 1);
  assert.equal(report.skippedCount, 1);
});

test('buildSystemPrompt includes exact Jaipuria Medhavi Core Specifications & Class 7 lock', () => {
  const ctx: AcademicContext = {
    role: 'student',
    grade: 'Class 7',
    subject: 'Mathematics',
    intelligenceMode: 'pedagogical',
    model: 'nvidia/nemotron-3.5-super-vl:free',
    customSpecs: [
      {
        id: 'spec-1',
        category: 'Current Syllabus',
        title: 'CBSE Chapter 6',
        content: 'The Triangle and its Properties',
        active: true
      }
    ]
  };

  const prompt = buildSystemPrompt(ctx);
  assert.match(prompt, /You are "Jaipuria Medhavi" \(मेधावी\), the official high-logic AI scholar and assistant for Seth M\.R\. Jaipuria School\./);
  assert.match(prompt, /YOUR CORE SPECIFICATIONS & RULES:/);
  assert.match(prompt, /1\. Identity: Whenever asked who you are, introduce yourself proudly as Jaipuria Medhavi\./);
  assert.match(prompt, /Class 7/);
  assert.match(prompt, /The Triangle and its Properties/);
});

test('buildVerifiedIdCardResult verifies valid Student and Teacher ID cards and rejects wrong info or invalid images', () => {
  const validAtharva = buildVerifiedIdCardResult({
    fullName: 'Atharva Jindal',
    role: 'student',
    schoolId: '13457'
  });
  assert.equal(validAtharva.verified, true);
  assert.equal(validAtharva.grade, 'Class 7');
  assert.equal(validAtharva.extractedRole, 'student');

  // Wrong Name for Scholar No 13457 (e.g. "Reshu Jindal" with "13457") MUST be rejected
  const wrongNameRes = buildVerifiedIdCardResult({
    fullName: 'Reshu Jindal',
    role: 'student',
    schoolId: '13457'
  });
  assert.equal(wrongNameRes.verified, false);
  assert.match(wrongNameRes.summary, /Wrong Info/i);

  // Role mismatch (Student ID 13457 used for Teacher account) MUST be rejected
  const wrongRoleRes = buildVerifiedIdCardResult({
    fullName: 'Atharva Jindal',
    role: 'teacher',
    schoolId: '13457'
  });
  assert.equal(wrongRoleRes.verified, false);
  assert.match(wrongRoleRes.summary, /Wrong Account Type/i);

  // Non-ID image (e.g. gift hamper photo) MUST be rejected
  const invalidImageRes = buildVerifiedIdCardResult({
    fullName: 'Atharva Jindal',
    role: 'student',
    schoolId: '13457',
    visionInspection: {
      isSchoolIdCard: false,
      isJaipuriaSchool: false,
      reason: 'Uploaded image is a gift hamper, not a school ID card.'
    }
  });
  assert.equal(invalidImageRes.verified, false);
  assert.match(invalidImageRes.summary, /gift hamper/i);
});

test('parseMedhaviResponse extracts logic summary and quiz JSON cleanly', () => {
  const raw = `<medhavi_logic>
- Approach: Use Euclidean theorem.
- Verification: Confirmed right-angle triangle.
</medhavi_logic>
Here is your Olympiad quiz:
<medhavi_quiz>
{
  "title": "Class 7 Geometry Sprint",
  "topic": "Triangles",
  "difficulty": "Olympiad",
  "timerSeconds": 120,
  "questions": [
    {
      "id": "q1",
      "question": "Hypotenuse of 3-4-5 triangle?",
      "options": ["3", "4", "5", "6"],
      "correctIndex": 2,
      "explanation": "3^2 + 4^2 = 5^2",
      "conceptTag": "Pythagoras"
    }
  ]
}
</medhavi_quiz>`;

  const parsed = parseMedhaviResponse(raw);
  assert.equal(parsed.logicSummary.length, 2);
  assert.ok(parsed.quizData);
  assert.equal(parsed.quizData?.title, 'Class 7 Geometry Sprint');
});

test('generateCuratedAcademicFallback answers strawberry and identity questions accurately', () => {
  const ctx: AcademicContext = {
    role: 'student',
    grade: 'Class 7',
    subject: 'Computer Science & AI',
    intelligenceMode: 'deep',
    model: 'nvidia/nemotron-3.5-super-vl:free',
    customSpecs: []
  };

  const strawberryRes = generateCuratedAcademicFallback("How many r's are in the word 'strawberry'?", ctx);
  assert.match(strawberryRes.content, /There are \*\*3\*\* letter `r`'s in \*\*strawberry\*\*/);

  const identityRes = generateCuratedAcademicFallback('Who are you?', ctx);
  assert.match(identityRes.content, /Jaipuria Medhavi/);
});

test('MOCK_SCHOOL_CALENDAR lists upcoming exams, school holidays, and assignment deadlines for Class 7', () => {
  assert.equal(MOCK_SCHOOL_CALENDAR.grade, 'Class 7');
  assert.ok(MOCK_SCHOOL_CALENDAR.exams.length >= 3);
  assert.ok(MOCK_SCHOOL_CALENDAR.assignments.length >= 3);
  assert.ok(MOCK_SCHOOL_CALENDAR.holidays.length >= 3);
  assert.ok(MOCK_SCHOOL_CALENDAR.initialVoiceNotes.length >= 2);

  const all = getAllCalendarEvents(MOCK_SCHOOL_CALENDAR);
  assert.equal(
    all.length,
    MOCK_SCHOOL_CALENDAR.exams.length +
      MOCK_SCHOOL_CALENDAR.assignments.length +
      MOCK_SCHOOL_CALENDAR.holidays.length
  );

  const examsOnly = filterCalendarEvents(all, { category: 'exam' });
  assert.equal(examsOnly.length, MOCK_SCHOOL_CALENDAR.exams.length);

  const days = getDaysRemaining('2026-11-02', '2026-10-24');
  assert.equal(days, 9);
});

test('stripMarkdownForSpeech cleans XML tags and markdown syntax for voice synthesis', () => {
  const input = '<medhavi_logic>- Step 1</medhavi_logic> ## Namaste **Jaipuria Medhavi**!';
  const cleaned = stripMarkdownForSpeech(input);
  assert.equal(cleaned, 'Namaste Jaipuria Medhavi !');
});
