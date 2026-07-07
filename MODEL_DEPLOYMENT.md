# 开源模型接入与公开部署

这个页面可以继续作为静态站点公开预览。“规划建议”会优先请求站内 `/api/advice`，如果当前环境没有后端函数，则直接请求 Pollinations 的 OpenAI-compatible 接口，调用匿名可用的 `openai-fast` 模型。

## 当前公网预览

GitHub Pages 只托管静态文件，所以不能保存私有模型 token。当前版本不依赖私有 token，而是从浏览器直接访问公开模型接口：

- Endpoint: `https://text.pollinations.ai/openai`
- Model: `openai-fast`
- 模型说明：GPT-OSS 20B reasoning LLM

如果公网模型接口超时或限流，页面会退回本地后备分析，保证系统不空白。

## Vercel 部署步骤

如果需要更稳定的模型调用，可以把同一套代码部署到支持 Serverless Function 的平台，例如 Vercel。

1. 把仓库导入 Vercel。
2. 可选：在 Project Settings 的 Environment Variables 添加：
   - `HF_TOKEN`: Hugging Face token。
   - `HF_MODEL`: 可选，默认 `Qwen/Qwen2.5-72B-Instruct`。
3. 重新部署。
4. 访问 Vercel 生成的公网地址，点击“运行推演”后，建议模块会把当前结果上下文发送到 `/api/advice`。如果没有设置 `HF_TOKEN`，后端会继续调用公开 GPT-OSS 20B 接口。

## 前端发送给模型的上下文

前端会自动读取：

- 当前城市。
- 当前结果视图：综合错配、人群轨迹或需求热力。
- Ratio、Grid、IGP、降雨情景和当前推演步数。
- 根据结果视图整理出的错配摘要、短板形态和规划风险。
- 用户在追问框输入的问题。

后续如果有真实错配指标，可以直接把高缺口网格数、设施覆盖率、灾点数量、人口规模、迭代次数等字段加到 `planningContext()`，模型回答会随上下文更新。
