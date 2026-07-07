const DEFAULT_MODEL = "Qwen/Qwen2.5-72B-Instruct";
const HF_ROUTER_URL = "https://router.huggingface.co/v1/chat/completions";
const PUBLIC_MODEL = "openai-fast";
const PUBLIC_MODEL_URL = "https://text.pollinations.ai/openai";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }
  if (typeof req.body === "string") {
    return JSON.parse(req.body || "{}");
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(text || "{}");
}

function systemPrompt(mode) {
  const outputShape =
    mode === "question"
      ? '{"answer":"一段中文回答，120到220字"}'
      : '{"sections":[{"title":"本次读数","body":"一句到两句中文"},{"title":"错配判断","body":"一句到两句中文"},{"title":"优先事项","body":"一句到两句中文"},{"title":"规划校核","body":"一句到两句中文"}]}';

  const rules = [
    "你是城市内涝应急避难设施供需匹配模型的规划分析助手。",
    "你的回答必须基于用户提供的当前城市、视图、网格、人口比例、IGP、步数和结果摘要。",
    "表达要像国土空间规划和应急避难设施配置评估，不要写成产品介绍，不要自称模型，不要说明用途限制。",
    "核心卖点是先模拟灾时人群移动和动态避难需求，再判断设施短板和配置优先事项。",
    "建议必须围绕避难设施容量、短板片区、公共建筑转换、平急两用和实施优先级，不要写公共交通、医疗、商业建设等无关方向。",
    "不要使用空泛词，不要输出 Markdown。",
  ];

  if (mode === "question") {
    rules.push("如果用户只是寒暄、致谢或询问身份，直接自然回答，不要强行输出规划建议。");
  }

  rules.push(`只返回 JSON，格式为 ${outputShape}`);
  return rules.join("\n");
}

function extractJson(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      return null;
    }
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.json({ error: "METHOD_NOT_ALLOWED" });
    return;
  }

  const token = process.env.HF_TOKEN;
  let payload;
  try {
    payload = await readJson(req);
  } catch {
    res.statusCode = 400;
    res.json({ error: "INVALID_JSON" });
    return;
  }

  const mode = payload.mode === "question" ? "question" : "report";
  const context = payload.context ?? {};
  const question = String(payload.question ?? context.question ?? "").trim();
  const model = process.env.HF_MODEL || DEFAULT_MODEL;

  const body = {
    model: token ? model : PUBLIC_MODEL,
    messages: [
      { role: "system", content: systemPrompt(mode) },
      {
        role: "user",
        content: JSON.stringify({ mode, context, question }, null, 2),
      },
    ],
    temperature: 0.35,
    max_tokens: mode === "question" ? 420 : 760,
  };

  try {
    const response = await fetch(token ? process.env.HF_ROUTER_URL || HF_ROUTER_URL : PUBLIC_MODEL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      res.statusCode = response.status;
      res.json({ error: "MODEL_REQUEST_FAILED", detail: data });
      return;
    }

    const content =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      data?.generated_text ??
      "";
    const parsed = extractJson(content);

    if (parsed) {
      res.statusCode = 200;
      res.json(parsed);
      return;
    }

    res.statusCode = 200;
    res.json(mode === "question" ? { answer: String(content).trim() } : { text: String(content).trim() });
  } catch (error) {
    res.statusCode = 500;
    res.json({ error: "MODEL_PROXY_ERROR" });
  }
};
