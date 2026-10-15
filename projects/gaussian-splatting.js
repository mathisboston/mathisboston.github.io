const languageButton = document.getElementById("gs-language");
const themeButton = document.getElementById("gs-theme");
let pageLanguage = "fr";

languageButton?.addEventListener("click", () => {
  pageLanguage = pageLanguage === "fr" ? "en" : "fr";
  document.documentElement.lang = pageLanguage;
  languageButton.textContent = pageLanguage === "fr" ? "EN" : "FR";
  document.querySelectorAll("[data-fr][data-en]").forEach((element) => {
    element.textContent = element.dataset[pageLanguage];
  });
});

themeButton?.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;
  try { localStorage.setItem("theme", nextTheme); } catch {}
});

document.querySelectorAll("[data-appearance-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    const mode = button.dataset.appearanceMode;
    document.querySelectorAll("[data-appearance-mode]").forEach((control) => {
      control.setAttribute("aria-pressed", String(control === button));
    });
    document.querySelectorAll(".gs-appearance-image img").forEach((image) => {
      image.src = image.dataset[mode];
      image.parentElement.href = image.dataset[mode];
    });
  });
});

const pairModels = { sh3: "SH3", sg: "SG", voronoi: "VORONOI" };
let activeAppearanceMode = "rgb";
const pairA = document.getElementById("gs-pair-a");
const pairB = document.getElementById("gs-pair-b");
const pairImageA = document.getElementById("gs-pair-image-a");
const pairImageB = document.getElementById("gs-pair-image-b");
const pairStage = document.getElementById("gs-pair-stage");
const pairRange = document.getElementById("gs-pair-range");
const syncAppearancePair = () => {
  const asset = (model) => `../assets/projects/gaussian-splatting/APPEARANCE-${pairModels[model]}-${activeAppearanceMode.toUpperCase()}.jpg`;
  pairImageA.src = asset(pairA.value);
  pairImageB.src = asset(pairB.value);
  document.getElementById("gs-pair-label-a").textContent = pairA.selectedOptions[0].textContent;
  document.getElementById("gs-pair-label-b").textContent = pairB.selectedOptions[0].textContent;
  pairImageA.alt = pairA.selectedOptions[0].textContent;
  pairImageB.alt = pairB.selectedOptions[0].textContent;
};
pairA.addEventListener("change", syncAppearancePair);
pairB.addEventListener("change", syncAppearancePair);
pairRange.addEventListener("input", () => pairStage.style.setProperty("--split", `${pairRange.value}%`));
document.querySelectorAll("[data-appearance-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    activeAppearanceMode = button.dataset.appearanceMode;
    syncAppearancePair();
  });
});
document.getElementById("gs-language").addEventListener("click", () => {
  pairRange.setAttribute("aria-label", pairRange.dataset[document.documentElement.lang === "fr" ? "ariaFr" : "ariaEn"]);
});
syncAppearancePair();
