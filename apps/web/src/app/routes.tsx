import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import DashboardPage from '../pages/Dashboard';
import { ApiManagementPage } from '../pages/ApiManagement';
import { CasesPage } from '../pages/Cases';
import { AgentPage } from '../pages/Agent';
import { ReportsPage } from '../pages/Reports';
import { ImportPage } from '../pages/Import';
import VariablesPage from '../pages/Variables';
import EnvironmentsPage from '../pages/Environments';
import WorkflowsPage from '../pages/Workflows';
import { GenericView } from '../pages/GenericView';

export function AppRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/apis" element={<ApiManagementPage />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/agent" element={<AgentPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/variables" element={<VariablesPage />} />
        <Route path="/environments" element={<EnvironmentsPage />} />
        <Route path="/workflows" element={<WorkflowsPage />} />
        <Route path="/workflows/:id" element={<WorkflowsPage />} />
        {/* Placeholder routes for modules not yet built */}
        <Route path="/plans" element={<GenericView path="/plans" />} />
        <Route path="/projects" element={<GenericView path="/projects" />} />
        <Route path="/team" element={<GenericView path="/team" />} />
        <Route path="/trash" element={<GenericView path="/trash" />} />
      </Routes>
    </AppLayout>
  );
}
