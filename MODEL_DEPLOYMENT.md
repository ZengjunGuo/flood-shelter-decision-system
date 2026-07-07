# 开源模型接入与公开部署

这个页面可以继续作为静态站点公开预览。若要让“规划建议”调用开源大模型，需要把同一套代码部署到支持 Serverless Function 的平台，例如 Vercel。

## 为什么不能直接放在 GitHub Pages

GitHub Pages 只托管静态文件。浏览器里不能放模型 API token，否则所有访问者都能在开发者工具里看到密钥。当前代码保留了静态后备逻辑：没有后端接口时，页面仍能读取当前城市、视图和推演参数生成建议；配置后端后，会自动调用 `/api/advice`。

## Vercel 部署步骤

1. 把仓库导入 Vercel。
2. 在 Project Settings 的 Environment Variables 添加：
   - `HF_TOKEN`: Hugging Face token。
   - `HF_MODEL`: 可选，默认 `Qwen/Qwen2.5-72B-Instruct`。
3. 重新部署。
4. 访问 Vercel 生成的公网地址，点击“运行推演”后，建议模块会把当前结果上下文发送到 `/api/advice`。

## 前端发送给模型的上下文

前端会自动读取：

- 当前城市。
- 当前结果视图：综合错配、人群轨迹或需求热力。
- Ratio、Grid、IGP、降雨情景和当前推演步数。
- 根据结果视图整理出的错配摘要、短板形态和规划风险。
- 用户在追问框输入的问题。

后续如果有真实错配指标，可以直接把高缺口网格数、设施覆盖率、灾点数量、人口规模、迭代次数等字段加到 `planningContext()`，模型回答会随上下文更新。
