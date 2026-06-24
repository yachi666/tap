import type { ElementType } from 'react';
import { DotsNine, Folders, CalendarCheck, UsersThree, Trash } from '@phosphor-icons/react';

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

export function GenericView({ path }: { path: string }) {
  const details: Partial<Record<string, [string, string, ElementType]>> = {
    '/projects': ['项目管理', '集中管理服务、成员与质量目标。', Folders],
    '/plans': ['测试计划', '组合用例与流程，形成 CI 质量门禁。', CalendarCheck],
    '/team': ['团队管理', '配置成员、角色和最小权限。', UsersThree],
    '/trash': ['回收站', '保留已归档资产并支持审计恢复。', Trash],
  };
  const [title, description, Icon] = details[path] ?? [
    viewLabels[path],
    '该模块正在准备。',
    DotsNine,
  ];
  return (
    <main className="page-view">
      <div className="page-intro">
        <div>
          <span className="eyebrow">SKETCHTEST MODULE</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <Icon size={72} weight="duotone" />
      </div>
    </main>
  );
}
