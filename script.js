// ebe lab — slider + panels

const SLIDER_IMAGES = [
  "20251005_125516.jpg",
  "20251011_115922.jpg",
  "20251018_194626.jpg",
  "20251030_175124.jpg",
  "20251103_210807.jpg",
  "20251119_180109.jpg",
  "20251124_113220.jpg",
  "20251204_221333.jpg",
  "20251211_170545.jpg",
  "20251211_171041.jpg",
  "20251221_145540.jpg",
  "20251222_192645.jpg",
  "20251224_091135.jpg",
  "20251224_120123.jpg",
  "20251230_081842.jpg",
  "20251230_082524.jpg",
  "20251230_082806.jpg",
  "20260111_143851.jpg",
  "20260111_144011.jpg",
  "20260116_185828.jpg",
  "20260116_185924.jpg",
  "20260116_185955.jpg",
  "20260116_190037.jpg",
  "20260116_190054.jpg",
  "20260117_1512512.jpg",
  "20260119_150513.jpg",
  "20260122_121203.jpg",
  "20260122_121217.jpg",
  "20260122_121243.jpg",
  "20260123_184654.jpg",
  "20260125_150006.jpg",
  "20260125_150013.jpg",
  "20260126_163158.jpg",
  "20260129_114220.jpg",
  "20260201_191535.jpg",
  "20260203_204852.jpg",
  "20260203_213427.jpg",
  "20260216_131705.jpg",
  "20260216_131742~2.jpg",
  "20260218_140024~2.jpg",
  "20260219_173047~2.jpg",
  "20260226_222349~2.jpg",
  "20260228_154628.jpg",
  "20260301_132647.jpg",
  "20260303_202735.jpg",
  "20260305_184337.jpg",
  "20260305_185553.jpg",
  "20260308_194523.jpg",
  "20260308_194603.jpg",
  "20260309_134436.jpg",
  "20260404_193809.jpg",
  "20260415_200717(0).jpg",
  "20260415_200724.jpg",
  "20260416_130929.jpg",
  "20260417_193716.jpg",
  "20260418_111819.jpg",
  "20260418_184832.jpg",
  "20260421_094544.jpg",
  "20260421_095553.jpg",
  "20260421_095847.jpg",
  "20260428_200100.jpg",
  "20260429_200047.jpg",
  "20260429_200529.jpg",
  "20260430_183516.jpg"
];

const SLIDE_INTERVAL_MS = 6000;
const BASE_PATH = "assets/slider-web/";
const IMG_EXT = ".webp";

const STORES = {
  etsy: "https://www.etsy.com/shop/ebelab",
  shopify: "https://lab.evelyndooley.com"
};

// ---------- slider ----------

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildSlide(filename) {
  const slide = document.createElement("div");
  slide.className = "slide";

  const img = new Image();
  img.alt = "";
  img.decoding = "async";
  img.loading = "lazy";
  const stem = filename.replace(/\.[a-z0-9]+$/i, "");
  img.src = BASE_PATH + encodeURI(stem) + IMG_EXT;

  img.addEventListener("load", () => {
    if (img.naturalWidth >= img.naturalHeight) {
      slide.classList.add("is-landscape");
    } else {
      slide.classList.add("is-portrait");
    }
  });

  slide.appendChild(img);
  return slide;
}

const slider = document.getElementById("slider");
const order = shuffle(SLIDER_IMAGES);
const slides = order.map(buildSlide);
slides.forEach((s) => slider.appendChild(s));

let currentIndex = 0;
slides[0]?.classList.add("active");

// eagerly load the first couple of slides
slides.slice(0, 3).forEach((s) => {
  const img = s.querySelector("img");
  if (img) img.loading = "eager";
});

function show(index) {
  const next = ((index % slides.length) + slides.length) % slides.length;
  slides[currentIndex].classList.remove("active");
  slides[next].classList.add("active");
  currentIndex = next;

  // preload the one after
  const ahead = slides[(next + 1) % slides.length]?.querySelector("img");
  if (ahead && !ahead.complete) ahead.loading = "eager";
}

let timer = null;
function startAuto() {
  stopAuto();
  if (slides.length < 2) return;
  timer = setInterval(() => show(currentIndex + 1), SLIDE_INTERVAL_MS);
}
function stopAuto() {
  if (timer) clearInterval(timer);
  timer = null;
}

document.getElementById("prev").addEventListener("click", () => {
  show(currentIndex - 1);
  startAuto();
});
document.getElementById("next").addEventListener("click", () => {
  show(currentIndex + 1);
  startAuto();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") { show(currentIndex + 1); startAuto(); }
  else if (e.key === "ArrowLeft") { show(currentIndex - 1); startAuto(); }
  else if (e.key === "Escape") { closeAllPanels(); }
});

// pause when tab hidden
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopAuto(); else startAuto();
});

// touch swipe
let touchStartX = null;
slider.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) touchStartX = e.touches[0].clientX;
}, { passive: true });
slider.addEventListener("touchend", (e) => {
  if (touchStartX === null) return;
  const dx = (e.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
  if (Math.abs(dx) > 40) {
    show(currentIndex + (dx < 0 ? 1 : -1));
    startAuto();
  }
  touchStartX = null;
}, { passive: true });

startAuto();

// ---------- store buttons ----------

document.getElementById("etsy-btn").href = STORES.etsy;
document.getElementById("shopify-btn").href = STORES.shopify;

// ---------- panels ----------

const backdrop = document.getElementById("panel-backdrop");
const panels = {
  about: document.getElementById("about-panel"),
  contact: document.getElementById("contact-panel")
};

function openPanel(name) {
  closeAllPanels();
  const p = panels[name];
  if (!p) return;
  p.classList.add("open");
  p.setAttribute("aria-hidden", "false");
  backdrop.classList.add("open");
  backdrop.setAttribute("aria-hidden", "false");
}

function closeAllPanels() {
  Object.values(panels).forEach((p) => {
    p.classList.remove("open");
    p.setAttribute("aria-hidden", "true");
  });
  backdrop.classList.remove("open");
  backdrop.setAttribute("aria-hidden", "true");
}

document.querySelectorAll(".menu-box").forEach((btn) => {
  btn.addEventListener("click", () => openPanel(btn.dataset.panel));
});

document.querySelectorAll(".panel-close").forEach((btn) => {
  btn.addEventListener("click", closeAllPanels);
});

backdrop.addEventListener("click", closeAllPanels);
