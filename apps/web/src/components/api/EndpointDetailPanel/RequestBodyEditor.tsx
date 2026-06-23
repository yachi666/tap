import { Plus, Trash } from '@phosphor-icons/react';
import type { ApiRequestBody } from '../../../types';

interface RequestBodyEditorProps {
  body?: {
    id: string;
    description?: string;
    required: boolean;
    contentTypes: string[];
    schemaRef?: string;
  };
  onChange: (bodies: ApiRequestBody[]) => void;
}

/**
 * Inline editor for the request body in edit/create mode.
 * Supports toggling required, editing content types, description, and schema ref.
 * Allows removing the request body entirely.
 */
export function RequestBodyEditor({ body, onChange }: RequestBodyEditorProps) {
  const current = body ?? {
    id: `body-${Date.now()}`,
    description: '',
    required: false,
    contentTypes: ['application/json'],
  };

  const update = (patch: Partial<ApiRequestBody>) => {
    onChange([{ ...current, ...patch }]);
  };

  const remove = () => {
    onChange([]);
  };

  if (!body) {
    return (
      <div className="editor-section">
        <div className="empty-state">此接口无请求体。</div>
        <button
          className="button button--ghost button--sm editor-add"
          type="button"
          onClick={() => onChange([current])}
        >
          <Plus size={14} />
          添加请求体
        </button>
      </div>
    );
  }

  return (
    <div className="editor-section">
      <div className="editor-row">
        <label className="editor-checkbox">
          <input
            type="checkbox"
            checked={current.required}
            onChange={(e) => update({ required: e.target.checked })}
          />
          必需
        </label>
        <input
          className="input input--cell"
          value={current.contentTypes.join(', ')}
          onChange={(e) =>
            update({
              contentTypes: e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="Content-Type，如 application/json"
          aria-label="Content-Type"
        />
      </div>
      <div className="editor-row">
        <input
          className="input input--cell input--wide"
          value={current.description ?? ''}
          onChange={(e) => update({ description: e.target.value || undefined })}
          placeholder="请求体描述（可选）"
          aria-label="请求体描述"
        />
        <input
          className="input input--cell"
          value={current.schemaRef ?? ''}
          onChange={(e) => update({ schemaRef: e.target.value || undefined })}
          placeholder="Schema 引用，如 /schemas/CreateUserRequest"
          aria-label="Schema 引用"
        />
      </div>
      <button className="button button--ghost button--sm" type="button" onClick={remove}>
        <Trash size={14} />
        移除请求体
      </button>
    </div>
  );
}
