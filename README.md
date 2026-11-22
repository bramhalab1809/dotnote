# Iconic Letter Writer (Modular Edition)

A fast, distraction-free, icon-first letter & dual-pane note writer built for Android, tablets, laptops, and desktop PCs.

## Folder Structure
- `index.html` — Main HTML layout (works directly by opening in any browser)
- `assets/logo/` — Place your AI-generated `logo.png` here (`LOGO_PROMPT.txt` included)
- `css/base.css` — Responsive viewport (`100dvh`), scrollbars, resizer handle
- `css/animations.css` — Floating-in-air cards, detached air shadows, tilted date stamp
- `js/config/tailwind-config.js` — Tailwind dark mode & Inter font configuration
- `js/data/words-part1..3.js` — Split English dictionary + O(1) 2-letter prefix index
- `js/db/indexeddb.js` — Dedicated IndexedDB engine (`IconicLetterDB`) with `updatedAt` index + safe fallback
- `js/core/state.js` — Centralized app state, DOM references, safe storage & scoped icon refresher
- `js/core/toast.js` — Lucide-safe icon toast & Android-safe `.txt` download helper
- `js/ui/home-grid.js` — Compact top floating draft cards (3-dot placeholder, zero center overlap)
- `js/ui/sidebar-settings.js` — Sidebar saved list, Settings modal, theme & typography controls
- `js/ui/editor-nav.js` — Home navigation, Single/Split toggle, letter CRUD & auto-save
- `js/ui/pane-tools.js` — Clipboard (paste/copy), clear/download pane & touch resizer
- `js/ui/caret-position.js` — Reused caret mirror & non-overlapping suggestion bar positioning
- `js/ui/suggestions.js` — Zero-lag 3-visible scrollable suggestion bar with Tab / Shift+Tab / Enter
- `js/effects/bg-dots.js` — HiDPI interactive dot grid (auto-pauses while editing to eliminate lag)
- `js/main.js` — App initialization & event binding

## Key Performance & Bug Fixes
1. **Home Icon**: Replaced the back arrow in the editor with a clean Home icon.
2. **IndexedDB Engine**: Proper `updatedAt` index, transaction guards, and automatic fallback.
3. **Zero Lag**: Paused background canvas loop in Editor View & hidden tabs, replaced per-keystroke dictionary scans with O(1) prefix buckets, reused a single caret mirror DOM node, and scoped Lucide icon rendering to updated containers.
4. **Cross-Device Ready**: Full `100dvh` mobile height, non-passive touch split-resizer, non-overlapping header, and Android-safe downloads.
