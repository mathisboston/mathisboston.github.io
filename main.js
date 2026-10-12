import * as THREE from "three";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";

// =====================
// AVATAR SCENE
// =====================
const avatarContainer = document.getElementById("avatar");
const avatarRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
avatarRenderer.setSize(avatarContainer.clientWidth, avatarContainer.clientHeight);
avatarRenderer.setPixelRatio(window.devicePixelRatio);
const avatarCanvas = avatarRenderer.domElement;
avatarContainer.appendChild(avatarCanvas);

const avatarScene = new THREE.Scene();
const avatarCamera = new THREE.PerspectiveCamera(60, 1, 0.01, 1000);

const avatarSpark = new SparkRenderer({ renderer: avatarRenderer });
avatarScene.add(avatarSpark);

const avatarSplat = new SplatMesh({ url: "./assets/gs/mathis_headneck_lite_low_cleaned.sog", lod: false });
const avatarTarget = new THREE.Vector3(0, 0, 0);
avatarSplat.rotation.x = Math.PI;
const avatarPivot = new THREE.Group();
avatarPivot.rotation.order = "YXZ";
avatarPivot.add(avatarSplat);
avatarScene.add(avatarPivot);
let avatarRadius = 1.5;

avatarSplat.initialized.then(() => {
  // Center the model inside a parent pivot so it can rotate in place.
  const bounds = avatarSplat.getBoundingBox(false);
  const center = bounds.getCenter(new THREE.Vector3()).applyQuaternion(avatarSplat.quaternion);
  avatarSplat.position.copy(center).negate();

  // Fit the complete head-and-neck bounds with a little breathing room.
  const size = bounds.getSize(new THREE.Vector3());
  const boundsRadius = size.length() / 2;
  avatarRadius = boundsRadius / Math.sin(THREE.MathUtils.degToRad(avatarCamera.fov / 2)) * 0.92;
}).catch((error) => console.error("Avatar splat failed to load:", error));

let isDragging = false;
let lastX = 0;
let lastY = 0;
let yaw = Math.PI;
let pitch = 0;

avatarCanvas.addEventListener("mousedown", (e) => {
  isDragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
});

// touch support
avatarCanvas.addEventListener("touchstart", (e) => {
  isDragging = true;
  lastX = e.touches[0].clientX;
  lastY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener("mouseup", () => { isDragging = false; });
window.addEventListener("touchend", () => { isDragging = false; });

window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  yaw  -= (e.clientX - lastX) * 0.005;
  pitch -= (e.clientY - lastY) * 0.005;
  pitch  = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));
  lastX = e.clientX;
  lastY = e.clientY;
});

window.addEventListener("touchmove", (e) => {
  if (!isDragging) return;
  yaw  -= (e.touches[0].clientX - lastX) * 0.005;
  pitch -= (e.touches[0].clientY - lastY) * 0.005;
  pitch  = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));
  lastX = e.touches[0].clientX;
  lastY = e.touches[0].clientY;
}, { passive: true });

avatarRenderer.setAnimationLoop(() => {
  if (!isDragging) yaw += 0.01;
  avatarPivot.rotation.y = yaw;
  avatarPivot.rotation.x = pitch;
  avatarCamera.position.set(0, 0, avatarRadius);
  avatarCamera.lookAt(avatarTarget);
  avatarRenderer.render(avatarScene, avatarCamera);
});

// =====================
// THEME TOGGLE
// =====================
const themeToggle = document.getElementById("theme-toggle");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
let currentTheme = localStorage.getItem("theme") || (prefersDark ? "dark" : "light");

const setTheme = (theme) => {
  currentTheme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
};

themeToggle.addEventListener("click", () => {
  setTheme(currentTheme === "dark" ? "light" : "dark");
});

// init theme
setTheme(currentTheme);

// =====================
// LANGUAGE TOGGLE
// =====================
const toggle = document.getElementById("lang-toggle");
let lang = "fr";

toggle.addEventListener("click", () => {
  lang = lang === "fr" ? "en" : "fr";
  toggle.textContent = lang === "fr" ? "EN" : "FR";
  document.querySelectorAll("[data-fr]").forEach(el => {
    el.textContent = el.dataset[lang];
  });
});

// init text
document.querySelectorAll("[data-fr]").forEach(el => {
  el.textContent = el.dataset["fr"];
});

// =====================
// SCROLL REVEAL
// =====================
const revealEls = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach(el => revealObserver.observe(el));

// =====================
// ACTIVE NAV HIGHLIGHT
// =====================
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-item");

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        const isActive = link.getAttribute("href") === `#${entry.target.id}`;
        link.classList.toggle("active", isActive);
        if (isActive) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }
  });
}, { threshold: 0.0, rootMargin: "-10% 0px -85% 0px" });

sections.forEach(s => navObserver.observe(s));
