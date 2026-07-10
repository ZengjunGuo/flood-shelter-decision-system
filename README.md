# 城市内涝应急避难场所供需匹配与优化决策支持模型

静态前端包含方法说明、人群移动模拟控制台、错配诊断、规划问答与配置方案输出。城市参数和模拟素材位于 `app.js` 与 `assets/sim`。

## 本地预览

只查看页面：

```bash
python3 -m http.server 4182
```

同时使用规划语言模型代理：

```bash
node server.mjs
```

访问 `http://127.0.0.1:4182`。

## 模型接入

模型配置、Ollama、vLLM、DeepSeek 和 Qwen 的运行方式见 `MODEL_DEPLOYMENT.md`。

## 公开版本

`public-site` 是用于 GitHub Pages 的发布目录。静态预览会使用公开模型后备接口；私有或本地模型应通过同源 `/api/advice` 代理接入。
