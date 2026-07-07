const nav = document.querySelector("[data-nav]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const menuClose = document.querySelector("[data-menu-close]");
const syncButton = document.querySelector("[data-sync]");
const copyButton = document.querySelector("[data-copy]");
const viewButtons = document.querySelectorAll("[data-view]");
const statePanels = document.querySelectorAll("[data-state]");
const citySelect = document.querySelector("[data-city-select]");
const ratioDisplay = document.querySelector("[data-ratio-display]");
const gridDisplay = document.querySelector("[data-grid-display]");
const igpDisplay = document.querySelector("[data-igp-display]");
const simForm = document.querySelector("[data-sim-form]");
const simViewButtons = document.querySelectorAll("[data-sim-view]");
const simIdle = document.querySelector("[data-sim-idle]");
const simOutput = document.querySelector("[data-sim-output]");
const activeCity = document.querySelector("[data-active-city]");
const activeView = document.querySelector("[data-active-view]");
const resultTitle = document.querySelector("[data-result-title]");
const resultSubtitle = document.querySelector("[data-result-subtitle]");
const resultState = document.querySelector("[data-result-state]");
const readoutRatio = document.querySelector("[data-readout-ratio]");
const readoutGrid = document.querySelector("[data-readout-grid]");
const readoutStatus = document.querySelector("[data-readout-status]");
const readoutIgp = document.querySelector("[data-readout-igp]");
const analysisSteps = document.querySelector("[data-analysis-steps]");
const analysisCells = document.querySelector("[data-analysis-cells]");
const analysisRatio = document.querySelector("[data-analysis-ratio]");
const analysisIgp = document.querySelector("[data-analysis-igp]");
const idleCity = document.querySelector("[data-idle-city]");
const idleGrid = document.querySelector("[data-idle-grid]");
const idleIgp = document.querySelector("[data-idle-igp]");

const IGP_LABEL = "本地5x5 / 外来3x3";
const IGP_COMPACT = "5x5/3x3";
const MAX_STEP = 49;
const STEP_INTERVAL_MS = 185;

const cities = [
  { slug: "Beijing", name: "北京", ratio: "5 : 6", grid: "202 : 262" },
  { slug: "Chengdu", name: "成都", ratio: "5 : 2", grid: "169 : 239" },
  { slug: "Chongqing", name: "重庆", ratio: "9 : 5", grid: "506 : 613" },
  { slug: "Dalian", name: "大连", ratio: "9 : 4", grid: "185 : 304" },
  { slug: "Dongguan", name: "东莞", ratio: "3 : 2", grid: "61 : 93" },
  { slug: "Shanghai", name: "上海", ratio: "3 : 4", grid: "147 : 157" },
  { slug: "Qingdao", name: "青岛", ratio: "3 : 1", grid: "196 : 184" },
  { slug: "Hangzhou", name: "杭州", ratio: "7 : 5", grid: "173 : 299" },
  { slug: "Harbin", name: "哈尔滨", ratio: "4 : 1", grid: "327 : 570" },
  { slug: "Zhengzhou", name: "郑州", ratio: "5 : 1", grid: "91 : 187" },
  { slug: "Shenzhen", name: "深圳", ratio: "3 : 2", grid: "58 : 109" },
  { slug: "Xi'an", name: "西安", ratio: "3 : 1", grid: "131 : 271" },
  { slug: "Changsha", name: "长沙", ratio: "4 : 1", grid: "102 : 296" },
  { slug: "Wuhan", name: "武汉", ratio: "5 : 2", grid: "174 : 173" },
  { slug: "Foshan", name: "佛山", ratio: "3 : 2", grid: "117 : 125" },
  { slug: "Jinan", name: "济南", ratio: "3 : 1", grid: "194 : 220" },
  { slug: "Shenyang", name: "沈阳", ratio: "9 : 4", grid: "231 : 174" },
  { slug: "Guangzhou", name: "广州", ratio: "3 : 2", grid: "172 : 138" },
  { slug: "Tianjin", name: "天津", ratio: "9 : 5", grid: "212 : 170" },
  { slug: "Kunming", name: "昆明", ratio: "7 : 2", grid: "270 : 188" },
  { slug: "Nanjing", name: "南京", ratio: "5 : 2", grid: "173 : 110" },
];

let selectedSimView = "combined";
let hasRun = false;
let currentStep = 0;
let stepTimer = null;

function setVisibleState(nextState) {
  statePanels.forEach((panel) => {
    panel.hidden = panel.dataset.state !== nextState;
  });

  viewButtons.forEach((button) => {
    const selected = button.dataset.view === nextState;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function addOptions(selectElement, options, getValue, getLabel) {
  if (!selectElement) {
    return;
  }

  selectElement.innerHTML = "";
  options.forEach((item) => {
    const option = document.createElement("option");
    option.value = getValue(item);
    option.textContent = getLabel(item);
    selectElement.appendChild(option);
  });
}

function currentCity() {
  return cities.find((city) => city.slug === citySelect?.value) ?? cities[1];
}

function pairValues(pair) {
  return pair.split(":").map((part) => part.trim());
}

function ratioValue(city = currentCity()) {
  return city.ratio;
}

function gridValue(city = currentCity()) {
  return city.grid;
}

function gridDisplayValue(city = currentCity()) {
  return compactPair(gridValue(city)).replace(":", "x");
}

function compactPair(pair) {
  return pair.replaceAll(" ", "");
}

function formatNumber(value) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

function gridCellCount(city = currentCity()) {
  const [rows, columns] = pairValues(gridValue(city)).map(Number);
  if (!Number.isFinite(rows) || !Number.isFinite(columns)) {
    return null;
  }

  return rows * columns;
}

function setStep(value) {
  currentStep = value;
  if (analysisSteps) {
    analysisSteps.textContent = String(value);
  }
}

function stopStepTicker() {
  if (stepTimer) {
    window.clearInterval(stepTimer);
    stepTimer = null;
  }
}

function startStepTicker() {
  stopStepTicker();
  setStep(1);
  stepTimer = window.setInterval(() => {
    setStep(currentStep >= MAX_STEP ? 1 : currentStep + 1);
  }, STEP_INTERVAL_MS);
}

function currentViewLabel() {
  if (selectedSimView === "agent") {
    return "人群轨迹";
  }

  if (selectedSimView === "heatmap") {
    return "需求热力";
  }

  return "综合";
}

function simMediaPath(city, view) {
  if (view === "agent") {
    return `./assets/sim/views/${city.slug}/video_agent.gif`;
  }

  if (view === "heatmap") {
    return `./assets/sim/views/${city.slug}/video_heatmap.gif`;
  }

  return `./assets/sim/combined/${city.slug}/video-fast.gif`;
}

function syncReadout(city) {
  const viewLabel = currentViewLabel();
  const cells = gridCellCount(city);
  const statusLabel = hasRun ? "运行中" : "待运行";

  if (activeCity) activeCity.textContent = city.name;
  if (activeView) activeView.textContent = viewLabel;
  if (resultTitle) resultTitle.textContent = city.name;
  if (resultSubtitle) resultSubtitle.textContent = `${viewLabel}视图`;
  if (resultState) resultState.textContent = statusLabel;
  if (ratioDisplay) ratioDisplay.textContent = compactPair(ratioValue(city));
  if (gridDisplay) gridDisplay.textContent = gridDisplayValue(city);
  if (igpDisplay) igpDisplay.textContent = IGP_LABEL;
  if (readoutRatio) readoutRatio.textContent = ratioValue(city);
  if (readoutGrid) readoutGrid.textContent = gridDisplayValue(city);
  if (readoutStatus) readoutStatus.textContent = statusLabel;
  if (readoutIgp) readoutIgp.textContent = IGP_COMPACT;
  if (!hasRun) setStep(0);
  if (analysisCells) analysisCells.textContent = cells ? formatNumber(cells) : "未定";
  if (analysisRatio) analysisRatio.textContent = compactPair(ratioValue(city));
  if (analysisIgp) analysisIgp.textContent = IGP_COMPACT;
  if (idleCity) idleCity.textContent = city.name;
  if (idleGrid) idleGrid.textContent = gridDisplayValue(city);
  if (idleIgp) idleIgp.textContent = IGP_LABEL;
}

function updateSimMedia({ restart = false } = {}) {
  const city = currentCity();
  if (!simOutput && !simIdle) {
    syncReadout(city);
    return;
  }

  if (!hasRun) {
    stopStepTicker();
    if (simIdle) {
      simIdle.hidden = false;
    }
    if (simOutput) {
      simOutput.hidden = true;
      simOutput.removeAttribute("src");
      simOutput.alt = "";
    }
    syncReadout(city);
    return;
  }

  const mediaPath = simMediaPath(city, selectedSimView);
  if (simIdle) {
    simIdle.hidden = true;
  }
  if (simOutput) {
    simOutput.hidden = false;
    simOutput.src = restart ? `${mediaPath}?t=${Date.now()}` : mediaPath;
    simOutput.alt = `${city.name}灾时人群移动${currentViewLabel()}视图`;
  }
  startStepTicker();
  syncReadout(city);
}

function setCityDefaults() {
  hasRun = false;
  updateSimMedia();
}

menuToggle?.addEventListener("click", () => {
  nav?.classList.add("is-open");
});

menuClose?.addEventListener("click", () => {
  nav?.classList.remove("is-open");
});

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setVisibleState(button.dataset.view);
  });
});

addOptions(citySelect, cities, (city) => city.slug, (city) => city.name);

if (citySelect) {
  citySelect.value = "Chengdu";
  setCityDefaults();
}

citySelect?.addEventListener("change", setCityDefaults);

simViewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedSimView = button.dataset.simView;
    simViewButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    if (hasRun) {
      updateSimMedia({ restart: true });
      return;
    }
    syncReadout(currentCity());
  });
});

simForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  hasRun = true;
  updateSimMedia({ restart: true });
});

syncButton?.addEventListener("click", () => {
  setVisibleState("loading");
  window.setTimeout(() => {
    setVisibleState("plan");
  }, 850);
});

copyButton?.addEventListener("click", async () => {
  const command = document.querySelector(".terminal code")?.textContent?.trim();
  if (!command) {
    return;
  }

  try {
    await navigator.clipboard.writeText(command);
    copyButton.textContent = "已复制";
    window.setTimeout(() => {
      copyButton.textContent = "复制";
    }, 1000);
  } catch {
    copyButton.textContent = "手动复制";
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    nav?.classList.remove("is-open");
  }
});
