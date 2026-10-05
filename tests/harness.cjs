const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  assert = require("node:assert/strict");
module.exports = function engine(storage = {}) {
  const elements = {},
    listeners = {};
  const element = () => ({
    events: {},
    textContent: "",
    hidden: false,
    style: {},
    dataset: {},
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute() {},
    addEventListener(n, cb) {
      this.events[n] = cb;
    },
    setPointerCapture() {},
    blur() {},
    getContext() {
      return new Proxy(
        { createRadialGradient: () => ({ addColorStop() {} }) },
        { get: (obj, key) => obj[key] || (() => {}) },
      );
    },
  });
  const sandbox = {
    console,
    assert,
    Math,
    performance: { now: () => 0 },
    requestAnimationFrame() {},
    HTMLButtonElement: class {},
    location: { protocol: "file:" },
    document: {
      getElementById: (id) => elements[id] || (elements[id] = element()),
      createElement: element,
      querySelectorAll: () => [],
      activeElement: null,
      addEventListener() {},
    },
    localStorage: {
      getItem: (k) => storage[k] || null,
      removeItem: (k) => delete storage[k],
      setItem: (k, v) => (storage[k] = v),
    },
    addEventListener: (n, cb) => (listeners[n] = cb),
    matchMedia: () => ({ matches: false }),
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const file of ["world.js", "scene-data.js", "adaptive-ai.js", "engine.js"])
    vm.runInContext(
      fs.readFileSync(path.join(__dirname, "../src", file), "utf8"),
      sandbox,
    );
  return {
    sandbox,
    elements,
    listeners,
    storage,
    run: (s) => vm.runInContext("{" + s + "}", sandbox),
  };
};
