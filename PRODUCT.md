# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Players joining recreational court-sport queues, and facility staff managing live sessions, courts, and matches.

## Product Purpose

RallyLoop helps sports facilities and player communities organize recreational games without confusing paper lists, group chats, or manual player rotations. Success means players can find and join an open session, understand their place in the queue, and see court updates, while staff can reliably run sessions and matches.

## Positioning

RallyLoop combines a first-in, first-out player queue with staff-controlled court and match operations and session-scoped near-real-time updates.

## Operating Context

The product is used on the web by players and facility staff during recreational court-sport sessions. Initial supported sports include pickleball, badminton, tennis, and other configurable court-based sports. The initial release targets a pilot facility or club.

## Capabilities and Constraints

- Players can find sessions, view public queue and court status, join or leave their own waiting queue entry, and view their own queue position and match history.
- The player home surfaces active queue position or assigned/in-progress match status with a direct link to the session.
- Facility management puts live session work first, then courts and facility details, with section links for quick access.
- Staff can manage sessions and queues, assign eligible players to courts, and start, complete, or cancel matches.
- Facility administrators can configure facilities, sports, courts, and sessions.
- Queue ordering is FIFO. Staff confirm court assignment; assignment is not automatic.
- Realtime updates are notifications only; the database remains authoritative.
- Store timestamps in UTC and display them in the facility's configured timezone.
- Public queue views must not expose email addresses or private profile data.
- Keep all current workflows and screens while redesigning the complete app UI. Preserve responsive web behavior and existing accessibility behavior.
- Do not add payments, subscriptions, tournament brackets, chat, advanced rankings, native apps, or complex booking calendars to the MVP.
- User requests a sporty, approachable experience and replacement of browser prompts with dialogs, toasts, or inline messages as appropriate.

## Brand Commitments

The product name is RallyLoop. The user requests a sporty, approachable interface; no existing visual assets or additional brand constraints were identified.

## Evidence on Hand

The repository contains the implementation plan, current application screens and workflows, and application code. No customer testimonials, reviews, press, usage statistics, or approved facility/player photography were identified; do not invent them.

## Product Principles

- Make it quick for a player to find and join an open session.
- Make queue position and court status easy to understand at a glance.
- Keep staff in control of queue and match operations.
- Treat the database as the source of truth for live updates.
- Protect players' private information in public views.

## Accessibility & Inclusion

Preserve the existing accessible interaction behavior and responsive web experience across the redesign.
