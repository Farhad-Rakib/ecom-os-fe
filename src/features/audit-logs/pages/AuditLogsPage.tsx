import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, Plus, Pencil, Trash2, LogIn } from 'lucide-react';
import { DataTable, Column, RowAction } from '../../../components/table/DataTable';
import { Modal } from '../../../components/ui/Modal/Modal';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';
import { tenantApi } from '../../tenants/pages/TenantsPage';

// Order must match the backend AuditAction enum exactly (Domain/Enums/AuditAction.cs) --
// `action` on AuditLogDto is the raw numeric enum value, indexed into this array.
export type AuditAction = 'Created' | 'Updated' | 'Deleted' | 'Accessed';

const ACTION_LABELS: AuditAction[] = ['Created', 'Updated', 'Deleted', 'Accessed'];

export interface AuditLogDto {
  id: number;
  tenantId: number | null;
  tenantName: string | null;
  userId: number | null;
  userName: string | null;
  entityName: string;
  entityId: number | null;
  action: number;
  changes: string | null;
  createdAt: string;
}

interface PagedResultDto<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface AuditLogQueryParams {
  tenantId?: number;
  entityName?: string;
  action?: number;
  userId?: number;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
}

// Entities excluded from capture on the backend (RefreshToken, PasswordResetToken, AuditLog itself)
// are intentionally left out of this list — see ApplicationDbContext.AuditExcludedTypes.
const ENTITY_NAMES = [
  'Menu', 'Module', 'Notification', 'Permission', 'Role', 'RolePermission',
  'SiteSetting', 'SubscriptionPlan', 'SubscriptionPlanModule', 'SystemSetting',
  'Tenant', 'TenantDomain', 'TenantFeatureFlag', 'TenantModule', 'TenantContextOverride',
  'User', 'UserRole',
];

class AuditLogApi extends BaseRepository {
  constructor() { super('/audit-logs'); }
  async getPaged(params: AuditLogQueryParams): Promise<PagedResultDto<AuditLogDto>> {
    const res = await this.get<ApiResponse<PagedResultDto<AuditLogDto>>>('', { params });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

const auditLogApi = new AuditLogApi();

const actionBadge: Record<AuditAction, string> = {
  Created: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Updated: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Deleted: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Accessed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const actionIcon: Record<AuditAction, React.ReactNode> = {
  Created: <Plus className="w-3 h-3" />,
  Updated: <Pencil className="w-3 h-3" />,
  Deleted: <Trash2 className="w-3 h-3" />,
  Accessed: <LogIn className="w-3 h-3" />,
};

const selectClasses =
  'px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

export const AuditLogsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [entityName, setEntityName] = useState('');
  const [action, setAction] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewLog, setViewLog] = useState<AuditLogDto | null>(null);

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantApi.getAll(),
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['audit-logs', { page, pageSize, entityName, action, tenantId, dateFrom, dateTo }],
    queryFn: () =>
      auditLogApi.getPaged({
        page,
        pageSize,
        entityName: entityName || undefined,
        action: action !== '' ? Number(action) : undefined,
        tenantId: tenantId !== '' ? Number(tenantId) : undefined,
        dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
        dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
      }),
  });

  const resetToFirstPage = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const columns: Column<AuditLogDto>[] = [
    {
      key: 'createdAt',
      label: 'Time',
      width: '180px',
      render: (_, log) => new Date(log.createdAt).toLocaleString(),
    },
    {
      key: 'action',
      label: 'Action',
      width: '110px',
      render: (_, log) => {
        const label = ACTION_LABELS[log.action];
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${actionBadge[label]}`}>
            {actionIcon[label]}
            {label}
          </span>
        );
      },
    },
    {
      key: 'entityName',
      label: 'Entity',
      render: (_, log) => (
        <span className="text-sm text-gray-900 dark:text-white">
          {log.entityName}
          {log.entityId !== null && <span className="text-gray-400 dark:text-gray-500"> #{log.entityId}</span>}
        </span>
      ),
    },
    {
      key: 'tenantName',
      label: 'Tenant',
      render: (_, log) => log.tenantName || <span className="text-gray-400">Global</span>,
    },
    {
      key: 'userName',
      label: 'User',
      render: (_, log) => log.userName || <span className="text-gray-400">System</span>,
    },
  ];

  const rowActions: RowAction<AuditLogDto>[] = [
    { icon: Eye, label: 'View changes', onClick: (log) => setViewLog(log), variant: 'secondary' },
  ];

  let changesEntries: [string, unknown][] = [];
  if (viewLog?.changes) {
    try {
      changesEntries = Object.entries(JSON.parse(viewLog.changes));
    } catch {
      changesEntries = [];
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track every create, update, and delete recorded across the platform
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={entityName}
          onChange={(e) => resetToFirstPage(setEntityName)(e.target.value)}
          className={selectClasses}
        >
          <option value="">All entities</option>
          {ENTITY_NAMES.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <select
          value={action}
          onChange={(e) => resetToFirstPage(setAction)(e.target.value)}
          className={selectClasses}
        >
          <option value="">All actions</option>
          {ACTION_LABELS.map((label, index) => (
            <option key={label} value={index}>{label}</option>
          ))}
        </select>

        <select
          value={tenantId}
          onChange={(e) => resetToFirstPage(setTenantId)(e.target.value)}
          className={selectClasses}
        >
          <option value="">All tenants</option>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => resetToFirstPage(setDateFrom)(e.target.value)}
          className={selectClasses}
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => resetToFirstPage(setDateTo)(e.target.value)}
          className={selectClasses}
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        error={error?.message}
        searchable={false}
        sortable={false}
        pagination={{
          currentPage: data?.page ?? page,
          totalPages: data?.totalPages ?? 1,
          pageSize: data?.pageSize ?? pageSize,
          total: data?.total ?? 0,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
        emptyState={{ title: 'No audit logs found', description: 'Try adjusting your filters' }}
        rowActions={rowActions}
        onRetry={() => refetch()}
      />

      <Modal isOpen={viewLog !== null} onClose={() => setViewLog(null)} title="Audit Log Details" size="lg">
        {viewLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Entity</span>
                <p className="text-gray-900 dark:text-white">{viewLog.entityName} {viewLog.entityId !== null && `#${viewLog.entityId}`}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Action</span>
                <p className="text-gray-900 dark:text-white">{ACTION_LABELS[viewLog.action]}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Tenant</span>
                <p className="text-gray-900 dark:text-white">{viewLog.tenantName || 'Global'}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">User</span>
                <p className="text-gray-900 dark:text-white">{viewLog.userName || 'System'}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 dark:text-gray-400">Timestamp</span>
                <p className="text-gray-900 dark:text-white">{new Date(viewLog.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Changes</span>
              {changesEntries.length === 0 ? (
                <p className="text-sm text-gray-400 mt-1">No field-level changes recorded</p>
              ) : (
                <div className="mt-1 border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-700/50">
                  {changesEntries.map(([key, value]) => (
                    <div key={key} className="flex items-start gap-3 px-3 py-2 text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300 shrink-0 w-40">{key}</span>
                      <span className="text-gray-600 dark:text-gray-400 break-all">{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
