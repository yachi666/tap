# 第一轮技术选型对比（已被全 TypeScript 决策取代）

> **请勿按本文旧“主选”实施。** 本文仅保留第一轮 Java/Go/Python 对比过程。主推荐已根据 AI Agent 与大型 TypeScript 平台的进一步调研调整为“全 TypeScript、多进程、热点可替换”，当前有效决策见 [全 TypeScript 架构决策](./ALL_TYPESCRIPT_ARCHITECTURE.md)。

> 状态：Recommendation v0.1  
> 调研日期：2026-06-20  
> 已确定前提：前端使用 TypeScript + React  
> 关联文档：[PRD](./PRD.md) · [技术架构](./TECHNICAL_ARCHITECTURE.md)

## 1. 推荐结论

### 主选方案

| 层次 | 推荐技术 | 决策 |
|---|---|---|
| Web | TypeScript + React | 已确定 |
| 控制面 | Java + Spring Boot | 主选 |
| 模块化 | Spring Modulith | 主选 |
| 数据访问 | jOOQ + Flyway | 主选 |
| 权限 | Spring Security + OIDC/OAuth 2.0 | 主选 |
| Runner | Go | 主选 |
| AI/代码分析 | Python Worker | 主选 |
| 数据库 | PostgreSQL | 主选 |
| 证据附件 | S3 兼容对象存储 | 主选 |
| 异步任务 | PostgreSQL 持久化任务 + 租约 | V1 主选 |
| 进度推送 | REST + Server-Sent Events | V1 主选 |
| 跨语言契约 | JSON Schema + OpenAPI | 主选 |

推荐形态：

```text
React/TypeScript
        │ REST + SSE
Java/Spring Boot 模块化单体控制面
        │ HTTPS 长轮询 + 租约
      Go Runner

Java 控制面 ──异步任务──> Python AI Worker
```

### 一句话理由

- Spring Boot 最适合承载事务、RBAC、审计、版本化资产和复杂领域规则。
- Go 最适合部署在多种内网环境中执行大量并发 HTTP 测试。
- Python 最适合 Git 代码分析、Tree-sitter、模型 SDK 和评测管道。
- 跨语言通过稳定契约协作，不追求虚假的“所有代码一种语言”。

## 2. 选型依据

这个项目不是普通 CRUD 后台。后端同时包含三种差异明显的负载。

### 2.1 控制面负载

- 工作空间、RBAC、服务账号和审计。
- API、测试、流程、环境和数据集的不可变版本。
- 幂等创建运行、状态机和租约调度。
- PostgreSQL 事务、复杂查询和版本 Diff。
- OIDC/OAuth 2.0、Secret、策略和生产保护。
- 大量领域规则，CPU 吞吐通常不是第一瓶颈。

### 2.2 Runner 负载

- 大量并发 HTTP I/O。
- 超时、取消、重试、轮询和连接池。
- 在客户内网以单文件或容器方式部署。
- 低资源占用、明确生命周期和故障隔离。
- 证据流式上传和本地脱敏。

### 2.3 AI/代码分析负载

- Git 快照、AST/Tree-sitter、框架识别。
- LLM Provider、Prompt、结构化输出和评测。
- 可能存在 CPU 密集和长时间异步任务。
- Python 生态明显比 JVM、Go、Node 更集中。

因此后端不应被视为一个单体语言决策，而是控制面、执行面和智能分析面三项决策。

## 3. 候选方案对比

下面评分是结合本项目需求做出的工程判断，不是通用语言性能排名。5 分表示非常匹配。

| 候选 | 事务/安全 | 模块化领域 | API/数据库生态 | 并发与后台任务 | 部署轻量 | 与前端共享语言 | 综合判断 |
|---|---:|---:|---:|---:|---:|---:|---|
| Java + Spring Boot | 5 | 5 | 5 | 4 | 3 | 2 | 控制面首选 |
| ASP.NET Core | 5 | 4 | 5 | 5 | 4 | 2 | 强同级备选 |
| NestJS | 4 | 4 | 4 | 4 | 4 | 5 | 小团队全 TS 备选 |
| Go | 3 | 3 | 4 | 5 | 5 | 2 | Runner 首选，控制面次选 |
| FastAPI | 3 | 3 | 4 | 4 | 4 | 2 | AI Worker 首选，控制面不首选 |

## 4. Java + Spring Boot

### 4.1 为什么适合控制面

Spring Boot 原生提供生产监控、管理端点、指标、Tracing、审计和 HTTP Exchange 等能力，适合平台型控制面。[Spring Boot Production-ready Features](https://docs.spring.io/spring-boot/reference/actuator/index.html)

Spring Modulith 专门支持领域驱动的模块化应用，并提供模块结构验证、模块集成测试、事件和文档生成。这与我们选择“模块化单体、必要时再拆”的方向高度一致。[Spring Modulith](https://docs.spring.io/spring-modulith/reference/)

Spring Security 对 OAuth 2.0 Login、OpenID Connect、资源服务器和方法级授权有成熟支持，能够覆盖企业 OIDC、服务账号和接口授权。[Spring Security OAuth 2.0 / OIDC](https://docs.spring.io/spring-security/reference/servlet/oauth2/login/index.html)

Spring Boot Actuator 与 Micrometer 能以相对统一的方式输出 Prometheus、OTLP 等指标和观察数据。[Micrometer](https://docs.micrometer.io/micrometer/reference/)

Java 侧的 OpenAPI Parser 持续维护，可作为 OpenAPI Adapter 的基础。[Swagger Parser](https://github.com/swagger-api/swagger-parser)

### 4.2 推荐具体组合

- Java，而不是默认 Kotlin。
- Spring Boot + Spring MVC。
- Spring Modulith 管理内部模块依赖。
- Spring Security 负责 OIDC、服务账号和资源授权。
- jOOQ 负责显式 SQL、复杂报告查询和 PostgreSQL 特性。[jOOQ Manual](https://www.jooq.org/doc/latest/manual/)
- Flyway 管理数据库迁移。
- Testcontainers + JUnit 进行 PostgreSQL、对象存储和 Fixture 集成测试。[Testcontainers for Java](https://java.testcontainers.org/)
- Actuator + Micrometer + OpenTelemetry 输出运行指标和 Trace。

### 4.3 为什么默认 Java 而不是 Kotlin

Kotlin 与 Spring 的兼容性没有根本问题，但当前团队背景未知。第一版默认 Java 可以降低：

- 新成员同时学习 Spring 和 Kotlin 语言特性的成本。
- 编译插件、注解处理、空类型映射和 Java 库互操作的额外决策。
- 招聘或跨团队维护时的前置要求。

如果现有核心后端团队已经熟练使用 Kotlin，控制面切换为 Kotlin 完全合理，架构不需要改变。

### 4.4 为什么使用 Spring MVC 而不是默认 WebFlux

控制面主要使用 PostgreSQL、jOOQ、对象存储和事务，典型实现仍包含阻塞式调用。Spring MVC 的心智成本更低，线程模型和事务调试更直接。

只有在压测证明同步线程模型成为瓶颈，并且端到端依赖都能非阻塞时，才考虑 WebFlux。不要为了“看起来更高并发”引入反应式复杂度。

### 4.5 风险

- JVM 镜像和内存通常比 Go/Node 更重。
- Gradle/Maven 构建速度需要治理。
- 如果团队完全没有 Java/Spring 经验，首期交付速度可能低于 NestJS。

这些风险主要影响控制面开发与部署，不影响 Runner，因此不值得为了节省一个运行时而放弃成熟的事务与安全生态。

## 5. Go

### 5.1 为什么适合 Runner

Go 的 goroutine 和 channel 模型非常适合大量并发请求、取消传播和事件管道。Go 官方强调通过通信管理共享状态，有利于控制并发任务生命周期。[Effective Go: Concurrency](https://go.dev/doc/effective_go#concurrency)

Go Runner 的实际优势：

- 容易交付为单一二进制或小型容器。
- 内存和启动开销适合在多个内网区域部署。
- 标准库 HTTP、TLS、context、pprof 足够成熟。
- `context.Context` 可以贯穿取消、超时和 Trace。
- OpenAPI 生态中 `kin-openapi` 仍在积极维护。[kin-openapi](https://github.com/getkin/kin-openapi)

### 5.2 为什么不优先让 Go 承载整个控制面

Go 能完成控制面，但在本项目中需要自行组合更多能力：

- 复杂 RBAC/OIDC 和方法级策略。
- 模块化领域依赖验证。
- 事务、审计、版本化资产和复杂报告查询。
- 大量 Schema、DTO 和验证映射。

这不是 Go 做不到，而是需要团队自己承担更多框架集成和约定治理。Go 的优势在 Runner 上更集中、更值得。

## 6. NestJS / Node.js

### 6.1 适用条件

NestJS 是合理备选，尤其当：

- 团队规模较小且成员主要是 TypeScript 工程师。
- 首要目标是尽快验证产品，而不是立即进入复杂企业治理。
- 控制面主要是 I/O 和简单事务。
- 接受未来把 Runner 或重任务迁出 Node。

优点：

- 前后端共享 TypeScript、校验 Schema 和部分开发工具。
- NestJS 的 Module、Guard、Interceptor、DI 与企业后端结构较接近。
- OpenAPI/JSON Schema 的 JS 工具生态不错，例如 [Swagger Parser](https://github.com/APIDevTools/swagger-parser)。

### 6.2 主要约束

Node 官方说明 Worker Threads 主要用于 CPU 密集型 JavaScript，不会改善 I/O 密集任务；内置异步 I/O 通常更合适。[Node.js Worker Threads](https://nodejs.org/api/worker_threads.html)

这意味着：

- HTTP 控制面可以很好地运行在 Node。
- 大型规范解析、Diff、代码分析和属性测试生成不能堵塞主事件循环。
- 必须使用独立 Worker Pool/进程，且不能每个任务临时创建一个 Worker。
- Runner、AI 和控制面最终仍然可能拆成不同运行时。

因此“全栈 TS”可以减少前期语言数量，但不能消除系统本身的负载差异。

### 6.3 何时选择 NestJS

如果核心团队 80% 以上精通 TS、没有 Java/.NET 经验，并且第一阶段是 2–3 个月产品验证，可以选择：

```text
React + NestJS 控制面 + Go Runner + Python AI Worker
```

仍不建议 Node Runner 与控制面共进程。

## 7. ASP.NET Core

ASP.NET Core 是最强的同级备选。Microsoft 官方最佳实践强调异步接口、避免阻塞调用和线程池饥饿，适合高并发控制面。[ASP.NET Core Best Practices](https://learn.microsoft.com/en-us/aspnet/core/performance/performance-best-practices)

`IHostedService` 和 Worker Service 支持长时间后台任务、定时任务和队列消费者。[ASP.NET Core Hosted Services](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/host/hosted-services)

优点：

- 性能、类型系统、异步模型和工具链均很强。
- ASP.NET Core Identity、OIDC、EF Core/Dapper 和 OpenTelemetry 生态成熟。
- .NET 有明确的官方支持周期。[.NET Support Policy](https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core)

选择规则非常简单：如果组织已有成熟 .NET 团队和基础设施，直接使用 ASP.NET Core，不需要为了“Java 更企业级”进行迁移。

## 8. FastAPI / Python

FastAPI 对 async/await 和 I/O 并发有良好支持。[FastAPI Concurrency](https://fastapi.tiangolo.com/async/)

推荐用于：

- AI Provider Adapter。
- Git/AST/Tree-sitter 分析任务。
- 生成结果评测服务。
- 独立模型推理入口。

不推荐作为主控制面的原因不是性能不够，而是本项目的难点在事务、权限、审计、版本化和长期演进。Python 在这些领域可以完成任务，但需要更多项目级约束才能获得与 Spring/.NET 相同的一致性。

AI Worker 如果只消费任务，不必为了“微服务完整感”强行使用 FastAPI；普通进程 Worker 就够了。只有需要健康检查、回调或独立管理接口时再暴露 HTTP。

## 9. RAML 对选型的影响

截至调研日期，RAML 官方 Java Parser 和 JavaScript Parser 仓库均已归档，最近核心代码提交停留在 2022 年。这是生态风险，不是选 Java、Node 或 Go 就能自然解决的问题：

- [raml-java-parser](https://github.com/raml-org/raml-java-parser)
- [raml-js-parser-2](https://github.com/raml-org/raml-js-parser-2)

建议：

1. OpenAPI 是内部统一模型的第一优先来源。
2. RAML 使用隔离进程或独立 Adapter，不进入控制面核心领域。
3. 只承诺 PRD 已列出的基础映射。
4. 使用真实 RAML Fixture 建立 Golden Tests。
5. 不支持的 Trait、Resource Type、Library 必须明确诊断。
6. 如果目标客户 RAML 使用率不高，把完整 RAML 支持调整到 P1。

RAML 不应成为选择 Node 或 Java 的决定性理由。

## 10. 是否使用 Temporal 等工作流引擎

Temporal 提供 Durable Execution，适合需要在进程、网络故障后持续恢复的关键业务工作流。[Temporal Documentation](https://docs.temporal.io/)

但 V1 不建议用 Temporal 直接执行测试步骤：

- 我们已经需要自己的可编辑流程 DSL、变量模型和证据事件。
- 每一步请求响应、重试尝试和脱敏证据都需要领域化存储。
- 引入 Temporal 会增加独立基础设施、Worker 版本和确定性约束。
- 平台内部运行状态仍不能完全由 Temporal UI 代替。

V1 使用 PostgreSQL 任务租约 + 不可变 ExecutionPlan 更简单。若未来出现跨小时/跨天等待、数十万并发长流程、人工任务和复杂恢复，再重新评估 Temporal。

## 11. 推荐控制面技术基线

```text
Language        Java
Framework       Spring Boot + Spring MVC
Modularity      Spring Modulith
Security        Spring Security + OIDC/OAuth 2.0
Persistence     PostgreSQL + jOOQ
Migration       Flyway
Object Storage  S3-compatible SDK
Validation      Jakarta Validation + JSON Schema
Testing         JUnit 5 + Testcontainers + WireMock/Fixture Server
Observability   Actuator + Micrometer + OpenTelemetry
Build           Maven 或 Gradle，团队统一一种
API             REST JSON + SSE
Async Jobs      PostgreSQL lease/outbox
```

### 11.1 不建议的默认选择

- 不默认使用微服务。
- 不默认使用 WebFlux。
- 不默认使用 Kafka。
- 不默认使用 Kubernetes Job 执行每个小测试。
- 不把 JPA Entity 直接暴露为接口 DTO。
- 不让 Runner 直接连接控制面数据库。
- 不让 AI Worker 获得 Git Credential 或运行 Secret。

## 12. 前后端契约

React/TS 与 Java 后端不需要共享源代码来保证类型安全：

1. 后端维护 OpenAPI 接口文档。
2. CI 校验 OpenAPI 兼容性。
3. 前端从 OpenAPI 生成 TypeScript Client 和类型。
4. Runner Protocol、Test DSL、Workflow DSL 使用 JSON Schema。
5. Java、Go、Python 分别从 Schema 生成类型或执行严格运行时校验。

共享的是契约，不是语言。这比把数据库 Entity、前端类型和 Runner 类型塞进一个 TS 包更稳定。

## 13. 最终决策规则

### 推荐 Java + Spring Boot，当：

- 目标是企业内部平台或私有化部署。
- RBAC、审计、OIDC、版本化和事务属于核心需求。
- 预期长期维护且会接入多个团队。
- 团队至少有两名熟悉 JVM/Spring 的工程师。

### 推荐 ASP.NET Core，当：

- 组织已有 .NET 团队、基础镜像、监控和身份系统。

### 推荐 NestJS，当：

- 团队主要是 TS 开发者。
- 当前阶段更重视快速验证。
- 接受 Runner 使用 Go、AI 使用 Python，并把 CPU 重任务隔离。

### 推荐全 Go 控制面，当：

- 团队非常熟悉 Go。
- 愿意自行建立 RBAC、事务、模块化和审计规范。
- 部署资源和单二进制交付优先级极高。

## 14. 调研来源与当前状态

本次优先使用官方文档和官方仓库：

- [Spring Boot Production-ready Features](https://docs.spring.io/spring-boot/reference/actuator/index.html)
- [Spring Modulith](https://docs.spring.io/spring-modulith/reference/)
- [Spring Security OAuth 2.0 Login](https://docs.spring.io/spring-security/reference/servlet/oauth2/login/index.html)
- [Swagger Parser](https://github.com/swagger-api/swagger-parser)
- [Go Concurrency](https://go.dev/doc/effective_go#concurrency)
- [kin-openapi](https://github.com/getkin/kin-openapi)
- [Node.js Worker Threads](https://nodejs.org/api/worker_threads.html)
- [NestJS Performance](https://docs.nestjs.com/techniques/performance)
- [ASP.NET Core Best Practices](https://learn.microsoft.com/en-us/aspnet/core/performance/performance-best-practices)
- [ASP.NET Core Hosted Services](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/host/hosted-services)
- [FastAPI Concurrency](https://fastapi.tiangolo.com/async/)
- [Temporal Documentation](https://docs.temporal.io/)
- [Testcontainers for Java](https://java.testcontainers.org/)
- [Micrometer](https://docs.micrometer.io/micrometer/reference/)

仓库活跃度检查显示 Spring Boot、Spring Modulith、Swagger Parser、kin-openapi、NestJS、FastAPI、ASP.NET Core 和 Temporal 均未归档且近期仍有提交；RAML 官方 Java/JS Parser 已归档。因此，当前最大的生态风险是 RAML，而不是主流后端框架。

## 15. 需要用 Spike 验证的事项

在正式冻结技术栈前，用 5–7 个工作日完成四个 Spike：

1. Java/Spring 导入一个大型 OpenAPI，生成统一模型并计算 Diff。
2. Go Runner 并发执行 1,000 个受控 HTTP 请求，验证取消、超时、脱敏和事件上传。
3. PostgreSQL 租约在多 Runner 并发、失联和重连下不重复执行。
4. Java、Go、Python 对同一 ExecutionPlan 和 RunEvent Fixture 的解释完全一致。

如果团队 Java 经验不足，再额外用 NestJS 实现同一个最小控制面切片，以真实交付速度而不是偏好决定最终选择。
