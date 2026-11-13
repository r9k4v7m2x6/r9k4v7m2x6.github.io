const BASELINE_GROUPS = [
  {
    id: "prior",
    title: "Prior PE methods",
    note: "",
    items: [
      { key: "RAPO", label: "RAPO" },
      { key: "VPO", label: "VPO" },
      { key: "Prompt-A-Video", label: "Prompt-A-Video" },
      { key: "SCMAPR", label: "SCMAPR" },
    ],
  },
  {
    id: "native",
    title: "Native PEs of modern commercial systems",
    note: "Both LTX-2.5-PE and H3-Context-IR's training methods and details are not disclosed.",
    items: [
      { key: "ltx", label: "LTX-2.5-PE" },
      { key: "h3", label: "H3-Context-IR" },
    ],
  },
  {
    id: "forward",
    title: "Forward rewriting baselines",
    note: "",
    items: [
      { key: "gemini", label: "Gemini-3.1-Pro" },
      { key: "qwen", label: "Qwen3.7-Max" },
      { key: "gpt", label: "GPT-5.4" },
    ],
  },
];

function makeDemo(id, videoPrefix, displayIndex, groups = BASELINE_GROUPS) {
  const flat = groups.flatMap((g) => g.items);
  return {
    id,
    displayIndex,
    groups,
    promptPath: `./assets/demo/${id}/prompt_en.txt`,
    pePath: `./assets/demo/${id}/pe_output.txt`,
    wo: `./assets/demo/${id}/${videoPrefix}_prompt.mp4`,
    pe: `./assets/demo/${id}/${videoPrefix}_WanPE.mp4`,
    baselines: flat.map((b) => ({
      ...b,
      video: `./assets/demo/${id}/${videoPrefix}_${b.key}.mp4`,
      textPath: `./assets/demo/${id}/pe_${b.key}.txt`,
      unavailablePath: `./assets/demo/${id}/pe_${b.key}_unavailable.txt`,
    })),
  };
}

const H3_BASELINE_GROUPS = BASELINE_GROUPS.filter((g) => g.id !== "forward");

// Section 1: Wan3.0
const DEMOS_WAN30 = ["demo1", "demo2", "demo3", "demo4", "demo5"].map((id, i) => {
  const d = makeDemo(id, "wan30", i + 1);
  d.wo = `./assets/demo/${id}/wan30_wo_pe.mp4`;
  d.pe = `./assets/demo/${id}/wan30_wanpe.mp4`;
  return d;
});

// Section 2: H3-Base — no forward rewriting APIs (assets and config both omit them).
const DEMOS_H3 = ["demo1", "demo2", "demo3", "demo4", "demo5"].map((id) => {
  const demo = makeDemo(id, "h3base", Number(id.replace("demo", "")), H3_BASELINE_GROUPS);
  if (id === "demo4") {
    demo.unavailableReason =
      "H3-Base supports videos of at most 15 seconds, while this case requires 30 seconds.";
  }
  return demo;
});

// Section 3: WanPE-only examples (prompt + enhanced prompt + video).
const DEMOS_S3 = ["s3demo1", "s3demo2", "s3demo3", "s3demo4", "s3demo5"].map((id, i) => ({
  id,
  displayIndex: i + 1,
  promptPath: `./assets/demo/${id}/prompt_en.txt`,
  pePath: `./assets/demo/${id}/pe_output.txt`,
  pe: `./assets/demo/${id}/wan30_wanpe.mp4`,
}));

function dismissWarning() {
  const el = document.getElementById("mobile-warning");
  if (el) el.style.display = "none";
}

async function loadText(path) {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.text()).trim();
  } catch (err) {
    return "";
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function videoPlayerHtml(src) {
  return `
    <div class="video-shell" data-src="${src}">
      <button type="button" class="video-load-btn" aria-label="Load video">
        <span class="video-load-icon" aria-hidden="true"></span>
        <span>Load video</span>
      </button>
      <button type="button" class="fs-btn" aria-label="Fullscreen" title="Fullscreen" hidden>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
          <path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm0-4h2V7h3V5H5v5h2zm10 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
        </svg>
      </button>
    </div>`;
}

function unavailableVideoHtml(reason) {
  return `<div class="video-unavailable" role="status">
    <div class="video-unavailable-title">Video unavailable</div>
    <div class="video-unavailable-body">${escapeHtml(reason)}</div>
  </div>`;
}

function rowPlayButtonHtml() {
  return `<button type="button" class="row-play-btn" data-state="paused" aria-pressed="false">
    <span class="play-icon" aria-hidden="true"></span>
    <span class="row-play-text">Play this row</span>
  </button>`;
}

function buildBaselineCard(b, text, unavailableReason) {
  const media = unavailableReason
    ? unavailableVideoHtml(unavailableReason)
    : videoPlayerHtml(b.video);

  const details = unavailableReason
    ? ""
    : `<details class="pe-details bl-details">
        <summary>
          <span class="pe-summary-copy">
            <span class="pe-summary-title">${escapeHtml(b.label)} enhanced prompt</span>
            <span class="pe-summary-hint">Click to view</span>
          </span>
          <span class="pe-summary-chevron" aria-hidden="true"></span>
        </summary>
        <div class="pe-body">${escapeHtml(text)}</div>
      </details>`;

  return `
    <div class="video-col baseline-col">
      <div class="video-card">
        <div class="video-label bl">${escapeHtml(b.label)}</div>
        ${media}
      </div>
      ${details}
    </div>
  `;
}

function buildGroupHtml(group, demo, payloadByKey) {
  const cards = group.items
    .map((item) => {
      const b = demo.baselines.find((x) => x.key === item.key);
      const payload = payloadByKey[item.key] || { text: "", unavailable: "" };
      return buildBaselineCard(b, payload.text, payload.unavailable);
    })
    .join("");
  const note = group.note
    ? `<p class="baseline-note">${escapeHtml(group.note)}</p>`
    : "";
  return `
    <div class="baseline-group video-row" data-group="${escapeHtml(group.id)}">
      <div class="video-row-head">
        <div class="baseline-head">${escapeHtml(group.title)}</div>
        ${rowPlayButtonHtml()}
      </div>
      ${note}
      <div class="baseline-grid cols-${group.items.length}">${cards}</div>
    </div>
  `;
}

function buildPeOnlyDemoCard(demo, promptText, peText) {
  const block = document.createElement("article");
  block.className = "demo-block";
  block.id = `s3-${demo.id}`;
  block.innerHTML = `
    <div class="demo-topbar">
      <div class="demo-index">Demo ${demo.displayIndex}</div>
      <div class="demo-controls">
        <div class="demo-speed-controls" role="group" aria-label="Playback speed for Demo ${demo.displayIndex}">
          <span class="speed-label">Speed</span>
          <button class="demo-speed-btn active" data-speed="1" type="button">x1</button>
          <button class="demo-speed-btn" data-speed="2" type="button">x2</button>
        </div>
      </div>
    </div>
    <div class="prompt-box">
      <div class="prompt-head">Prompt input</div>
      <div class="prompt-body">${escapeHtml(promptText)}</div>
    </div>
    <div class="video-row main-video-row">
      <div class="video-row-head">
        <div class="video-row-label">WanPE result</div>
      </div>
      <div class="compare-grid pe-only-grid">
        <div class="video-col">
          <div class="video-card">
            <div class="video-label pe">w/ WanPE</div>
            ${videoPlayerHtml(demo.pe)}
          </div>
          <details class="pe-details">
            <summary>
              <span class="pe-summary-copy">
                <span class="pe-summary-title">WanPE enhanced prompt</span>
                <span class="pe-summary-hint">Click to view</span>
              </span>
              <span class="pe-summary-chevron" aria-hidden="true"></span>
            </summary>
            <div class="pe-body">${escapeHtml(peText)}</div>
          </details>
        </div>
      </div>
    </div>
  `;
  return block;
}

async function renderPeOnlyDemoList(hostId, demos) {
  const host = document.getElementById(hostId);
  if (!host) return;
  for (const demo of demos) {
    const [prompt, pe] = await Promise.all([
      loadText(demo.promptPath),
      loadText(demo.pePath),
    ]);
    host.appendChild(buildPeOnlyDemoCard(demo, prompt, pe));
  }
}

function buildDemoCard(demo, promptText, peText, baselinePayloads, opts) {
  const block = document.createElement("article");
  block.className = "demo-block";
  block.id = opts.blockId || demo.id;

  const payloadByKey = {};
  demo.baselines.forEach((b, i) => {
    payloadByKey[b.key] = baselinePayloads[i];
  });
  const groups = opts.groups || demo.groups || BASELINE_GROUPS;
  const groupsHtml = groups.map((g) => buildGroupHtml(g, demo, payloadByKey)).join("");
  const primaryUnavailable = demo.unavailableReason || "";
  const demoMedia = primaryUnavailable
    ? `<div class="demo-unavailable-only">${unavailableVideoHtml(primaryUnavailable)}</div>`
    : `<div class="video-row main-video-row">
      <div class="video-row-head">
        <div class="video-row-label">Main comparison</div>
        ${rowPlayButtonHtml()}
      </div>
      <div class="compare-grid">
        <div class="video-col">
          <div class="video-card">
            <div class="video-label wo">w/o PE</div>
            ${videoPlayerHtml(demo.wo)}
          </div>
        </div>
        <div class="video-col">
          <div class="video-card">
            <div class="video-label pe">w/ WanPE</div>
            ${videoPlayerHtml(demo.pe)}
          </div>
          <details class="pe-details">
          <summary>
            <span class="pe-summary-copy">
              <span class="pe-summary-title">WanPE enhanced prompt</span>
              <span class="pe-summary-hint">Click to view</span>
            </span>
            <span class="pe-summary-chevron" aria-hidden="true"></span>
          </summary>
          <div class="pe-body">${escapeHtml(peText)}</div>
          </details>
        </div>
      </div>
    </div>
    <div class="baseline-section-title">${escapeHtml(opts.baselineTitle)}</div>
    ${groupsHtml}`;
  const demoControls = primaryUnavailable
    ? ""
    : `<div class="demo-controls">
        <div class="demo-speed-controls" role="group" aria-label="Playback speed for Demo ${demo.displayIndex}">
          <span class="speed-label">Speed</span>
          <button class="demo-speed-btn active" data-speed="1" type="button">x1</button>
          <button class="demo-speed-btn" data-speed="2" type="button">x2</button>
        </div>
      </div>`;

  block.innerHTML = `
    <div class="demo-topbar">
      <div class="demo-index">Demo ${demo.displayIndex}</div>
      ${demoControls}
    </div>
    <div class="prompt-box">
      <div class="prompt-head">Prompt input</div>
      <div class="prompt-body">${escapeHtml(promptText)}</div>
    </div>
    ${demoMedia}
  `;
  return block;
}

async function loadDemoPayload(demo) {
  if (demo.unavailableReason) {
    return {
      prompt: await loadText(demo.promptPath),
      pe: "",
      baselinePayloads: [],
    };
  }
  const [prompt, pe, ...baselinePayloads] = await Promise.all([
    loadText(demo.promptPath),
    loadText(demo.pePath),
    ...demo.baselines.map(async (b) => {
      const [text, unavailable] = await Promise.all([
        loadText(b.textPath),
        loadText(b.unavailablePath),
      ]);
        return { text, unavailable: demo.unavailableReason || unavailable };
    }),
  ]);
  return { prompt, pe, baselinePayloads };
}

async function renderDemoList(hostId, demos, opts) {
  const host = document.getElementById(hostId);
  if (!host) return;

  for (const demo of demos) {
    const { prompt, pe, baselinePayloads } = await loadDemoPayload(demo);
    host.appendChild(
      buildDemoCard(demo, prompt, pe, baselinePayloads, {
        baselineTitle: opts.baselineTitle,
        blockId: opts.idPrefix ? `${opts.idPrefix}-${demo.id}` : demo.id,
        groups: opts.groups,
      })
    );
  }
}

async function renderDemos() {
  await renderDemoList("demo-list", DEMOS_WAN30, {
    baselineTitle: "Other PE baselines on the same Wan3.0 generator",
  });
  await renderDemoList("demo-list-h3", DEMOS_H3, {
    baselineTitle: "Other PE baselines on the same H3-Base generator",
    idPrefix: "h3",
  });
  await renderPeOnlyDemoList("demo-list-s3", DEMOS_S3);
  setupFullscreenControls();
  setupPlayControls();
  setupSpeedControls();
  observeVideos();
}

/* ---------- play / pause state ----------
 * Nothing autoplays. A video only plays when:
 *   - its demo block is toggled on, or
 *   - the user hits play in the native controls.
 * Scrolling a video into view only lazy-loads its source (first frame).
 */
const rowPlaying = new Set();
const groupedVideos = new WeakSet();

function videosIn(root, create = false) {
  return [...root.querySelectorAll(".video-shell")]
    .map((shell) => (create ? createVideo(shell, true) : shell.querySelector("video.gallery-video")))
    .filter(Boolean);
}

function bindVideoEvents(v) {
  if (v.dataset.bound === "1") return;
  v.dataset.bound = "1";
  v.addEventListener("pointerdown", () => {
    groupedVideos.delete(v);
    v.muted = false;
  });
  v.addEventListener("keydown", () => {
    groupedVideos.delete(v);
    v.muted = false;
  });
  v.addEventListener("play", () => {
    if (!groupedVideos.has(v) && !shouldAutoplay(v)) v.muted = false;
  });
  v.addEventListener("ended", () => {
    groupedVideos.delete(v);
    const row = v.closest(".video-row");
    if (row) finishRowIfEnded(row);
  });
}

function setVideoLoadState(shell, state) {
  const btn = shell.querySelector(".video-load-btn");
  const label = btn?.querySelector("span:last-child");
  if (!btn) return;
  btn.classList.toggle("is-loading", state === "loading");
  btn.toggleAttribute("hidden", state === "ready");
  btn.setAttribute("aria-busy", state === "loading" ? "true" : "false");
  if (label) label.textContent = state === "loading" ? "Loading…" : "Load video";
}

function finishVideoLoading(shell, v) {
  if (shell.querySelector("video.gallery-video") !== v || v.dataset.eager !== "1") return;
  setVideoLoadState(shell, "ready");
  shell.querySelector(".fs-btn")?.removeAttribute("hidden");
}

function startVideoLoading(shell, v) {
  v.dataset.eager = "1";
  v.preload = "auto";
  setVideoLoadState(shell, "loading");
  if (v.readyState >= 2) finishVideoLoading(shell, v);
  else v.load();
}

function createVideo(shell, eager = false) {
  let v = shell.querySelector("video.gallery-video");
  if (v) {
    if (eager) startVideoLoading(shell, v);
    return v;
  }
  v = document.createElement("video");
  v.className = "gallery-video";
  v.muted = true;
  v.playsInline = true;
  v.controls = true;
  v.preload = "metadata";
  v.dataset.src = shell.dataset.src || "";
  v.src = v.dataset.src;
  shell.prepend(v);
  shell.classList.add("is-loaded");
  setVideoLoadState(shell, eager ? "loading" : "idle");
  bindVideoEvents(v);
  v.addEventListener("loadeddata", () => finishVideoLoading(shell, v));
  v.addEventListener("canplay", () => finishVideoLoading(shell, v));
  v.addEventListener("error", () => {
    if (shell.querySelector("video.gallery-video") !== v) return;
    v.remove();
    shell.classList.remove("is-loaded");
    setVideoLoadState(shell, "idle");
    shell.querySelector(".fs-btn")?.setAttribute("hidden", "");
  });
  if (eager) v.dataset.eager = "1";
  v.load();
  return v;
}

function releaseVideo(shell) {
  const v = shell.querySelector("video.gallery-video");
  if (!v || activeFullscreenElement() === v || shouldAutoplay(v)) return;
  groupedVideos.delete(v);
  v.pause();
  v.removeAttribute("src");
  v.load();
  v.remove();
  shell.classList.remove("is-loaded");
  setVideoLoadState(shell, "idle");
  shell.querySelector(".fs-btn")?.setAttribute("hidden", "");
}

function ensureLoaded(v) {
  if (!v.getAttribute("src") && v.dataset.src) {
    v.src = v.dataset.src;
    v.load();
  }
}

function shouldAutoplay(v) {
  const row = v.closest(".video-row");
  return !!(row && rowPlaying.has(row));
}

function rowIsPlaying(row) {
  return rowPlaying.has(row);
}

function playVideo(v, grouped = false) {
  ensureLoaded(v);
  v.playbackRate = demoSpeed(v.closest(".demo-block"));
  if (grouped) {
    groupedVideos.add(v);
    v.muted = true;
  }
  v.play().catch(() => {});
}

function setBtnState(btn, playing, textPlay, textPause) {
  if (!btn) return;
  btn.dataset.state = playing ? "playing" : "paused";
  btn.setAttribute("aria-pressed", String(playing));
  const t = btn.querySelector(".demo-play-text, .row-play-text");
  if (t) t.textContent = playing ? textPause : textPlay;
}

function syncDemoButtons() {
  document.querySelectorAll(".demo-block").forEach((block) => {
    block.querySelectorAll(".video-row").forEach((row) => {
      setBtnState(
        row.querySelector(".row-play-btn"),
        rowIsPlaying(row),
        "Play this row",
        "Pause this row"
      );
    });
  });
}

function setRowPlaying(row, on) {
  const block = row.closest(".demo-block");
  if (!block) return;
  if (on) rowPlaying.add(row);
  else rowPlaying.delete(row);
  syncDemoButtons();
  videosIn(row, on).forEach((v) => {
    if (on) {
      playVideo(v, true);
    } else if (activeFullscreenElement() !== v) {
      groupedVideos.delete(v);
      v.pause();
    }
  });
}

function finishRowIfEnded(row) {
  const videos = videosIn(row);
  if (!videos.length || !videos.every((v) => v.ended)) return;
  rowPlaying.delete(row);
  syncDemoButtons();
}

function setupPlayControls() {
  document.querySelectorAll(".demo-block").forEach((block) => {
    block.querySelectorAll(".video-row").forEach((row) => {
      const rowBtn = row.querySelector(".row-play-btn");
      if (!rowBtn || rowBtn.dataset.bound === "1") return;
      rowBtn.dataset.bound = "1";
      rowBtn.addEventListener("click", () => {
        const on = rowIsPlaying(row);
        setRowPlaying(row, !on);
      });
    });
  });
}

function demoSpeed(block) {
  const active = block?.querySelector(".demo-speed-btn.active");
  return Number(active?.dataset.speed || 1);
}

function syncDemoPlaybackSpeed(block, speed) {
  videosIn(block).forEach((v) => {
    v.playbackRate = speed;
  });
}

function activeFullscreenElement() {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement ||
    null
  );
}

async function enterFullscreen(video) {
  if (!video) return;
  ensureLoaded(video);
  groupedVideos.delete(video);
  video.muted = false;
  video.playbackRate = demoSpeed(video.closest(".demo-block"));
  video.play().catch(() => {});
  try {
    if (video.requestFullscreen) await video.requestFullscreen();
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
    else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
    else if (video.msRequestFullscreen) video.msRequestFullscreen();
  } catch (err) {
    /* ignore user-gesture / policy failures */
  }
}

async function exitFullscreen() {
  try {
    if (document.exitFullscreen) await document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
  } catch (err) {
    /* ignore */
  }
}

function setupFullscreenControls() {
  document.querySelectorAll(".video-shell").forEach((shell) => {
    const btn = shell.querySelector(".fs-btn");
    const loadBtn = shell.querySelector(".video-load-btn");
    if (!btn || btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const video = createVideo(shell, true);
      if (activeFullscreenElement() === video) exitFullscreen();
      else enterFullscreen(video);
    });
    loadBtn?.addEventListener("click", () => createVideo(shell, true));
    shell.addEventListener("dblclick", (e) => {
      e.preventDefault();
      const video = createVideo(shell, true);
      if (activeFullscreenElement() === video) exitFullscreen();
      else enterFullscreen(video);
    });
  });
}

function setupSpeedControls() {
  document.querySelectorAll(".demo-block").forEach((block) => {
    block.querySelectorAll(".demo-speed-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        block.querySelectorAll(".demo-speed-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        syncDemoPlaybackSpeed(block, Number(btn.dataset.speed || 1));
      });
    });
  });
}

function setupNavHighlight() {
  const links = Array.from(document.querySelectorAll(".nav-link"));
  const sections = links
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  const onScroll = () => {
    const y = window.scrollY + 140;
    let current = sections[0];
    for (const s of sections) {
      if (s.offsetTop <= y) current = s;
    }
    if (!current) return;
    links.forEach((a) => {
      a.classList.toggle("active", a.getAttribute("href") === `#${current.id}`);
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function observeVideos() {
  const shells = document.querySelectorAll(".video-shell");
  if (!("IntersectionObserver" in window)) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const shell = entry.target;
        clearTimeout(shell.releaseTimer);
        if (entry.isIntersecting) {
          const v = createVideo(shell);
          ensureLoaded(v);
          if (shouldAutoplay(v) && v.paused && !v.ended) playVideo(v, true);
        } else {
          const v = shell.querySelector("video.gallery-video");
          if (!v || activeFullscreenElement() === v || shouldAutoplay(v)) return;
          v.pause();
          // Keep a recently viewed player briefly so small scroll movements do
          // not repeatedly recreate it, then remove the native media element.
          shell.releaseTimer = setTimeout(() => releaseVideo(shell), 12000);
        }
      });
    },
    { rootMargin: "160px 0px", threshold: 0.01 }
  );

  shells.forEach((shell) => io.observe(shell));
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("dismiss-warning")?.addEventListener("click", dismissWarning);
  setupNavHighlight();
  renderDemos();
});
