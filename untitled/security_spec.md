# Jaipuria Medhavi — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants & Master Source of Truth

1. **Master Gate & Relational Ownership**:
   - `/users/{userId}` is the root identity document for each authenticated user.
   - Subcollections `/users/{userId}/sessions/{sessionId}`, `/users/{userId}/specs/{specId}`, and `/users/{userId}/quizAttempts/{attemptId}` are strictly owned by `{userId}` and require `exists(/databases/$(database)/documents/users/$(userId))` on single-document writes (`create`, `update`, `delete`) and `get`.
2. **Verified Identity Enforcement**:
   - Every write operation (`create`, `update`, `delete`) across all collections requires `request.auth != null && request.auth.token.email_verified == true`.
   - `uid` / `userId` in the document payload must strictly match both `request.auth.uid` and the path parameter `{userId}`.
3. **Strict Schema & Volumetric Bounds**:
   - All strings have explicit minimum and maximum `.size()` bounds.
   - All path IDs (`userId`, `sessionId`, `specId`, `attemptId`) must match `^[a-zA-Z0-9_\-]+$` with length `1..128`.
   - No shadow/ghost fields are permitted (`keys().hasAll(...) && keys().hasOnly(...)`).
4. **Temporal & Immutable Integrity**:
   - `createdAt` and `updatedAt` must equal `request.time` on creation.
   - On update, `createdAt`, `id`, `uid`, and `userId` are strictly immutable, and `updatedAt` must equal `request.time`.
   - `QuizAttempt` records are immutable history logs (no updates permitted once created).
5. **Query Enforcer (Secure List)**:
   - Every `allow list` rule enforces `isSignedIn() && request.auth.uid == userId && resource.data.userId == request.auth.uid` without costly `get()`/`exists()` calls inside `list`.

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 (Unverified Email Write)**: Authenticated user with `email_verified: false` attempts to create `/users/u1`. -> `PERMISSION_DENIED`
2. **Payload 2 (Identity Spoofing on User Create)**: User `u1` attempts to create `/users/u1` with `uid: "u2"`. -> `PERMISSION_DENIED`
3. **Payload 3 (Shadow Field Injection)**: User `u1` creates `/users/u1` including an extra field `isAdmin: true`. -> `PERMISSION_DENIED`
4. **Payload 4 (Orphaned Subcollection Write)**: User `u1` attempts to create `/users/u1/sessions/s1` before `/users/u1` exists. -> `PERMISSION_DENIED`
5. **Payload 5 (Cross-Tenant Session Read)**: User `u2` attempts to `get` or `list` `/users/u1/sessions`. -> `PERMISSION_DENIED`
6. **Payload 6 (Path ID Poisoning)**: User `u1` attempts to create `/users/u1/specs/invalid$id!@#` with non-alphanumeric characters. -> `PERMISSION_DENIED`
7. **Payload 7 (Value Poisoning on Update)**: User `u1` updates `/users/u1` setting `persona: "superadmin"` (outside enum `['student', 'teacher']`). -> `PERMISSION_DENIED`
8. **Payload 8 (Timestamp Forgery)**: User `u1` creates `/users/u1/specs/sp1` with a past client timestamp instead of `request.time`. -> `PERMISSION_DENIED`
9. **Payload 9 (Immortal Field Mutation)**: User `u1` updates `/users/u1/sessions/s1` changing `createdAt` or `userId`. -> `PERMISSION_DENIED`
10. **Payload 10 (Unlisted Field Update Gap)**: User `u1` updates `/users/u1/specs/sp1` mutating a field not in `affectedKeys().hasOnly(...)`. -> `PERMISSION_DENIED`
11. **Payload 11 (Terminal State / History Tampering)**: User `u1` attempts to `update` a completed `/users/u1/quizAttempts/qa1` document. -> `PERMISSION_DENIED`
12. **Payload 12 (Denial of Wallet Oversized String)**: User `u1` attempts to create `/users/u1/specs/sp1` with `content` exceeding 4,000 characters. -> `PERMISSION_DENIED`
