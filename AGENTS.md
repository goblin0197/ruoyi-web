# AGENTS.md

本文件为 AI 编码代理提供本仓库的开发指引。详细文档见 `README_ZH.md`（本仓库另有 `CLAUDE.md`）。

## 项目概述

RuoYi AI 用户端前端，**Vue 3 + Vite + TypeScript**。对接后端 `../ruoyi-ai`（默认端口 6039），自身默认端口 5137。

**项目关系**：同工作区下 `../ruoyi-ai` 是唯一后端（dev 代理目标 `127.0.0.1:6039`，见 `.env.development` 的 `VITE_API_URL`），`../ruoyi-admin` 是面向运营/管理员的管理后台前端（本仓库面向最终用户）。跨仓库耦合点（接口协议、SSE 契约、认证）见工作区 `../AGENTS.md`「三个活跃项目的关系」。

## 常用命令

```bash
pnpm install          # 安装依赖
pnpm dev              # 开发（vite）
pnpm build            # 构建（vue-tsc -b && vite build）
pnpm preview          # 预览
```

## 结构速览

- 业务源码在 `src/`；Vite 构建插件与配置在 `.build/`；反向代理见 `nginx.conf` 与 `vite.config.ts`。
- Docker 部署：`docker-compose.yml` / `Dockerfile.frontend`。

## 注意事项

- 构建前会跑 `vue-tsc` 类型检查，注意类型完整。
- SSE 流式对话、WebSocket 相关逻辑与后端 `ruoyi-common-sse` 的事件结构（`SseEventDto`）对应，改协议要两端同步。
- 提交遵循 conventional commits（`feat:` / `fix:` / `docs:` …）。
