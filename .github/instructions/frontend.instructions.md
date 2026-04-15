---
description: "Use when generating or refactoring React frontend code in frontend/src. Enforces page-first structure, service-layer API access, and responsive UI defaults."
name: "Frontend UI Defaults"
applyTo: "frontend/src/**"
---
# Frontend UI Defaults

- Keep a page-first structure under `src/pages` (Dashboard, Transactions, Wallets, Categories, Reports, Settings).
- Keep reusable UI in `src/components` and avoid page-specific logic leaking into shared components.
- Use `src/layouts` for shell-level concerns (navigation, headers, auth layout), not business logic.

## Service Layer Rules

- Access backend APIs only through `src/services`.
- Keep network calls out of page and presentational components.
- Keep service files focused by domain (auth, transaction, report, wallet, category).
- Normalize API errors in the service layer so UI can handle a consistent shape.

## State And Data Flow

- Keep page components responsible for orchestration (load data, pass props, trigger actions).
- Keep shared state in `src/store` (auth, transaction, ui) and avoid duplicating global state in local component state.
- Keep utility transforms in `src/utils` instead of inline data-munging in JSX.

## Responsive UI Defaults

- Build mobile-first layouts, then scale for tablet and desktop.
- Support common breakpoints consistently across pages.
- Avoid fixed heights/widths that break on small screens.
- Ensure tables, charts, and filter bars degrade gracefully on mobile (stack, collapse, or horizontal scroll).
- Keep touch targets and spacing usable on mobile.

## UX Consistency

- Keep loading, empty, and error states explicit on all data-driven pages.
- Keep form validation feedback near fields and use consistent message style.
- Preserve dark-mode compatibility for new components and pages.

## Boundaries

- Do not call database or AI service directly from frontend; always go through backend REST APIs.
- Do not couple frontend modules to backend internal implementation details.
