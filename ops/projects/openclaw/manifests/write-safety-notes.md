# 状态文件写安全收口（2026-03-13）

## 高风险单体 JSON（已加锁+原子写）
- /root/.openclaw/workspace/memory/stable/defaults.json
- /root/.openclaw/workspace/memory/active-tasks/tasks.json
- /root/.openclaw/workspace/memory-admin/meta/proposal-promotions-state.json
- /root/.openclaw/workspace/memory-admin/meta/proposal-promotions-processed.json
- /root/.openclaw/workspace/memory-admin/meta/observation-report-state.json

## 低/中风险 append-only JSONL（锁+append）
- proposal-promotions.jsonl
- archive.jsonl

## 统一写入工具
- /root/.openclaw/workspace/tools/safe-file-write.mjs
  - readJsonSafe(file, fallback)
  - writeJsonAtomic(file, obj)  // 临时文件 + fsync + rename + lock
  - appendJsonlAtomic(file, line)
  - withFileLock(lockPath, fn)
  - CLI：get-key / set-key / write-json

## 已接入安全写入的 helper
- defaults-helper.mjs （异步 set/clear/save 统一走 writeJsonAtomic）
- active-tasks-helper.mjs （saveStore/archiving 使用 writeJsonAtomic/appendJsonlAtomic）
- proposal-promoter.mjs （state、processed、log、任务/默认晋升均走安全写）
- observation-report-send.sh （状态读写改用 safe-file-write CLI，防半写）

## 并发防护
- 文件级锁：file.lock（create-exclusive + 重试）
- 原子写：写 tmp + fsync + rename，防半写/部分覆盖
- promotion 并发：state/log/defaults/active_tasks 写入均经锁，减小多进程竞态

## 仍需注意
- JSONL append 仍可能因磁盘满报错；锁已避免交叉写乱序
- 如果未来新增新的状态文件，请复用 safe-file-write.mjs
