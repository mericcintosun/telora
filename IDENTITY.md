# IDENTITY (contract; every later phase obeys this file)

DIRECTION: D19 aurora
GROUND: #fff4ec peach-mist
SURFACE: #ffe9dc
DEEP: #ffd9c7
LINE: #f0c9b8
INK: #24122e
ACCENT: #c81f73 magenta
ON_ACCENT: #fff4ec
SECOND: #ff9a62 peach
OK: #2e7d4f
WARN: #a8641c
BAD: #b3382c
FONT_DISPLAY: F19 Red Hat Display (next/font/google: Red_Hat_Display)
FONT_BODY: Red Hat Text (next/font/google: Red_Hat_Text)
FONT_MONO: none
STRUCTURE: S1 single-surface
ARCHETYPE: L2 product-first
MOTION: M5 fade, prefix telora-
KIT: K4 spring
RADIUS: round
HEADER: solid ground, border-b in LINE, sticky
LOGO_POLICY: brand-mark

## Why

The farm assigned this identity so that no two projects share a look, a route map or an interaction style. The most recent projects it differs from: Acodemic X KeebsforWater Global SDG Hackathon (D8, S6, L3, K3); Peninsula Innovation Hackathon (D6, S5, L4, K1); Aevum Builder Challenge #1 (D7, S2, L7, K7). It is not a suggestion. Tie the product's own nouns to it; do not swap any row for a familiar one.

## Direction: D19 aurora

Warm mesh gradient of peach, magenta and violet behind clean white panels.

Surface treatment: A mesh-gradient hero built from two or three large radial-gradients at low opacity over the ground, white panels with soft shadows above it, gradient text allowed on exactly one headline word, round corners.

Every hex in app/globals.css comes from the key block above. RADIUS round means 0.75rem and above on every card, panel and control. ON_ACCENT is the text color on an ACCENT fill. The semantic colors (OK, WARN, BAD) mark state only, never brand.

## Structure: S1 single-surface

The product IS the home route. There is no marketing landing page.

Route map (name the bracketed parts with the product's own words):
- `/` : the working tool, seeded and usable in the first viewport, with the claim in a slim band
- `/about` : why it exists, how it works, the sponsor tech (reached from the header)
- shareable state lives in the URL (search params such as `?view=` or `?id=`), so a result has a link

Rules:
- the first viewport is the tool, not copy about the tool
- onboarding is inline (hints, an example already loaded), never a separate page
- the header holds the mark, one link and one action; no multi-link nav

## Archetype: L2 product-first (the composition of the home route)

The real product surface (the actual component tree, seeded, not a mock) fills the top 50 to 60vh under the nav; the claim and ONE CTA sit in a slim band above it or as an overlay band on it; copy sections follow.

MUSTs: the component is live JSX fed by the real seed; the claim band is at most 2 lines; the product is interactive.
Bans: browser-chrome dots; any screenshot pretending to be the product.

## Motion: M5 fade (the entrance signature)

opacity only, linear, 280ms, no transform. One keyframe block implements it; every keyframe name starts with `telora-`. A `prefers-reduced-motion: reduce` block disables it.

## Interaction kit: K4 spring

react-spring with use-gesture: physical drag, throw and settle.

Packages for package.json dependencies: "@react-spring/web": "^10.1.2", "@use-gesture/react": "^10.3.1".

Typical import: `import { useSpring, useSprings, animated } from "@react-spring/web"; import { useDrag } from "@use-gesture/react";`

Signature interactions (the scaffold ships the first; all three exist by the end of the frontend phase):
1. a throwable card deck or draggable slider of the seed records (`useDrag` with velocity feeding `useSpring`)
2. a spring-driven figure or gauge that overshoots and settles whenever the core value changes
3. a pointer-following tilt or magnetic pull on the hero artifact or the primary control

Rules:
- set `touch-action` on every draggable element
- every drag has a keyboard or button alternative
- add the packages above to package.json `dependencies` (and `devDependencies` where listed) with exactly these ranges; the runner installs them
- every import of a kit package lives in a component that starts with `"use client"`
- server HTML must be readable with JavaScript off: never server-render content at opacity 0 or off screen; animate from the visible state or on interaction
- honor `prefers-reduced-motion: reduce`: the content and every control stay usable with motion off
- every interaction is driven by the real seed data; a decorative animation with no product meaning does not count as a signature

## Amendments (append-only; later phases add dated lines here, never edit anything above)
