const { test } = require("node:test");
const assert = require("node:assert");
const { shouldSuppressAltMenuFocus, attachAltMenuGuard } = require("../alt-menu-guard");

test("bare Alt keyDown is suppressed", () => {
  assert.equal(
    shouldSuppressAltMenuFocus({ key: "Alt", type: "keyDown", alt: true }),
    true,
  );
});

test("bare Alt keyUp is suppressed (the release triggers the menu focus)", () => {
  assert.equal(
    shouldSuppressAltMenuFocus({ key: "Alt", type: "keyUp", alt: false }),
    true,
  );
});

test("bare Alt rawKeyDown is suppressed", () => {
  assert.equal(
    shouldSuppressAltMenuFocus({ key: "Alt", type: "rawKeyDown", alt: true }),
    true,
  );
});

test("Alt+<letter> chord is NOT suppressed (arrives as the letter's event)", () => {
  assert.equal(
    shouldSuppressAltMenuFocus({ key: "f", type: "keyDown", alt: true }),
    false,
  );
});

test("Ctrl+Alt is NOT suppressed (not the menu-focus gesture)", () => {
  assert.equal(
    shouldSuppressAltMenuFocus({ key: "Alt", type: "keyDown", control: true }),
    false,
  );
});

test("Alt+Shift is NOT suppressed (keyboard-layout switching)", () => {
  assert.equal(
    shouldSuppressAltMenuFocus({ key: "Alt", type: "keyDown", shift: true }),
    false,
  );
});

test("Super+Alt is NOT suppressed", () => {
  assert.equal(
    shouldSuppressAltMenuFocus({ key: "Alt", type: "keyDown", meta: true }),
    false,
  );
});

test("non-key input types pass through", () => {
  assert.equal(shouldSuppressAltMenuFocus({ key: "Alt", type: "char" }), false);
});

test("null/undefined input passes through", () => {
  assert.equal(shouldSuppressAltMenuFocus(null), false);
  assert.equal(shouldSuppressAltMenuFocus(undefined), false);
});

test("attachAltMenuGuard prevents default only on bare Alt", () => {
  let handler = null;
  const webContents = {
    on(name, fn) {
      assert.equal(name, "before-input-event");
      handler = fn;
    },
  };
  attachAltMenuGuard(webContents);
  assert.ok(handler, "listener registered");

  const fire = (input) => {
    let prevented = false;
    handler({ preventDefault: () => { prevented = true; } }, input);
    return prevented;
  };

  assert.equal(fire({ key: "Alt", type: "keyDown" }), true);
  assert.equal(fire({ key: "Alt", type: "keyUp" }), true);
  assert.equal(fire({ key: "Tab", type: "keyDown", alt: true }), false);
  assert.equal(fire({ key: "F4", type: "keyDown", alt: true }), false);
});
