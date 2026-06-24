# Project Status

> **这是状态快照，不是 Agent 指令。** 最后更新：2026-06-24。
> 此处记录的数字（模块数、行数、页面数）会随开发快速过期，Agent 应通过代码探索自行确认当前状态，而非依赖此文档。
> 建议：每次 milestone 结束时手动更新一次，或运行 `git diff --stat $(git log -1 --format=%H -- docs/STATUS.md)..HEAD` 检查漂移。

## 里程碑进度

M0 已完成。M1 和 M2 **已完成**。M3 尚未开始。

### 已构建的核心模块

- ✅ Monorepo — pnpm workspace、TypeScript strict、Biome、Vitest、Turbo
- ✅ 5 个共享合约包，含 Zod schema 和 golden test
- ✅ 5 个适配器：OpenAPI、Postman、HAR、RAML、format-detector
- ✅ Runner — HTTP 执行、断言评估、变量提取、敏感数据脱敏
- ✅ Hermetic Fixture Server — 8 个业务流程场景（BP-01 至 BP-08）
- ✅ CI pipeline（见 `.github/workflows/`）
- ✅ Control Plane — IAM、import、run、workflow、scheduling 等 13 个模块，~80 API endpoints，22 PostgreSQL 表
- ✅ Workflow Compiler — 将 WorkflowDefinition 编译为 ExecutionPlan
- ✅ Web app — 工作流编辑器、运行时间线，已对接 Control Plane
- ✅ CLI — GitHub Actions 和 GitLab CI 集成示例
- ✅ **Control Plane 自动化测试** — 16 test files, 367 tests，覆盖全部 13 个模块
- ✅ **Web app 自动化测试** — 8 test files, 116 tests，覆盖全部 7 个 stores

### M1 & M2 测试覆盖

| 模块 | 测试文件 | 测试数 |
|------|---------|--------|
| CP: generation | generation.service.test.ts | 46 |
| CP: iam | iam.service.test.ts | 38 |
| CP: workflow | workflow-compiler.test.ts | 34 |
| CP: run | run.service.test.ts, event.service.test.ts | 47 |
| CP: import | diff.service.test.ts | 24 |
| CP: shared | jwt.test.ts | 9 |
| CP: e2e | e2e-chain.test.ts | 8 |
| CP: health | health.routes.test.ts | ✅ |
| CP: report | report.service.test.ts | ✅ |
| CP: runner-registry | runner-registry.service.test.ts | ✅ |
| CP: test-authoring | test-authoring.service.test.ts | ✅ |
| CP: dataset | csv-parser.test.ts | ✅ |
| CP: environment | environment.service.test.ts | ✅ |
| CP: policy | policy.service.test.ts | ✅ |
| CP: test-suite | test-suite.service.test.ts | ✅ |
| Web: stores | apiStore, runStore, uiStore, authStore, environmentStore, variableStore, workflowStore + stores | 116 |
| **总计** | **24 test files** | **~495 tests** |

### 尚未完成

- 🔲 AI Worker（M3）
- 🔲 S3 对象存储集成
- 🔲 Web 组件/页面级测试（当前覆盖：stores 和 hooks；组件和页面尚未有自动化测试）
