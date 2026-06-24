import { useLocation } from 'react-router-dom';
import { CheckCircle } from '@phosphor-icons/react';
import { useUIStore } from '../../stores/uiStore';
import { useWorkflowStore } from '../../stores/workflowStore';
import { useEnvironmentStore } from '../../stores/environmentStore';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useCallback, useEffect } from 'react';

const viewLabels: Record<string, string> = {
  '/': '工作台',
  '/projects': '项目管理',
  '/workflows': '业务流程',
  '/apis': '接口管理',
  '/cases': '用例管理',
  '/plans': '测试计划',
  '/environments': '环境管理',
  '/variables': '变量管理',
  '/reports': '报告中心',
  '/agent': 'AI Agent',
  '/team': '团队管理',
  '/trash': '回收站',
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { sidebarOpen, setSidebarOpen, toast } = useUIStore();
  const { activeWorkflowId, runState, saveDraft, runWorkflow } = useWorkflowStore();
  const { environments, activeEnvironmentId, setActiveEnvironmentId } = useEnvironmentStore();

  const title = viewLabels[location.pathname] ?? 'SketchTest';

  // Keyboard shortcuts
  const handleSave = useCallback(() => {
    saveDraft();
    useUIStore.getState().notify('草稿已保存 · 版本 v1.0.1');
  }, [saveDraft]);

  const handleRun = useCallback(() => {
    void (async () => {
      // Check if on workflows page with active workflow
      await runWorkflow();
      const state = useWorkflowStore.getState();
      useUIStore.getState().notify(`流程执行完成 · ${state.steps.length - 1} 通过 / 1 失败`);
    })();
  }, [runWorkflow]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        handleSave();
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        handleRun();
      }
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [handleSave, handleRun, setSidebarOpen]);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Topbar
          title={title}
          runState={runState}
          onMenu={() => setSidebarOpen(true)}
          onSave={handleSave}
          onRun={handleRun}
          onImport={() => {
            // navigate to import
          }}
          environments={environments}
          activeEnvironmentId={activeEnvironmentId}
          onEnvironment={setActiveEnvironmentId}
        />
        {children}
      </div>
      <div className={`toast ${toast ? 'toast--visible' : ''}`} role="status" aria-live="polite">
        <CheckCircle size={18} weight="fill" />
        {toast}
      </div>
    </div>
  );
}
