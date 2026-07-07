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
const adviceModelState = document.querySelector("[data-advice-model-state]");
const adviceForm = document.querySelector("[data-advice-form]");
const adviceInput = document.querySelector("[data-advice-input]");
const adviceAnswer = document.querySelector("[data-advice-answer]");
const adviceAnswerState = document.querySelector("[data-advice-answer-state]");

const IGP_LABEL = "本地5x5 / 外来3x3";
const IGP_COMPACT = "5x5/3x3";
const MAX_STEP = 49;
const STEP_INTERVAL_MS = 185;
const API_OVERRIDE = window.PLANNING_ADVICE_API ?? "";
const CAN_PROBE_LOCAL_API =
  location.protocol.startsWith("http") && !location.hostname.endsWith("github.io");
const ADVICE_API_URL = API_OVERRIDE || (CAN_PROBE_LOCAL_API ? "/api/advice" : "");
const REPORT_MIN_DELAY_MS = 1900;
const ANSWER_MIN_DELAY_MS = 1600;

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
let adviceRequestId = 0;
let answerRequestId = 0;
let adviceBusy = false;
let answerBusy = false;

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

function setAdviceModelState(text) {
  if (adviceModelState) {
    adviceModelState.textContent = text;
  }
}

function setAdviceAnswerState(text) {
  if (adviceAnswerState) {
    adviceAnswerState.textContent = text;
  }
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function holdMinimum(startTime, minimumMs) {
  const elapsed = performance.now() - startTime;
  if (elapsed < minimumMs) {
    await wait(minimumMs - elapsed);
  }
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function syncAdviceShell(city = currentCity()) {
  if (adviceCity) adviceCity.textContent = city.name;
  if (adviceView) adviceView.textContent = viewFocus();
  if (adviceGrid) adviceGrid.textContent = gridDisplayValue(city);
  if (adviceStatus) adviceStatus.textContent = hasRun ? "已运行" : "待运行";
  if (adviceContext) {
    adviceContext.textContent = hasRun
      ? `${city.name}已完成${viewFocus()}推演，结果可用于短板识别和规划优先事项判断。`
      : `当前选择${city.name}，${viewFocus()}视图。运行推演后生成本次规划建议。`;
  }
  if (!adviceBusy) {
    setAdviceModelState(hasRun ? (adviceGenerated ? "建议已生成" : "等待读取结果") : "等待推演结果");
  }
  if (!answerBusy) {
    setAdviceAnswerState(adviceGenerated ? "可继续追问" : "等待问题");
  }
  if (adviceButton) {
    adviceButton.disabled = !hasRun || adviceBusy;
    adviceButton.textContent = !hasRun ? "等待推演" : adviceGenerated ? "重新读取" : "读取当前结果";
  }
}

function resetAdviceOutput() {
  if (adviceOutput) {
    adviceOutput.classList.remove("is-thinking");
    adviceOutput.classList.add("is-pending");
    adviceOutput.innerHTML = "<p>先在上方选择城市和结果视图，点击运行推演后生成本次规划建议。</p>";
  }
  if (adviceAnswer) {
    adviceAnswer.classList.remove("is-thinking");
    adviceAnswer.innerHTML = "<p>运行推演后，可围绕优先级、设施类型、平急两用和实施时序继续询问。</p>";
  }
}

function clearAdvice() {
  adviceRequestId += 1;
  answerRequestId += 1;
  adviceBusy = false;
  answerBusy = false;
  adviceGenerated = false;
  syncAdviceShell(currentCity());
  resetAdviceOutput();
}

function resultPattern() {
  if (selectedSimView === "agent") {
    return "轨迹结果显示，灾时人群并不按最近距离均匀分散，而是在道路可达、设施吸引和群体跟随作用下形成若干集中流向。";
  }
  if (selectedSimView === "heatmap") {
    return "热力结果显示，动态需求在部分网格持续抬升，单纯按静态人口配置会低估灾时承压片区。";
  }
  return "综合结果显示，人口流向、避难设施供给和洪涝暴露在若干片区叠加，形成可识别的供需错配。";
}

function deriveResultSummary(city = currentCity()) {
  const cells = gridCellCount(city) ?? 0;
  const [rows, columns] = pairValues(gridValue(city)).map(Number);
  const [local, nonlocal] = pairValues(ratioValue(city)).map(Number);
  const totalRatio = local + nonlocal;
  const nonlocalShare = totalRatio > 0 ? nonlocal / totalRatio : 0.35;
  const compactness = rows && columns ? Math.min(rows, columns) / Math.max(rows, columns) : 0.6;
  const pressureScore = Math.round(
    Math.min(92, Math.max(38, 42 + nonlocalShare * 24 + (1 - compactness) * 18 + Math.log10(cells || 10) * 4)),
  );
  const pressureLevel = pressureScore >= 74 ? "高" : pressureScore >= 58 ? "中高" : "中等";
  const shortageShare = pressureLevel === "高" ? "连续成片" : pressureLevel === "中高" ? "局部连片" : "点状集聚";
  const corridor = rows > columns ? "南北向联系通道" : "东西向联系通道";

  return {
    pattern: resultPattern(),
    pressureLevel,
    shortageShare,
    corridor,
    planningRisk:
      nonlocalShare >= 0.34
        ? "外来通勤与流动人群会放大灾时需求偏移，需要把移动后的需求纳入配置判断。"
        : "本地居民占比较高，仍需校核夜间人口和社区设施容量，避免只看常住人口总量。",
  };
}

function planningContext(question = "") {
  const city = currentCity();
  return {
    city: {
      name: city.name,
      slug: city.slug,
      scale: cityScale(city),
      populationMix: populationMix(city),
    },
    view: {
      key: selectedSimView,
      label: viewFocus(),
    },
    parameters: {
      ratio: ratioValue(city),
      grid: gridDisplayValue(city),
      gridCells: gridCellCount(city),
      igp: IGP_LABEL,
      rainfall: "百年一遇",
      step: currentStep,
      maxStep: MAX_STEP,
    },
    result: deriveResultSummary(city),
    question,
  };
}

function fallbackReport(context = planningContext()) {
  const cells = context.parameters.gridCells ? formatNumber(context.parameters.gridCells) : "未定";
  return [
    {
      title: "本次读数",
      body: `${context.city.name}当前视图为${context.view.label}，分析网格 ${cells} 个。${context.result.pattern}`,
    },
    {
      title: "错配判断",
      body: `${context.result.shortageShare}的高需求片区应作为首要校核对象，重点看设施容量、可达路径和洪涝暴露是否同时承压。`,
    },
    {
      title: "优先事项",
      body: `近期排序不宜只按设施距离展开，应先处理${context.result.corridor}附近的连续短板，再评估周边公共设施的转换能力。`,
    },
    {
      title: "规划校核",
      body: `${context.result.planningRisk}后续需要接入积水深度、道路阻断、设施开放容量和时段人口，形成可复算的项目清单。`,
    },
  ];
}

function fallbackAnswer(context, question) {
  const normalized = question.trim();
  if (!normalized) {
    return "请输入需要判断的规划问题。";
  }
  if (normalized.includes("优先") || normalized.includes("近期") || normalized.includes("顺序")) {
    return `${context.city.name}当前${context.view.label}结果下，优先事项应从连续短板片区开始：先校核高需求网格周边的可达设施，再筛选能快速转换的公共建筑，最后按投资强度和服务补足效果排出近期项目。`;
  }
  if (normalized.includes("设施") || normalized.includes("改造") || normalized.includes("增设")) {
    return `设施策略建议分两类处理。可达性好但容量不足的存量设施先做改造和开放条件校核；服务空白且需求持续集聚的片区，再考虑新增小型避难节点或嵌入式公共空间。`;
  }
  if (normalized.includes("平急") || normalized.includes("公共设施")) {
    return `平急两用不应平均铺开，应优先落在动态需求稳定抬升、现有避难容量不足、道路仍具备到达条件的片区，并同步明确开放时段、容量转换和管理责任。`;
  }
  if (normalized.includes("人口") || normalized.includes("流动") || normalized.includes("需求")) {
    return `${context.result.planningRisk}这个模型的价值在于先模拟灾时移动，再做设施配置判断，避免用静态人口替代动态规划过程。`;
  }
  return `${context.city.name}的判断可以按三步展开：识别连续短板片区，筛选可转换设施，按服务补足效果和实施难度确定优先事项。`;
}

async function requestPlanningModel(payload) {
  if (!ADVICE_API_URL) {
    throw new Error("NO_MODEL_ENDPOINT");
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 26000);
  try {
    const response = await fetch(ADVICE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`MODEL_ENDPOINT_${response.status}`);
    }
    return await response.json();
  } finally {
    window.clearTimeout(timeout);
  }
}

function normalizeSections(data, context) {
  const candidate = Array.isArray(data?.sections) ? data.sections : data?.report?.sections;
  if (!Array.isArray(candidate) || candidate.length === 0) {
    return fallbackReport(context);
  }

  return candidate
    .slice(0, 4)
    .map((item) => ({
      title: String(item.title ?? "规划判断").trim().slice(0, 12),
      body: String(item.body ?? item.content ?? "").trim(),
    }))
    .filter((item) => item.body);
}

function normalizeAnswer(data, context, question) {
  const answer = data?.answer ?? data?.text ?? data?.message;
  if (typeof answer === "string" && answer.trim()) {
    return answer.trim();
  }
  return fallbackAnswer(context, question);
}

function setThinkingState(container, size = "large") {
  if (!container) {
    return;
  }
  const lineCount = size === "large" ? 5 : 3;
  container.classList.remove("is-pending");
  container.classList.add("is-thinking");
  container.innerHTML = `<div class="thinking-lines">${Array.from({ length: lineCount })
    .map((_, index) => `<span style="--line:${index}"></span>`)
    .join("")}</div>`;
}

function requestStillCurrent(type, requestId) {
  return type === "report" ? requestId === adviceRequestId : requestId === answerRequestId;
}

async function typeText(element, text, type, requestId) {
  if (!requestStillCurrent(type, requestId)) {
    return false;
  }

  if (prefersReducedMotion()) {
    element.textContent = text;
    return true;
  }

  element.textContent = "";
  const chunkSize = text.length > 90 ? 18 : 12;
  for (let index = 0; index < text.length; index += chunkSize) {
    if (!requestStillCurrent(type, requestId)) {
      return false;
    }
    element.textContent += text.slice(index, index + chunkSize);
    await wait(28);
  }
  return true;
}

async function renderReportSections(sections, requestId) {
  if (!adviceOutput || !requestStillCurrent("report", requestId)) {
    return;
  }

  adviceOutput.classList.remove("is-pending", "is-thinking");
  adviceOutput.innerHTML = "";
  for (const item of sections) {
    if (!requestStillCurrent("report", requestId)) {
      return;
    }
    const block = document.createElement("section");
    const title = document.createElement("h3");
    const body = document.createElement("p");
    title.textContent = item.title;
    block.append(title, body);
    adviceOutput.appendChild(block);
    const completed = await typeText(body, item.body, "report", requestId);
    if (!completed) {
      return;
    }
    await wait(90);
  }
}

async function renderAdvice() {
  syncAdviceShell(currentCity());
  if (!adviceOutput) {
    return;
  }

  if (!hasRun) {
    clearAdvice();
    return;
  }

  const requestId = adviceRequestId + 1;
  adviceRequestId = requestId;
  adviceBusy = true;
  adviceGenerated = false;
  if (adviceButton) {
    adviceButton.disabled = true;
    adviceButton.textContent = "读取中";
  }
  setAdviceModelState("读取当前结果");
  setAdviceAnswerState("等待建议生成");
  setThinkingState(adviceOutput);

  const context = planningContext();
  const startTime = performance.now();
  let sections = fallbackReport(context);
  try {
    setAdviceModelState("形成规划判断");
    const data = await requestPlanningModel({ mode: "report", context });
    sections = normalizeSections(data, context);
  } catch (error) {
    await wait(520);
  }

  await holdMinimum(startTime, REPORT_MIN_DELAY_MS);
  if (!requestStillCurrent("report", requestId)) {
    return;
  }

  setAdviceModelState("输出结构化建议");
  await renderReportSections(sections, requestId);
  if (!requestStillCurrent("report", requestId)) {
    return;
  }

  adviceBusy = false;
  adviceGenerated = true;
  setAdviceModelState("建议已生成");
  setAdviceAnswerState("可继续追问");
  syncAdviceShell(currentCity());
}

async function askPlanningQuestion() {
  if (!adviceAnswer) {
    return;
  }

  const question = adviceInput?.value.trim() ?? "";
  const requestId = answerRequestId + 1;
  answerRequestId = requestId;

  if (!question) {
    adviceAnswer.classList.remove("is-thinking");
    adviceAnswer.innerHTML = "<p>请输入需要判断的规划问题。</p>";
    setAdviceAnswerState("等待问题");
    return;
  }

  if (!hasRun || !adviceGenerated) {
    adviceAnswer.classList.remove("is-thinking");
    adviceAnswer.innerHTML = "<p>先运行当前视图，并等结构化建议生成后再追问。</p>";
    setAdviceAnswerState("等待结果");
    return;
  }

  answerBusy = true;
  setAdviceAnswerState("读取当前上下文");
  setThinkingState(adviceAnswer, "small");
  const context = planningContext(question);
  const startTime = performance.now();
  let answer = fallbackAnswer(context, question);

  try {
    await wait(260);
    setAdviceAnswerState("组织回答");
    const data = await requestPlanningModel({ mode: "question", context, question });
    answer = normalizeAnswer(data, context, question);
  } catch (error) {
    await wait(500);
  }

  await holdMinimum(startTime, ANSWER_MIN_DELAY_MS);
  if (!requestStillCurrent("answer", requestId)) {
    return;
  }

  adviceAnswer.classList.remove("is-thinking");
  adviceAnswer.innerHTML = "";
  const paragraph = document.createElement("p");
  adviceAnswer.appendChild(paragraph);
  setAdviceAnswerState("输出回答");
  await typeText(paragraph, answer, "answer", requestId);
  if (!requestStillCurrent("answer", requestId)) {
    return;
  }
  answerBusy = false;
  setAdviceAnswerState("可继续追问");
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
  askPlanningQuestion();
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
