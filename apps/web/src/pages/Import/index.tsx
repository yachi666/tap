import { ApiView } from '../../views/ApiView';
import { useApiStore } from '../../stores/apiStore';
import { useVariableStore } from '../../stores/variableStore';
import { useEnvironmentStore } from '../../stores/environmentStore';
import { useUIStore } from '../../stores/uiStore';
import { apiVersions, versionDiff } from '../../data';
import { CpImportPanel } from '../../components/api/CpImportPanel';
import type { ApiEndpoint } from '../../types';

export function ImportPage() {
  const {
    apiSources,
    apiEndpoints,
    apiDetails,
    apiSchemas,
    imported,
    setImported,
    createEndpoint,
    updateEndpoint,
    deleteEndpoint,
    createSchema,
    saveSource,
    setManageSourcesOpen,
  } = useApiStore();
  const { variables } = useVariableStore();
  const { activeEnvironmentId } = useEnvironmentStore();
  const { notify } = useUIStore();

  const importApi = () => {
    setImported(true);
    notify('OpenAPI 导入成功 · 已创建 6 个接口资产');
  };

  const handleCpImport = (endpoints: ApiEndpoint[]) => {
    for (const ep of endpoints) {
      createEndpoint(ep, {
        endpointId: ep.id,
        method: ep.method,
        path: ep.path,
        summary: ep.summary ?? ep.path,
        deprecated: ep.deprecated ?? false,
        tags: ep.tags ?? [],
        parameters: [],
        requestBodies: [],
        responses: [],
      });
    }
    setImported(true);
    notify(`控制面导入成功 · ${endpoints.length} 个端点`);
  };

  return (
    <>
      <ApiView
        sources={apiSources}
        endpoints={apiEndpoints}
        versions={apiVersions}
        details={apiDetails}
        schemas={apiSchemas}
        diff={versionDiff}
        imported={imported}
        variables={variables}
        activeEnvironmentId={activeEnvironmentId}
        onImport={importApi}
        onCreate={createEndpoint}
        onUpdate={updateEndpoint}
        onDelete={deleteEndpoint}
        onCreateSchema={createSchema}
        onCreateVariable={() => {}}
        onManageSources={() => setManageSourcesOpen(true)}
        onSourceCreated={saveSource}
      />
      <CpImportPanel onImport={handleCpImport} />
    </>
  );
}
