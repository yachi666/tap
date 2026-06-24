import { useState } from 'react';
import { CaretDown, Check, PencilSimple, TrashSimple, Plus, Stack } from '@phosphor-icons/react';
import type { Environment, Variable } from '../../types';
import { useEnvironmentStore } from '../../stores/environmentStore';
import { useVariableStore } from '../../stores/variableStore';
import { useUIStore } from '../../stores/uiStore';
import { EnvironmentDialog } from './EnvironmentDialog';
import { DeleteEnvironmentDialog } from './DeleteEnvironmentDialog';

function toneForEnv(env: Environment): 'brown' | 'amber' | 'green' {
  if (env.tags?.includes('生产')) return 'brown';
  if (env.tags?.includes('预发')) return 'amber';
  return 'green';
}

export default function EnvironmentView() {
  const { environments, activeEnvironmentId, setActiveEnvironmentId } = useEnvironmentStore();
  const variables = useVariableStore((s) => s.variables);
  const notify = useUIStore((s) => s.notify);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Environment | null>(null);

  const envVarCount = (envId: string) => variables.filter((v) => v.overrides?.[envId]).length;
  const activeEnv = environments.find((e) => e.id === activeEnvironmentId);

  return (
    <main className="page-view">
      <div className="page-intro">
        <div>
          <span className="eyebrow">ENVIRONMENTS</span>
          <h2>环境管理</h2>
          <p>管理测试、预发和生产环境，隔离不同的 Base URL 和变量覆盖值。</p>
        </div>
        <button
          className="button button--primary"
          type="button"
          onClick={() => {
            setDialogMode('create');
            setEditingEnv(null);
            setDialogOpen(true);
          }}
        >
          <Plus size={18} />
          新建环境
        </button>
      </div>

      <section className="env-grid">
        {environments.map((env) => {
          const tone = toneForEnv(env);
          const isActive = env.id === activeEnvironmentId;
          return (
            <div
              className={`env-card env-card--${tone} ${isActive ? 'env-card--active' : ''}`}
              key={env.id}
            >
              <div className="env-card-header">
                <span>
                  <Stack size={24} weight="duotone" />
                </span>
                <div>
                  <strong>{env.name}</strong>
                  {env.description ? <small>{env.description}</small> : null}
                </div>
              </div>
              <div className="env-card-body">
                <span>{envVarCount(env.id)} 个变量覆盖</span>
                {(env.tags || []).map((tag) => (
                  <span className="env-tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
              <div className="env-card-actions">
                {isActive ? (
                  <span className="status-badge status-badge--passed">
                    <Check size={14} /> 当前
                  </span>
                ) : (
                  <button
                    className="button button--outline button--sm"
                    type="button"
                    onClick={() => {
                      setActiveEnvironmentId(env.id);
                      notify(`切换到 ${env.name}`);
                    }}
                  >
                    激活
                  </button>
                )}
                <button
                  className="icon-button"
                  type="button"
                  aria-label="编辑"
                  onClick={() => {
                    setEditingEnv(env);
                    setDialogMode('edit');
                    setDialogOpen(true);
                  }}
                >
                  <PencilSimple size={16} />
                </button>
                <button
                  className="icon-button"
                  type="button"
                  aria-label="删除"
                  onClick={() => setDeleteTarget(env)}
                >
                  <TrashSimple size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </section>

      <EnvironmentDialog
        open={dialogOpen}
        mode={dialogMode}
        environment={editingEnv}
        onClose={() => setDialogOpen(false)}
      />
      <DeleteEnvironmentDialog
        open={deleteTarget !== null}
        environment={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </main>
  );
}
