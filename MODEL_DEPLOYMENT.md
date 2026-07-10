# 规划语言模型接入与部署

网站已把模型调用统一到 OpenAI-compatible `chat/completions` 接口。DeepSeek、Qwen、Ollama、vLLM 或其他兼容服务只需要替换环境变量，不需要修改前端业务代码。

## 接口选择顺序

`api/advice.js` 按以下顺序选择模型：

1. `LLM_ENDPOINT` 或 `LLM_BASE_URL` 指定的自建、云端接口。
2. 已配置 `HF_TOKEN` 时使用 Hugging Face Router。
3. 未配置后端时使用公开模型接口，确保 GitHub Pages 预览不出现空白。

可配置变量：

- `LLM_ENDPOINT`: 完整的 chat completions 地址，例如 `http://127.0.0.1:11434/v1/chat/completions`。
- `LLM_BASE_URL`: OpenAI-compatible 服务根地址，例如 `http://127.0.0.1:8000/v1`。
- `LLM_MODEL`: 服务中的模型名称。
- `LLM_API_KEY`: 云端或受保护服务的密钥；Ollama 本机运行时可不填。
- `LLM_LABEL`: 记录在接口返回中的显示名称。

## 本机运行 Qwen

Ollama 适合单机快速部署：

```bash
ollama pull qwen3:8b

LLM_ENDPOINT=http://127.0.0.1:11434/v1/chat/completions \
LLM_MODEL=qwen3:8b \
LLM_LABEL=Qwen3-8B \
node server.mjs
```

浏览器访问 `http://127.0.0.1:4182`。网页和 `/api/advice` 由同一个服务提供，模型端口不会直接暴露给浏览器。

## 本机运行 DeepSeek

资源较有限的机器可先使用蒸馏版本：

```bash
ollama pull deepseek-r1:14b

LLM_ENDPOINT=http://127.0.0.1:11434/v1/chat/completions \
LLM_MODEL=deepseek-r1:14b \
LLM_LABEL=DeepSeek-R1-14B \
node server.mjs
```

## GPU 服务器运行 Qwen 或 DeepSeek

vLLM 可直接提供 OpenAI-compatible 接口：

```bash
vllm serve Qwen/Qwen3-8B --host 127.0.0.1 --port 8000

LLM_BASE_URL=http://127.0.0.1:8000/v1 \
LLM_MODEL=Qwen/Qwen3-8B \
node server.mjs
```

DeepSeek 蒸馏模型同样可以替换模型名称后运行。模型大小、量化方式和并行参数应按显存条件确定。

## 公网部署

GitHub Pages 只能托管静态文件，无法在服务器侧保存密钥，也不能访问某台电脑上的 `localhost`。要让公众使用本地或私有模型，应把 `server.mjs` 与模型服务部署在同一台云服务器或同一内网：

- 公网只开放网站端口或 HTTPS 反向代理。
- Ollama 的 `11434` 或 vLLM 的 `8000` 只监听内网或本机。
- 浏览器只访问同源 `/api/advice`，不接触模型密钥和模型端口。

## 当前模型上下文

前端会自动发送当前城市、结果视图、人口结构、分析网格、感知范围、当前步数、人口规模、潜在淹没区和系统生成的结果摘要。现有数据尚未包含逐网格的真实错配指数、设施容量和覆盖率，因此语言模型目前能解释已有参数与推演状态，但不能替代真实错配数据。拿到这些指标后，应直接扩展 `planningContext()`，再让模型生成片区级建议。
