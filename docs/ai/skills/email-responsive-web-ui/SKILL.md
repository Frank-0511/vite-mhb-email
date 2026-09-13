---
name: email-responsive-web-ui
description: "Use when changing responsive layout, breakpoints, Grid, Flexbox, or container queries in EmailForge dashboard pages under src/web/**, especially when a header or control bar has less space than the viewport."
---

# Responsive web UI

Use the available space that actually governs the UI. Preserve product mode,
DOM contracts, and accessible controls while changing visual distribution.

Use alongside `email-preview-dashboard` for Preview/Dashboard behavior and
`email-visual-design-system` when tokens, dark/light, or contrast are affected.
This skill does not apply to `src/emails/**` or email-client CSS.

## Choose the responsive mechanism

| Decision                                                           | Mechanism          |
| ------------------------------------------------------------------ | ------------------ |
| Editor/preview mode, navigation, or another application-wide state | `@media`           |
| Header, toolbar, card, or component reacting to its panel width    | named `@container` |
| Known two-dimensional regions                                      | Grid               |
| Linear controls, alignment, or intrinsic wrapping                  | Flexbox            |

Place a named container on a stable ancestor of every element that must react;
an element cannot query itself. Keep `min-width: 0` on flexible tracks where
content may otherwise overflow. Derive container thresholds from the minimum
width of the actual groups, then verify each at `x - 1`, `x`, and `x + 1`.

## Preserve behavior before cleanup

- Inspect the active task, current diff, CSS consumers, JS selectors, and tests.
- Keep IDs, ARIA, keyboard behavior, storage, iframe boundaries, and conditional
  states intact. Do not remove a wrapper or `display: contents` merely to make
  the CSS shorter if it changes ordering or selectors.
- Make a behavior-equivalent responsive migration first. Move DOM, consolidate
  labels, or replace layout structure only in a separately accepted cleanup.
- For shrinking controls, prefer `full label → short label → icon`; the
  accessible name must remain stable.

Example: a Preview header beside a fixed editor uses `@media` for the
single-panel tab mode, but a `preview-panel` container on `#right-panel` for
the header's one-row, two-row, and compact states.

## Verify the visual contract

Run the focused Bun checks required by the affected feature, then distinguish
them from manual visual acceptance. Check dark/light, loading skeleton, ready
state, long error or status text, conditional inputs, keyboard focus, zoom, and
horizontal overflow. Test representative viewports plus every container
threshold boundary. Do not claim visual acceptance from lint, tests, or build
alone. Open the Browser pane only when the user has explicitly requested it.
