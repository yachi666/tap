import { Info, TrashSimple, Warning, X } from '@phosphor-icons/react';
import { useEffect, useRef } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useVariableStore } from '../../stores/variableStore';
import type { Variable } from '../../types';

export function DeleteVariableDialog({
  open,
  variable,
  onClose,
}: {
  open: boolean;
  variable: Variable | null;
  onClose: () => void;
}) {
  const notify = useUIStore((s) => s.notify);
  const deleteVariable = useVariableStore((s) => s.deleteVariable);
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);
  if (!open || !variable) return null;

  const hasReferences = variable.usedIn.length > 0;

  const handleConfirm = () => {
    deleteVariable(variable.id);
    notify(`变量 ${variable.name} 已删除`);
    onClose();
  };

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
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-variable-title"
      >
        <div className="modal-heading">
          <div>
            <span className="eyebrow">CONFIRM DELETION</span>
            <h2 id="delete-variable-title">删除变量</h2>
          </div>
          <button
            className="icon-button"
            ref={cancelRef}
            type="button"
            onClick={onClose}
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>

        <div className="delete-confirm-body">
          <Warning size={36} weight="duotone" className="delete-warn-icon" />
          <p>
            确定要删除变量 <code>{variable.name}</code> 吗？此操作不可撤销。
          </p>
          {hasReferences ? (
            <div className="notice notice--warning">
              <Info size={18} />
              <span>
                <strong>该变量仍被 {variable.usedIn.length} 个流程引用</strong>
                <small>
                  {variable.usedIn.join('、')}
                  。删除后这些流程将无法解析该变量引用。
                </small>
              </span>
            </div>
          ) : null}
        </div>

        <div className="modal-actions">
          <button className="button button--ghost" type="button" onClick={onClose}>
            取消
          </button>
          <button className="button button--danger" type="button" onClick={handleConfirm}>
            <TrashSimple size={17} />
            确认删除
          </button>
        </div>
      </section>
    </div>
  );
}
