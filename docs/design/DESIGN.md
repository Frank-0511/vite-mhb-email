---
version: alpha
name: EmailForge Space Blue
description: Design system for the local EmailForge web application.
colors:
  canvas: "#07111F"
  surface: "#0C1B2D"
  surface-raised: "#122842"
  surface-hover: "#183656"
  text: "#F2F7FF"
  text-muted: "#A8B8CC"
  border: "#27425F"
  accent: "#4FA3FF"
  accent-strong: "#2587F5"
  focus: "#7DC0FF"
  success: "#45D39A"
  warning: "#F5BE4F"
  danger: "#FF717D"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: 2rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: 1.25rem
    fontWeight: 650
    lineHeight: 1.3
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: 0.75rem
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.04em"
rounded:
  sm: 6px
  md: 10px
  lg: 14px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  action-primary:
    backgroundColor: "{colors.accent-strong}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: 8px 12px
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
  status-success:
    textColor: "{colors.success}"
  status-warning:
    textColor: "{colors.warning}"
  status-danger:
    textColor: "{colors.danger}"
---

# EmailForge Space Blue

## Overview

EmailForge is a local working environment for developers and designers who
create HTML emails. Its interface is dark-first, focused and technical: it
should feel calm under dense information, not decorative or generic. A light
mode is a complete alternative for people who need it; it preserves the same
hierarchy, semantic roles and interaction patterns.

The application interface is the only consumer of this document. Email HTML,
Maizzle, Handlebars and ESP variables remain outside this design system.

## Colors

The dark theme uses Space Blue: a deep blue canvas, layered blue surfaces and a
contained clear-blue accent. The accent indicates primary actions, selection,
links and keyboard focus. It must not be used as a large decorative field.

Status colors convey validation state only. Success, warning and danger must
always be accompanied by text, an icon or another non-color cue. Light mode
must map every semantic role to a high-contrast light equivalent rather than
inverting individual colors ad hoc.

The light palette uses a muted blue-gray canvas (`#E4EDF6`) with near-white
surfaces (`#F8FBFE` and `#EEF4F9`), avoiding pure white glare while preserving
the existing text, accent, focus and status contrast.

## Typography

Use the system sans stack for reading and interface controls; it avoids a
network-font dependency in a local tool. Use the mono stack only for technical
labels, code, variable names and compact metadata. Headings establish task
hierarchy, while body text remains readable at the default browser size.

## Layout

Desktop layouts use a max-width content frame with a consistent 8px-derived
spacing rhythm. Related controls share panels; preview content receives visual
space without competing with navigation or validation feedback.

On narrow screens, panels stack and labels may shorten only when their accessible
name remains clear. No operation is hidden solely because the viewport is small.
Interactive controls retain a minimum comfortable target and a visible reading
order.

## Elevation & Depth

Separate layers primarily through surface tone and borders. Shadows are subtle
and reserved for hover, floating dialogs and transient overlays. Do not use
blur-heavy, glass or oversized shadows that reduce the clarity of a working
tool.

## Shapes

Panels and inputs use the small, consistent radius scale. Avoid excessive pills:
reserve fully rounded shapes for compact tags or unmistakably small controls.

## Components

Shared patterns include app header, navigation links, primary and secondary
actions, panels, template cards, validation messages, dialogs, form controls
and focus states. Each pattern uses semantic tokens rather than a hard-coded
framework color name.

Template cards give the email preview the dominant area, then expose template
name and useful metadata. The application frame must not alter the HTML inside
an email preview iframe.

## Do's and Don'ts

- Do provide a visible `:focus-visible` treatment using the focus token.
- Do target WCAG AA contrast for text and actionable controls in both themes.
- Do preserve keyboard operation, semantic HTML and existing ARIA contracts.
- Do use explicit copy alongside status color and icons.
- Do keep Home, Preview and Library feature-local; share only genuine primitives.
- Do not change Maizzle, Handlebars, ESP delimiters or the email Tailwind setup.
- Do not copy another product's visual identity, proprietary fonts or branding.
- Do not introduce color-only state, decorative gradients or dark-mode-only UI.
