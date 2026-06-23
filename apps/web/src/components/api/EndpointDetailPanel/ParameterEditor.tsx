import { Plus, Trash } from '@phosphor-icons/react';
import type { ApiParameter } from '../../../types';

interface ParameterEditorProps {
  parameters: ApiParameter[];
  onChange: (params: ApiParameter[]) => void;
}

/**
 * Inline parameter editor used in edit/create mode.
 * Supports add, update, and remove of parameters with name, location, type,
 * required status, and description fields.
 */
export function ParameterEditor({ parameters, onChange }: ParameterEditorProps) {
  const addParam = () => {
    const newParam: ApiParameter = {
      id: `param-${Date.now()}`,
      name: '',
      in: 'query',
      description: '',
      required: false,
      deprecated: false,
      type: 'string',
    };
    onChange([...parameters, newParam]);
  };

  const updateParam = (idx: number, patch: Partial<ApiParameter>) => {
    const next = [...parameters];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const removeParam = (idx: number) => {
    onChange(parameters.filter((_, i) => i !== idx));
  };

  return (
    <div className="editor-section">
      {parameters.length === 0 ? (
        <div className="empty-state">此接口无参数。</div>
      ) : (
        <div className="editor-list">
          {parameters.map((p, idx) => (
            <div key={p.id} className="editor-row">
              <input
                className="input input--cell"
                value={p.name}
                onChange={(e) => updateParam(idx, { name: e.target.value })}
                placeholder="参数名"
                aria-label="参数名称"
              />
              <select
                className="input input--cell"
                value={p.in}
                onChange={(e) => updateParam(idx, { in: e.target.value as ApiParameter['in'] })}
                aria-label="参数位置"
              >
                <option value="path">Path</option>
                <option value="query">Query</option>
                <option value="header">Header</option>
                <option value="cookie">Cookie</option>
              </select>
              <input
                className="input input--cell input--narrow"
                value={p.type ?? ''}
                onChange={(e) => updateParam(idx, { type: e.target.value || undefined })}
                placeholder="类型"
                aria-label="参数类型"
              />
              <label className="editor-checkbox">
                <input
                  type="checkbox"
                  checked={p.required}
                  onChange={(e) => updateParam(idx, { required: e.target.checked })}
                />
                必填
              </label>
              <input
                className="input input--cell input--wide"
                value={p.description ?? ''}
                onChange={(e) => updateParam(idx, { description: e.target.value || undefined })}
                placeholder="说明（可选）"
                aria-label="参数说明"
              />
              <button
                className="icon-button icon-button--sm"
                type="button"
                onClick={() => removeParam(idx)}
                aria-label="删除参数"
              >
                <Trash size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        className="button button--ghost button--sm editor-add"
        type="button"
        onClick={addParam}
      >
        <Plus size={14} />
        添加参数
      </button>
    </div>
  );
}
