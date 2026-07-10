import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createRequire } from "node:module";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const adviceHandler = require("./api/advice.js");
const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const port = Number(process.env.PORT || 4182);
const host = process.env.HOST || "127.0.0.1";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function sendJson(res, payload) {
  if (!res.headersSent) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
  }
  res.end(JSON.stringify(payload));
}

function publicPath(pathname) {
  const decoded = decodeURIComponent(pathname === "/" ? "/index.html" : pathname);
  const filePath = resolve(root, `.${decoded}`);
  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    return null;
  }
  return filePath;
}

const server = createServer(async (req, res) => {
  const requestUrl = new URL(req.url || "/", "http://localhost");

  if (requestUrl.pathname === "/api/advice") {
    res.json = (payload) => sendJson(res, payload);
    try {
      await adviceHandler(req, res);
    } catch {
      if (!res.headersSent) {
        res.statusCode = 500;
      }
      sendJson(res, { error: "ADVICE_HANDLER_FAILED" });
    }
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  const filePath = publicPath(requestUrl.pathname);
  if (!filePath) {
    res.statusCode = 400;
    res.end("Bad Request");
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      throw new Error("NOT_A_FILE");
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", contentTypes[extname(filePath).toLowerCase()] || "application/octet-stream");
    res.setHeader("Content-Length", fileStat.size);
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    createReadStream(filePath).pipe(res);
  } catch {
    res.statusCode = 404;
    res.end("Not Found");
  }
});

server.listen(port, host, () => {
  console.log(`Flood shelter system: http://${host}:${port}`);
});
