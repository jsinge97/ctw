# Production-Real Tranche Implementation Plan

Date: 2026-05-17

This tranche finishes the next set of product-hardening work: production auth, OpenAI-backed document intelligence, deeper MCP coverage, and app polish.

## Source Of Truth

- [x] Re-read `AGENTS.md` and `CLAUDE.md` before implementation.
- [ ] Re-read the relevant source docs before each slice:
  - `docs/feature-plan.md`
  - `docs/crud-model.md`
  - `docs/data-model.md`
  - `docs/architecture.md`
  - `docs/screens.md`
  - `docs/frontend-architecture.md`
  - `docs/design-system.md`
  - `docs/deployment.md`
- [x] Use official OpenAI docs for OpenAI API integration decisions.
- [x] Commit after each completed slice.

## Milestone 1: Production Auth

- [x] Replace the shared dev password path with durable password credentials.
- [x] Store salted password hashes, never plaintext passwords.
- [x] Keep demo login convenience available only outside production.
- [x] Make production runtime safety fail when credential auth is not durable.
- [x] Seed local durable demo users with development credentials.
- [x] Cover login success/failure and production guard behavior with tests.

## Milestone 2: OCR And Document Intelligence

- [ ] Add OpenAI configuration for document intelligence.
- [ ] Use the Responses API with structured outputs for extraction/classification.
- [ ] Keep fake/local behavior deterministic when `CTW_AI_MODE=fake`.
- [ ] Route uploaded document versions into async OCR/classification jobs.
- [ ] Persist extracted text, OCR status, document type, and classification status.
- [ ] Surface failures as reviewable states instead of silent success.

## Milestone 3: MCP Depth

- [ ] Keep MCP HTTP-only.
- [ ] Continue adapting around the OpenAPI contract.
- [ ] Add curated tools for common deal workspace verbs:
  - list/update messages
  - list/update/archive documents
  - list participants
  - list activity
  - list current session/capabilities
- [ ] Mark tools with accurate read-only/idempotency/destructive annotations.
- [ ] Cover new tool mappings in MCP tests.

## Milestone 4: UI Polish And Hardening

- [ ] Audit active screens for dead controls and unfinished actions.
- [ ] Add hover/focus states to every clickable button/menu/action.
- [ ] Add toasts and spinner/progress states for mutations and async work.
- [ ] Make empty/error/loading states clear without adding marketing copy.
- [ ] Browser-test the primary flows:
  - login
  - create deal
  - move deal
  - send message
  - upload/edit/delete document
  - routing review
  - VA work

## Verification

- [x] `pnpm prisma:generate`
- [ ] `pnpm openapi:generate`
- [ ] `pnpm client:generate`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] Targeted browser smoke test on `http://127.0.0.1:5173/deals`
