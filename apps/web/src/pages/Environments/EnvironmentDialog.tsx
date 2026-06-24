import { useState, useRef, useEffect } from 'react';
import type { Environment } from '../../types';
import { useEnvironmentStore } from '../../stores/environmentStore';
import { useUIStore } from '../../stores/uiStore';

export function EnvironmentDialog({
  open,
  mode,
  environment,
  onClose,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  environment: Environment | null;
  onClose: () => void;
}) {
  const { createEnvironment, updateEnvironment } = useEnvironmentStore();
  const notify = useUIStore((s) => s.notify);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isProduction, setIsProduction] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'edit' && environment) {
      setName(environment.name);
      setDescription(environment.description || '');
      setTags((environment.tags || []).join(', '));
      setIsProduction(environment.tags?.includes('生产') ?? false);
    } else {
      setName('');
      setDescription('');
      setTags('');
      setIsProduction(false);
    }
    setErrors({});
  }, [open, mode, environment]);

  useEffect(() => {
    if (open && nameRef.current) nameRef.current.focus();
  }, [open]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs['name'] = '环境名称不能为空';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (isProduction && !tagList.includes('生产')) tagList.push('生产');
    const now = new Date().toISOString();
    if (mode === 'create') {
      const env: Environment = {
        id: `env-${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        tags: tagList,
        isProduction,
        updatedAt: now,
        updatedBy: 'user',
      };
      createEnvironment(env);
      notify(`环境 "${env['name']}" 创建成功`);
    } else if (environment) {
      const updated: Environment = {
        ...environment,
        name: name.trim(),
        description: description.trim(),
        tags: tagList,
      };
      updateEnvironment(updated);
      notify(`环境 "${updated.name}" 更新成功`);
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'create' ? '新建环境' : '编辑环境'}
      >
        <div className="modal-heading">
          <div>
            <span className="eyebrow">{mode === 'create' ? 'CREATE' : 'EDIT'} ENVIRONMENT</span>
            <h2>{mode === 'create' ? '新建环境' : '编辑环境'}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>
        <div className="modal-body">
          <label>
            环境名称 <span className="required">*</span>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：测试环境、预发环境"
            />
            {errors['name'] ? <span className="field-error">{errors['name']}</span> : null}
          </label>
          <label>
            描述
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简短描述环境用途"
            />
          </label>
          <label>
            标签（逗号分隔）
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="staging, docker"
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isProduction}
              onChange={(e) => setIsProduction(e.target.checked)}
            />
            生产环境
          </label>
        </div>
        <div className="modal-actions">
          <button className="button button--ghost" type="button" onClick={onClose}>
            取消
          </button>
          <button className="button button--primary" type="button" onClick={handleSave}>
            {mode === 'create' ? '创建环境' : '保存更改'}
          </button>
        </div>
      </section>
    </div>
  );
}
