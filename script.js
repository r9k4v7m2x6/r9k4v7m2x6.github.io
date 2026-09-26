const DEMOS = ["demo1", "demo2", "demo3", "demo4", "demo5"].map((id) => ({
  id,
  promptPath: `./assets/demo/${id}/prompt_en.txt`,
  pePath: `./assets/demo/${id}/pe_output.txt`,
  wo: `./assets/demo/${id}/wan30_wo_pe.mp4`,
  pe: `./assets/demo/${id}/wan30_wanpe_397B.mp4`,
}));

function dismissWarning() {
  const el = document.getElementById("mobile-warning");
  if (el) el.style.display = "none";
}

async function loadText(path) {
  try {
    const res = await fetch(path);
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

function buildDemoCard(demo, index, promptText, peText) {
  const block = document.createElement("article");
  block.className = "demo-block";
  block.id = demo.id;

  block.innerHTML = `
    <div class="demo-index">Demo ${index + 1}</div>
    <div class="prompt-box">
      <div class="prompt-head">Prompt input</div>
      <div class="prompt-body">${escapeHtml(promptText)}</div>
    </div>
    <div class="compare-grid">
      <div class="video-col">
        <div class="video-card">
          <div class="video-label wo">w/o PE</div>
          <video class="gallery-video" loop muted playsinline controls preload="none" data-src="${demo.wo}"></video>
        </div>
      </div>
      <div class="video-col">
        <div class="video-card">
          <div class="video-label pe">w/ WanPE</div>
          <video class="gallery-video" loop muted playsinline controls preload="none" data-src="${demo.pe}"></video>
        </div>
        <details class="pe-details">
          <summary>WanPE enhanced prompt</summary>
          <div class="pe-body">${escapeHtml(peText)}</div>
        </details>
      </div>
    </div>
  `;
  return block;
}

async function renderDemos() {
  const host = document.getElementById("demo-list");
  if (!host) return;

  for (let i = 0; i < DEMOS.length; i++) {
    const demo = DEMOS[i];
    const [prompt, pe] = await Promise.all([loadText(demo.promptPath), loadText(demo.pePath)]);
    host.appendChild(buildDemoCard(demo, i, prompt, pe));
  }

  syncPlaybackSpeed(currentSpeed());
  observeVideos();
}

function currentSpeed() {
  const active = document.querySelector(".speed-btn.active");
  return Number(active?.dataset.speed || 1);
}

function syncPlaybackSpeed(speed) {
  document.querySelectorAll("video.gallery-video").forEach((v) => {
    v.playbackRate = speed;
  });
}

function setupSpeedControls() {
  document.querySelectorAll(".speed-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".speed-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      syncPlaybackSpeed(Number(btn.dataset.speed || 1));
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
  const videos = document.querySelectorAll("video.gallery-video");
  if (!("IntersectionObserver" in window)) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const v = entry.target;
        if (entry.isIntersecting) {
          if (!v.src && v.dataset.src) {
            v.src = v.dataset.src;
            v.load();
          }
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      });
    },
    { rootMargin: "400px 0px", threshold: 0.01 }
  );

  videos.forEach((v) => io.observe(v));
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("dismiss-warning")?.addEventListener("click", dismissWarning);
  setupSpeedControls();
  setupNavHighlight();
  renderDemos();
});
