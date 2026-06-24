import type { TestCase } from '../../types';
import { useApiStore } from '../../stores/apiStore';
import { useUIStore } from '../../stores/uiStore';
import { PencilSimple, Robot, FileCode, Sparkle } from '@phosphor-icons/react';

export function CasesPage() {
  const { cases, setCases } = useCasesStore();
  const { notify } = useUIStore();

  const generateCases = () => {
    const generated: TestCase[] = [
      {
        id: `g-${Date.now()}`,
        name: '支付订单 · 非法金额',
        endpoint: 'POST /api/payments',
        source: 'OpenAPI',
        status: '待审核',
        lastRun: '尚未运行',
      },
      {
        id: `g-${Date.now() + 1}`,
        name: '查询订单 · 不存在资源',
        endpoint: 'GET /api/orders/{id}',
        source: 'OpenAPI',
        status: '待审核',
        lastRun: '尚未运行',
      },
    ];
    setCases([...generated, ...cases]);
    notify('已生成 2 条测试草稿 · 等待审核');
  };

  return (
    <main className="page-view">
      <div className="page-intro">
        <div>
          <span className="eyebrow">TEST CASES</span>
          <h2>测试用例</h2>
          <p>由契约、AI Agent 和人工共同维护的可信测试资产。</p>
        </div>
        <button className="button button--primary" type="button" onClick={generateCases}>
          <Sparkle size={18} weight="fill" />从 OpenAPI 生成
        </button>
      </div>
      <section className="table-panel">
        <div className="case-summary">
          <span>
            <strong>{cases.length}</strong> 条用例
          </span>
          <span>
            <i className="dot dot--success" />{' '}
            {cases.filter((item) => item.status === '已发布').length} 已发布
          </span>
          <span>
            <i className="dot dot--warning" />{' '}
            {cases.filter((item) => item.status === '待审核').length} 待审核
          </span>
        </div>
        <div className="data-table cases-table">
          <div className="data-row data-row--head">
            <span>用例名称</span>
            <span>来源</span>
            <span>状态</span>
            <span>最近执行</span>
            <span>操作</span>
          </div>
          {cases.map((test) => (
            <div className="data-row" key={test.id}>
              <span>
                <strong>{test.name}</strong>
                <code>{test.endpoint}</code>
              </span>
              <span className="source-tag">
                {test.source === 'AI Agent' ? <Robot size={15} /> : <FileCode size={15} />}{' '}
                {test.source}
              </span>
              <span
                className={
                  test.status === '已发布'
                    ? 'status-badge status-badge--passed'
                    : 'status-badge status-badge--warning'
                }
              >
                {test.status}
              </span>
              <span>{test.lastRun}</span>
              <button className="icon-button" type="button" aria-label={`编辑 ${test.name}`}>
                <PencilSimple size={17} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

// Simple local store for cases (not yet migrated to Zustand)
import { create } from 'zustand';
import { initialCases } from '../../data';

interface CasesState {
  cases: TestCase[];
  setCases: (cases: TestCase[]) => void;
}

const useCasesStore = create<CasesState>((set) => ({
  cases: initialCases,
  setCases: (cases) => set({ cases }),
}));
