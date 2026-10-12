import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";
import { createAvatarReveal } from "./avatar-reveal.js";

export function attachAvatarModal(trigger) {
  const dialog = document.createElement("dialog");
  dialog.className = "avatar-modal";
  dialog.setAttribute("aria-labelledby", "avatar-modal-title");
  dialog.innerHTML = `<header><div><h2 id="avatar-modal-title">Moi, en 55 726 splats</h2><p class="avatar-modal-count" hidden></p></div><button type="button" aria-label="Fermer">×</button></header><div class="avatar-modal-stage"></div><footer><button class="avatar-modal-reset" type="button" disabled>De face</button><p role="status">Chargement…</p></footer>`;
  document.body.appendChild(dialog);
  const stage = dialog.querySelector(".avatar-modal-stage");
  const status = dialog.querySelector("[role=status]");
  const count = dialog.querySelector(".avatar-modal-count");
  const resetButton = dialog.querySelector(".avatar-modal-reset");
  let renderer, controls, mesh, observer;
  let previousOverflow;
  let generation = 0;

  const open = async () => {
    if (dialog.open) return;
    trigger.classList.remove("avatar-click-hint");
    dialog.showModal();
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    status.textContent = "Chargement…";
    count.hidden = true;
    resetButton.disabled = true;
    const request = ++generation;
    try {
      const response = await fetch("./assets/gs/mathis_fullbody_lite.sog");
      if (!response.ok) throw new Error("Modèle introuvable.");
      const data = await response.arrayBuffer();
      if (!data.byteLength) throw new Error("Le fichier du modèle est vide.");
      if (!dialog.open || request !== generation) return;
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      stage.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      scene.add(new SparkRenderer({ renderer }));
      const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
      mesh = new SplatMesh({ url: "./assets/gs/mathis_fullbody_lite.sog", lod: false });
      mesh.rotation.x = Math.PI;
      const pivot = new THREE.Group();
      pivot.rotation.y = Math.PI + THREE.MathUtils.degToRad(15);
      pivot.add(mesh);
      scene.add(pivot);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      observer = new ResizeObserver(() => {
        if (!stage.clientWidth || !stage.clientHeight) return;
        renderer.setSize(stage.clientWidth, stage.clientHeight);
        camera.aspect = stage.clientWidth / stage.clientHeight;
        camera.updateProjectionMatrix();
      });
      observer.observe(stage);
      await mesh.initialized;
      if (!dialog.open || request !== generation) return;
      const bounds = mesh.getBoundingBox(false);
      mesh.position.copy(bounds.getCenter(new THREE.Vector3()).applyQuaternion(mesh.quaternion)).negate();
      const radius = bounds.getSize(new THREE.Vector3()).length() / 2;
      const aspect = stage.clientWidth / stage.clientHeight;
      const halfFov = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * Math.min(1, aspect));
      camera.position.set(0, 0, radius / Math.sin(halfFov) * 0.7);
      camera.far = Math.max(1000, camera.position.z * 4);
      camera.updateProjectionMatrix();
      controls.update();
      controls.saveState();
      resetButton.disabled = false;
      count.textContent = `${new Intl.NumberFormat("fr-FR").format(mesh.numSplats)} splats`;
      count.hidden = false;
      const animateReveal = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? null : createAvatarReveal(mesh, radius);
      renderer.domElement.addEventListener("dblclick", () => controls.reset());
      status.textContent = "Glisse pour tourner · Molette ou pincement pour zoomer · Double clic pour recentrer";
      renderer.setAnimationLoop((time) => {
        animateReveal?.(time);
        controls.update();
        renderer.render(scene, camera);
      });
    } catch (error) {
      if (dialog.open && request === generation) status.textContent = error.message;
    }
  };
  dialog.querySelector("button").addEventListener("click", () => dialog.close());
  resetButton.addEventListener("click", () => controls?.reset());
  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener("close", () => {
    generation++;
    observer?.disconnect();
    renderer?.setAnimationLoop(null);
    controls?.dispose();
    mesh?.dispose();
    renderer?.dispose();
    stage.replaceChildren();
    observer = renderer = controls = mesh = undefined;
    document.body.style.overflow = previousOverflow;
    trigger.focus();
  });
  trigger.setAttribute("role", "button");
  trigger.setAttribute("aria-label", "Ouvrir l’avatar 3D complet");
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.classList.add("avatar-click-hint");
  trigger.addEventListener("click", open);
  trigger.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  });
}
