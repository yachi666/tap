import { useState } from 'react';
import { Robot, GitBranch, Lightning, Sparkle, ShieldCheck, FileCode } from '@phosphor-icons/react';

export function AgentPage() {
  const [repo, setRepo] = useState('github.com/sketchtest/order-service');
  const [analyzing, setAnalyzing] = useState(false);
  const [done, setDone] = useState(false);

  const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const analyze = async () => {
    setAnalyzing(true);
    setDone(false);
    await sleep(1300);
    setAnalyzing(false);
    setDone(true);
  };

  return (
    <main className="page-view">
      <div className="page-intro">
        <div>
          <span className="eyebrow">REPOSITORY AGENT / BETA</span>
          <h2>AI 仓库分析</h2>
          <p>从路由、DTO、鉴权和错误分支生成有证据的测试草稿。</p>
        </div>
      </div>
      <section className="agent-hero">
        <div className="agent-copy">
          <span className="agent-mark">
            <Robot size={38} weight="duotone" />
          </span>
          <h3>让代码自己交代测试线索</h3>
          <p>
            只读扫描指定分支。每条建议都关联文件位置、提交版本和置信度，未经审核不会进入正式测试集。
          </p>
          <label>
            Git 仓库地址
            <div className="repo-input">
              <GitBranch size={19} />
              <input value={repo} onChange={(event) => setRepo(event.target.value)} />
              <button
                className="button button--primary"
                type="button"
                onClick={analyze}
                disabled={analyzing}
              >
                {analyzing ? <Lightning className="spin" size={17} /> : <Sparkle size={17} />}{' '}
                {analyzing ? '正在分析' : '开始分析'}
              </button>
            </div>
          </label>
          <div className="safety-row">
            <ShieldCheck size={18} />
            <span>只读权限</span>
            <span>凭证不进入模型</span>
            <span>人工审核发布</span>
          </div>
        </div>
        <div className="agent-sketch">
          <Robot size={72} weight="duotone" />
          <span>route → dto → service → test</span>
        </div>
      </section>
      {done ? (
        <section className="paper-panel findings-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">ANALYSIS COMPLETE</span>
              <h3>发现 3 条测试机会</h3>
            </div>
            <span className="stamp stamp--success">已验证</span>
          </div>
          {[
            ['PaymentController.ts:84', '支付余额不足分支未覆盖', '94%'],
            ['OrderDto.ts:31', 'quantity 最大值边界缺少用例', '88%'],
            ['AuthGuard.ts:52', '过期 Token 场景缺少断言', '82%'],
          ].map(([file, title, confidence]) => (
            <div className="finding-row" key={file}>
              <FileCode size={20} />
              <span>
                <code>{file}</code>
                <strong>{title}</strong>
              </span>
              <em>置信度 {confidence}</em>
              <button className="button button--outline" type="button">
                生成草稿
              </button>
            </div>
          ))}
        </section>
      ) : null}
    </main>
  );
}
