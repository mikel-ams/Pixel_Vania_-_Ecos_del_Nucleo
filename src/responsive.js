/* Adaptación por espacio disponible, orientación, entrada táctil y barras del navegador. */
(() => {
  const root = document.documentElement,
    body = document.body;
  const main = document.querySelector(".console");
  const shell = document.querySelector(".game-shell");
  const viewport = document.getElementById("viewport-wrapper");
  const coarse = matchMedia("(pointer: coarse)");
  let pending = false;
  function fit() {
    pending = false;
    const visual = window.visualViewport;
    const height = visual && visual.scale === 1 ? visual.height : innerHeight;
    const width = innerWidth;
    const touch = coarse.matches || navigator.maxTouchPoints > 0;
    const side = width >= 560 && width > height && (touch || height < 900);
    body.dataset.viewport = `${width}x${Math.round(height)}`;
    body.dataset.layout = side ? "side" : "bottom";
    body.dataset.touch = String(touch);
    root.style.setProperty("--app-height", `${height}px`);
    const rail = width < 700 ? 72 : Math.min(112, Math.max(88, width * 0.085));
    root.style.setProperty("--rail-size", `${rail}px`);
    const overlayStyle = getComputedStyle(document.getElementById("overlay"));
    root.style.setProperty(
      "--dialog-height",
      `${Math.max(120, height - parseFloat(overlayStyle.paddingTop) - parseFloat(overlayStyle.paddingBottom))}px`,
    );
    const style = getComputedStyle(body);
    const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const gap = parseFloat(getComputedStyle(main).rowGap);
    const header = main
      .querySelector(".masthead")
      .getBoundingClientRect().height;
    const footer = main.querySelector("footer").getBoundingClientRect().height;
    const deck = side
      ? 0
      : document.getElementById("mobile-controls").getBoundingClientRect()
          .height;
    const chrome =
      shell.getBoundingClientRect().height -
      viewport.getBoundingClientRect().height;
    const remaining = Math.max(
      72,
      height - padY - header - footer - deck - chrome - gap * (side ? 2 : 3),
    );
    const outer = side ? rail * 2 + gap * 2 : 0;
    const available = Math.max(0, width - padX);
    // Un mínimo legible evita bucles al envolver textos en ventanas extremadamente pequeñas.
    const minimum = Math.min(available, 240 + outer);
    const fitted = Math.min(
      available,
      side ? 1360 : 1120,
      Math.max(minimum, (remaining * 5) / 3 + outer + 2),
    );
    const next = `${Math.floor(fitted)}px`;
    if (main.style.getPropertyValue("--fit-width") !== next)
      main.style.setProperty("--fit-width", next);
  }
  function schedule() {
    if (!pending) {
      pending = true;
      requestAnimationFrame(fit);
    }
  }
  function resized() {
    if (typeof clearInputs === "function") clearInputs();
    fit();
  }
  window.addEventListener("resize", resized, { passive: true });
  window.visualViewport?.addEventListener("resize", resized, { passive: true });
  window.screen.orientation?.addEventListener("change", resized);
  if (coarse.addEventListener) coarse.addEventListener("change", schedule);
  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(schedule);
    observer.observe(shell);
    observer.observe(main.querySelector(".masthead"));
    observer.observe(main.querySelector("footer"));
  }
  fit();
})();
