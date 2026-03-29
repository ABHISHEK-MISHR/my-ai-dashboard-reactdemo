# Copilot Instructions — react-first-demo (GeminiKit)

## Project Overview
A single-page AI toolkit dashboard called **GeminiKit** built with **React 19 + Vite 7**. It integrates Google Gemini API to power 5 features: Chat, Voice, Text Analyzer, Code Generator, and Image Analyzer.

## Architecture: Single-File Design
**Everything lives in `src/App.jsx` (827 lines).** This is intentional for simplicity:
- All CSS is written as a JS template string (`styles`) and injected via `<style>{styles}</style>` in the root `App` component — **do not use external `.css` files for feature styling**.
- All view components (`ChatView`, `VoiceView`, `AnalyzerView`, `CodeGenView`, `ImageAnalyzeView`, `DashboardView`) are co-located in the same file.
- Navigation is done via a `view` state string (`"dashboard"`, `"chat"`, `"voice"`, `"analyzer"`, `"codegen"`, `"image"`) — **no React Router**.

## Gemini API Integration
Two API utility functions at the top of `App.jsx` handle all AI calls:
- **`callGemini(messages, systemPrompt)`** — text generation using `gemini-2.5-flash` model. `messages` must be `[{role: "user"|"ai", text: "..."}]`.
- **`callGeminiVision(base64Image, mimeType, prompt)`** — multimodal image analysis.

The API key is set as `const GEMINI_API_KEY = "..."` at line 7 in `App.jsx`. A runtime override via `ApiKeyBanner` component writes to `window.__GEMINI_KEY__` but the fetch functions use `GEMINI_API_KEY` directly — update the constant for persistent changes.

## CSS / Styling Conventions
- All styles use **CSS custom properties** defined in `:root` — use `var(--accent)`, `var(--surface2)`, `var(--muted)`, etc.; never hardcode colors.
- Dark theme variables: `--bg: #050508`, `--surface`, `--surface2`, `--border`, `--accent` (blue), `--accent2` (green), `--accent3` (yellow).
- Two font families: `--font-display: 'Syne'` for UI text, `--font-mono: 'Space Mono'` for code/labels.
- Add new component styles inside the `styles` template string, not in `App.css` or new files.

## Developer Workflows
```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
npm run lint      # ESLint (flat config, eslint.config.js)
```

## State Management Pattern
No external state library. Each view component manages its own local state via `useState`/`useRef`/`useCallback`. The root `App` component holds only navigation state (`view`) and the runtime API key.

## ESLint Notes
`eslint.config.js` configures `no-unused-vars` to **ignore UPPER_CASE variables** (`varsIgnorePattern: '^[A-Z_]'`) — constants like `GEMINI_API_KEY`, `NAV`, `LANGS`, `MODES` won't trigger warnings.

## Adding a New Feature/View
1. Create a new component function in `App.jsx` (e.g., `function NewView() {...}`).
2. Add an entry to the `NAV` array and `VIEW_META` object.
3. Add `{view === "newview" && <NewView />}` in the `App` return.
4. Add any required styles to the `styles` template string.

## Code Comment Style
Comments in this codebase are written in **Hinglish (Hindi + English)** — maintain this convention when adding comments to match the existing code voice.
