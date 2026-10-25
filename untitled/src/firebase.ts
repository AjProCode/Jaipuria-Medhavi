import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import type { CustomSpecItem, PersonaRole } from './utils/medhaviEngine';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot as required by firebase-integration-rpc
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export function sanitizeId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);
  return cleaned || 'id-default';
}

export async function signInWithGoogleScholar(): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutScholar(): Promise<void> {
  await fbSignOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

export async function ensureUserProfileDoc(
  user: User,
  prefs: { persona: PersonaRole; grade: string; subject: string; theme: 'dark' | 'light' }
): Promise<void> {
  const uid = sanitizeId(user.uid);
  const path = `users/${uid}`;
  const ref = doc(db, 'users', uid);

  try {
    const snap = await getDoc(ref);
    const displayName = (user.displayName || user.email?.split('@')[0] || 'Jaipuria Scholar').slice(0, 100);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid,
        displayName,
        persona: prefs.persona === 'teacher' ? 'teacher' : 'student',
        grade: prefs.grade.slice(0, 40),
        subject: prefs.subject.slice(0, 80),
        theme: prefs.theme === 'light' ? 'light' : 'dark',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      await updateDoc(ref, {
        displayName,
        persona: prefs.persona === 'teacher' ? 'teacher' : 'student',
        grade: prefs.grade.slice(0, 40),
        subject: prefs.subject.slice(0, 80),
        theme: prefs.theme === 'light' ? 'light' : 'dark',
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export interface StoredSessionRecord {
  id: string;
  title: string;
  timestamp: number;
  role: PersonaRole;
  classLevel: string;
  subject: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    durationSeconds?: number;
    reasoningTokens?: number;
    imagePreview?: string;
    model?: string;
  }>;
}

export async function saveCloudSession(user: User, session: StoredSessionRecord): Promise<void> {
  const uid = sanitizeId(user.uid);
  const sessionId = sanitizeId(session.id);
  const path = `users/${uid}/sessions/${sessionId}`;
  const ref = doc(db, 'users', uid, 'sessions', sessionId);

  const totalReasoning = session.messages.reduce((acc, m) => acc + (m.reasoningTokens || 0), 0);
  const serializedPayload = JSON.stringify(
    session.messages.map((m) => ({
      ...m,
      // Do not store large base64 images in Firestore (1MB limit)
      imagePreview: undefined
    }))
  ).slice(0, 195000);

  try {
    const existingSnap = await getDoc(ref);
    if (!existingSnap.exists()) {
      await setDoc(ref, {
        id: sessionId,
        userId: uid,
        title: (session.title || 'Scholarly Session').slice(0, 200),
        role: session.role === 'teacher' ? 'teacher' : 'student',
        classLevel: session.classLevel.slice(0, 40),
        subject: session.subject.slice(0, 80),
        payload: serializedPayload,
        reasoningTokensTotal: Math.min(10000000, Math.max(0, totalReasoning)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      await updateDoc(ref, {
        title: (session.title || 'Scholarly Session').slice(0, 200),
        role: session.role === 'teacher' ? 'teacher' : 'student',
        classLevel: session.classLevel.slice(0, 40),
        subject: session.subject.slice(0, 80),
        payload: serializedPayload,
        reasoningTokensTotal: Math.min(10000000, Math.max(0, totalReasoning)),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCloudSession(user: User, sessionIdRaw: string): Promise<void> {
  const uid = sanitizeId(user.uid);
  const sessionId = sanitizeId(sessionIdRaw);
  const path = `users/${uid}/sessions/${sessionId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'sessions', sessionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToCloudSessions(
  user: User,
  onData: (sessions: StoredSessionRecord[]) => void
): Unsubscribe {
  const uid = sanitizeId(user.uid);
  const path = `users/${uid}/sessions`;
  const q = query(collection(db, 'users', uid, 'sessions'), where('userId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const records: StoredSessionRecord[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        try {
          const parsedMessages = JSON.parse(d.payload || '[]');
          records.push({
            id: d.id,
            title: d.title,
            timestamp: d.updatedAt?.toMillis?.() || Date.now(),
            role: d.role === 'teacher' ? 'teacher' : 'student',
            classLevel: d.classLevel || 'Class 9',
            subject: d.subject || 'Mathematics',
            messages: Array.isArray(parsedMessages) ? parsedMessages : []
          });
        } catch {
          // Skip malformed payload
        }
      });
      records.sort((a, b) => b.timestamp - a.timestamp);
      onData(records);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveCloudSpec(user: User, spec: CustomSpecItem): Promise<void> {
  const uid = sanitizeId(user.uid);
  const specId = sanitizeId(spec.id);
  const path = `users/${uid}/specs/${specId}`;
  const ref = doc(db, 'users', uid, 'specs', specId);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        id: specId,
        userId: uid,
        category: spec.category,
        title: spec.title.slice(0, 120),
        content: spec.content.slice(0, 4000),
        active: Boolean(spec.active),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      await updateDoc(ref, {
        category: spec.category,
        title: spec.title.slice(0, 120),
        content: spec.content.slice(0, 4000),
        active: Boolean(spec.active),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCloudSpec(user: User, specIdRaw: string): Promise<void> {
  const uid = sanitizeId(user.uid);
  const specId = sanitizeId(specIdRaw);
  const path = `users/${uid}/specs/${specId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'specs', specId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCloudQuizAttempt(
  user: User,
  attempt: {
    id: string;
    topic: string;
    subject: string;
    classLevel: string;
    difficulty: 'Foundation' | 'Competitive' | 'Olympiad' | 'Extreme Logic';
    score: number;
    maxScore: number;
    accuracy: number;
  }
): Promise<void> {
  const uid = sanitizeId(user.uid);
  const attemptId = sanitizeId(attempt.id);
  const path = `users/${uid}/quizAttempts/${attemptId}`;
  const ref = doc(db, 'users', uid, 'quizAttempts', attemptId);

  try {
    await setDoc(ref, {
      id: attemptId,
      userId: uid,
      topic: attempt.topic.slice(0, 150),
      subject: attempt.subject.slice(0, 80),
      classLevel: attempt.classLevel.slice(0, 40),
      difficulty: attempt.difficulty,
      score: Math.max(-100, Math.min(1000, attempt.score)),
      maxScore: Math.max(1, Math.min(1000, attempt.maxScore)),
      accuracy: Math.max(0, Math.min(100, attempt.accuracy)),
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
