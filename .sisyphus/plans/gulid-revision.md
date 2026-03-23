# Gulid Revision - point3-common-tool

## TL;DR

> **Quick Summary**: Revise Gulid class to support Agreement ID migration with strict validation, new getters (`Prefix`, `ULID`), and `equals()` method.
> 
> **Deliverables**:
> - Updated `values/gulid.ts` with new API
> - Updated `values/__tests__/gulid.spec.ts` with comprehensive tests
> - Version bump to 1.0.36
> - Published to npm registry
> 
> **Estimated Effort**: Quick (1-2 hours)
> **Parallel Execution**: NO - sequential (tests depend on implementation)
> **Critical Path**: Tests → Implementation → Build → Publish

---

## Context

### Original Request
Revise Gulid class to support Agreement ID migration for InbizNet's 30-character `authReqNumber` limit.

### Interview Summary
**Key Discussions**:
- Keep `:` separator (not changing)
- `create(prefix)` - prefix REQUIRED (throws if empty or contains `:`)
- Add `Prefix` getter (uppercase, matches Guid API)
- Keep `prefix` getter with `@deprecated` annotation
- Add `ULID` getter for raw 26-char value
- Add `equals(other)` method - returns `false` for null/undefined
- **Strict colon rule**: `parse()` throws if multiple colons

**Research Findings**:
- Current implementation at `values/gulid.ts` - uses `lastIndexOf(':')` which allows multiple colons
- Tests at `values/__tests__/gulid.spec.ts` - 3 existing tests
- `ulid` package v3.0.1 already installed
- Library version 1.0.35

### Metis Review
**Identified Gaps** (addressed):
- Multiple colon handling: Changed to strict (throw error)
- `equals(null/undefined)` behavior: Returns `false`, no throw
- Breaking change: `create()` prefix now required
- Edge case validation added to `parse()`

---

## Work Objectives

### Core Objective
Revise Gulid class to provide strict validation and complete API matching Guid's interface pattern.

### Concrete Deliverables
- `values/gulid.ts` - Updated implementation
- `values/__tests__/gulid.spec.ts` - Comprehensive tests
- `package.json` - Version 1.0.36

### Definition of Done
- [ ] `bun test` passes with 0 failures
- [ ] All new methods tested
- [ ] `bun run build` succeeds
- [ ] `npm publish` succeeds

### Must Have
- `create(prefix)` throws on empty prefix
- `create(prefix)` throws on prefix containing `:`
- `parse(id)` throws on multiple colons (strict rule)
- `parse(id)` throws on missing colon
- `parse(id)` throws on empty prefix
- `parse(id)` throws on ULID not 26 chars
- `Prefix` getter (uppercase)
- `prefix` getter with `@deprecated` JSDoc
- `ULID` getter
- `equals(other)` returns `false` for null/undefined

### Must NOT Have (Guardrails)
- DO NOT add methods beyond: `create`, `parse`, `Prefix`, `prefix`, `ULID`, `toString`, `equals`
- DO NOT create custom error classes
- DO NOT touch files outside `gulid.ts` and `gulid.spec.ts` (except package.json)
- DO NOT refactor existing passing tests
- DO NOT add new dependencies
- DO NOT create CHANGELOG or migration guide

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (bun test)
- **Automated tests**: YES (TDD approach)
- **Framework**: bun test

### Agent-Executed QA Scenarios

All verification via `bun test` commands - no human intervention.

---

## Execution Strategy

### Sequential Execution (No Parallelism)

```
Task 1: Update Gulid tests (RED phase)
    ↓
Task 2: Update Gulid implementation (GREEN phase)
    ↓
Task 3: Version bump and publish
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|------------|--------|
| 1 | None | 2 |
| 2 | 1 | 3 |
| 3 | 2 | None |

---

## TODOs

- [ ] 1. Update Gulid Tests (RED Phase)

  **What to do**:
  - Add tests for `create()` validation (empty prefix, colon in prefix)
  - Add tests for `parse()` validation (no colon, multiple colons, empty prefix, invalid ULID length)
  - Add tests for `Prefix` getter (uppercase)
  - Add tests for `prefix` getter (backward compat)
  - Add tests for `ULID` getter
  - Add tests for `equals()` method (same, different, null, undefined)
  - Run tests - expect FAILURES (RED phase)

  **Must NOT do**:
  - Do NOT implement the actual changes yet
  - Do NOT modify gulid.ts
  - Do NOT delete or modify existing passing tests

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`
    - No special skills needed - standard TypeScript testing

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 2
  - **Blocked By**: None

  **References**:
  - `values/__tests__/gulid.spec.ts` - Existing tests, follow same structure
  - `values/__tests__/uuid.spec.ts` - Reference for test patterns
  - `.sisyphus/drafts/gulid-revision-contract.md` - Complete contract with test cases

  **Acceptance Criteria**:

  **Test Structure (run after implementation):**
  - [ ] Test file has `describe('create')` block with 3+ tests
  - [ ] Test file has `describe('parse')` block with 5+ tests
  - [ ] Test file has `describe('Prefix')` block
  - [ ] Test file has `describe('ULID')` block
  - [ ] Test file has `describe('equals')` block with 5+ tests

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Test file compiles without errors
    Tool: Bash (bun)
    Preconditions: Working directory is point3-common-tool
    Steps:
      1. bun run tsc --noEmit values/__tests__/gulid.spec.ts
    Expected Result: No compilation errors
    Evidence: Exit code 0
  ```

  **Commit**: NO (group with Task 2)

---

- [ ] 2. Update Gulid Implementation (GREEN Phase)

  **What to do**:
  - Change `_value` to `_ulid` for clarity
  - Make `create(prefix)` throw if prefix is empty or undefined
  - Make `create(prefix)` throw if prefix contains `:`
  - Change `parse()` to use strict colon rule (exactly one colon required)
  - Add validation in `parse()` for empty prefix and ULID length
  - Add `Prefix` getter (uppercase)
  - Mark existing `prefix` getter with `@deprecated`
  - Add `ULID` getter
  - Add `equals(other)` method that returns `false` for null/undefined
  - Run all tests - expect PASS

  **Must NOT do**:
  - Do NOT add methods beyond the contract
  - Do NOT create custom error classes
  - Do NOT modify toString() format (keep `{prefix}:{ulid}`)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`
    - No special skills needed - standard TypeScript implementation

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References**:
  - `values/gulid.ts:1-35` - Current implementation
  - `values/guid.ts:1-62` - Reference API pattern (Prefix, UUID, equals)
  - `.sisyphus/drafts/gulid-revision-contract.md` - Complete implementation contract

  **Target Implementation** (from contract):
  ```typescript
  import { ulid } from 'ulid';

  export class Gulid {
      private readonly _prefix: string;
      private readonly _ulid: string;

      private constructor(prefix: string, ulidValue: string) {
          this._prefix = prefix;
          this._ulid = ulidValue;
      }

      static create(prefix: string): Gulid {
          if (!prefix || prefix.length === 0) {
              throw new Error('Prefix is required');
          }
          if (prefix.includes(':')) {
              throw new Error('Prefix must not contain ":"');
          }
          return new Gulid(prefix, ulid());
      }

      static parse(id: string): Gulid {
          const colonCount = (id.match(/:/g) || []).length;
          if (colonCount === 0) {
              throw new Error('Invalid Gulid format: missing ":" separator');
          }
          if (colonCount > 1) {
              throw new Error('Invalid Gulid format: multiple ":" not allowed');
          }
          
          const colonIndex = id.indexOf(':');
          const prefix = id.substring(0, colonIndex);
          const ulidPart = id.substring(colonIndex + 1);
          
          if (!prefix || prefix.length === 0) {
              throw new Error('Invalid Gulid format: empty prefix');
          }
          if (ulidPart.length !== 26) {
              throw new Error(`Invalid Gulid format: ULID must be 26 chars, got ${ulidPart.length}`);
          }
          
          return new Gulid(prefix, ulidPart);
      }

      get Prefix(): string {
          return this._prefix;
      }

      /** @deprecated Use `Prefix` instead. Will be removed in next major version. */
      get prefix(): string {
          return this._prefix;
      }

      get ULID(): string {
          return this._ulid;
      }

      toString(): string {
          return `${this._prefix}:${this._ulid}`;
      }

      equals(other: Gulid | null | undefined): boolean {
          if (other == null) {
              return false;
          }
          return this._prefix === other._prefix && this._ulid === other._ulid;
      }
  }
  ```

  **Acceptance Criteria**:

  **Unit Tests:**
  - [ ] `bun test values/__tests__/gulid.spec.ts` → ALL PASS (0 failures)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: All tests pass after implementation
    Tool: Bash (bun)
    Preconditions: point3-common-tool directory
    Steps:
      1. cd /Users/user/projects/point3-common-tool
      2. bun test values/__tests__/gulid.spec.ts
    Expected Result: All tests pass, exit code 0
    Evidence: Test output shows "X pass, 0 fail"

  Scenario: create() throws on empty prefix
    Tool: Bash (bun)
    Preconditions: Implementation complete
    Steps:
      1. bun test --grep "throws.*empty prefix"
    Expected Result: Test passes
    Evidence: Test output

  Scenario: create() throws on colon in prefix
    Tool: Bash (bun)
    Preconditions: Implementation complete
    Steps:
      1. bun test --grep "throws.*colon"
    Expected Result: Test passes
    Evidence: Test output

  Scenario: parse() throws on multiple colons
    Tool: Bash (bun)
    Preconditions: Implementation complete
    Steps:
      1. bun test --grep "multiple.*colon"
    Expected Result: Test passes
    Evidence: Test output

  Scenario: equals returns false for null
    Tool: Bash (bun)
    Preconditions: Implementation complete
    Steps:
      1. bun test --grep "equals.*null"
    Expected Result: Test passes
    Evidence: Test output
  ```

  **Commit**: YES
  - Message: `feat(gulid): add strict validation, Prefix/ULID getters, equals method`
  - Files: `values/gulid.ts`, `values/__tests__/gulid.spec.ts`
  - Pre-commit: `bun test`

---

- [ ] 3. Version Bump and Publish

  **What to do**:
  - Bump version in `package.json` from `1.0.35` to `1.0.36`
  - Run `bun run build` to compile
  - Run `npm publish` to publish to registry

  **Must NOT do**:
  - Do NOT modify any other package.json fields
  - Do NOT create CHANGELOG.md
  - Do NOT modify any source files

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`
    - Standard npm publishing

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (final task)
  - **Blocks**: None
  - **Blocked By**: Task 2

  **References**:
  - `package.json` - Current version 1.0.35
  - Standard npm publish workflow

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Build succeeds
    Tool: Bash (bun)
    Preconditions: All tests passing
    Steps:
      1. cd /Users/user/projects/point3-common-tool
      2. bun run build
    Expected Result: Build completes without errors
    Evidence: Exit code 0, dist/ folder updated

  Scenario: Publish succeeds
    Tool: Bash (npm)
    Preconditions: Build successful
    Steps:
      1. npm publish
    Expected Result: Package published to registry
    Evidence: npm output shows success, version 1.0.36
  ```

  **Commit**: YES
  - Message: `chore: bump version to 1.0.36`
  - Files: `package.json`
  - Pre-commit: `bun run build`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 2 | `feat(gulid): add strict validation, Prefix/ULID getters, equals method` | `gulid.ts`, `gulid.spec.ts` | `bun test` |
| 3 | `chore: bump version to 1.0.36` | `package.json` | `bun run build` |

---

## Success Criteria

### Verification Commands
```bash
# All tests pass
bun test values/__tests__/gulid.spec.ts
# Expected: All tests pass, 0 failures

# Build succeeds
bun run build
# Expected: Exit code 0

# Package published
npm view point3-common-tool version
# Expected: 1.0.36
```

### Final Checklist
- [ ] `create()` throws on empty prefix ✓
- [ ] `create()` throws on colon in prefix ✓
- [ ] `parse()` throws on multiple colons ✓
- [ ] `Prefix` getter works ✓
- [ ] `prefix` getter marked @deprecated ✓
- [ ] `ULID` getter works ✓
- [ ] `equals()` returns false for null/undefined ✓
- [ ] All tests pass ✓
- [ ] Version 1.0.36 published ✓
