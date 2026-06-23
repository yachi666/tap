import { FloppyDisk, Plus, X } from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { upsertApiSource } from '../../lib/storage';
import type { ApiSource } from '../../types';

interface ApiSourceDialogProps {
  /** Existing source to edit, or null for create mode. */
  source: ApiSource | null;
  open: boolean;
  onClose: () => void;
  onSaved: (source: ApiSource) => void;
}

function emptySource(): ApiSource {
  return {
    id: '',
    name: '',
    description: '',
    sourceLabel: '',
    sourceType: 'openapi',
    defaultBaseUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function ApiSourceDialog({ source, open, onClose, onSaved }: ApiSourceDialogProps) {
  const [draft, setDraft] = useState<ApiSource>(source ?? emptySource());
  const [closing, setClosing] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const isEdit = source !== null;

  useEffect(() => {
    if (open) {
      setDraft(source ? { ...source } : emptySource());
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [open, source]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setClosing(true);
        setTimeout(onClose, 120);
      }
    };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleSave = useCallback(() => {
    if (!draft.name.trim() || !draft.sourceLabel.trim()) return;
    const now = new Date().toISOString();
    const saved: ApiSource = {
      ...draft,
      id: isEdit ? draft.id : `src-${Date.now()}`,
      name: draft.name.trim(),
      sourceLabel: draft.sourceLabel.trim(),
      createdAt: isEdit ? draft.createdAt : now,
      updatedAt: now,
    };
    upsertApiSource({
      id: saved.id,
      name: saved.name,
      description: saved.description || undefined,
      sourceLabel: saved.sourceLabel,
      sourceType: saved.sourceType,
      defaultBaseUrl: saved.defaultBaseUrl || undefined,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    });
    onSaved(saved);
    setClosing(true);
    setTimeout(onClose, 120);
  }, [draft, isEdit, onClose, onSaved]);

  if (!open) return null;

  return (
    <div
      className={`endpoint-dialog-overlay${closing ? ' endpoint-dialog-overlay--closing' : ''}`}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          setClosing(true);
          setTimeout(onClose, 120);
        }
      }}
    >
      <div
        className={`endpoint-dialog${closing ? ' endpoint-dialog--closing' : ''}`}
        style={{ maxWidth: '520px' }}
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? '编辑系统' : '新建系统'}
      >
        {/* Title bar */}
        <div className="endpoint-dialog-titlebar">
          <div className="endpoint-dialog-titlebar-left">
            <span className="endpoint-dialog-titlebar-icon">
              <Plus size={16} weight="bold" />
            </span>
            <h2>{isEdit ? '编辑系统' : '新建系统'}</h2>
          </div>
          <div className="endpoint-dialog-titlebar-right">
            <button
              className="icon-button"
              type="button"
              onClick={() => {
                setClosing(true);
                setTimeout(onClose, 120);
              }}
              aria-label="关闭"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="endpoint-dialog-identity">
          <label className="modal-field" style={{ display: 'block', marginBottom: 14 }}>
            <span
              style={{
                display: 'block',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--ink-soft)',
                marginBottom: 4,
              }}
            >
              系统名称 *
            </span>
            <input
              ref={nameRef}
              className="input input--summary"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="例如：用户服务"
              style={{ margin: 0 }}
            />
          </label>

          <label className="modal-field" style={{ display: 'block', marginBottom: 14 }}>
            <span
              style={{
                display: 'block',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--ink-soft)',
                marginBottom: 4,
              }}
            >
              来源标识 *
            </span>
            <input
              className="input input--path"
              value={draft.sourceLabel}
              onChange={(e) => setDraft((d) => ({ ...d, sourceLabel: e.target.value }))}
              placeholder="例如：user-service.yaml"
              style={{ display: 'block', width: '100%' }}
            />
          </label>

          <label className="modal-field" style={{ display: 'block', marginBottom: 14 }}>
            <span
              style={{
                display: 'block',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--ink-soft)',
                marginBottom: 4,
              }}
            >
              默认 Base URL
            </span>
            <input
              className="input input--path"
              value={draft.defaultBaseUrl ?? ''}
              onChange={(e) =>
                setDraft((d) => ({ ...d, defaultBaseUrl: e.target.value || undefined }))
              }
              placeholder="例如：http://localhost:8080"
              style={{ display: 'block', width: '100%' }}
            />
          </label>

          <label className="modal-field" style={{ display: 'block', marginBottom: 14 }}>
            <span
              style={{
                display: 'block',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--ink-soft)',
                marginBottom: 4,
              }}
            >
              类型
            </span>
            <select
              className="input input--method"
              value={draft.sourceType}
              onChange={(e) =>
                setDraft((d) => ({ ...d, sourceType: e.target.value as ApiSource['sourceType'] }))
              }
              style={{ width: '100%', fontSize: '0.82rem', fontWeight: 400 }}
            >
              <option value="openapi">OpenAPI</option>
              <option value="raml">RAML</option>
              <option value="manual">手动录入</option>
            </select>
          </label>

          <label className="modal-field" style={{ display: 'block', marginBottom: 0 }}>
            <span
              style={{
                display: 'block',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--ink-soft)',
                marginBottom: 4,
              }}
            >
              描述
            </span>
            <textarea
              className="input input--desc"
              value={draft.description ?? ''}
              onChange={(e) =>
                setDraft((d) => ({ ...d, description: e.target.value || undefined }))
              }
              placeholder="可选描述"
              rows={2}
            />
          </label>
        </div>

        {/* Footer */}
        <div className="endpoint-dialog-footer">
          <div className="endpoint-dialog-footer-left" />
          <div className="endpoint-dialog-footer-right">
            <button
              className="button button--ghost button--sm"
              type="button"
              onClick={() => {
                setClosing(true);
                setTimeout(onClose, 120);
              }}
            >
              取消
            </button>
            <button
              className="button button--primary button--sm"
              type="button"
              disabled={!draft.name.trim() || !draft.sourceLabel.trim()}
              onClick={handleSave}
            >
              <FloppyDisk size={15} />
              {isEdit ? '保存' : '创建'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
