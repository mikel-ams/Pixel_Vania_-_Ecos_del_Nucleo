/* Aprendizaje online local: bandido contextual, sin servicios externos. */
window.PixelAI = (() => {
  const key = "pixelvania-learning-v1";
  const fresh = () => ({
    version: 1,
    decisions: 0,
    updates: 0,
    q: Array.from({ length: 3 }, () => [0, 0, 0]),
    counts: Array.from({ length: 3 }, () => [0, 0, 0]),
  });
  let model = fresh(),
    dirty = false;
  try {
    const s = JSON.parse(localStorage.getItem(key));
    if (
      s?.version === 1 &&
      Number.isInteger(s.updates) &&
      s.updates >= 0 &&
      Number.isInteger(s.decisions) &&
      s.decisions >= 0 &&
      s.q?.length === 3 &&
      s.counts?.length === 3 &&
      s.q.every(
        (row) =>
          Array.isArray(row) &&
          row.length === 3 &&
          row.every((n) => Number.isFinite(n) && Math.abs(n) <= 4),
      ) &&
      s.counts.every(
        (row) =>
          Array.isArray(row) &&
          row.length === 3 &&
          row.every((n) => Number.isInteger(n) && n >= 0),
      )
    )
      model = s;
  } catch {}
  function save() {
    if (!dirty) return;
    try {
      localStorage.setItem(key, JSON.stringify(model));
      dirty = false;
    } catch {}
  }
  function choose(context, random = Math.random) {
    const visits = model.counts[context].reduce((a, b) => a + b, 0);
    const epsilon = Math.max(0.08, 0.28 / (1 + visits / 40));
    let action = 0;
    if (random() < epsilon) action = Math.floor(random() * 3);
    else
      for (let i = 1; i < 3; i++)
        if (model.q[context][i] > model.q[context][action]) action = i;
    model.decisions++;
    dirty = true;
    return action;
  }
  function reward(context, action, value) {
    if (![0, 1, 2].includes(context) || ![0, 1, 2].includes(action)) return;
    const count = ++model.counts[context][action];
    const rate = Math.max(0.06, 1 / Math.min(count, 12));
    const target = Math.max(-4, Math.min(4, value));
    model.q[context][action] += rate * (target - model.q[context][action]);
    model.updates++;
    dirty = true;
  }
  function reset() {
    model = fresh();
    dirty = true;
    save();
  }
  return {
    choose,
    reward,
    save,
    reset,
    stats: () => JSON.parse(JSON.stringify(model)),
  };
})();
