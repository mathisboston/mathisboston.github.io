import * as THREE from "three";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";
import { attachAvatarModal } from "./avatar-modal.js";

// =====================
// AVATAR SCENE
// =====================
const avatarContainer = document.getElementById("avatar");
attachAvatarModal(avatarContainer);
const avatarHome = avatarContainer.parentElement;
const mobileAvatarSlot = document.getElementById("mobile-avatar-slot");
const mobileLayout = window.matchMedia("(max-width: 768px), (max-width: 1024px) and (max-height: 500px)");
const placeAvatar = () => {
  if (mobileLayout.matches) mobileAvatarSlot.appendChild(avatarContainer);
  else avatarHome.prepend(avatarContainer);
};
placeAvatar();
mobileLayout.addEventListener("change", placeAvatar);
const avatarRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
avatarRenderer.setSize(avatarContainer.clientWidth, avatarContainer.clientHeight);
avatarRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const avatarCanvas = avatarRenderer.domElement;
avatarContainer.appendChild(avatarCanvas);

const avatarScene = new THREE.Scene();
const avatarCamera = new THREE.PerspectiveCamera(60, 1, 0.01, 1000);
const avatarResizeObserver = new ResizeObserver(() => {
  const width = avatarContainer.clientWidth;
  const height = avatarContainer.clientHeight;
  if (!width || !height) return;
  avatarRenderer.setSize(width, height);
  avatarCamera.aspect = width / height;
  avatarCamera.updateProjectionMatrix();
});
avatarResizeObserver.observe(avatarContainer);

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

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let mobileLookTime = 0;
let yaw = Math.PI;
let pitch = 0;
avatarPivot.rotation.y = yaw;
let lastAvatarFrameTime = null;

const resetAvatarLook = () => {
  yaw = Math.PI;
  pitch = 0;
  mobileLookTime = 0;
};
document.documentElement.addEventListener("mouseleave", resetAvatarLook);
window.addEventListener("blur", resetAvatarLook);
mobileLayout.addEventListener("change", resetAvatarLook);
reducedMotion.addEventListener("change", resetAvatarLook);

window.addEventListener("mousemove", (e) => {
  if (mobileLayout.matches) return;
  const rect = avatarCanvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const cursorX = e.clientX - (rect.left + rect.width / 2);
  const cursorY = e.clientY - (rect.top + rect.height / 2);
  // Convert the screen offset to a viewing angle using the camera's focal length.
  const focalLength = rect.height / (2 * Math.tan(THREE.MathUtils.degToRad(avatarCamera.fov / 2)));
  yaw = Math.PI + Math.atan2(cursorX, focalLength);
  pitch = THREE.MathUtils.clamp(
    -Math.atan2(cursorY, Math.hypot(cursorX, focalLength)),
    -Math.PI / 3,
    Math.PI / 3,
  );
});

// Load LinkedIn only when the visitor opens a demonstrator.
document.querySelectorAll(".linkedin-demo").forEach((demo) => {
  demo.addEventListener("toggle", () => {
    if (!demo.open || demo.querySelector("iframe")) return;
    const frame = document.createElement("iframe");
    frame.src = demo.dataset.embed;
    frame.title = demo.querySelector(".demo-title").textContent;
    frame.allow = "fullscreen";
    frame.allowFullscreen = true;
    demo.querySelector(".linkedin-player").appendChild(frame);
  });
});

avatarRenderer.setAnimationLoop((time) => {
  const delta = lastAvatarFrameTime === null ? 0 : Math.min((time - lastAvatarFrameTime) / 1000, 0.1);
  lastAvatarFrameTime = time;
  if (mobileLayout.matches) {
    // A gentle 12-second sweep keeps the face visible without touch input.
    if (!reducedMotion.matches) mobileLookTime += delta;
    yaw = Math.PI + (reducedMotion.matches ? 0 : Math.sin(mobileLookTime * Math.PI / 6) * THREE.MathUtils.degToRad(20));
    pitch = 0;
    if (reducedMotion.matches) avatarPivot.rotation.set(0, Math.PI, 0);
  }
  const blend = 1 - Math.exp(-12 * delta);
  const yawDelta = Math.atan2(Math.sin(yaw - avatarPivot.rotation.y), Math.cos(yaw - avatarPivot.rotation.y));
  avatarPivot.rotation.y += yawDelta * blend;
  avatarPivot.rotation.x = THREE.MathUtils.lerp(avatarPivot.rotation.x, pitch, blend);
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
