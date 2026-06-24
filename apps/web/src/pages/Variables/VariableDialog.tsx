import { Check, Eye, EyeSlash, Globe, LinkSimple, X } from '@phosphor-icons/react';
import type { VariableScope } from '@sketch-test/contracts-common';
import { useEffect, useRef, useState } from 'react';
import { useApiStore } from '../../stores/apiStore';
import { useEnvironmentStore } from '../../stores/environmentStore';
import { useUIStore } from '../../stores/uiStore';
import { useVariableStore } from '../../stores/variableStore';
import type { Variable, VariableType } from '../../types';

export function VariableDialog({
  open,
  mode,
  variable,
  onClose,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  variable: Variable | null;
  onClose: () => void;
}) {
  const notify = useUIStore((s) => s.notify);
  const { environments } = useEnvironmentStore();
  const { apiSources: sources } = useApiStore();
  const { createVariable, updateVariable } = useVariableStore();

  const [name, setName] = useState('');
  const [defaultValue, setDefaultValue] = useState('');
  const [type, setType] = useState<VariableType>('plain');
  const [scope, setScope] = useState<VariableScope>('environment');
  const [sensitive, setSensitive] = useState(false);
  const [sourceId, setSourceId] = useState('');
  const [description, setDescription] = useState('');
  const [showValue, setShowValue] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const nameRef = useRef<HTMLInputElement>(null);

  // Only show per-environment overrides when scope is 'environment'
  const showEnvOverrides = scope === 'environment' && environments.length > 0;

  // Auto-tag: if defaultValue starts with http:// or https://, ensure 'host' tag
  useEffect(() => {
    if (/^https?:\/\//.test(defaultValue.trim())) {
      setTags((prev) => (prev.includes('host') ? prev : [...prev, 'host']));
    }
  }, [defaultValue]);

  useEffect(() => {
    if (open && mode === 'edit' && variable) {
      setName(variable.name);
      setDefaultValue(variable.defaultValue);
      setType(variable.type);
      setScope(variable.scope);
      setSensitive(variable.sensitive);
      setSourceId(variable.sourceId ?? '');
      setDescription(variable.description);
      setOverrides({ ...variable.overrides });
      setTags(variable.tags ?? []);
      setShowValue(false);
      setErrors({});
    } else if (open && mode === 'create') {
      setName('');
      setDefaultValue('');
      setType('plain');
      setScope('environment');
      setSensitive(false);
      setSourceId('');
      setDescription('');
      setOverrides({});
      setTags([]);
      setShowValue(false);
      setErrors({});
    }
  }, [open, mode, variable]);

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => nameRef.current?.focus(), 80);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  if (!open) return null;

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) next['name'] = '变量名不能为空';
    else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name.trim()))
      next['name'] = '变量名只能包含字母、数字和下划线，且必须以字母或下划线开头';
    if (!defaultValue && type !== 'dataset') next['defaultValue'] = '默认值不能为空';
    if (type === 'secret') setSensitive(true);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const now = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const saved: Variable = {
      id: variable?.id ?? `var-${Date.now()}`,
      name: name.trim(),
      defaultValue,
      overrides: showEnvOverrides ? overrides : {},
      type,
      scope,
      sourceId: sourceId || undefined,
      tags,
      sensitive,
      description: description.trim(),
      updatedAt: now,
      updatedBy: 'QA_team',
      usedIn: variable?.usedIn ?? [],
    };
    if (mode === 'create') {
      createVariable(saved);
      notify('变量创建成功');
    } else {
      updateVariable(saved);
      notify('变量更新成功');
    }
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="variable-dialog-title"
      >
        <div className="modal-heading">
          <div>
            <span className="eyebrow">{mode === 'create' ? 'NEW VARIABLE' : 'EDIT VARIABLE'}</span>
            <h2 id="variable-dialog-title">
              {mode === 'create' ? '新建变量' : `编辑 ${variable?.name ?? ''}`}
            </h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        <div className="variable-dialog-body">
          {/* Variable name */}
          <label className="variable-field">
            <span className="field-label">
              变量名 <span className="required">*</span>
            </span>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors['name']) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder="例如：userService, paymentService, apiToken"
              className={errors['name'] ? 'input--error' : ''}
              spellCheck={false}
            />
            {errors['name'] ? <span className="field-error">{errors['name']}</span> : null}
          </label>

          {/* Default value */}
          <label className="variable-field">
            <span className="field-label">
              默认值 <span className="required">*</span>
              <small className="field-hint">（无环境匹配或本地开发时使用）</small>
            </span>
            <div className="value-input-group">
              <input
                type={sensitive && !showValue ? 'password' : 'text'}
                value={defaultValue}
                onChange={(e) => {
                  setDefaultValue(e.target.value);
                  if (errors['defaultValue']) setErrors((prev) => ({ ...prev, defaultValue: '' }));
                }}
                placeholder={type === 'dataset' ? 'JSON 格式数据...' : '输入默认值...'}
                className={errors['defaultValue'] ? 'input--error' : ''}
                spellCheck={false}
              />
              {sensitive ? (
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowValue((v) => !v)}
                  aria-label={showValue ? '隐藏值' : '显示值'}
                  title={showValue ? '隐藏值' : '显示值'}
                >
                  {showValue ? <EyeSlash size={17} /> : <Eye size={17} />}
                </button>
              ) : null}
            </div>
            {errors['defaultValue'] ? (
              <span className="field-error">{errors['defaultValue']}</span>
            ) : null}
          </label>

          {/* Per-environment overrides */}
          {showEnvOverrides ? (
            <div className="env-overrides-section">
              <span className="field-label">
                环境覆盖值
                <small className="field-hint">（每个环境的覆盖值优先于默认值）</small>
              </span>
              <div className="env-overrides-grid">
                {environments.map((env) => (
                  <label className="variable-field env-override-field" key={env.id}>
                    <span className="env-override-label">
                      <span
                        className={`scope-badge scope-badge--environment`}
                        style={{ fontSize: '0.5rem' }}
                      >
                        {env.name}
                      </span>
                    </span>
                    <div className="value-input-group">
                      <input
                        type={sensitive && !showValue ? 'password' : 'text'}
                        value={overrides[env.id] ?? ''}
                        onChange={(e) =>
                          setOverrides((prev) => ({
                            ...prev,
                            [env.id]: e.target.value,
                          }))
                        }
                        placeholder={`${env.name} 的覆盖值（留空使用默认值）`}
                        spellCheck={false}
                      />
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {/* Type & Scope row */}
          <div className="variable-field-row">
            <label className="variable-field">
              <span className="field-label">类型</span>
              <select value={type} onChange={(e) => setType(e.target.value as VariableType)}>
                <option value="plain">普通变量</option>
                <option value="secret">Secret</option>
                <option value="dataset">数据集</option>
              </select>
            </label>
            <label className="variable-field">
              <span className="field-label">作用域</span>
              <select value={scope} onChange={(e) => setScope(e.target.value as VariableScope)}>
                <option value="environment">环境</option>
                <option value="workflow">工作流</option>
                <option value="step">步骤</option>
                <option value="secret">Secret</option>
              </select>
            </label>

            {scope === 'environment' && (
              <label className="variable-field">
                <span className="field-label">所属系统</span>
                <select value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
                  <option value="">全局（不限系统）</option>
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {/* Sensitive checkbox */}
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={sensitive}
              onChange={(e) => setSensitive(e.target.checked)}
              disabled={type === 'secret'}
            />
            <span>
              <strong>敏感变量</strong>
              <small>值将在日志和控制台中自动脱敏，运行时不落盘。</small>
            </span>
          </label>

          {/* Description */}
          <label className="variable-field">
            <span className="field-label">描述</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="变量的用途和注意事项..."
              rows={3}
            />
          </label>

          {/* Tags */}
          <div className="variable-field" style={{ marginBottom: 16 }}>
            <span className="field-label">
              标签
              <small className="field-hint">（HTTP/HTTPS 值自动添加 "host" 标签）</small>
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    background: tag === 'host' ? 'var(--blue-100)' : 'var(--ink-subtle)',
                    color: tag === 'host' ? 'var(--blue-700)' : 'var(--ink-soft)',
                  }}
                >
                  {tag === 'host' ? <Globe size={11} /> : null}
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                    aria-label={`移除标签 ${tag}`}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      color: 'inherit',
                      opacity: 0.6,
                    }}
                  >
                    <X size={10} weight="bold" />
                  </button>
                </span>
              ))}
              {tags.length === 0 ? (
                <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                  无标签 · 以 http:// 或 https:// 开头的值会自动添加 "host" 标签
                </span>
              ) : null}
            </div>
          </div>

          {/* Usage info (edit mode only) */}
          {mode === 'edit' && variable && variable.usedIn.length > 0 ? (
            <div className="variable-usage-info">
              <LinkSimple size={15} />
              <span>
                被 {variable.usedIn.length} 个流程引用：
                {variable.usedIn.map((bp) => (
                  <code key={bp}>{bp}</code>
                ))}
              </span>
            </div>
          ) : null}
        </div>

        <div className="modal-actions">
          <button className="button button--ghost" type="button" onClick={onClose}>
            取消
          </button>
          <button className="button button--primary" type="button" onClick={handleSave}>
            <Check size={17} />
            {mode === 'create' ? '创建变量' : '保存修改'}
          </button>
        </div>
      </section>
    </div>
  );
}
