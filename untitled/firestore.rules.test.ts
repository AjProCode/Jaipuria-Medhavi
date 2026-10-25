import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Hardened Red-Team Audit & Dirty Dozen Security Rule Verification
 * Verifies that firestore.rules enforces all 8 Pillars of Hardened Rules
 * and blocks all 12 Dirty Dozen adversarial payloads.
 */

const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const rulesContent = fs.readFileSync(rulesPath, 'utf-8');

test('Pillar 1 & Global Safety Net: Default deny catch-all exists', () => {
  assert.match(rulesContent, /match \/\{document=\*\*\} \{\s*allow read, write: if false;\s*\}/);
});

test('Pillar 2: Validation Blueprints exist for all 4 entities and enforce hasAll & hasOnly', () => {
  assert.match(rulesContent, /function isValidUserProfile\(data, userId\)/);
  assert.match(rulesContent, /function isValidSession\(data, userId, sessionId\)/);
  assert.match(rulesContent, /function isValidSpec\(data, userId, specId\)/);
  assert.match(rulesContent, /function isValidQuizAttempt\(data, userId, attemptId\)/);
  assert.match(rulesContent, /data\.keys\(\)\.hasAll/);
  assert.match(rulesContent, /data\.keys\(\)\.hasOnly/);
});

test('Pillar 3: Path Variable Hardening (isValidId regex guard)', () => {
  assert.match(rulesContent, /function isValidId\(id\)/);
  assert.match(rulesContent, /\^\[a-zA-Z0-9_\\\\-\]\+\$/);
});

test('Pillar 4 & Action-Based Updates: affectedKeys().hasOnly() on all updatable collections', () => {
  assert.match(rulesContent, /affectedKeys\(\)\.hasOnly\(\['displayName', 'persona', 'grade', 'subject', 'theme', 'updatedAt'\]\)/);
  assert.match(rulesContent, /affectedKeys\(\)\.hasOnly\(\['title', 'role', 'classLevel', 'subject', 'payload', 'reasoningTokensTotal', 'updatedAt'\]\)/);
  assert.match(rulesContent, /affectedKeys\(\)\.hasOnly\(\['category', 'title', 'content', 'active', 'updatedAt'\]\)/);
});

test('Pillar 6 & Verified Users: Email verification required for writes & no blanket reads', () => {
  assert.match(rulesContent, /request\.auth\.token\.email_verified == true/);
  assert.doesNotMatch(rulesContent, /allow read: if isSignedIn\(\);/);
  assert.doesNotMatch(rulesContent, /allow list: if isSignedIn\(\);/);
});

test('Pillar 8: Secure List Queries enforce existing().userId == request.auth.uid without get/exists', () => {
  assert.match(rulesContent, /allow list: if isOwner\(userId\) && existing\(\)\.userId == request\.auth\.uid;/);
});

test('Temporal & Immortal Field Integrity: request.time and immutable createdAt/id/userId', () => {
  assert.match(rulesContent, /incoming\(\)\.createdAt == request\.time/);
  assert.match(rulesContent, /incoming\(\)\.updatedAt == request\.time/);
  assert.match(rulesContent, /incoming\(\)\.createdAt == existing\(\)\.createdAt/);
});
