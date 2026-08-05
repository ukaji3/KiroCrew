"use strict";

// Suppress the bare-Alt "focus the menu bar" behavior on Linux.
//
// On Linux the window keeps its native frame and native menu bar
// (main.js: Electron ignores titleBarStyle there), and GTK's convention is
// that a lone Alt press moves keyboard focus into that menu bar. For a
// keyboard-heavy dashboard this is disruptive — VS Code exposes the same
// escape hatch as `window.customMenuBarAltFocus: false`.
//
// The mechanism: webContents' `before-input-event` fires in the main process
// before the browser's built-in keyboard handling. Calling preventDefault()
// on the bare Alt keyDown/keyUp stops the menu-bar focus without affecting
// Alt+<key> combos (those arrive as the OTHER key's event with `input.alt`
// set, which this predicate does not match).
//
// Pure data-in/data-out: no electron imports, so the decision is
// unit-testable without a display server (same pattern as app-menu.js).

/**
 * @param {{ key?: string, type?: string, control?: boolean, shift?: boolean, meta?: boolean }} input
 *   The `input` payload of a `before-input-event`.
 * @returns {boolean} true when the event is a bare Alt press/release that
 *   would move focus to the native menu bar and should be suppressed.
 */
function shouldSuppressAltMenuFocus(input) {
  if (!input || input.key !== "Alt") return false;
  // Only keyDown/keyUp of Alt itself; rawKeyDown is covered by keyDown here.
  if (input.type !== "keyDown" && input.type !== "keyUp" && input.type !== "rawKeyDown") {
    return false;
  }
  // Alt as part of a chord with other modifiers (Ctrl+Alt, Alt+Shift for
  // layout switching, Super+Alt) is not the menu-focus gesture — let those
  // through untouched.
  if (input.control || input.shift || input.meta) return false;
  return true;
}

/**
 * Attach the guard to one webContents. Kept here so main.js wires a single
 * call and every window (main + connection windows) gets the same behavior.
 *
 * @param {{ on: Function }} webContents
 */
function attachAltMenuGuard(webContents) {
  webContents.on("before-input-event", (event, input) => {
    if (shouldSuppressAltMenuFocus(input)) event.preventDefault();
  });
}

module.exports = { shouldSuppressAltMenuFocus, attachAltMenuGuard };
