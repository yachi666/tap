import { CaretDown, Check, SidebarSimple } from '@phosphor-icons/react';
import { useState, useRef, useEffect } from 'react';
import type { Environment, RunState } from '../../types';

export function Topbar({
  title,
  runState,
  onMenu,
  onSave,
  onRun,
  onImport,
  environments,
  activeEnvironmentId,
  onEnvironment,
}: {
  title: string;
  runState: RunState;
  onMenu: () => void;
  onSave: () => void;
  onRun: () => void;
  onImport: () => void;
  environments: Environment[];
  activeEnvironmentId: string;
  onEnvironment: (envId: string) => void;
}) {
  const [envOpen, setEnvOpen] = useState(false);
  const envRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (envRef.current && !envRef.current.contains(e.target as Node)) setEnvOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeEnv = environments.find((e) => e.id === activeEnvironmentId);

  return (
    <header className="topbar">
      <button className="mobile-menu" type="button" onClick={onMenu} aria-label="打开导航">
        <SidebarSimple size={22} />
      </button>
      <h1>{title}</h1>
      <div className="topbar-actions">
        <button className="button button--ghost button--sm" type="button" onClick={onImport}>
          导入
        </button>
        <div className="env-selector" ref={envRef}>
          <button
            className="button button--ghost button--sm"
            type="button"
            onClick={() => setEnvOpen(!envOpen)}
          >
            {activeEnv?.name ?? '选择环境'}
            <CaretDown size={14} />
          </button>
          {envOpen ? (
            <div className="dropdown-menu">
              {environments.map((env) => (
                <button
                  key={env.id}
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    onEnvironment(env.id);
                    setEnvOpen(false);
                  }}
                >
                  <span>{env.name}</span>
                  {env.id === activeEnvironmentId ? <Check size={16} /> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button className="button button--ghost button--sm" type="button" onClick={onSave}>
          保存
        </button>
        <button
          className="button button--primary button--sm"
          type="button"
          onClick={onRun}
          disabled={runState === 'running'}
        >
          运行
        </button>
      </div>
    </header>
  );
}
