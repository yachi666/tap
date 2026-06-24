import {
  ArrowsClockwise,
  BracketsCurly,
  CaretDown,
  EyeSlash,
  Globe,
  Key,
  LinkSimple,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  Table,
  TrashSimple,
} from '@phosphor-icons/react';
import type { VariableScope } from '@sketch-test/contracts-common';
import { type ElementType, useState } from 'react';
import { useApiStore } from '../../stores/apiStore';
import { useEnvironmentStore } from '../../stores/environmentStore';
import { useUIStore } from '../../stores/uiStore';
import { useVariableStore } from '../../stores/variableStore';
import { resolveVariableValue } from '../../types';
import type { Variable, VariableType } from '../../types';
import { DeleteVariableDialog } from './DeleteVariableDialog';
import { VariableDialog } from './VariableDialog';

// ─── Variable Helpers ─────────────────────────────────────────────

const VARIABLE_TYPE_LABEL: Record<VariableType, string> = {
  plain: '普通变量',
  secret: 'Secret',
  dataset: '数据集',
};

const VARIABLE_TYPE_ICON: Record<VariableType, ElementType> = {
  plain: BracketsCurly,
  secret: Key,
  dataset: Table,
};

const SCOPE_LABEL: Record<VariableScope, string> = {
  environment: '环境',
  workflow: '工作流',
  step: '步骤',
  secret: 'Secret',
};

// ─── Variables View ──────────────────────────────────────────────

export default function VariablesView() {
  const { variables } = useVariableStore();
  const { environments, activeEnvironmentId } = useEnvironmentStore();
  const { apiSources: sources } = useApiStore();
  useUIStore((s) => s.notify); // available for future toast usage

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | VariableType>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | VariableScope>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('');

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingVariable, setEditingVariable] = useState<Variable | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Variable | null>(null);

  const activeEnv = environments.find((e) => e.id === activeEnvironmentId);

  const openCreate = () => {
    setDialogMode('create');
    setEditingVariable(null);
    setDialogOpen(true);
  };

  const openEdit = (v: Variable) => {
    setDialogMode('edit');
    setEditingVariable(v);
    setDialogOpen(true);
  };

  const q = query.toLowerCase();
  const filtered = variables.filter((v) => {
    const resolvedValue = resolveVariableValue(v, activeEnvironmentId);
    const matchesQuery =
      v.name.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q) ||
      resolvedValue.toLowerCase().includes(q);
    const matchesType = typeFilter === 'all' || v.type === typeFilter;
    const matchesScope = scopeFilter === 'all' || v.scope === scopeFilter;
    const matchesSource =
      sourceFilter === ''
        ? true
        : sourceFilter === '__global__'
          ? !v.sourceId
          : v.sourceId === sourceFilter;
    return matchesQuery && matchesType && matchesScope && matchesSource;
  });

  const typeCounts = {
    all: variables.length,
    plain: variables.filter((v) => v.type === 'plain').length,
    secret: variables.filter((v) => v.type === 'secret').length,
    dataset: variables.filter((v) => v.type === 'dataset').length,
  };

  return (
    <main className="page-view">
      <VariableDialog
        open={dialogOpen}
        mode={dialogMode}
        variable={editingVariable}
        onClose={() => setDialogOpen(false)}
      />
      <DeleteVariableDialog
        open={deleteTarget !== null}
        variable={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />

      <div className="page-intro">
        <div>
          <span className="eyebrow">VARIABLES</span>
          <h2>变量管理</h2>
          <p>
            管理普通变量、数据集与 Secret 引用，支持按环境和流程作用域隔离。
            {activeEnv ? (
              <span>
                {' '}
                当前活跃环境：
                <strong>{activeEnv.name}</strong>
              </span>
            ) : null}
            。共 {variables.length} 个变量。
          </p>
        </div>
        <button className="button button--primary" type="button" onClick={openCreate}>
          <Plus size={18} />
          新建变量
        </button>
      </div>

      {/* Filter bar */}
      <div className="variable-filter-bar">
        <div className="filter-tabs">
          {(
            [
              ['all', '全部'],
              ['plain', '普通变量'],
              ['secret', 'Secret'],
              ['dataset', '数据集'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`filter-tab ${typeFilter === key ? 'filter-tab--active' : ''}`}
              onClick={() => setTypeFilter(key)}
            >
              {label}
              <span className="filter-count">({typeCounts[key]})</span>
            </button>
          ))}
        </div>
        <span className="toolbar-spacer" />
        <label className="search-field" style={{ minWidth: 200 }}>
          <MagnifyingGlass size={16} />
          <span className="sr-only">搜索变量</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索变量名、值或描述"
          />
        </label>
        <label className="select-wrap">
          <span className="sr-only">作用域筛选</span>
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value as 'all' | VariableScope)}
          >
            <option value="all">全部作用域</option>
            <option value="environment">环境</option>
            <option value="workflow">工作流</option>
            <option value="step">步骤</option>
            <option value="secret">Secret</option>
          </select>
          <CaretDown size={15} aria-hidden />
        </label>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="source-select"
          aria-label="按系统筛选"
          style={{
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: '0.72rem',
            color: 'var(--muted)',
            background: 'var(--paper)',
          }}
        >
          <option value="">全部系统</option>
          <option value="__global__">全局变量</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Main table */}
      <section className="table-panel">
        <div className="data-table variables-table">
          <div className="data-row data-row--head">
            <span>变量名</span>
            <span>类型</span>
            <span>作用域</span>
            <span>解析值{activeEnv ? `（${activeEnv.name}）` : '（默认）'}</span>
            <span>描述</span>
            <span>引用</span>
            <span>最近更新</span>
            <span>操作</span>
          </div>
          {filtered.length === 0 ? (
            <div className="empty-module" style={{ border: 'none', minHeight: 240 }}>
              <BracketsCurly size={42} weight="duotone" />
              <h3>
                {query || typeFilter !== 'all' || scopeFilter !== 'all'
                  ? '没有匹配的变量'
                  : '暂无变量'}
              </h3>
              <p>
                {query || typeFilter !== 'all' || scopeFilter !== 'all'
                  ? '试试调整搜索条件或筛选器。'
                  : '点击右上角"新建变量"创建第一个变量。'}
              </p>
            </div>
          ) : (
            filtered.map((v) => {
              const TypeIcon = VARIABLE_TYPE_ICON[v.type];
              const resolvedValue = resolveVariableValue(v, activeEnvironmentId);
              const isOverridden =
                v.scope === 'environment' &&
                activeEnvironmentId &&
                !!v.overrides[activeEnvironmentId];
              return (
                <div className="data-row" key={v.id}>
                  <span>
                    <code className="variable-name-code">{v.name}</code>
                    {v.tags?.includes('host') ? (
                      <span
                        className="host-tag-badge"
                        title="Host 变量，可在接口编辑中选择作为服务地址"
                        style={{
                          display: 'inline-flex',
                          marginLeft: 4,
                          color: 'var(--blue-500)',
                          verticalAlign: 'middle',
                        }}
                      >
                        <Globe size={11} weight="fill" />
                      </span>
                    ) : null}
                    {v.sensitive ? (
                      <span className="sensitive-dot" title="敏感变量，日志中自动脱敏">
                        <EyeSlash size={11} weight="fill" />
                      </span>
                    ) : null}
                  </span>
                  <span className="source-tag">
                    <TypeIcon size={14} /> {VARIABLE_TYPE_LABEL[v.type]}
                  </span>
                  <span>
                    <span className={`scope-badge scope-badge--${v.scope}`}>
                      {SCOPE_LABEL[v.scope]}
                    </span>
                  </span>
                  <span className="variable-value-cell">
                    <code className={v.sensitive ? 'value-masked' : ''}>
                      {v.sensitive ? '••••••••••••' : resolvedValue}
                    </code>
                    {isOverridden ? (
                      <span className="value-override-badge" title="已由当前环境覆盖">
                        <ArrowsClockwise size={10} />
                      </span>
                    ) : null}
                  </span>
                  <span className="variable-desc-cell" title={v.description}>
                    {v.description}
                  </span>
                  <span>
                    {v.usedIn.length > 0 ? (
                      <span className="usage-count" title={v.usedIn.join('、')}>
                        <LinkSimple size={12} /> {v.usedIn.length}
                      </span>
                    ) : (
                      <span className="usage-count usage-count--none">—</span>
                    )}
                  </span>
                  <span className="variable-time-cell">{v.updatedAt}</span>
                  <span className="variable-actions-cell">
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => openEdit(v)}
                      aria-label={`编辑 ${v.name}`}
                      title="编辑"
                    >
                      <PencilSimple size={16} />
                    </button>
                    <button
                      className="icon-button icon-button--danger"
                      type="button"
                      onClick={() => setDeleteTarget(v)}
                      aria-label={`删除 ${v.name}`}
                      title="删除"
                    >
                      <TrashSimple size={16} />
                    </button>
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
