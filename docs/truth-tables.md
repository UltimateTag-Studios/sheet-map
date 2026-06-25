# Map shell + camera truth tables

**Authority:** This document is the product spec for `@siegetag/sheet-map` sheet geometry, selection, padding, and camera fly behavior. Implementation (`MapShellMachine`, `MapCameraMachine`, hooks) must match these tables. When code and this doc disagree, **fix the code**.

Related: [camera.md](./camera.md) (architecture and API), `truth-table.test.ts` (executable rows).

---

## Architecture

Two pure machines, thin adapters:


| Machine              | Owns                                                        |
| -------------------- | ----------------------------------------------------------- |
| **MapShellMachine**  | Sheet snap/target/phase, selection, fly intent, route enter |
| **MapCameraMachine** | Session, tracking, boot, padding phase, navigate effects    |


**Bridge:** camera `notifyShell` effects → shell `cameraSignal` events. No React polling of camera state.

**Sheet phase authority:** only `syncCameraSheetPhase` shell effects → camera `sheetPhaseChanged`.

---

## State fields

### Shell (`MapShellMachineState`)


| Field            | Meaning                                                                     | Updates when                                                            |
| ---------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `sheetSnap`      | Snap the sheet **has arrived at**                                           | `sheetSettled`, layout idle arrival commit                              |
| `sheetTarget`    | Commanded destination while in flight; `**null` when arrived / no command** | `selectItem`, dismiss, gesture mirror, intent apply; cleared on arrival |
| `sheetPhase`     | `resting` | `dragging` | `settling`                                         | `sheetLayoutFrameChanged` (Sheet `idle` → `resting`)                    |
| `selectedItemId` | Highlighted list/map item                                                   | `selectItem`, clear/dismiss                                             |
| `intent`         | Pending camera/sheet orchestration                                          | See [Intent](#intent)                                                   |
| `cameraSnapshot` | Mirror of camera signals                                                    | `cameraSignal` events                                                   |
| `routeVisit`     | Active route enter fly lifecycle                                            | Route registration / apply                                              |


**Sheet prop to `<Sheet>`:** `sheetTarget ?? sheetSnap`.

**Planning snap** (`snapForPlanning`): while `sheetPhase !== resting`, use `sheetTarget ?? sheetSnap` (gesture destination). When resting, use `sheetSnap`.

### Camera (`MapCameraState`) — summary


| Field                  | Meaning                                                 |
| ---------------------- | ------------------------------------------------------- |
| `session`              | `idle` | `userGesture` | `flying`                       |
| `sheetPhase`           | `idle` | `dragging` | `settling` (from shell sync only) |
| `padding.phase`        | `pending` | `ready`                                     |
| `padding.options`      | Last measured Mapbox padding                            |
| `padding.pendingApply` | Deferred padding while flying at sheet rest             |
| `anchor`               | Stored center for realign / jump                        |
| `tracking`             | Follow-user on/off                                      |


---

## Invariants


| ID      | Rule                                                                                                                                                                                                                                                                                                                                 |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **I1**  | **Latest user intent wins.** New `selectItem` / `recenterUser` / `navigateTo` replaces prior shell intent. No queue.                                                                                                                                                                                                                 |
| **I2**  | **Mid-fly pivot.** Selecting a different item (or recenter) while camera is `flying` **immediately** emits a new fly. Camera supersedes the in-flight animation.                                                                                                                                                                     |
| **I3**  | Sheet prop = `sheetTarget ?? sheetSnap`.                                                                                                                                                                                                                                                                                             |
| **I4**  | `sheetSnap` commits on arrival only. `sheetTarget` is `**null` when arrived** (no in-flight sheet command).                                                                                                                                                                                                                          |
| **I5**  | **No smooth fly while the sheet is moving.** Animated `flyTo` only when the sheet is **resting**. During motion, padding changes use **jump** (camera physics).                                                                                                                                                                      |
| **I6**  | **Padding and navigate are loosely coupled.** Sheet motion → padding applies immediately (often with realign → jump). Programmatic navigate may batch current padding before `moveCamera`. Live DOM padding can arrive before or after any navigate.                                                                                 |
| **I7**  | Only `syncCameraSheetPhase` updates camera `sheetPhase`.                                                                                                                                                                                                                                                                             |
| **I8**  | **When in doubt, do not block shell emit** — except: `mapPaddingReady`, smooth-fly snap wait (full→half), and **select while settling** (defer until resting).                                                                                                                                                                       |
| **I9**  | User pan during fly stops the fly; **selection stays**. No auto-retry; user taps again to fly.                                                                                                                                                                                                                                       |
| **I10** | Route enter **always navigates** — configured target, or `**flyToUser` by default**. Same rules as `selectItem`: defer while **settling**, jump while **dragging**, smooth fly when **resting**.                                                                                                                                     |
| **I11** | **Select at rest, then drag sheet before fly completes → jump.** User moves the sheet by **dragging** while a fly is in flight → padding + **jump** to intent target. **Not** the same as select-while-settling (I12).                                                                                                               |
| **I12** | **Select while settling → defer smooth fly.** `restingSnap` is known. Update selection + intent; **do not emit** until sheet is **resting** at that snap, then **smooth fly**.                                                                                                                                                       |
| **I13** | **Settling → dragging cancels deferral.** If the user grabbed the sheet before settle finished, the I12 wait is **void** (`restingSnap` no longer trustworthy). **Do not** smooth-fly on the old deferred path when idle arrives. If intent remains (not gesture-close cancelled), **emit jump immediately** on entering `dragging`. |


---

## Intent

`ShellIntent` discriminated union:

### `awaitGates`

Pending camera fly. Fields:


| Field              | Purpose                                              |
| ------------------ | ---------------------------------------------------- |
| `itemId`           | Selection (or `null` for recenter)                   |
| `camera`           | `flyToItem` or `flyToUser`                           |
| `requiredSnap`     | Snap that must be **arrived** before fly (see below) |
| `openHalfAfterFly` | Collapsed select: open half after fly completes      |


`**requiredSnap` (replaces redundant `intent.sheetTarget`):**

- Set from `snapForPlanning` at select time: `collapsed` → `collapsed`, `half` → `half`, `full` → `half`.
- **Smooth fly only:** when sheet is **resting**, require `requiredSnap` unset or `sheetSnap === requiredSnap` (e.g. full → half waits for half arrival).
- **Select while settling (I12):** destination `restingSnap` is known — defer emit until **resting** at that snap; then smooth fly.
- **Select while dragging:** destination unknown — **emit jump immediately** (G1 only).
- When `sheetSnap` already equals `requiredSnap` at plan time, `requiredSnap` may be omitted / treated as satisfied.
- **Not** the same as `state.sheetTarget` (in-flight sheet command). Intent only records what snap a **smooth fly** waits for.

### `awaitCameraIdleForHalf`

Collapsed select path: fly first, then command `sheetTarget: half` after camera reports fly complete (`flying → idle` or `navigateSettled`).

### Intent cleared when


| Cause                                                            | Clear?               |
| ---------------------------------------------------------------- | -------------------- |
| Fly satisfied (`navigateSettled` for **that** intent’s fly)      | Yes                  |
| Superseded by newer `selectItem` / `recenterUser`                | Replaced, not queued |
| Dismiss / drag-close (except select-while-settling-to-collapsed) | Yes                  |
| `awaitCameraIdleForHalf` → half commanded                        | Yes                  |


**Never** clear on `navigateSettled` from an **older** fly when intent was already superseded.

---

## Fly emit gates (shell)

Shell emits `flyToItem` / `flyToUser`. Camera chooses **fly vs jump** via `resolveNavigateMode` (`jump` when camera `sheetPhase` is `dragging` or `settling` at navigate time).

### Dragging vs settling (critical)


| `sheetPhase` | Destination known?      | Shell on **new** `selectItem`                | Camera when emit runs                 |
| ------------ | ----------------------- | -------------------------------------------- | ------------------------------------- |
| **dragging** | **No**                  | **Emit jump immediately**                    | `jump`                                |
| **settling** | **Yes** (`restingSnap`) | **Defer** smooth fly until **resting** (I12) | `fly` (sheet resting when emit fires) |
| **resting**  | Yes (`sheetSnap`)       | Emit immediately if gates pass               | `fly`                                 |


**Do not conflate** select-while-settling (defer) with select-then-drag-mid-fly (I11, jump).

### Settling → dragging (cancel deferral)

Sequence:

1. Sheet **settling** (destination = `restingSnap`)
2. User **taps item** → selection + intent; fly **deferred** (I12)
3. User **grabs sheet** before settle completes → `sheetPhase` becomes **dragging**


| Step | Behavior                                                                                                        |
| ---- | --------------------------------------------------------------------------------------------------------------- |
| 3a   | **Cancel I12 deferral** — do not smooth-fly to item when the sheet later idles at the *old* `restingSnap` (I13) |
| 3b   | If intent **still valid** (not drag-close cancelled)                                                            |
| 3c   | If drag toward `**collapsed`** without select-during-dismiss                                                    |


**Shell hook:** `sheetLayoutFrameChanged` with `phase: dragging` while a deferred I12 intent exists → cancel deferral path; try jump emit (or cancel on close).

### When shell emits


| Gate                             | Pass when                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| G1 `mapPaddingReady`             | Camera `padding.phase === ready`                                                    |
| G2 `intent.phase === awaitGates` | Pending fly intent exists                                                           |
| G3 Smooth-fly snap               | Sheet **resting** and (`requiredSnap` unset or `sheetSnap === requiredSnap`)        |
| G4 Not settling on select        | `**sheetPhase !== settling`** for new select — settling defers to layout idle (I12) |


**Not gated:**

- `sheetPhase === dragging` on select — emit jump immediately
- `cameraSession === flying` — pivot allowed (I2)
- `cameraSession === idle` with map momentum — emit allowed
- `cameraSession === userGesture` — emit allowed

**Deferred emit:**


| Case                                         | Wait for                                   |
| -------------------------------------------- | ------------------------------------------ |
| **Select while settling** (I12)              | `sheetPhase → resting` at `restingSnap`    |
| Resting at **full**, `requiredSnap === half` | `sheetSnap === half` (sheet slide command) |
| `mapPaddingReady === false`                  | Padding ready                              |


### Sheet motion + navigate (core rule)


| Situation                                               | Shell                                  | Camera                                            |
| ------------------------------------------------------- | -------------------------------------- | ------------------------------------------------- |
| **Select while dragging**                               | Emit **jump** now                      | `jump`                                            |
| **Select while settling**                               | **Defer**; emit on layout idle         | **Smooth fly** when resting                       |
| **Select while resting**                                | Emit now                               | **Smooth fly**                                    |
| **Select at rest, then user drags sheet mid-fly** (I11) | Intent unchanged / updated on reselect | **Jump** via padding realign — not deferred retry |
| **Full → half** (command, not user select during drag)  | Defer until half + resting             | Smooth fly                                        |


### Immediate emit vs deferred retry


| Situation                                      | Behavior                                    |
| ---------------------------------------------- | ------------------------------------------- |
| `selectItem`, sheet **dragging**               | **Emit immediately** → **jump**             |
| `selectItem`, sheet **settling**               | **Defer** → smooth fly on layout idle (I12) |
| `selectItem`, sheet **resting**, gates pass    | **Emit immediately** → smooth fly           |
| `selectItem`, mid-fly pivot (resting/dragging) | **Emit immediately** (I2); dragging → jump  |
| `selectItem`, resting at full                  | Defer until `sheetSnap === half`            |
| Padding not ready                              | Store intent; retry when G1 opens           |


### Retry triggers


| Signal                                         | Retry smooth fly?                                                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `paddingReadyChanged → true`                   | Yes, if intent still pending                                                                                  |
| `sheetLayoutFrameChanged → idle`               | Yes — **I12** defer complete, **full→half**, snap wait — **only if I13 did not fire** (never settled→dragged) |
| `sheetLayoutFrameChanged → dragging`           | **Cancel I12 deferral** (I13); jump emit if intent valid, or gesture-close cancel                             |
| `sessionChanged → idle` from `**userGesture`** | Yes, if intent pending and never emitted                                                                      |
| `sessionChanged → idle` from `**flying**`      | **No**                                                                                                        |
| `navigateSettled`                              | Clear intent if it matches settled fly; do not clear superseded intent                                        |


---

## `selectItem`

### By sheet phase


| `sheetPhase` | `restingSnap` / context       | Selection | `sheetTarget` command           | Navigate                                                                                 |
| ------------ | ----------------------------- | --------- | ------------------------------- | ---------------------------------------------------------------------------------------- |
| **resting**  | `collapsed`                   | Set       | `collapsed`                     | **Immediate fly** (G1); then `awaitCameraIdleForHalf` → open half                        |
| **resting**  | `half`                        | Set       | `half`                          | **Immediate fly**                                                                        |
| **resting**  | `full`                        | Set       | `half`                          | **Deferred smooth fly** until `sheetSnap === half` (sheet command only; no navigate yet) |
| **settling** | known (`restingSnap`)         | Set       | Mirror gesture                  | **Defer** smooth fly until **resting** (I12)                                             |
| **settling** | toward `collapsed` + tap item | Set       | `collapsed`, `openHalfAfterFly` | **Defer** until resting at `collapsed`, then fly, then half                              |
| **dragging** | unknown                       | Set       | Mirror gesture                  | **Immediate jump** (I11) — see below                                                     |


### By camera session (gates pass)


| `cameraSession`              | Fly on `selectItem`?                         |
| ---------------------------- | -------------------------------------------- |
| `idle`                       | **Yes**                                      |
| `flying`                     | **Yes — pivot immediately** (I2)             |
| `userGesture`                | **Yes** — start fly; cancel gesture/momentum |
| Map momentum, session `idle` | **Yes**                                      |


### Rapid taps (A → B → C)

Each tap updates selection + intent and **immediately pivots** fly to the latest item when gates pass. No waiting for prior fly to finish.

### Select while dragging vs settling


|                 | **Dragging**                                         | **Settling**                                    |
| --------------- | ---------------------------------------------------- | ----------------------------------------------- |
| Destination     | **Unknown**                                          | **Known** (`restingSnap`)                       |
| On `selectItem` | Update selection + intent; **emit jump immediately** | Update selection + intent; **defer** smooth fly |
| When fly runs   | Now (`jump`)                                         | On layout **idle** / resting at destination     |
| Rationale       | Cannot plan final padding snap                       | Wait for final padding, then one smooth fly     |


**Select while dragging:** jump now — we cannot know where the sheet will land.

**Select while settling:** **defer** — `restingSnap` tells us the target snap; smooth fly once resting (I12). **Unless** user grabs sheet → **I13** cancels deferral, jump now.

**Settling → dragging after deferred select:** cancel deferral; jump if intent survives gesture-close (I13).

**Select at rest, then drag sheet before fly completes (I11):** separate case — user **drags** during in-flight animation → **jump** via padding realign.

### Reselect at full


| Step                                    | Behavior                                      |
| --------------------------------------- | --------------------------------------------- |
| Tap item B while A selected, sheet full | `sheetTarget: half`, intent for B, no fly yet |
| Sheet reaches half, resting             | Fly to B                                      |


---

## `recenterUser`


|               | Behavior                                                                            |
| ------------- | ----------------------------------------------------------------------------------- |
| Selection     | Cleared                                                                             |
| `sheetTarget` | Unchanged snap command cancelled (in-flight half slide from prior select cancelled) |
| `sheetSnap`   | Unchanged                                                                           |
| Fly           | Same gates as `selectItem`; pivot mid-fly; OK during gesture/momentum               |
| Sheet         | Never opens half                                                                    |


Location button disabled when `!userLocation \|\| !mapPaddingReady`.

---

## `navigateTo` (shell)


| `preserveTracking` | Selection | Effect                            |
| ------------------ | --------- | --------------------------------- |
| `false` (default)  | Cleared   | `flyToPosition` → camera navigate |
| `true`             | Kept      | `flyToPosition`                   |


Same fly/pivot rules as selection at camera layer. Does not use `awaitGates` intent (direct effect).

---

## Dismiss / close sheet


| Action                              | `selectedItemId`                                    | `sheetTarget`  | `intent`                 | Fly                                         |
| ----------------------------------- | --------------------------------------------------- | -------------- | ------------------------ | ------------------------------------------- |
| `dismissSheet`                      | `null`                                              | `collapsed`    | cleared                  | None                                        |
| `sheetSnapChangeStarted(collapsed)` | cleared (unless select-while-settling-to-collapsed) | `collapsed`    | cancel stale half-target | None                                        |
| Drag toward `collapsed`             | cleared (same exception)                            | mirror gesture | cancel (same exception)  | None                                        |
| Settle at `collapsed`               | —                                                   | —              | —                        | **No fly** for cancelled half-target intent |


### Select while settling to collapsed


| Step                                                  | Behavior                                       |
| ----------------------------------------------------- | ---------------------------------------------- |
| Sheet **settling** toward `collapsed`, user taps item | `collapsed` plan + `openHalfAfterFly`          |
| On tap                                                | Update selection + intent; **defer** fly (I12) |
| Arrive `collapsed`, **resting**                       | **Smooth fly** to item                         |
| Fly completes                                         | `sheetTarget: half`                            |


Wording: **“tap item while settling”** — destination known, so **defer**, not jump.

---

## Route enter


| Rule                | Behavior                                                            |
| ------------------- | ------------------------------------------------------------------- |
| Default             | `flyToUser` when route does not configure enter fly                 |
| Configured          | `flyToItem` (with `enterFly`) or `flyToUser` via `useRouteEnterFly` |
| Gates               | Same as `selectItem`                                                |
| Sheet **settling**  | **Defer** until resting (I12)                                       |
| Sheet **dragging**  | **Jump** immediately                                                |
| Resting, snap ready | Smooth fly immediately                                              |
| `applyStatus`       | `waiting` → `dispatched` → `satisfied` / `dismissed`                |


---

## Sheet events → shell


| Event                                | Shell updates                                                                                  | Camera effects                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `sheetLayoutFrameChanged`            | `sheetPhase`, mirror `sheetTarget` from `restingSnap` when moving, commit arrival on idle      | `syncCameraSheetPhase` when phase changes       |
| `sheetLayoutFrameChanged → dragging` | **I13:** cancel I12 deferral; jump emit or gesture-close cancel                                | sync dragging                                   |
| `sheetLayoutFrameChanged → idle`     | `sheetPhase → resting`, try deferred fly (I12, full→half) if I13 did not fire, try route enter | sync idle + smooth fly if deferred intent ready |
| `sheetSettled`                       | Commit `sheetSnap`                                                                             | None                                            |
| `sheetSnapChangeStarted`             | `sheetTarget`, cancel intent on close                                                          | None                                            |


**Arrival commit:** `sheetSnap` moves on `sheetSettled` and/or layout idle when `restingSnap !== sheetSnap`. `sheetTarget → null` on commit.

---

## Camera signals → shell


| Signal                   | Snapshot patch    | Side effects                                                                                                                    |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `sessionChanged`         | `cameraSession`   | `completeSelectOpenHalf`; route user enter satisfied; **retry** only if `previousSession === userGesture` && `session === idle` |
| `paddingReadyChanged`    | `mapPaddingReady` | Retry if `ready`                                                                                                                |
| `paddingApplied`         | —                 | No shell retry — layout idle at rest covers deferred fly                                                                        |
| `navigateSettled`        | —                 | Complete `awaitCameraIdleForHalf`; clear matching `awaitGates` intent                                                           |
| `anchorZoomChanged`      | `anchorZoom`      | —                                                                                                                               |
| `hasUserLocationChanged` | `hasUserLocation` | Retry `flyToUser` intent; route enter may proceed                                                                               |


---

## Padding truth table (camera)


| Situation                                | `paddingMeasured` changed | Apply?                     | `realign`                 | Navigate mode if navigate follows |
| ---------------------------------------- | ------------------------- | -------------------------- | ------------------------- | --------------------------------- |
| Sheet **dragging** or **settling**       | Yes                       | **Immediately**            | **true** (jump to anchor) | **jump**                          |
| `flying` + sheet **at rest**             | Yes                       | **Defer** (`pendingApply`) | —                         | —                                 |
| Fly settles (`mapMoveEnd` / `mapIdle`)   | —                         | Flush deferred             | true                      | —                                 |
| `userGesture`                            | Yes                       | Apply                      | **false**                 | —                                 |
| Sheet resting, camera `idle`, DOM change | Yes                       | Apply if changed           | false                     | —                                 |
| Sheet resting, `flying`                  | Yes                       | Defer                      | —                         | —                                 |


Programmatic navigate (`buildNavigateEffects`): if `padding.options` exists, `applyPadding { realign: false }` then `moveCamera` in one batch.

### Padding measurement pipeline

DOM → `liveSheetObscuredBottomPx` → `padding-dom-sync` → `paddingMeasured`.

**Updates fire from:**

- Sheet `onLayoutFrameChange`
- `ResizeObserver` on map canvas + sheet element
- Map `resize`, window / `visualViewport` resize & scroll

**“Sheet resting” ≠ “padding frozen.”** After sheet `idle`, observers can still fire (list content, sub-pixel layout, **realign feedback loop**). Expected during **sheet drag** (many updates). After rest, churn should be minimal — investigate if convergence loop persists.

**Do not** block all padding updates when resting (breaks rotation, keyboard, resize). Prefer coalescing / ignoring sub-pixel churn if needed.

---

## Camera session truth table


| Session       | Entered by                             | Exited by                                                |
| ------------- | -------------------------------------- | -------------------------------------------------------- |
| `idle`        | At rest                                | User gesture start; programmatic fly start               |
| `userGesture` | `dragstart` / `zoomstart`              | `moveend` + not moving                                   |
| `flying`      | `navigateTo` / fly with `duration > 0` | Target reached; superseded by new navigate; user gesture |



| Session       | Blocks shell fly emit?       |
| ------------- | ---------------------------- |
| `idle`        | No                           |
| `flying`      | **No** (pivot)               |
| `userGesture` | **No** (fly cancels gesture) |


### `navigateRequested` during `flying`


| New mode | Result                                   |
| -------- | ---------------------------------------- |
| `fly`    | Stay `flying`; **new fly to new target** |
| `jump`   | Jump; session → `idle`                   |


### User pan during fly

Fly stops. Selection unchanged. **No auto-retry.**

### Pan map, then tap list item

**Fly immediately** — momentum cancellation is fine.

---

## Sheet drag during in-flight fly (I11)


|                                     | Behavior                                                           |
| ----------------------------------- | ------------------------------------------------------------------ |
| Trigger                             | User **drags** sheet after select at rest, before fly completes    |
| Padding                             | Applies immediately with `realign: true`                           |
| Camera                              | **Jump** to intent target — replaces smooth fly                    |
| After sheet rests                   | **Do not** retry a smooth fly for this path — jump already applied |
| New `selectItem` while **dragging** | **Immediate jump** to latest item                                  |
| New `selectItem` while **settling** | **Defer** until resting (I12) — different from I11                 |


Padding realign during sheet motion is camera physics. **I11** is user drag mid-fly. **I12** is new select during settle animation.

---

## Collapsed → half after select


| Step                | Behavior                                           |
| ------------------- | -------------------------------------------------- |
| Select at collapsed | Fly immediately; intent → `awaitCameraIdleForHalf` |
| Fly completes       | `sheetTarget: half`                                |
| Sheet opens half    | Intent cleared                                     |


---

## Tracking / follow user


| Event                           | Tracking                        |
| ------------------------------- | ------------------------------- |
| Fly to item                     | Off (`preserveTracking: false`) |
| `recenterUser`                  | On after fly                    |
| Pan > threshold while following | Released                        |
| Pan ≤ threshold                 | Snap-back fly, tracking kept    |
| GPS tick while tracking         | Instant jump                    |


---

## Executable tests

Each major row should have a corresponding test in:

- `src/shell/map-shell-machine/truth-table.test.ts`
- `src/shell/map-shell-machine/reduce.test.ts`
- `src/camera/hooks/use-map-camera.test.ts`
- `src/camera/testing/padding-camera.integration.test.ts`

---

## Implementation gaps (current code ≠ this doc)

Track until fixed:


| Gap                     | Spec                                 | Status       |
| ----------------------- | ------------------------------------ | ------------ |
| Post-rest padding storm | Coalesce / investigate feedback loop | Follow-up PR |


### Implementation notes

Shell navigate gate lives in `intent/shell-navigate-gate.ts`. Intent fields:

- `requiredSnap` — smooth-fly snap wait (`half` for full→half); `null` when already at target
- `deferFlyUntilResting` — I12; set on select while settling; cleared on I13 or layout idle
- `navigateEmitted` / `outstandingShellNavigates` — correlate `navigateSettled` with latest emit (I1/I2 pivot). Gate returns `none` when `navigateEmitted` to prevent per-frame re-emit during sheet motion.

---

## Manual QA checklist

- Half sheet: tap item → immediate fly
- Flying to A: tap B → **immediate pivot** to B
- Rapid A/B/C taps at half → ends on C
- Full sheet: tap item → half + fly
- View trail / route enter: fly (default user if unconfigured)
- Route enter while sheet **settling**: defer until resting
- Route enter while sheet **dragging**: immediate jump
- Select while **dragging** → immediate jump to item
- Select while **settling** → smooth fly after resting (not jump on tap)
- Select while settling, then **grab sheet** before settle → cancel deferral, jump (or close-cancel)
- Select at half, **drag** sheet before fly ends → jump (no smooth fly after settle)
- Drag sheet during fly → jump to anchor / intent target
- Pan map during fly → fly stops; selection kept; no auto-retry
- Pan then tap item → fly (momentum OK)
- Select while settling to collapsed → fly then half
- Close sheet → deselect, no fly
- Recenter → fly user, sheet unchanged

