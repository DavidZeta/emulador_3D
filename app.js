const config = {
  catalogUrl: "games.json",
  defaultGame: "pokemon-amarillo",
  color: "#8fbf45",
  ...(window.ROM_CONFIG || {}),
};

const keyMap = {
  ArrowUp: { key: "ArrowUp", code: "ArrowUp", keyCode: 38 },
  ArrowRight: { key: "ArrowRight", code: "ArrowRight", keyCode: 39 },
  ArrowDown: { key: "ArrowDown", code: "ArrowDown", keyCode: 40 },
  ArrowLeft: { key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 },
  KeyZ: { key: "z", code: "KeyZ", keyCode: 90 },
  KeyX: { key: "x", code: "KeyX", keyCode: 88 },
  ShiftRight: { key: "Shift", code: "ShiftRight", keyCode: 16 },
  Enter: { key: "Enter", code: "Enter", keyCode: 13 },
};

const activePointers = new Map();
const pressedKeys = new Set();

function dispatchEmulatorKey(code, type) {
  const keyData = keyMap[code];
  if (!keyData) return;

  const event = new KeyboardEvent(type, {
    key: keyData.key,
    code: keyData.code,
    bubbles: true,
    cancelable: true,
  });

  Object.defineProperty(event, "keyCode", { get: () => keyData.keyCode });
  Object.defineProperty(event, "which", { get: () => keyData.keyCode });

  document.dispatchEvent(event);
  window.dispatchEvent(event);
}

function pressKey(code) {
  if (pressedKeys.has(code)) return;
  pressedKeys.add(code);
  dispatchEmulatorKey(code, "keydown");
}

function releaseKey(code) {
  if (!pressedKeys.has(code)) return;
  pressedKeys.delete(code);
  dispatchEmulatorKey(code, "keyup");
}

function bindControls() {
  document.querySelectorAll("[data-key]").forEach((button) => {
    const code = button.dataset.key;

    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      activePointers.set(event.pointerId, { code, button });
      button.classList.add("is-pressed");
      pressKey(code);
      unlockAudio();
    });

    const endPress = (event) => {
      const active = activePointers.get(event.pointerId);
      if (!active) return;

      active.button.classList.remove("is-pressed");
      releaseKey(active.code);
      activePointers.delete(event.pointerId);
    };

    button.addEventListener("pointerup", endPress);
    button.addEventListener("pointercancel", endPress);
    button.addEventListener("lostpointercapture", endPress);
  });

  window.addEventListener("blur", releaseAllKeys);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) releaseAllKeys();
  });
}

function releaseAllKeys() {
  [...pressedKeys].forEach(releaseKey);
  document.querySelectorAll(".is-pressed").forEach((button) => button.classList.remove("is-pressed"));
  activePointers.clear();
}

async function unlockAudio() {
  const audioButton = document.querySelector("#audio-toggle");

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass && !window.__gbAudioContext) {
      window.__gbAudioContext = new AudioContextClass();
    }

    if (window.__gbAudioContext?.state === "suspended") {
      await window.__gbAudioContext.resume();
    }

    document.querySelectorAll("audio, video").forEach((media) => {
      media.muted = false;
      media.volume = Math.max(media.volume || 0, 0.65);
      media.play?.().catch(() => {});
    });

    audioButton?.setAttribute("aria-pressed", "true");
    if (audioButton) audioButton.textContent = "Sonido activo";
  } catch {
    if (audioButton) audioButton.textContent = "Toca para sonido";
  }
}

function bindAudioButton() {
  const audioButton = document.querySelector("#audio-toggle");
  audioButton?.addEventListener("click", unlockAudio);
}

function hydrateUi() {
  document.title = "Mini Cartucho";
  const title = document.querySelector("#game-title");
  if (title) title.textContent = "Mini Cartucho";
}

function getRequestedGameId(defaultGame) {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("game");
  const fromHash = window.location.hash.replace("#", "");
  return fromQuery || fromHash || defaultGame;
}

async function loadGameCatalog() {
  const response = await fetch(config.catalogUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${config.catalogUrl}`);
  }
  return response.json();
}

function resolveGame(catalog) {
  const defaultGame = catalog.default || config.defaultGame;
  const requestedGame = getRequestedGameId(defaultGame);
  const game = catalog.games?.[requestedGame] || catalog.games?.[defaultGame];

  if (!game) {
    throw new Error(`No existe el juego "${requestedGame}" en el catalogo`);
  }

  return { id: requestedGame, ...game };
}

function configureEmulator(game) {
  window.EJS_player = "#game";
  window.EJS_core = game.core || "gb";
  window.EJS_gameName = game.title;
  window.EJS_gameUrl = game.rom;
  window.EJS_color = game.color || config.color;
  window.EJS_pathtodata = "https://cdn.emulatorjs.org/latest/data/";
  window.EJS_startOnLoaded = true;
  window.EJS_volume = 0.65;
  window.EJS_backgroundImage = "";

  document.title = game.title;
  const title = document.querySelector("#game-title");
  const loadingText = document.querySelector("#loading-text");
  if (title) title.textContent = game.title;
  if (loadingText) loadingText.textContent = `Cargando ROM desde ${game.rom}`;
}

function loadEmulatorScript() {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.emulatorjs.org/latest/data/loader.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("No se pudo cargar EmulatorJS"));
    document.body.append(script);
  });
}

async function bootSelectedGame() {
  const loadingText = document.querySelector("#loading-text");

  try {
    const catalog = await loadGameCatalog();
    const game = resolveGame(catalog);
    configureEmulator(game);
    await loadEmulatorScript();
  } catch (error) {
    if (loadingText) {
      loadingText.textContent = `${error.message}. Revisa games.json y la ruta de la ROM.`;
    }
  }
}

function hideLoaderWhenReady() {
  const loadingPanel = document.querySelector("#loading-panel");
  const gameRoot = document.querySelector("#game");

  const observer = new MutationObserver(() => {
    if (gameRoot?.querySelector("canvas, iframe")) {
      loadingPanel?.classList.add("is-hidden");
      observer.disconnect();
    }
  });

  if (gameRoot) observer.observe(gameRoot, { childList: true, subtree: true });

  window.setTimeout(() => {
    if (gameRoot?.querySelector("canvas, iframe")) {
      loadingPanel?.classList.add("is-hidden");
      observer.disconnect();
    }
  }, 1800);
}

hydrateUi();
bindControls();
bindAudioButton();
hideLoaderWhenReady();
bootSelectedGame();
