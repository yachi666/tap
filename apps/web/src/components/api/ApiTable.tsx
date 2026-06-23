import { MagnifyingGlass, PencilSimple, Trash, Warning } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import type { ApiEndpoint, ApiVersionInfo } from '../../types';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { MethodBadge } from '../shared/MethodBadge';
import { SearchField } from '../shared/SearchField';
import { FilterDropdown } from './FilterDropdown';

interface ApiTableProps {
  endpoints: ApiEndpoint[];
  activeVersion: ApiVersionInfo | null;
  /** Maps endpoint ID → its workflow references. */
  usedInWorkflows: Record<string, string[]>;
  onViewDetail: (endpointId: string) => void;
  onEdit: (endpointId: string) => void;
  /** Called when user confirms deletion in the confirm dialog. */
  onDelete?: (endpointId: string) => void;
}

/**
 * The core API catalog table with search, filter, and per-row actions.
 * Rows are fully clickable — clicking anywhere opens the detail view.
 * Edit and Delete buttons sit at the end of each row with stopPropagation.
 */
export function ApiTable({
  endpoints,
  activeVersion,
  usedInWorkflows,
  onViewDetail,
  onEdit,
  onDelete,
}: ApiTableProps) {
  const [query, setQuery] = useState('');
  const [activeMethod, setActiveMethod] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [coverageRange, setCoverageRange] = useState<[number, number]>([0, 100]);
  const [deleteTarget, setDeleteTarget] = useState<ApiEndpoint | null>(null);

  // Derive unique methods and tags from endpoints
  const methods = useMemo(() => [...new Set(endpoints.map((ep) => ep.method))].sort(), [endpoints]);
  const tags = useMemo(() => [...new Set(endpoints.flatMap((ep) => ep.tags))].sort(), [endpoints]);

  // Filter logic
  const filtered = useMemo(() => {
    return endpoints.filter((ep) => {
      if (activeMethod && ep.method !== activeMethod) return false;
      if (activeTag && !ep.tags.includes(activeTag)) return false;
      if (ep.coverage < coverageRange[0] || ep.coverage > coverageRange[1]) return false;
      const q = query.toLowerCase();
      if (q && !`${ep.method} ${ep.path} ${ep.summary}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [endpoints, query, activeMethod, activeTag, coverageRange]);

  const coverageClass = (pct: number) => {
    if (pct >= 90) return 'coverage--high';
    if (pct >= 60) return 'coverage--medium';
    return 'coverage--low';
  };

  const totalEndpoints = endpoints.length;
  const avgCoverage =
    totalEndpoints > 0
      ? Math.round(endpoints.reduce((sum, ep) => sum + ep.coverage, 0) / totalEndpoints)
      : 0;

  return (
    <section className="table-panel api-catalog">
      {/* Stats bar */}
      <div className="api-stats-bar">
        <div className="api-stat">
          <strong>{totalEndpoints}</strong>
          <span>接口</span>
        </div>
        <div className="api-stat">
          <strong>{avgCoverage}%</strong>
          <span>平均覆盖率</span>
        </div>
        {activeVersion ? (
          <div className="api-stat api-stat--wide">
            <strong>
              <span className="version-source" title="源文件名称">
                {activeVersion.fileName}
              </span>
              <span className="version-sep">·</span>
              <span className="version-tag" title="规约版本号">
                v{activeVersion.version}
              </span>
            </strong>
            <span>当前版本</span>
          </div>
        ) : null}
      </div>

      {/* Toolbar */}
      <div className="table-toolbar">
        <SearchField value={query} onChange={setQuery} placeholder="搜索方法、路径或摘要" />
        <span className="toolbar-spacer" />
        <FilterDropdown
          methods={methods}
          tags={tags}
          activeMethod={activeMethod}
          activeTag={activeTag}
          coverageRange={coverageRange}
          onMethodChange={setActiveMethod}
          onTagChange={setActiveTag}
          onCoverageChange={setCoverageRange}
        />
        <span className="toolbar-spacer" />
        <span className="filter-summary">
          {filtered.length === endpoints.length
            ? `${endpoints.length} 个接口`
            : `${filtered.length} / ${endpoints.length} 个接口`}
        </span>
      </div>

      {/* Table */}
      <div className="data-table">
        <div className="data-row data-row--head">
          <span>方法</span>
          <span>路径与摘要</span>
          <span>标签</span>
          <span>覆盖率</span>
          <span>用例</span>
          <span>流程</span>
          <span>操作</span>
        </div>

        {filtered.length === 0 ? (
          <div className="table-empty">
            <MagnifyingGlass size={28} />
            <p>未找到匹配的接口</p>
            <span>尝试调整搜索条件或筛选器</span>
          </div>
        ) : (
          filtered.map((api) => (
            <div
              className="data-row"
              key={api.id}
              role="button"
              tabIndex={0}
              aria-label={`查看 ${api.method} ${api.path} 详情`}
              onClick={() => onViewDetail(api.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onViewDetail(api.id);
                }
              }}
            >
              <span>
                <MethodBadge method={api.method} />
                {api.deprecated ? (
                  <span className="tag tag--warning" title="已弃用">
                    <Warning size={10} />
                  </span>
                ) : null}
              </span>
              <span>
                <code>{api.path}</code>
                <small>{api.summary}</small>
              </span>
              <span>
                <span className="tag-list">
                  {api.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                  {api.tags.length > 2 ? <span className="tag">+{api.tags.length - 2}</span> : null}
                </span>
              </span>
              <span>
                <span className={`progress ${coverageClass(api.coverage)}`}>
                  <i style={{ width: `${api.coverage}%` }} />
                </span>
                <small>{api.coverage}%</small>
              </span>
              <strong>{api.cases}</strong>
              <span>{usedInWorkflows[api.id]?.length ?? 0}</span>
              <span className="row-actions">
                <button
                  className="icon-button"
                  type="button"
                  aria-label={`编辑 ${api.path}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(api.id);
                  }}
                >
                  <PencilSimple size={16} />
                </button>
                {onDelete ? (
                  <button
                    className="icon-button icon-button--danger"
                    type="button"
                    aria-label={`删除 ${api.path}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(api);
                    }}
                  >
                    <Trash size={16} />
                  </button>
                ) : null}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Confirm dialog for delete */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除接口"
        message={
          deleteTarget ? `确定要删除接口 ${deleteTarget.method} ${deleteTarget.path} 吗？` : ''
        }
        variant="danger"
        confirmLabel="删除"
        onConfirm={() => {
          if (deleteTarget) onDelete?.(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}
