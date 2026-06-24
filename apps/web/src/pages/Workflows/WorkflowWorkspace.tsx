import { useState } from 'react';
import { ArrowLeft, TrashSimple, Plus, CaretDown } from '@phosphor-icons/react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { workflows } from '../../data';

export function WorkflowWorkspace({ onBack }: { onBack: () => void }) {
  const { steps, setSteps, selectedId, setSelectedId, logs, activeWorkflowId, saveDraft } =
    useWorkflowStore();

  const workflowName = workflows.find((w) => w.id === activeWorkflowId)?.name ?? '业务流程';
  const selected = steps.find((s) => s.id === selectedId);
  const [collapsed, setCollapsed] = useState(false);

  const deleteStep = () => {
    if (steps.length <= 1) return;
    const curIdx = steps.findIndex((s) => s.id === selectedId);
    const next = steps.filter((s) => s.id !== selectedId);
    setSelectedId(next[Math.min(curIdx, next.length - 1)].id);
    setSteps(next);
  };

  return (
    <main className="page-view workflow-view">
      <div className="workflow-topbar">
        <button className="button button--ghost" type="button" onClick={onBack}>
          <ArrowLeft size={18} /> 返回
        </button>
        <h2>{workflowName}</h2>
        <span className="workflow-step-count">{steps.length} 步骤</span>
        <button className="button button--outline button--sm" type="button" onClick={saveDraft}>
          保存草稿
        </button>
      </div>

      <div className={`workflow-body ${collapsed ? 'workflow-body--collapsed' : ''}`}>
        <section className="workflow-canvas">
          <div className="workflow-step-list">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`workflow-step-node ${step.id === selectedId ? 'workflow-step-node--active' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(step.id)}
              >
                <span className="step-index">{index + 1}</span>
                <div>
                  <strong>{step.name}</strong>
                  <code>
                    {step.method} {step.path}
                  </code>
                </div>
              </div>
            ))}
          </div>
          <button
            className="button button--outline button--sm"
            type="button"
            style={{ marginTop: 12 }}
          >
            <Plus size={16} /> 添加步骤
          </button>
        </section>

        {selected ? (
          <aside className="workflow-inspector">
            <div className="workflow-inspector-header">
              <h3>步骤配置</h3>
              <div className="workflow-inspector-actions">
                <button
                  className="icon-button"
                  type="button"
                  aria-label="删除步骤"
                  onClick={deleteStep}
                >
                  <TrashSimple size={16} />
                </button>
              </div>
            </div>
            <div className="workflow-inspector-body">
              <label>
                步骤名称
                <input value={selected.name} readOnly />
              </label>
              <label>
                Method
                <input value={selected.method} readOnly />
              </label>
              <label>
                Path
                <input value={selected.path} readOnly />
              </label>
            </div>
          </aside>
        ) : null}
      </div>

      <section className={`bottom-console ${collapsed ? 'bottom-console--collapsed' : ''}`}>
        <div
          className="bottom-console-header"
          role="button"
          tabIndex={0}
          onClick={() => setCollapsed(!collapsed)}
        >
          <h3>执行日志</h3>
          <CaretDown
            size={16}
            style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
          />
        </div>
        {!collapsed ? (
          <div className="bottom-console-body">
            {logs.map((log) => (
              <div key={log.stepId} className={`console-entry console-entry--${log.status}`}>
                <span className={`console-dot console-dot--${log.status}`} />
                <span className="console-step-name">
                  {steps.find((s) => s.id === log.stepId)?.name ?? log.stepId}
                </span>
                {log.code ? <span className="console-status">HTTP {log.code}</span> : null}
                {log.duration ? <span className="console-duration">{log.duration}ms</span> : null}
                {log.message ? <span className="console-message">{log.message}</span> : null}
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
