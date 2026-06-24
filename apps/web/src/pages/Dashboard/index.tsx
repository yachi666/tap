import { CaretRight } from '@phosphor-icons/react/CaretRight';
import { CheckCircle } from '@phosphor-icons/react/CheckCircle';
import { ClipboardText } from '@phosphor-icons/react/ClipboardText';
import { DotsThree } from '@phosphor-icons/react/DotsThree';
import { FileArrowUp } from '@phosphor-icons/react/FileArrowUp';
import { FlowArrow } from '@phosphor-icons/react/FlowArrow';
import { PlugsConnected } from '@phosphor-icons/react/PlugsConnected';
import { XCircle } from '@phosphor-icons/react/XCircle';
import { useNavigate } from 'react-router-dom';
import { initialRuns, testPlans, workflows } from '../../data';
import type { WorkflowMeta } from '../../types';
import { MetricCard } from './MetricCard';

function sideEffectLabel(effect: WorkflowMeta['sideEffect']) {
  if (effect === 'readonly') return '只读';
  if (effect === 'cleanable-write') return '可清理写入';
  return '不可逆';
}

export default function DashboardOverview() {
  const navigate = useNavigate();
  const topFlows = workflows.slice(0, 4);

  return (
    <main className="page-view overview-view">
      <div className="page-intro">
        <div>
          <span className="eyebrow">SKETCHTEST / PROJECT</span>
          <h2>早上好，今天的 API 很诚实。</h2>
          <p>
            共 {workflows.length} 条业务流程，
            {workflows.filter((w) => w.status === 'healthy').length} 条健康，仍有 3
            个失败用例需要关注。
          </p>
        </div>
        <button className="button button--primary" type="button" onClick={() => navigate('/apis')}>
          <FileArrowUp size={18} />
          导入 OpenAPI
        </button>
      </div>
      <section className="metrics-grid" aria-label="质量指标">
        <MetricCard
          icon={PlugsConnected}
          label="API 覆盖率"
          value="78%"
          delta="188 / 240"
          tone="brown"
        />
        <MetricCard
          icon={CheckCircle}
          label="通过率"
          value="96.4%"
          delta="较上周 +2.1%"
          tone="green"
        />
        <MetricCard
          icon={ClipboardText}
          label="总用例数"
          value="612"
          delta="本周新增 24"
          tone="amber"
        />
        <MetricCard
          icon={FlowArrow}
          label="关键流程"
          value={`${workflows.length}`}
          delta={`${workflows.filter((w) => w.status === 'healthy').length} 条健康`}
          tone="violet"
        />
        <MetricCard icon={XCircle} label="失败" value="3" delta="需要关注" tone="brick" />
      </section>
      <div className="overview-grid">
        <section className="paper-panel health-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">LAST 7 DAYS</span>
              <h3>运行健康度</h3>
            </div>
            <button type="button">
              <DotsThree size={20} />
            </button>
          </div>
          <div className="bar-chart" aria-label="最近七天运行健康度柱状图">
            {[64, 68, 72, 70, 82, 78, 91].map((value, index) => (
              <div key={index}>
                <span className="bar-success" style={{ height: `${value}%` }} />
                <span className="bar-failure" style={{ height: `${index === 5 ? 14 : 8}%` }} />
                <small>06-{15 + index}</small>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span>
              <i className="dot dot--success" />
              通过 51
            </span>
            <span>
              <i className="dot dot--failure" />
              失败 3
            </span>
            <span>
              <i className="dot dot--muted" />
              跳过 1
            </span>
          </div>
        </section>
        <section className="paper-panel recent-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">RECENT RUNS</span>
              <h3>最近执行</h3>
            </div>
            <button className="text-button" type="button" onClick={() => navigate('/reports')}>
              查看全部 <CaretRight size={15} />
            </button>
          </div>
          {['每日回归测试', '订单流程验证', '全量回归测试', '新增 API 验证'].map((name, index) => (
            <button
              className="recent-row"
              type="button"
              key={name}
              onClick={() => navigate('/reports')}
            >
              <time>{index === 0 ? '10:24' : `${8 - index}:15`}</time>
              <strong>{name}</strong>
              <span className="env-tag">测试环境</span>
              <span>{55 - index * 9} 用例</span>
              <span
                className={
                  index === 1
                    ? 'status-badge status-badge--failed'
                    : 'status-badge status-badge--passed'
                }
              >
                {index === 1 ? '失败' : '通过'}
              </span>
              <CaretRight size={15} />
            </button>
          ))}
        </section>
        <section className="paper-panel attention-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">NEEDS ATTENTION</span>
              <h3>失败用例</h3>
            </div>
            <span className="stamp stamp--danger">失败 3</span>
          </div>
          {['POST /v1/orders/create', 'GET /v1/users/{id}', 'PUT /v1/inventory/{id}'].map(
            (path, index) => (
              <div className="failure-row" key={path}>
                <span className="failure-pin" />
                <code>{path}</code>
                <span>{['订单创建校验失败', '用户信息查询超时', '库存更新数据不一致'][index]}</span>
                <time>{['2 小时前', '5 小时前', '1 天前'][index]}</time>
              </div>
            ),
          )}
        </section>
        <section className="paper-panel flow-preview">
          <div className="section-heading">
            <div>
              <span className="eyebrow">BUSINESS FLOWS</span>
              <h3>业务流程速览</h3>
            </div>
            <button className="text-button" type="button" onClick={() => navigate('/workflows')}>
              浏览全部 <CaretRight size={15} />
            </button>
          </div>
          <div className="quick-flows-grid">
            {topFlows.map((wf) => (
              <button
                key={wf.id}
                type="button"
                className={`quick-flow-card quick-flow--${wf.status}`}
                onClick={() => navigate(`/workflows/${wf.id}`)}
              >
                <span className={`bp-badge bp-badge--${wf.category}`}>{wf.bpId}</span>
                <strong>{wf.name}</strong>
                <small>
                  {wf.stepCount} 步骤 · {sideEffectLabel(wf.sideEffect)}
                </small>
                <span className={`bp-status bp-status--${wf.status}`}>
                  {wf.status === 'healthy' ? '健康' : wf.status === 'warning' ? '需关注' : '草稿'}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
