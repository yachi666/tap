import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle,
  Clipboard,
  CreditCard,
  Eye,
  FlowArrow,
  Lock,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  ShoppingCart,
  User,
  XCircle,
} from '@phosphor-icons/react';
import { workflows } from '../../data';
import { useWorkflowStore } from '../../stores/workflowStore';
import type { ExecutionLog, WorkflowMeta, WorkflowStep } from '../../types';

function stepIcon(icon: WorkflowStep['icon'], size = 38) {
  const props = { size, weight: 'duotone' as const, 'aria-hidden': true };
  if (icon === 'user') return <User {...props} />;
  if (icon === 'lock') return <Lock {...props} />;
  if (icon === 'cart') return <ShoppingCart {...props} />;
  if (icon === 'card') return <CreditCard {...props} />;
  return <Clipboard {...props} />;
}

function sideEffectLabel(effect: WorkflowMeta['sideEffect']) {
  if (effect === 'readonly') return '只读';
  if (effect === 'cleanable-write') return '可清理写入';
  return '不可逆';
}

function sideEffectIcon(effect: WorkflowMeta['sideEffect']) {
  if (effect === 'readonly') return <Eye size={15} />;
  if (effect === 'cleanable-write') return <PencilSimple size={15} />;
  return <Lock size={15} />;
}

export function WorkflowCard({
  step,
  index,
  selected,
  executionStatus,
  onSelect,
}: {
  step: WorkflowStep;
  index: number;
  selected: boolean;
  executionStatus: ExecutionLog['status'];
  onSelect: () => void;
}) {
  return (
    <button
      className={`workflow-card tone-${step.tone} ${selected ? 'workflow-card--selected' : ''} status-${executionStatus}`}
      type="button"
      onClick={onSelect}
      aria-label={`编辑步骤 ${index + 1} ${step.name}`}
    >
      <span className="step-number">{index + 1}</span>
      <span className="rest-label">REST</span>
      <span className="step-icon">{stepIcon(step.icon)}</span>
      <strong>{step.name}</strong>
      <span className="endpoint">
        <em>{step.method}</em> {step.path}
      </span>
      {executionStatus === 'running' ? <span className="status-ribbon">执行中</span> : null}
      {executionStatus === 'passed' ? (
        <CheckCircle className="card-result card-result--success" size={22} weight="fill" />
      ) : null}
      {executionStatus === 'failed' ? (
        <XCircle className="card-result card-result--failure" size={22} weight="fill" />
      ) : null}
    </button>
  );
}

export function WorkflowListView() {
  const openWorkflow = useWorkflowStore((s) => s.openWorkflow);
  const [filter, setFilter] = useState<'all' | 'normal' | 'error-path'>('all');
  const [query, setQuery] = useState('');
  const filtered = workflows.filter(
    (wf) =>
      (filter === 'all' || wf.category === filter) &&
      (wf.name.includes(query) ||
        wf.bpId.includes(query.toUpperCase()) ||
        wf.description.includes(query) ||
        wf.tags.some((t) => t.includes(query))),
  );

  return (
    <main className="page-view workflow-list-view">
      <div className="page-intro">
        <div>
          <span className="eyebrow">BUSINESS PROCESSES</span>
          <h2>业务流程</h2>
          <p>
            每个业务流程是一个多接口 API
            序列，覆盖正常路径和异常路径，支持变量传递、条件、重试和清理。
          </p>
        </div>
        <button className="button button--primary" type="button">
          <Plus size={18} />
          新建流程
        </button>
      </div>

      <div className="workflow-filter-bar">
        <div className="filter-tabs">
          {(
            [
              ['all', '全部'],
              ['normal', '正常流程'],
              ['error-path', '异常路径'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`filter-tab ${filter === key ? 'filter-tab--active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label}
              {key === 'all'
                ? ` (${workflows.length})`
                : ` (${workflows.filter((w) => w.category === key).length})`}
            </button>
          ))}
        </div>
        <span className="toolbar-spacer" />
        <label className="search-field" style={{ minWidth: 200 }}>
          <MagnifyingGlass size={16} />
          <span className="sr-only">搜索业务流程</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索名称、标签或 BP 编号"
          />
        </label>
      </div>

      <section className="workflow-grid" aria-label="业务流程列表">
        {filtered.map((wf) => (
          <button
            key={wf.id}
            type="button"
            className={`workflow-item-card workflow-item--${wf.status}`}
            onClick={() => openWorkflow(wf.id)}
          >
            <div className="workflow-item-header">
              <span className={`bp-badge bp-badge--${wf.category}`}>{wf.bpId}</span>
              <span className={`bp-status bp-status--${wf.status}`}>
                {wf.status === 'healthy' ? '健康' : wf.status === 'warning' ? '需关注' : '草稿'}
              </span>
            </div>

            <h3>{wf.name}</h3>
            <p>{wf.description}</p>

            <div className="workflow-item-meta">
              <span title="步骤数">
                <FlowArrow size={15} />
                {wf.stepCount} 步骤
              </span>
              <span title={`副作用等级：${sideEffectLabel(wf.sideEffect)}`}>
                {sideEffectIcon(wf.sideEffect)}
                {sideEffectLabel(wf.sideEffect)}
              </span>
            </div>

            <div className="workflow-item-vars">
              {wf.variableChain.length > 0 ? (
                <>
                  <span className="var-label">变量链路</span>
                  {wf.variableChain.map((v, i) => (
                    <span key={v}>
                      {i > 0 ? <ArrowRight size={12} /> : null}
                      <code>{v}</code>
                    </span>
                  ))}
                </>
              ) : (
                <span className="var-label">无变量传递</span>
              )}
            </div>

            <div className="workflow-item-footer">
              <span className="workflow-tags">
                {wf.tags.map((tag) => (
                  <span key={tag} className="bp-tag">
                    {tag}
                  </span>
                ))}
              </span>
              {wf.lastRun ? <time>最近执行 {wf.lastRun}</time> : null}
            </div>
          </button>
        ))}
      </section>

      {filtered.length === 0 ? (
        <section className="empty-module">
          <FlowArrow size={58} weight="duotone" />
          <h3>暂无匹配的业务流程</h3>
          <p>切换筛选条件或新建一个流程。</p>
        </section>
      ) : null}
    </main>
  );
}
