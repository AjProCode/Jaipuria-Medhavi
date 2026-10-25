export type CalendarEventCategory = 'exam' | 'holiday' | 'assignment';

export interface CalendarEventItem {
  id: string;
  title: string;
  category: CalendarEventCategory;
  date: string; // YYYY-MM-DD
  endDate?: string;
  timeLabel: string;
  subject: string;
  grade: 'Class 7';
  locationOrMode: string;
  syllabusOrDetails: string;
  weightageOrDuration: string;
  priority: 'high' | 'medium' | 'normal';
  completed?: boolean;
  aiPrepPrompt: string;
}

export interface VoiceNoteItem {
  id: string;
  title: string;
  transcript: string;
  durationSeconds: number;
  createdAt: string;
  linkedEventId?: string;
  linkedEventTitle?: string;
  subject: string;
  audioDataUrl?: string;
  waveformHeights: number[];
}

export interface MockSchoolCalendarObject {
  schoolName: string;
  academicSession: string;
  grade: 'Class 7';
  lastUpdated: string;
  exams: CalendarEventItem[];
  holidays: CalendarEventItem[];
  assignments: CalendarEventItem[];
  initialVoiceNotes: VoiceNoteItem[];
}

export const MOCK_SCHOOL_CALENDAR: MockSchoolCalendarObject = {
  schoolName: 'Seth M.R. Jaipuria School',
  academicSession: '2026–2027 (Term II · Class 7 Exclusive)',
  grade: 'Class 7',
  lastUpdated: '2026-10-24',
  exams: [
    {
      id: 'exam-math-ut2',
      title: 'Class 7 Mathematics Unit Test II — Linear Equations & Triangles',
      category: 'exam',
      date: '2026-11-02',
      timeLabel: '08:30 AM – 10:00 AM',
      subject: 'Mathematics',
      grade: 'Class 7',
      locationOrMode: 'Examination Hall B · Block II',
      syllabusOrDetails:
        'Chapter 4: Simple Equations, Chapter 6: The Triangle and its Properties (Angle Sum, Exterior Angle, Pythagoras Theorem).',
      weightageOrDuration: '40 Marks · 90 Mins',
      priority: 'high',
      aiPrepPrompt:
        'Create a Class 7 Mathematics Unit Test II 5-Minute Exam Revision Sheet covering Simple Equations and Triangle Properties (Angle Sum & Pythagoras Theorem) with 3 high-probability numerical problems.'
    },
    {
      id: 'exam-sci-olympiad',
      title: 'National Science & High-Logic Medhavi Olympiad Qualifier',
      category: 'exam',
      date: '2026-11-09',
      timeLabel: '09:00 AM – 10:30 AM',
      subject: 'Physics',
      grade: 'Class 7',
      locationOrMode: 'Jaipuria Digital Assessment Lab',
      syllabusOrDetails:
        'Heat & Temperature, Motion and Time, Electric Current and its Effects, Logical Reasoning (+2 Correct, -1 Incorrect).',
      weightageOrDuration: '60 Marks · Olympiad Pattern',
      priority: 'high',
      aiPrepPrompt:
        'Generate a 5-question Olympiad-level MCQ challenge for Class 7 Science (Heat, Motion & Time, Electric Current) inside <medhavi_quiz>...</medhavi_quiz> tags.'
    },
    {
      id: 'exam-cs-practical',
      title: 'Computer Science & AI Mid-Term Practical — Python Loops & Conditionals',
      category: 'exam',
      date: '2026-11-18',
      timeLabel: '11:15 AM – 12:45 PM',
      subject: 'Computer Science & AI',
      grade: 'Class 7',
      locationOrMode: 'Atal Tinkering & AI Lab 01',
      syllabusOrDetails:
        'Writing and debugging Python programs using for/while loops, range(), conditional statements, and pattern printing.',
      weightageOrDuration: '30 Marks · Lab Viva + Code',
      priority: 'medium',
      aiPrepPrompt:
        'Provide a Class 7 Python practical exam preparation guide on for/while loops and conditional statements with sample viva questions and code debugging.'
    },
    {
      id: 'exam-eng-lit',
      title: 'English Literature & Grammar Periodic Assessment',
      category: 'exam',
      date: '2026-11-26',
      timeLabel: '08:30 AM – 09:45 AM',
      subject: 'English',
      grade: 'Class 7',
      locationOrMode: 'Class 7 Section A–D Rooms',
      syllabusOrDetails:
        'Honeycomb Prose & Poetry comprehension, Active & Passive Voice, Reported Speech, and Formal Letter to the Editor.',
      weightageOrDuration: '30 Marks · 75 Mins',
      priority: 'medium',
      aiPrepPrompt:
        'Help me revise Class 7 English Grammar (Active & Passive Voice and Reported Speech) with step-by-step transformation rules and practice sentences.'
    }
  ],
  assignments: [
    {
      id: 'assign-sci-thermo',
      title: 'Physics Lab Dossier: Clinical vs Laboratory Thermometer & Heat Transfer',
      category: 'assignment',
      date: '2026-10-28',
      timeLabel: 'Due by 04:00 PM',
      subject: 'Physics',
      grade: 'Class 7',
      locationOrMode: 'Submit in Science Lab + Medhavi Cloud',
      syllabusOrDetails:
        'Draw labeled diagrams comparing conduction, convection, and radiation in everyday household objects with 5 observation readings.',
      weightageOrDuration: '15 Marks · Internal Portfolio',
      priority: 'high',
      aiPrepPrompt:
        'Guide me step-by-step to structure my Class 7 Physics Lab Dossier on Conduction, Convection, and Radiation with a comparison table and real-world examples.'
    },
    {
      id: 'assign-math-mensuration',
      title: 'Mathematics Activity File: Perimeter & Area of Composite Shapes',
      category: 'assignment',
      date: '2026-11-05',
      timeLabel: 'Due by 02:30 PM',
      subject: 'Mathematics',
      grade: 'Class 7',
      locationOrMode: 'Class 7 Mathematics Faculty Desk',
      syllabusOrDetails:
        'Measure 4 rectangular and circular objects at home, verify the ratio of circumference to diameter (π), and compute total surface areas.',
      weightageOrDuration: '10 Marks · NEP-2020 Experiential',
      priority: 'medium',
      aiPrepPrompt:
        'Explain how to write a Class 7 Mathematics experiential activity verifying circumference to diameter ratio (pi) and calculating areas of composite shapes.'
    },
    {
      id: 'assign-hist-mughal',
      title: 'History Heritage Portfolio: Architecture & Administration in Medieval India',
      category: 'assignment',
      date: '2026-11-12',
      timeLabel: 'Due by 03:00 PM',
      subject: 'History',
      grade: 'Class 7',
      locationOrMode: 'Social Science Resource Studio',
      syllabusOrDetails:
        'Comparative timeline of 16th–17th century monuments, water-harvesting baolis, and revenue administration systems.',
      weightageOrDuration: '10 Marks · Project Work',
      priority: 'normal',
      aiPrepPrompt:
        'Create a structured Class 7 History study outline on Medieval Indian Architecture and Administration with key dates and monument characteristics.'
    },
    {
      id: 'assign-sanskrit-shloka',
      title: 'Trilingual Subhashitani & Grammar Recitation Script',
      category: 'assignment',
      date: '2026-11-20',
      timeLabel: 'Due by 01:30 PM',
      subject: 'Sanskrit — संस्कृतम्',
      grade: 'Class 7',
      locationOrMode: 'Language Lab · Audio + Written Sheet',
      syllabusOrDetails:
        'Write 4 Class 7 Ruchira Subhashitani verses with word-by-word Sandhi breakdown and translations in Hindi and English.',
      weightageOrDuration: '10 Marks · Oral + Written',
      priority: 'normal',
      aiPrepPrompt:
        'Provide 2 classic Class 7 Sanskrit Subhashitani verses on knowledge (Vidya) with word-by-word meaning in Hindi and English.'
    }
  ],
  holidays: [
    {
      id: 'hol-diwali',
      title: 'Deepawali & Govardhan Puja — Autumn Festival Break',
      category: 'holiday',
      date: '2026-11-07',
      endDate: '2026-11-10',
      timeLabel: '4-Day School Holiday',
      subject: 'Interdisciplinary',
      grade: 'Class 7',
      locationOrMode: 'Campus Closed · Self-Paced Medhavi Study',
      syllabusOrDetails:
        'Seth M.R. Jaipuria School remains closed for Deepawali celebrations. Students are encouraged to celebrate an eco-friendly festival of light ("Tamso Ma Jyotirgamaya").',
      weightageOrDuration: 'Nov 7 – Nov 10, 2026',
      priority: 'normal',
      aiPrepPrompt:
        'Create a light, enjoyable 4-day Diwali holiday self-study schedule for Class 7 balancing 30 minutes of daily Olympiad practice with family festivities.'
    },
    {
      id: 'hol-gurunanak',
      title: 'Guru Nanak Jayanti — Gurpurab Institutional Holiday',
      category: 'holiday',
      date: '2026-11-24',
      timeLabel: 'Full Day Holiday',
      subject: 'General Knowledge',
      grade: 'Class 7',
      locationOrMode: 'Campus Closed',
      syllabusOrDetails:
        'Gazetted holiday commemorating the birth anniversary of Guru Nanak Dev Ji and his teachings of universal harmony, truth, and selfless service.',
      weightageOrDuration: 'Nov 24, 2026',
      priority: 'normal',
      aiPrepPrompt:
        'Share a Class 7 General Knowledge & History summary on the life and core teachings of Guru Nanak Dev Ji.'
    },
    {
      id: 'hol-winter',
      title: 'Jaipuria Winter Vacation & Olympiad Camp Window',
      category: 'holiday',
      date: '2026-12-25',
      endDate: '2027-01-05',
      timeLabel: '12-Day Winter Recess',
      subject: 'Interdisciplinary',
      grade: 'Class 7',
      locationOrMode: 'Campus Closed · Optional Online Medhavi Camp',
      syllabusOrDetails:
        'Annual winter break for Class 7 students. Optional 20-minute daily High-Logic Medhavi Reasoning capsules remain unlocked.',
      weightageOrDuration: 'Dec 25 – Jan 5',
      priority: 'normal',
      aiPrepPrompt:
        'Design a Class 7 Winter Vacation curiosity roadmap combining Science experiments, Mathematics puzzles, and reading.'
    }
  ],
  initialVoiceNotes: [
    {
      id: 'vn-seed-1',
      title: 'Triangle Angle Sum & Exterior Angle Proof Memo',
      transcript:
        'Remember for the Nov 2 Maths Unit Test: Draw a line parallel to the base through the top vertex, then use alternate interior angles to prove ∠A + ∠B + ∠C = 180 degrees.',
      durationSeconds: 14,
      createdAt: '2026-10-24 · 07:45 AM',
      linkedEventId: 'exam-math-ut2',
      linkedEventTitle: 'Class 7 Mathematics Unit Test II',
      subject: 'Mathematics',
      waveformHeights: [32, 58, 76, 44, 88, 95, 62, 48, 84, 70, 52, 90, 64, 40, 72, 55, 38, 60]
    },
    {
      id: 'vn-seed-2',
      title: 'Physics Lab Thermometer Kink Observation',
      transcript:
        'For the Oct 28 Physics Lab Dossier: Highlight why a clinical thermometer has a kink near the bulb—it prevents mercury level from falling on its own while taking a reading.',
      durationSeconds: 11,
      createdAt: '2026-10-24 · 07:50 AM',
      linkedEventId: 'assign-sci-thermo',
      linkedEventTitle: 'Physics Lab Dossier: Thermometer & Heat',
      subject: 'Physics',
      waveformHeights: [40, 66, 50, 82, 74, 92, 56, 42, 78, 86, 60, 48, 70, 62, 45, 52, 36, 48]
    }
  ]
};

export function getAllCalendarEvents(
  calendar: MockSchoolCalendarObject = MOCK_SCHOOL_CALENDAR
): CalendarEventItem[] {
  return [...calendar.exams, ...calendar.assignments, ...calendar.holidays].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

export function filterCalendarEvents(
  events: CalendarEventItem[],
  options: {
    category?: 'all' | CalendarEventCategory;
    subject?: string;
    searchQuery?: string;
  }
): CalendarEventItem[] {
  const { category = 'all', subject = 'All', searchQuery = '' } = options;
  const q = searchQuery.trim().toLowerCase();

  return events.filter((ev) => {
    if (category !== 'all' && ev.category !== category) return false;
    if (
      subject &&
      subject !== 'All' &&
      ev.subject.toLowerCase() !== subject.toLowerCase() &&
      ev.category !== 'holiday'
    ) {
      return false;
    }
    if (q) {
      const hay = `${ev.title} ${ev.subject} ${ev.syllabusOrDetails} ${ev.locationOrMode}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function getDaysRemaining(targetDateStr: string, referenceDateStr = '2026-10-24'): number {
  const target = new Date(`${targetDateStr}T00:00:00Z`).getTime();
  const ref = new Date(`${referenceDateStr}T00:00:00Z`).getTime();
  const diffDays = Math.round((target - ref) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
