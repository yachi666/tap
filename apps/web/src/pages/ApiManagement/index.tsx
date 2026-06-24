import { ApiView } from '../../views/ApiView';
import { useApiStore } from '../../stores/apiStore';
import { useVariableStore } from '../../stores/variableStore';
import { useEnvironmentStore } from '../../stores/environmentStore';
import { useUIStore } from '../../stores/uiStore';
import { apiVersions, versionDiff } from '../../data';

export function ApiManagementPage() {
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
  } = useApiStore();

  const { variables } = useVariableStore();
  const { activeEnvironmentId } = useEnvironmentStore();
  const { notify } = useUIStore();

  const importApi = () => {
    setImported(true);
    notify('OpenAPI 导入成功 · 已创建 6 个接口资产');
  };

  return (
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
      onManageSources={() => {}}
      onSourceCreated={saveSource}
    />
  );
}
