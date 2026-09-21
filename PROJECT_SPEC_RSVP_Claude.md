# RSVP Reader --- Complete Technical Specification

**Version:** 1.0\
**Status:** Source of truth for implementation\
**Target:** Claude / coding agent\
**Platform:** Desktop + Mobile, one codebase\
**Architecture:** Responsive Web App + PWA\
**Backend:** None for MVP

------------------------------------------------------------------------

## 1. Product Goal

Build a polished RSVP (Rapid Serial Visual Presentation) speed-reading
application.

The user imports a document, primarily a PDF. The application extracts
the text, cleans and structures it, tokenizes it, and displays one
word/token at a time in a focused reading interface.

The application must support:

-   PDF import
-   text extraction
-   text normalization and cleanup
-   sentence and paragraph detection
-   tokenization
-   RSVP playback
-   adjustable WPM
-   intelligent timing
-   pause/resume
-   previous/next token
-   restart
-   progress tracking
-   reader settings
-   local persistence
-   responsive desktop/mobile UI
-   PWA installation

The MVP should be reliable, maintainable, and intentionally simple.

Do not build a backend unless a later requirement explicitly requires
one.

------------------------------------------------------------------------

# 2. Core Product Principles

1.  The reader is the primary experience.
2.  The current word must receive visual focus.
3.  The interface should minimize distraction.
4.  PDF processing should be robust enough for normal text-based PDFs.
5.  RSVP timing must be deterministic and testable.
6.  Desktop and mobile must use the same codebase.
7.  Mobile compatibility must be considered from the beginning.
8.  Local processing and local persistence are preferred.
9.  Avoid unnecessary dependencies.
10. Do not implement future features prematurely.

------------------------------------------------------------------------

# 3. Platform Strategy

## 3.1 Desktop

The application must work in modern desktop browsers.

Target behavior:

-   mouse interaction
-   keyboard shortcuts
-   responsive desktop layout
-   fullscreen reader
-   large-screen layout

## 3.2 Mobile

The same application must work on mobile browsers.

Target behavior:

-   portrait orientation
-   landscape orientation where practical
-   touch-friendly controls
-   sufficiently large touch targets
-   no critical hover-only interaction
-   readable RSVP display on small screens
-   mobile PDF import
-   mobile-safe layout and scrolling

## 3.3 PWA

PWA support is part of the final implementation.

Use:

-   `vite-plugin-pwa`

The PWA layer should be added after the core application is stable.

Do not create a separate Android or iOS codebase.

------------------------------------------------------------------------

# 4. Technology Stack

  Concern           Library / Technology                Version
  ----------------- ----------------------------------- ----------------------------
  Build             Vite                                5.x
  UI                React + React DOM                   18.x
  Language          TypeScript                          5.x
  TypeScript        strict + noUncheckedIndexedAccess   enabled
  Styling           Tailwind CSS                        3.x
  CSS tooling       PostCSS + Autoprefixer              3.x
  Routing           react-router-dom                    6.x
  PDF               pdfjs-dist                          4.x
  Local storage     Dexie / IndexedDB                   4.x
  Unit tests        Vitest                              current compatible version
  DOM tests         jsdom                               current compatible version
  React tests       @testing-library/react              current compatible version
  Assertions        @testing-library/jest-dom           current compatible version
  IndexedDB tests   fake-indexeddb                      current compatible version
  E2E               @playwright/test                    1.x
  PWA               vite-plugin-pwa                     current compatible version
  Script runner     tsx                                 current compatible version

## Explicitly not required

Do not add these unless a serious technical reason appears:

-   Redux
-   Zustand
-   MobX
-   another state-management framework
-   backend
-   cloud database
-   authentication
-   pdf-lib
-   dexie-react-hooks
-   custom Web Workers
-   a separate mobile application
-   Electron
-   React Native
-   Flutter

`Dexie.liveQuery` should be used with React's `useSyncExternalStore`
where reactive IndexedDB access is required.

`pdfjs-dist` uses its own worker.

Other work should remain on the main thread with cooperative yielding
where necessary.

------------------------------------------------------------------------

# 5. Architecture

The conceptual pipeline is:

``` text
Document Import
      ↓
PDF Loader
      ↓
PDF Text Extraction
      ↓
Text Normalization
      ↓
Structure Detection
      ↓
Tokenization
      ↓
RSVP Engine
      ↓
Reader State
      ↓
React UI
```

The application should have clear boundaries between:

-   document processing
-   text processing
-   RSVP domain logic
-   persistence
-   application state
-   UI
-   constants/configuration

Pure logic should not depend on React where unnecessary.

------------------------------------------------------------------------

# 6. Recommended Project Structure

Use a structure similar to:

``` text
src/
  app/
    App.tsx
    routes.tsx

  components/
    common/
    reader/
    documents/
    settings/

  pages/
    HomePage.tsx
    ReaderPage.tsx
    SettingsPage.tsx

  domain/
    documents/
    text/
    rsvp/
    reader/

  services/
    pdf/
    storage/

  hooks/
    reader/
    documents/

  state/
    reader/
    settings/

  constants/
    timing.ts
    reader.ts
    storage.ts

  types/
    index.ts

  utils/
    errors/
    formatting/

  styles/
    index.css

  tests/
    fixtures/
    helpers/

  main.tsx
```

The exact structure may be adjusted if the implementation reveals a
concrete technical reason, but unnecessary restructuring should be
avoided.

------------------------------------------------------------------------

# 7. Core Domain Models

Use explicit TypeScript types.

Conceptual models include:

## Document

``` ts
interface DocumentRecord {
  id: string;
  name: string;
  type: 'pdf';
  pageCount: number;
  tokenCount: number;
  createdAt: number;
  updatedAt: number;
}
```

## Text structure

``` ts
interface TextDocument {
  paragraphs: Paragraph[];
}

interface Paragraph {
  id: string;
  sentences: Sentence[];
}

interface Sentence {
  id: string;
  tokens: Token[];
}
```

## Token

``` ts
interface Token {
  id: string;
  text: string;
  index: number;
  sentenceIndex: number;
  paragraphIndex: number;
  punctuation: PunctuationType;
}
```

The exact types may be refined during implementation.

## Reader state

Reader state should distinguish:

-   current token index
-   playback state
-   WPM
-   current document
-   progress
-   settings relevant to playback

Do not persist transient state unless explicitly useful.

------------------------------------------------------------------------

# 8. Document Processing

## 8.1 Supported MVP format

Primary MVP format:

-   PDF

Future formats may include:

-   TXT
-   EPUB
-   DOCX

Do not implement future formats during the MVP.

------------------------------------------------------------------------

# 9. PDF Processing

Use `pdfjs-dist`.

Pipeline:

``` text
File
 ↓
PDF loading
 ↓
Page iteration
 ↓
Text item extraction
 ↓
Text reconstruction
 ↓
Normalization
 ↓
Structure detection
```

## 9.1 Normal PDFs

Support ordinary text-based PDFs.

Extract text from every page.

Preserve enough information to reconstruct:

-   paragraphs
-   sentence boundaries
-   page boundaries where useful

## 9.2 Common PDF artifacts

The cleaning layer should handle common artifacts such as:

-   excessive whitespace
-   unnecessary line breaks
-   repeated headers
-   repeated footers where detectable
-   page numbers where confidently detectable
-   line-break fragmentation
-   hyphenation
-   empty lines
-   extraction noise

Do not aggressively delete text when the system cannot confidently
identify it as an artifact.

## 9.3 Multi-column documents

The MVP should make a reasonable attempt to preserve reading order.

Do not create a complex academic-layout reconstruction engine.

If a PDF cannot be reliably reconstructed, show a useful extraction
warning rather than silently producing badly ordered text.

## 9.4 Scanned PDFs

OCR is not required for the MVP.

If a PDF contains no extractable text:

-   detect this condition;
-   explain that the document appears to contain no machine-readable
    text;
-   do not pretend extraction succeeded.

OCR can be a future feature.

------------------------------------------------------------------------

# 10. Text Normalization

The normalization pipeline should be deterministic.

Responsibilities:

-   normalize whitespace
-   normalize line breaks
-   preserve meaningful paragraph boundaries
-   remove obvious extraction artifacts
-   repair safe hyphenation
-   preserve punctuation
-   preserve word order
-   avoid accidental text loss

Normalization must be unit tested heavily.

------------------------------------------------------------------------

# 11. Sentence Detection

Detect sentence boundaries using practical rules.

Support common sentence-ending punctuation:

-   `.`
-   `!`
-   `?`

Also account for:

-   quotation marks
-   closing brackets
-   abbreviations where practical

Do not attempt perfect natural-language parsing in the MVP.

The goal is useful timing and navigation, not linguistic research.

------------------------------------------------------------------------

# 12. Tokenization

Tokenization should:

-   produce deterministic tokens;
-   preserve punctuation information;
-   preserve sentence boundaries;
-   preserve paragraph boundaries;
-   handle common contractions;
-   handle numbers;
-   handle long words;
-   avoid empty tokens.

Tokenization must be independent of the React UI.

------------------------------------------------------------------------

# 13. RSVP Engine

The RSVP engine is the core domain component.

It should not be implemented as a React component.

It should expose predictable operations such as:

``` text
start()
pause()
resume()
next()
previous()
restart()
setWpm()
getCurrentToken()
getProgress()
```

The exact API should be determined during implementation based on the
final state model.

------------------------------------------------------------------------

# 14. WPM

Base timing should be derived from WPM.

Conceptually:

``` text
baseDuration = 60000 / WPM
```

This is only the base duration.

Do not use identical timing for every token.

Timing adjustments must be deterministic.

------------------------------------------------------------------------

# 15. Timing Rules

Timing should account for:

-   normal words
-   punctuation
-   sentence endings
-   paragraph boundaries
-   optionally long/complex tokens if justified

Suggested conceptual categories:

``` text
normal token
short pause
sentence pause
paragraph pause
```

All thresholds and multipliers must be stored as named constants.

Never scatter magic numbers throughout the code.

------------------------------------------------------------------------

# 16. Timer Accuracy

Avoid naive repeated timers that accumulate drift.

The implementation should account for:

-   scheduling delay
-   browser throttling
-   WPM changes
-   pause/resume
-   tab visibility changes where relevant

The exact implementation may use:

-   `setTimeout`
-   timestamp-based scheduling
-   re-anchoring

Choose the simplest reliable approach.

A fake clock should be used for deterministic timing tests.

------------------------------------------------------------------------

# 17. Reader Controls

Minimum controls:

-   Play
-   Pause
-   Restart
-   Previous token
-   Next token
-   WPM decrease
-   WPM increase
-   direct WPM adjustment if included by design
-   progress indication

Optional controls may include:

-   fullscreen
-   document navigation
-   settings

Do not add unnecessary controls to the primary reader.

------------------------------------------------------------------------

# 18. ORP

ORP (Optimal Recognition Point) may be used to visually emphasize the
recognition point of the displayed word.

If implemented:

-   keep it simple;
-   make it visually subtle;
-   calculate deterministically;
-   test the calculation;
-   avoid excessive visual complexity.

ORP should not be required if it materially complicates the MVP.

------------------------------------------------------------------------

# 19. Reader UI

The reader should prioritize the current token.

Conceptual layout:

``` text
┌──────────────────────────────────────┐
│ Document title             Progress │
│                                      │
│                                      │
│               current                │
│                WORD                  │
│                                      │
│                                      │
│     Previous    Play/Pause    Next   │
│                                      │
│              300 WPM                 │
└──────────────────────────────────────┘
```

The actual visual design should remain clean and focused.

Do not turn the reader into a dashboard.

------------------------------------------------------------------------

# 20. Responsive Design

## Desktop

Use available screen space efficiently.

Support:

-   large reader area
-   keyboard shortcuts
-   mouse controls
-   optional fullscreen

## Mobile

Support:

-   portrait orientation
-   touch controls
-   compact header
-   large readable RSVP word
-   controls reachable with one hand where practical
-   no tiny buttons
-   no hover-dependent functionality

The core RSVP area should adapt to viewport size.

------------------------------------------------------------------------

# 21. Accessibility

Include:

-   semantic buttons
-   visible focus states
-   keyboard navigation
-   accessible labels
-   adequate touch targets
-   sufficient contrast
-   reduced-motion support where applicable
-   no essential information conveyed only by color

The RSVP reader should remain usable with keyboard controls on desktop.

------------------------------------------------------------------------

# 22. Keyboard Shortcuts

Recommended shortcuts:

-   Space: play/pause
-   Left Arrow: previous token
-   Right Arrow: next token
-   R: restart

Shortcuts must not interfere with normal text input fields.

Document the shortcuts in the UI or help section if included.

------------------------------------------------------------------------

# 23. Local Persistence

Use Dexie with IndexedDB.

Persist only data that benefits the user.

Possible persistent data:

-   imported document metadata
-   processed document content if size permits
-   reading progress
-   reader settings
-   theme
-   WPM preference

Do not blindly store every transient state update.

Progress saving should be throttled/debounced where necessary.

------------------------------------------------------------------------

# 24. Storage Architecture

Define a small Dexie database.

Conceptually:

``` text
documents
progress
settings
```

The schema should be versioned.

Handle:

-   database initialization failures;
-   missing records;
-   corrupted records;
-   schema upgrades.

Storage logic must remain separate from UI components.

------------------------------------------------------------------------

# 25. Performance

Important performance goals:

-   fast initial load;
-   responsive UI;
-   no unnecessary React re-rendering;
-   efficient RSVP updates;
-   acceptable performance with long PDFs;
-   reasonable memory use;
-   mobile compatibility.

Do not render the entire token list as React elements.

The RSVP display should render only the information currently needed.

For large processing operations, use cooperative yielding where useful.

Do not introduce custom Web Workers unless profiling demonstrates that
they are necessary.

------------------------------------------------------------------------

# 26. Error Handling

User-facing errors should exist for:

-   invalid file
-   unsupported file
-   corrupted PDF
-   PDF with no extractable text
-   extraction failure
-   storage failure
-   unexpected application error

Messages should explain:

1.  what happened;
2.  whether the document is usable;
3.  what the user can do next.

Avoid exposing raw stack traces to users.

------------------------------------------------------------------------

# 27. Security and Privacy

The MVP should process documents locally whenever possible.

Do not introduce:

-   analytics
-   user accounts
-   cloud document uploads
-   unnecessary telemetry

User documents should not leave the device unless a future feature
explicitly requires it.

Treat imported PDFs as untrusted input.

Do not assume extracted text is safe or well-formed.

------------------------------------------------------------------------

# 28. Testing Strategy

## Unit tests

Test:

-   whitespace normalization
-   paragraph detection
-   sentence detection
-   hyphenation handling
-   tokenization
-   punctuation classification
-   WPM calculation
-   timing calculation
-   ORP calculation if implemented
-   reader state transitions
-   progress calculation

## Integration tests

Test:

-   PDF import
-   PDF extraction
-   normalization pipeline
-   storage
-   document loading
-   reader initialization

## Component tests

Test:

-   reader controls
-   play/pause
-   navigation
-   WPM controls
-   settings
-   error states
-   loading states

## E2E

Use Playwright with Chromium.

Critical flow:

``` text
Open application
 ↓
Import PDF
 ↓
Process document
 ↓
Open reader
 ↓
Start playback
 ↓
Pause
 ↓
Change WPM
 ↓
Navigate
 ↓
Restart
```

Also test mobile-sized viewports.

------------------------------------------------------------------------

# 29. Testing Principles

Tests should focus on behavior, not implementation details.

Avoid tests that break merely because component structure changes.

Pure timing and text-processing logic should have strong unit-test
coverage.

------------------------------------------------------------------------

# 30. PWA

Add PWA support in a later phase using:

`vite-plugin-pwa`

Requirements:

-   installable on supported devices;
-   app manifest;
-   appropriate icons;
-   standalone display;
-   sensible theme/background configuration;
-   service worker configuration appropriate for the app.

Do not make offline caching more complicated than necessary.

The core app should continue working as a normal web app.

------------------------------------------------------------------------

# 31. UI States

Every important screen should have:

-   loading state
-   empty state
-   normal state
-   error state

Examples:

### Home

Empty: - no documents yet - clear import action

Loading: - processing document

Error: - document could not be processed

### Reader

Loading: - preparing content

Normal: - RSVP playback

Paused: - clear paused state

Completed: - clear completion state

------------------------------------------------------------------------

# 32. Application Routes

A simple route structure is sufficient.

Suggested:

``` text
/
  Home

/reader/:documentId
  Reader

/settings
  Settings
```

Do not create unnecessary routes.

------------------------------------------------------------------------

# 33. MVP Scope

## Include

-   PDF import
-   PDF extraction
-   text cleanup
-   sentence/paragraph detection
-   tokenization
-   RSVP engine
-   WPM
-   intelligent timing
-   playback controls
-   progress
-   responsive UI
-   local persistence
-   basic settings
-   tests

## Exclude from MVP

-   OCR
-   cloud synchronization
-   accounts
-   social features
-   AI summarization
-   AI-generated reading recommendations
-   collaboration
-   payments
-   complex analytics
-   native mobile applications
-   multiple document formats unless implementation becomes trivial

------------------------------------------------------------------------

# 34. Future Features

Possible future versions:

-   OCR
-   EPUB
-   TXT
-   DOCX
-   cloud sync
-   reading statistics
-   bookmarks
-   highlights
-   vocabulary assistance
-   AI summaries
-   AI difficulty estimation
-   advanced reading analytics
-   custom timing profiles
-   multiple themes
-   reading goals

These must not affect MVP architecture unnecessarily.

------------------------------------------------------------------------

# 35. 20-Phase Implementation Plan

## Phase 1 --- Project Foundation

Implement:

-   Vite
-   React
-   TypeScript
-   strict configuration
-   Tailwind
-   testing environment
-   base folder structure
-   minimal app shell

Acceptance:

-   app runs;
-   TypeScript passes;
-   tests run;
-   production build succeeds.

Do not implement PDF or RSVP functionality.

------------------------------------------------------------------------

## Phase 2 --- Core Domain Models

Implement:

-   document types
-   text structures
-   token types
-   reader state types
-   settings types
-   shared constants foundation

Add unit tests.

Do not build final UI.

------------------------------------------------------------------------

## Phase 3 --- PDF Loading and Extraction

Implement:

-   file selection
-   PDF loading
-   pdfjs-dist integration
-   page iteration
-   text extraction
-   extraction errors

Add tests.

Do not implement OCR.

------------------------------------------------------------------------

## Phase 4 --- Text Processing

Implement:

-   normalization
-   whitespace handling
-   paragraph detection
-   sentence detection
-   safe hyphenation handling
-   tokenization
-   punctuation classification

Add extensive unit tests.

------------------------------------------------------------------------

## Phase 5 --- RSVP Engine

Implement:

-   base WPM timing
-   punctuation timing
-   sentence pauses
-   paragraph pauses
-   reader state transitions
-   play/pause
-   next/previous
-   restart
-   progress
-   timing tests
-   fake clock

Keep the engine independent of React.

------------------------------------------------------------------------

## Phase 6 --- Basic Reader UI

Implement:

-   reader page
-   current token display
-   play/pause
-   previous/next
-   restart
-   WPM display/control
-   progress

Connect UI to the RSVP engine.

------------------------------------------------------------------------

## Phase 7 --- Reader Navigation and State

Implement:

-   route `/reader/:documentId`
-   document loading
-   reader initialization
-   completion state
-   keyboard shortcuts
-   safe state transitions

------------------------------------------------------------------------

## Phase 8 --- Settings

Implement:

-   WPM preference
-   theme preference
-   reader preferences specified by the design
-   settings persistence

Do not add unnecessary configuration.

------------------------------------------------------------------------

## Phase 9 --- IndexedDB Persistence

Implement:

-   Dexie database
-   document metadata
-   stored content strategy
-   reading progress
-   settings
-   schema versioning
-   error handling

------------------------------------------------------------------------

## Phase 10 --- Document Library

Implement:

-   home/document list
-   imported document records
-   open document
-   delete document if specified
-   empty state
-   loading state
-   error state

------------------------------------------------------------------------

## Phase 11 --- Responsive Mobile UI

Audit and implement:

-   mobile layout
-   portrait mode
-   touch controls
-   responsive typography
-   touch targets
-   mobile navigation
-   mobile PDF import

Do not create a separate mobile application.

------------------------------------------------------------------------

## Phase 12 --- Desktop UX and Keyboard Interaction

Implement/refine:

-   desktop layout
-   keyboard shortcuts
-   fullscreen
-   mouse interaction
-   responsive behavior

------------------------------------------------------------------------

## Phase 13 --- Advanced RSVP Timing

Refine:

-   punctuation timing
-   sentence timing
-   paragraph timing
-   long-token behavior if justified
-   WPM changes during playback
-   timer drift correction
-   visibility/pause behavior where necessary

All changes must be covered by tests.

------------------------------------------------------------------------

## Phase 14 --- Performance

Profile and optimize:

-   PDF processing
-   text processing
-   memory
-   React rendering
-   RSVP updates
-   IndexedDB access
-   mobile performance

Do not optimize without evidence where possible.

------------------------------------------------------------------------

## Phase 15 --- Error Handling and Resilience

Implement robust handling for:

-   bad PDFs
-   empty PDFs
-   unsupported content
-   storage failures
-   unexpected errors
-   malformed extracted text

Improve user-facing messages.

------------------------------------------------------------------------

## Phase 16 --- Accessibility

Audit:

-   keyboard navigation
-   focus
-   labels
-   semantic HTML
-   contrast
-   touch targets
-   reduced motion

Fix identified problems.

------------------------------------------------------------------------

## Phase 17 --- PWA

Implement:

-   vite-plugin-pwa
-   manifest
-   icons
-   standalone mode
-   service worker
-   installability

Test desktop and mobile installation behavior where possible.

------------------------------------------------------------------------

## Phase 18 --- End-to-End Testing

Implement Playwright coverage for:

-   import
-   processing
-   reading
-   pause/resume
-   WPM
-   navigation
-   persistence
-   responsive layouts

------------------------------------------------------------------------

## Phase 19 --- Production Polish

Audit:

-   visual consistency
-   loading states
-   error states
-   empty states
-   typography
-   responsiveness
-   accessibility
-   performance
-   build output

Remove unnecessary code and dependencies.

------------------------------------------------------------------------

## Phase 20 --- Final Production Audit

Verify:

-   all MVP requirements;
-   all acceptance criteria;
-   all tests;
-   TypeScript;
-   production build;
-   PWA;
-   mobile;
-   desktop;
-   PDF handling;
-   RSVP timing;
-   persistence;
-   error handling.

Produce a final implementation report.

Do not add new features during this phase.

------------------------------------------------------------------------

# 36. Acceptance Criteria

The MVP is considered successful when:

1.  A user can import a normal text-based PDF.
2.  The application extracts readable text.
3.  The text is normalized and tokenized.
4.  The user can start RSVP playback.
5.  One token is shown at a time.
6.  WPM can be changed.
7.  Punctuation affects timing.
8.  Sentence and paragraph boundaries affect timing.
9.  Pause/resume works.
10. Previous/next works.
11. Restart works.
12. Progress is visible.
13. Reading state can be persisted where specified.
14. The application works on desktop.
15. The application works on mobile.
16. The UI is responsive.
17. The app can eventually be installed as a PWA.
18. Core logic is covered by tests.
19. Production build succeeds.
20. No unnecessary backend is required.

------------------------------------------------------------------------

# 37. Coding Agent Rules

The coding agent must:

1.  Read this specification before implementation.
2.  Treat it as the source of truth.
3.  Implement one phase at a time.
4.  Inspect existing code before editing.
5.  Avoid rewriting working code unnecessarily.
6.  Avoid speculative features.
7.  Avoid unnecessary dependencies.
8.  Keep pure logic testable.
9.  Keep domain logic separate from UI.
10. Keep mobile and desktop in one codebase.
11. Use named constants for timing thresholds.
12. Run tests after meaningful changes.
13. Run TypeScript checks.
14. Run production builds at appropriate checkpoints.
15. Report deviations.
16. Document serious architectural changes.
17. Never silently change core architecture.
18. Never implement future phases prematurely.

------------------------------------------------------------------------

# 38. Definition of Done for Each Phase

A phase is complete only when:

-   its specified functionality is implemented;
-   relevant tests exist;
-   tests pass;
-   TypeScript passes;
-   the application still builds;
-   no unrelated features were added;
-   no known serious regression remains;
-   the coding agent reports what changed.

------------------------------------------------------------------------

# 39. Critical Architecture Constraints

Do not:

-   create a backend for the MVP;
-   create a separate mobile app;
-   introduce a global state library without necessity;
-   introduce custom workers without evidence;
-   build OCR during MVP;
-   build cloud sync during MVP;
-   turn the application into a dashboard;
-   render huge token lists unnecessarily;
-   put all logic inside React components;
-   scatter timing constants throughout the code;
-   hide architectural changes from the project owner.

------------------------------------------------------------------------

# 40. Final Technical Summary

## Stack

``` text
Vite
React
React DOM
TypeScript
Tailwind CSS
React Router
pdfjs-dist
Dexie
Vitest
Testing Library
fake-indexeddb
Playwright
vite-plugin-pwa
tsx
```

## Architecture

``` text
                RSVP Reader
                     │
              React + TypeScript
                     │
       ┌─────────────┼─────────────┐
       │             │             │
   Document       RSVP Domain   Persistence
   Processing        Logic       / IndexedDB
       │             │             │
       └─────────────┼─────────────┘
                     │
                Responsive UI
                     │
             ┌───────┴───────┐
             │               │
          Desktop          Mobile
             │               │
             └───────┬───────┘
                     │
                    PWA
```

## Primary pipeline

``` text
PDF
 ↓
PDF.js
 ↓
Text extraction
 ↓
Normalization
 ↓
Structure detection
 ↓
Tokenization
 ↓
RSVP timing engine
 ↓
Reader state
 ↓
Responsive reader UI
```

## Product philosophy

Simple.

Fast.

Focused.

Local-first.

Mobile-compatible.

Testable.

No unnecessary complexity.
