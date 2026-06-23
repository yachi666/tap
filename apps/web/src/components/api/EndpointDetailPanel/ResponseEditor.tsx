import { Plus, Trash } from '@phosphor-icons/react';
import type { ApiResponseDef } from '../../../types';

interface ResponseEditorProps {
  responses: ApiResponseDef[];
  onChange: (responses: ApiResponseDef[]) => void;
}

/**
 * Inline editor for HTTP responses in edit/create mode.
 * Supports add, update, and remove of response definitions with status code,
 * description, content types, and schema ref fields.
 */
export function ResponseEditor({ responses, onChange }: ResponseEditorProps) {
  const addResponse = () => {
    const newResp: ApiResponseDef = {
      id: `resp-${Date.now()}`,
      statusCode: 200,
      description: '',
      contentTypes: ['application/json'],
    };
    onChange([...responses, newResp]);
  };

  const updateResponse = (idx: number, patch: Partial<ApiResponseDef>) => {
    const next = [...responses];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const removeResponse = (idx: number) => {
    onChange(responses.filter((_, i) => i !== idx));
  };

  return (
    <div className="editor-section">
      {responses.length === 0 ? (
        <div className="empty-state">无响应定义。</div>
      ) : (
        <div className="editor-list">
          {responses.map((resp, idx) => (
            <div key={resp.id} className="editor-card">
              <div className="editor-row">
                <input
                  className="input input--cell input--narrow"
                  type="number"
                  value={resp.statusCode}
                  onChange={(e) => updateResponse(idx, { statusCode: Number(e.target.value) })}
                  min={100}
                  max={599}
                  aria-label="HTTP 状态码"
                />
                <input
                  className="input input--cell input--wide"
                  value={resp.description}
                  onChange={(e) => updateResponse(idx, { description: e.target.value })}
                  placeholder="响应描述"
                  aria-label="响应描述"
                />
                <button
                  className="icon-button icon-button--sm"
                  type="button"
                  onClick={() => removeResponse(idx)}
                  aria-label="删除响应"
                >
                  <Trash size={14} />
                </button>
              </div>
              <div className="editor-row">
                <input
                  className="input input--cell"
                  value={resp.contentTypes.join(', ')}
                  onChange={(e) =>
                    updateResponse(idx, {
                      contentTypes: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Content-Type"
                  aria-label="响应 Content-Type"
                />
                <input
                  className="input input--cell"
                  value={resp.schemaRef ?? ''}
                  onChange={(e) => updateResponse(idx, { schemaRef: e.target.value || undefined })}
                  placeholder="Schema 引用（可选）"
                  aria-label="响应 Schema 引用"
                />
              </div>
            </div>
          ))}
        </div>
      )}
      <button
        className="button button--ghost button--sm editor-add"
        type="button"
        onClick={addResponse}
      >
        <Plus size={14} />
        添加响应
      </button>
    </div>
  );
}
