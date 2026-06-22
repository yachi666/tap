# TAP Domain Glossary

> Test Automation Platform — REST API 自动化测试平台

## Core Entities

- **Workspace** — Top-level organizational unit. Contains members, runners, and projects. All authorization is scoped to a workspace.
- **Project** — A collection of API assets, tests, workflows, environments, and runs. Projects are owned by a workspace.
- **ApiSource** — A reference to an API description (OpenAPI file, RAML file, URL, or Git path). The raw input before parsing.
- **ApiVersion** — An immutable, published snapshot of a CanonicalApiModel after successful parsing and validation. Created from an ApiSource.
- **CanonicalApiModel** — The unified, adapter-neutral representation of an API. Contains servers, security schemes, schemas, endpoints, and diagnostics. This is the platform's most important stable seam.
- **Endpoint** — A single REST operation (method + path) within an API version. Has stable, deterministic identifiers.
- **TestCase** — A mutable container for test definitions. Holds draft and published versions.
- **TestCaseVersion** — An immutable, published test case. Historical runs always reference the exact version used.
- **TestDefinition** — The editor-format document for a single REST API test: request, assertions, variable extractions, and side-effect classification.
- **Workflow** — A mutable container for workflow definitions. Holds draft and published versions.
- **WorkflowVersion** — An immutable, published workflow. Compiled into an ExecutionPlan at publish time.
- **WorkflowDefinition** — The human-editable multi-step API workflow document. Contains sequential steps with control logic and an optional teardown phase.
- **ExecutionPlan** — A compiled, immutable plan that the Runner executes. All variable references are resolved; all limits are explicit. The Runner never sees the mutable editor document.
- **FrozenStep** — A single step within an ExecutionPlan. All variable templates, retry configs, and assertions are concrete.
- **Run** — A single execution instance triggered by manual, CLI, webhook, schedule, or CI. Contains a RunSnapshot.
- **RunSnapshot** — Frozen input versions (API, test, workflow, environment, Git SHA) created when a run is triggered. Ensures full reproducibility.
- **RunAttempt** — An infrastructure-level retry of a run (e.g., Runner reconnection). Distinct from test-level retries within a step.
- **StepRun** — The execution of a single FrozenStep within a run. Contains the full request/response evidence.
- **RunEvent** — An ordered, idempotent event produced by the Runner during execution. Events are (runId, sequence) unique.
- **Evidence** — Structured, redacted request/response data saved to object storage. Each piece has content hash, size, media type, and retention policy.
- **Artifact** — Large binary or text objects (raw spec files, response bodies over 1MB) stored separately from the metadata database.
- **Environment** — Base URL, variables, secret references, and runner labels for a deployment target. Versioned immutably.
- **EnvironmentVersion** — An immutable snapshot of an environment's configuration. Runs reference a specific version.
- **Secret** — Encrypted sensitive value (API key, token, password). Resolved by the Runner at execution time; never stored in events or displayed in UI.
- **Dataset** — Versioned collection of test data rows (from JSON, CSV, or manual entry). Supports data-driven testing.
- **DatasetVersion** — Immutable snapshot of a dataset. Runs reference the specific version and log which row was used.
- **TestSuite** — A named collection of test cases and workflows with quality gate configuration.
- **TestSuiteVersion** — Immutable version of a test suite.
- **GenerationJob** — An asynchronous task that produces test drafts from API specs, rules, or AI analysis.
- **GeneratedDraft** — A test draft produced by a GenerationJob. Must pass validation gates and human review before publishing.
- **CodeEvidenceGraph** — Structured findings from Git repository analysis: routes, DTOs, auth guards, error handlers. Each finding links to a file path and line number.
- **Runner** — An independent process deployed near the system under test. Pulls tasks via lease, executes HTTP requests, redacts secrets, and uploads events.
- **PolicyEngine** — Centralized authorization: evaluates (subject, action, resource, context) → allow/deny/require-approval.
- **QualityGate** — Post-execution evaluation of a run against configured criteria (required workflows, no new failures, coverage thresholds). Produces passed/failed/blocked/inconclusive/cancelled.

## Business Processes

> TAP 平台支撑的核心业务流程列表。每个流程对应一个可复用、可版本化的多接口 Workflow。

| # | 业务流程 | 涉及接口 | 关键变量传递 | 副作用等级 |
|---|---------|---------|-------------|-----------|
| BP-01 | **用户注册与认证** | `POST /users` → `POST /auth/login` → `GET /auth/me` | `userId`, `accessToken` | 可清理写入 |
| BP-02 | **创建订单并支付** | `POST /auth/login` → `POST /orders` → `POST /payments` → `GET /orders/{id}` | `accessToken`, `orderId`, `paymentId` | 不可逆 |
| BP-03 | **订单生命周期管理** | `POST /orders` → `GET /orders/{id}` → `DELETE /orders/{id}` | `orderId`, `status` | 可清理写入 |
| BP-04 | **用户信息查询与更新** | `POST /auth/login` → `GET /users/{id}` | `accessToken`, `userId` | 只读 |
| BP-05 | **支付状态轮询** | `POST /payments` → `GET /orders/{id}` (轮询直到 `status=已支付`) | `paymentId`, `orderId`, `status` | 不可逆 |
| BP-06 | **异常路径：重复支付保护** | `POST /payments` → `POST /payments` (同样 orderId) | `orderId`, `status` | 不可逆 |
| BP-07 | **异常路径：认证失败处理** | `POST /auth/login` (错误凭证) → 断言 401 | — | 只读 |
| BP-08 | **异常路径：参数校验失败** | `POST /users` (缺字段) → 断言 400 + fieldProblems | — | 只读 |

### 业务流程通用结构

```yaml
流程:
  前置条件: [环境已就绪, 测试数据已准备]
  主步骤:
    - 步骤1: [认证/准备]
    - 步骤2..N-1: [核心业务操作]
    - 步骤N: [结果验证]
  清理: [删除测试数据, 恢复环境状态]
  变量链路: [步骤1.提取 → 步骤2.引用 → 步骤3.引用 → ...]
```

### 平台级业务流程（用户操作流程）

| # | 平台流程 | 入口 | 产出 |
|---|---------|------|------|
| PF-01 | **从 OpenAPI 创建回归测试** | 项目 → 导入 API → 选择端点 → 生成策略 | 可执行的 TestCaseVersion |
| PF-02 | **编排多接口业务流程** | 项目 → 新建流程 → 添加步骤 → 配置变量 → 发布 | 可执行的 WorkflowVersion |
| PF-03 | **AI 分析 Git 仓库生成测试** | AI 工作区 → 连接仓库 → 扫描 → 审核草稿 → 发布 | GeneratedDraft → TestCaseVersion |
| PF-04 | **CI 执行发布门禁** | CI Pipeline → CLI/API 触发 → Runner 执行 → 质量门禁 | Run + QualityGateResult |
| PF-05 | **调试单步执行** | 流程编排器 → 单步运行 → 查看请求/响应 → 修正 | 调试日志 + 数据样例 |
| PF-06 | **失败分析与重现** | 执行记录 → 失败步骤 → 查看证据 → 复制 curl | 重现命令 + Trace |

## Key Relationships

- ApiVersion, TestCaseVersion, WorkflowVersion, EnvironmentVersion, and DatasetVersion are all **immutable once published**.
- A **Run** freezes all input versions into a **RunSnapshot** at creation time.
- **RunEvents** are appended with strictly increasing `(runId, sequence)` pairs. Duplicate uploads are idempotent.
- **GeneratedDrafts** that are approved create new **TestCaseVersions**; the draft is preserved as generation evidence.
- **Secret** values are resolved by the **Runner** at execution time and **never** enter the Control Plane's database or logs.
- The **ExecutionPlan** is compiled from a **WorkflowVersion** at publish time. The Runner only sees the plan, never the editor document.

## Product Principles

1. **Evidence-first** — All generated conclusions and execution results must trace back to sources.
2. **Draft-first** — AI and rule-generated content enters as drafts, never directly as published tests.
3. **Flow over count** — Critical business flow coverage matters more than total test case count.
4. **Reproducibility-first** — Failures must retain enough input and version info to replay.
5. **Secure by default** — Secrets are never shown in plain text; request/response is redacted by default.
6. **Adapter architecture** — OpenAPI, RAML, and code analysis all output the same CanonicalApiModel.
7. **Control/execution separation** — Runners can be deployed in the same network as the system under test.

## Canonical Terms

| Say | Don't Say |
|-----|-----------|
| TestCaseVersion | test case (ambiguous: draft or published?) |
| WorkflowVersion | workflow (ambiguous: editor doc or published?) |
| CanonicalApiModel | API spec, API document, parsed API |
| ExecutionPlan | compiled workflow, frozen workflow |
| RunSnapshot | run config, run params |
| RunEvent | execution log, run log (ambiguous with app logs) |
| StepRun | step execution, run step |
| GeneratedDraft | AI test, generated test (ambiguous before/after publishing) |
