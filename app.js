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
const adviceCity = document.querySelector("[data-advice-city]");
const adviceContext = document.querySelector("[data-advice-context]");
const adviceView = document.querySelector("[data-advice-view]");
const adviceGrid = document.querySelector("[data-advice-grid]");
const adviceStatus = document.querySelector("[data-advice-status]");
const adviceOutput = document.querySelector("[data-advice-output]");
const adviceButton = document.querySelector("[data-generate-advice]");
const adviceForm = document.querySelector("[data-advice-form]");
const adviceInput = document.querySelector("[data-advice-input]");
const adviceAnswer = document.querySelector("[data-advice-answer]");

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
let adviceGenerated = false;

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

function cityScale(city = currentCity()) {
  const cells = gridCellCount(city) ?? 0;
  if (cells >= 120000) {
    return "超大网格";
  }
  if (cells >= 50000) {
    return "大范围网格";
  }
  return "紧凑网格";
}

function populationMix(city = currentCity()) {
  const [local, nonlocal] = pairValues(ratioValue(city)).map(Number);
  if (!Number.isFinite(local) || !Number.isFinite(nonlocal) || nonlocal === 0) {
    return "本地与外来人群混合";
  }
  if (local / nonlocal >= 2.5) {
    return "本地居民占比较高";
  }
  if (nonlocal / local >= 1.1) {
    return "外来通勤与流动人群占比较高";
  }
  return "本地与外来人群接近均衡";
}

function viewFocus() {
  if (selectedSimView === "agent") {
    return "人群轨迹";
  }
  if (selectedSimView === "heatmap") {
    return "需求热力";
  }
  return "综合错配";
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
  syncAdviceShell(city);
}

function syncAdviceShell(city = currentCity()) {
  if (adviceCity) adviceCity.textContent = city.name;
  if (adviceView) adviceView.textContent = viewFocus();
  if (adviceGrid) adviceGrid.textContent = gridDisplayValue(city);
  if (adviceStatus) adviceStatus.textContent = hasRun ? "已运行" : "待运行";
  if (adviceContext) {
    adviceContext.textContent = hasRun
      ? `${city.name}已完成${viewFocus()}推演，可读取错配诊断并形成规划建议。`
      : `当前选择${city.name}，${viewFocus()}视图。运行推演后生成本次规划建议。`;
  }
  if (adviceButton) {
    adviceButton.disabled = !hasRun;
    adviceButton.textContent = hasRun ? "读取当前结果" : "等待推演";
  }
}

function clearAdvice() {
  adviceGenerated = false;
  syncAdviceShell(currentCity());
  if (adviceOutput) {
    adviceOutput.classList.add("is-pending");
    adviceOutput.innerHTML = "<p>先在上方选择城市和结果视图，点击运行推演后生成本次规划建议。</p>";
  }
  if (adviceAnswer) {
    adviceAnswer.innerHTML = "<p>运行推演后，可围绕优先级、设施类型、平急两用和实施时序继续询问。</p>";
  }
}

function adviceItems(city = currentCity()) {
  const scale = cityScale(city);
  const mix = populationMix(city);
  const focus = viewFocus();
  const cells = formatNumber(gridCellCount(city) ?? 0);

  return [
    {
      title: "错配判断",
      body: `${city.name}为${scale}，分析网格 ${cells} 个。${focus}结果应优先识别连续高需求网格，以及服务容量不足的避难设施片区。`,
    },
    {
      title: "配置重点",
      body: `${mix}，建议把学校、体育馆、社区中心等可快速转换设施纳入校核范围，先补强高需求片区的步行可达服务。`,
    },
    {
      title: "实施时序",
      body: "近期先处理高风险高缺口片区，中期推进存量设施改造，远期通过片区协同提高冗余设施调剂能力。",
    },
    {
      title: "复核数据",
      body: "建议继续核对积水深度、道路阻断、设施开放容量、夜间人口和通勤人口，避免用常住人口直接替代灾时需求。",
    },
  ];
}

function renderAdvice() {
  syncAdviceShell(currentCity());
  if (!adviceOutput) {
    return;
  }

  if (!hasRun) {
    clearAdvice();
    return;
  }

  adviceGenerated = true;
  adviceOutput.classList.remove("is-pending");
  adviceOutput.innerHTML = "";
  adviceItems().forEach((item) => {
    const block = document.createElement("section");
    const title = document.createElement("h3");
    const body = document.createElement("p");
    title.textContent = item.title;
    body.textContent = item.body;
    block.append(title, body);
    adviceOutput.appendChild(block);
  });
}

function answerPlanningQuestion(question) {
  const city = currentCity();
  const normalized = question.trim();
  const focus = viewFocus();
  if (!normalized) {
    return "请输入需要判断的规划问题。";
  }
  if (!hasRun || !adviceGenerated) {
    return "先运行当前视图并读取结果，再进行追问。";
  }
  if (normalized.includes("优先") || normalized.includes("近期") || normalized.includes("顺序")) {
    return `${city.name}当前${focus}结果下，优先事项应从高缺口且连续成片的网格开始，再处理边缘承压片区，最后把富余设施纳入跨片区调剂。`;
  }
  if (normalized.includes("设施") || normalized.includes("改造") || normalized.includes("增设")) {
    return `建议先校核现有避难设施容量与开放条件。容量不足但可达性好的设施优先改造，服务空白片区再考虑新增小型避难节点。`;
  }
  if (normalized.includes("平急") || normalized.includes("公共设施")) {
    return `平急两用应优先落在高需求网格周边的学校、体育馆、社区服务中心和大型公共建筑，并明确开放时段、容量转换和管理责任。`;
  }
  if (normalized.includes("人口") || normalized.includes("流动") || normalized.includes("需求")) {
    return `${populationMix(city)}。规划判断应采用灾时移动后的动态需求，避免只按静态常住人口分配避难资源。`;
  }
  return `${city.name}的建议应围绕三件事展开：先确认高缺口片区，再匹配可改造设施，最后按收益和实施难度排出近期项目顺序。`;
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
  clearAdvice();
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
    const nextView = button.dataset.simView;
    const changedView = selectedSimView !== nextView;
    selectedSimView = nextView;
    simViewButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });

    if (changedView) {
      hasRun = false;
      updateSimMedia();
      clearAdvice();
      return;
    }

    syncReadout(currentCity());
  });
});

simForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  hasRun = true;
  updateSimMedia({ restart: true });
  renderAdvice();
});

adviceButton?.addEventListener("click", () => {
  renderAdvice();
});

adviceForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!adviceAnswer) {
    return;
  }
  const answer = answerPlanningQuestion(adviceInput?.value ?? "");
  adviceAnswer.innerHTML = "";
  const paragraph = document.createElement("p");
  paragraph.textContent = answer;
  adviceAnswer.appendChild(paragraph);
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
