import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Pencil, Ban, Blocks, Rocket, PackageCheck, Link as LinkIcon, Copy, Check,
  BadgeCheck, Globe, Download, RefreshCw, Trash2, X, RotateCw,
} from 'lucide-react';
import { DataTable, Column, RowAction } from '../../../components/table/DataTable';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { Modal } from '../../../components/ui/Modal/Modal';
import { DynamicForm, FormField } from '../../../components/form/DynamicForm';
import { toast } from '../../../components/ui/Toast/toast.store';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';
import { subscriptionPlanApi } from '../../subscription-plans/pages/SubscriptionPlansPage';

export interface TenantDto {
  id: number;
  slug: string;
  name: string;
  isActive: boolean;
  subscriptionPlanId: number | null;
  isProvisioned: boolean;
}

interface PendingRegistrationDto {
  fullName: string;
  email: string;
  submittedAtUtc: string;
}

interface ModuleToggleDto {
  id: number;
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
}

interface TenantDomainDto {
  id: number;
  domain: string;
}

interface TenantLicenseStatusDto {
  status: number; // matches backend LicenseStatus enum order: Active, Trial, GracePeriod, Expired, Suspended
}

interface TenantCatalogResyncResultDto {
  resyncedCount: number;
  skippedCount: number;
  resyncedTenantIds: number[];
}

const LICENSE_STATUS_LABELS = ['Active', 'Trial', 'Grace Period', 'Expired', 'Suspended'];
const LICENSE_STATUS_STYLES = [
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
];

class TenantApi extends BaseRepository {
  constructor() { super('/tenants'); }
  async getAll(): Promise<TenantDto[]> {
    const res = await this.get<ApiResponse<TenantDto[]>>('');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async create(dto: { slug: string; name: string }): Promise<TenantDto> {
    const res = await this.post<ApiResponse<TenantDto>>('', dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async update(id: number, dto: { name: string }): Promise<TenantDto> {
    const res = await this.put<ApiResponse<TenantDto>>(`/${id}`, dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async disable(id: number): Promise<void> {
    await this.delete<any>(`/${id}`);
  }
  async getModules(tenantId: number): Promise<ModuleToggleDto[]> {
    const res = await this.get<ApiResponse<ModuleToggleDto[]>>(`/${tenantId}/modules`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async enableModule(tenantId: number, moduleId: number): Promise<void> {
    await this.post<any>(`/${tenantId}/modules/${moduleId}`, {});
  }
  async disableModule(tenantId: number, moduleId: number): Promise<void> {
    await this.delete<any>(`/${tenantId}/modules/${moduleId}`);
  }
  async provision(tenantId: number, subscriptionPlanId: number | null): Promise<void> {
    await this.post<any>(`/${tenantId}/provision`, { subscriptionPlanId });
  }
  async assignSubscriptionPlan(tenantId: number, subscriptionPlanId: number): Promise<void> {
    await this.post<any>(`/${tenantId}/subscription-plan`, { subscriptionPlanId });
  }
  async generateRegistrationLink(tenantId: number): Promise<{ token: string; expiresAtUtc: string }> {
    const res = await this.post<ApiResponse<{ token: string; expiresAtUtc: string }>>(`/${tenantId}/registration-link`, {});
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async getPendingRegistration(tenantId: number): Promise<PendingRegistrationDto | null> {
    const res = await this.get<ApiResponse<PendingRegistrationDto | null>>(`/${tenantId}/pending-registration`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async approveRegistration(tenantId: number, subscriptionPlanId: number | null): Promise<void> {
    await this.post<any>(`/${tenantId}/approve-registration`, { subscriptionPlanId });
  }
  async getLicenseStatus(tenantId: number): Promise<TenantLicenseStatusDto> {
    const res = await this.get<ApiResponse<TenantLicenseStatusDto>>(`/${tenantId}/license`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async startTrial(tenantId: number, trialEndsAtUtc: string): Promise<void> {
    await this.post<any>(`/${tenantId}/license/trial`, { trialEndsAtUtc });
  }
  async setLicenseExpiry(tenantId: number, licenseExpiresAtUtc: string | null): Promise<void> {
    await this.post<any>(`/${tenantId}/license/expiry`, { licenseExpiresAtUtc });
  }
  async suspendLicense(tenantId: number): Promise<void> {
    await this.post<any>(`/${tenantId}/license/suspend`, {});
  }
  async unsuspendLicense(tenantId: number): Promise<void> {
    await this.post<any>(`/${tenantId}/license/unsuspend`, {});
  }
  async getDomains(tenantId: number): Promise<TenantDomainDto[]> {
    const res = await this.get<ApiResponse<TenantDomainDto[]>>(`/${tenantId}/domains`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async addDomain(tenantId: number, domain: string): Promise<TenantDomainDto> {
    const res = await this.post<ApiResponse<TenantDomainDto>>(`/${tenantId}/domains`, { domain });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async removeDomain(tenantId: number, domainId: number): Promise<void> {
    await this.delete<any>(`/${tenantId}/domains/${domainId}`);
  }
  async exportData(tenantId: number): Promise<unknown> {
    const res = await this.get<ApiResponse<unknown>>(`/${tenantId}/export`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async purge(tenantId: number, confirmSlug: string): Promise<void> {
    await this.delete<any>(`/${tenantId}/purge`, { params: { confirmSlug } });
  }
  async resyncCatalog(tenantId: number): Promise<void> {
    await this.post<any>(`/${tenantId}/resync-catalog`, {});
  }
  async resyncAllCatalogs(): Promise<TenantCatalogResyncResultDto> {
    const res = await this.post<ApiResponse<TenantCatalogResyncResultDto>>('/resync-catalog-all', {});
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

export const tenantApi = new TenantApi();

const ToggleSwitch: React.FC<{ checked: boolean; disabled?: boolean; onChange: () => void }> = ({ checked, disabled, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
      checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

export const TenantsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTenant, setEditTenant] = useState<TenantDto | null>(null);
  const [disableTenantId, setDisableTenantId] = useState<number | null>(null);
  const [modulesTenant, setModulesTenant] = useState<TenantDto | null>(null);
  const [pendingModuleId, setPendingModuleId] = useState<number | null>(null);
  const [provisionTenant, setProvisionTenant] = useState<TenantDto | null>(null);
  const [provisionPlanId, setProvisionPlanId] = useState<string>('');
  const [assignPlanTenant, setAssignPlanTenant] = useState<TenantDto | null>(null);
  const [assignPlanId, setAssignPlanId] = useState<string>('');
  const [linkTenant, setLinkTenant] = useState<TenantDto | null>(null);
  const [registrationLink, setRegistrationLink] = useState<{ url: string; expiresAtUtc: string } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [licenseTenant, setLicenseTenant] = useState<TenantDto | null>(null);
  const [trialDate, setTrialDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [domainsTenant, setDomainsTenant] = useState<TenantDto | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [purgeTenant, setPurgeTenant] = useState<TenantDto | null>(null);
  const [purgeConfirmSlug, setPurgeConfirmSlug] = useState('');

  const { data: tenants = [], isLoading, error, refetch } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantApi.getAll(),
  });

  const { data: subscriptionPlans = [] } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionPlanApi.getAll(),
  });

  const planNameById = new Map(subscriptionPlans.map((plan) => [plan.id, plan.name]));

  const { data: pendingRegistration, isLoading: loadingPendingRegistration } = useQuery({
    queryKey: ['tenant-pending-registration', provisionTenant?.id],
    queryFn: () => tenantApi.getPendingRegistration(provisionTenant!.id),
    enabled: provisionTenant !== null,
  });

  const { data: modules = [], isLoading: loadingModules } = useQuery({
    queryKey: ['tenant-modules', modulesTenant?.id],
    queryFn: () => tenantApi.getModules(modulesTenant!.id),
    enabled: modulesTenant !== null,
  });

  const { data: licenseStatus, isLoading: loadingLicense } = useQuery({
    queryKey: ['tenant-license', licenseTenant?.id],
    queryFn: () => tenantApi.getLicenseStatus(licenseTenant!.id),
    enabled: licenseTenant !== null,
  });

  const { data: domains = [], isLoading: loadingDomains } = useQuery({
    queryKey: ['tenant-domains', domainsTenant?.id],
    queryFn: () => tenantApi.getDomains(domainsTenant!.id),
    enabled: domainsTenant !== null,
  });

  const moduleToggleMutation = useMutation({
    mutationFn: ({ moduleId, enable }: { moduleId: number; enable: boolean }) =>
      enable ? tenantApi.enableModule(modulesTenant!.id, moduleId) : tenantApi.disableModule(modulesTenant!.id, moduleId),
    onMutate: ({ moduleId }) => setPendingModuleId(moduleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant-modules', modulesTenant?.id] }),
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to update module'),
    onSettled: () => setPendingModuleId(null),
  });

  const createMutation = useMutation({
    mutationFn: (dto: { slug: string; name: string }) => tenantApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant created successfully');
      setShowAddModal(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to create tenant'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: { name: string } }) => tenantApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant updated successfully');
      setEditTenant(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to update tenant'),
  });

  const disableMutation = useMutation({
    mutationFn: (id: number) => tenantApi.disable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant disabled successfully');
      setDisableTenantId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to disable tenant'),
  });

  const provisionMutation = useMutation({
    mutationFn: ({ id, subscriptionPlanId }: { id: number; subscriptionPlanId: number | null }) =>
      tenantApi.provision(id, subscriptionPlanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-modules'] });
      toast.success('Tenant provisioned successfully');
      setProvisionTenant(null);
      setProvisionPlanId('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to provision tenant'),
  });

  const approveRegistrationMutation = useMutation({
    mutationFn: ({ id, subscriptionPlanId }: { id: number; subscriptionPlanId: number | null }) =>
      tenantApi.approveRegistration(id, subscriptionPlanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-modules'] });
      toast.success('Registration approved and tenant activated successfully');
      setProvisionTenant(null);
      setProvisionPlanId('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to approve registration'),
  });

  const assignPlanMutation = useMutation({
    mutationFn: ({ id, subscriptionPlanId }: { id: number; subscriptionPlanId: number }) =>
      tenantApi.assignSubscriptionPlan(id, subscriptionPlanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-modules'] });
      toast.success('Subscription plan assigned successfully');
      setAssignPlanTenant(null);
      setAssignPlanId('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to assign subscription plan'),
  });

  const registrationLinkMutation = useMutation({
    mutationFn: (id: number) => tenantApi.generateRegistrationLink(id),
    onSuccess: (data) => {
      setRegistrationLink({ url: `${window.location.origin}/register-tenant?token=${encodeURIComponent(data.token)}`, expiresAtUtc: data.expiresAtUtc });
      setLinkCopied(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to generate registration link');
      setLinkTenant(null);
    },
  });

  const startTrialMutation = useMutation({
    mutationFn: ({ id, trialEndsAtUtc }: { id: number; trialEndsAtUtc: string }) => tenantApi.startTrial(id, trialEndsAtUtc),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-license', licenseTenant?.id] });
      toast.success('Trial started');
      setTrialDate('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to start trial'),
  });

  const setExpiryMutation = useMutation({
    mutationFn: ({ id, licenseExpiresAtUtc }: { id: number; licenseExpiresAtUtc: string | null }) =>
      tenantApi.setLicenseExpiry(id, licenseExpiresAtUtc),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-license', licenseTenant?.id] });
      toast.success('License expiry updated');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to update license expiry'),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: number) => tenantApi.suspendLicense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-license', licenseTenant?.id] });
      toast.success('Tenant license suspended');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to suspend license'),
  });

  const unsuspendMutation = useMutation({
    mutationFn: (id: number) => tenantApi.unsuspendLicense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-license', licenseTenant?.id] });
      toast.success('Tenant license unsuspended');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to unsuspend license'),
  });

  const addDomainMutation = useMutation({
    mutationFn: ({ id, domain }: { id: number; domain: string }) => tenantApi.addDomain(id, domain),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-domains', domainsTenant?.id] });
      toast.success('Domain added');
      setNewDomain('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to add domain'),
  });

  const removeDomainMutation = useMutation({
    mutationFn: ({ id, domainId }: { id: number; domainId: number }) => tenantApi.removeDomain(id, domainId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-domains', domainsTenant?.id] });
      toast.success('Domain removed');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to remove domain'),
  });

  const exportMutation = useMutation({
    mutationFn: (tenant: TenantDto) => tenantApi.exportData(tenant.id).then((data) => ({ data, tenant })),
    onSuccess: ({ data, tenant }) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tenant.slug}-export.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Tenant data exported');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to export tenant data'),
  });

  const purgeMutation = useMutation({
    mutationFn: ({ id, confirmSlug }: { id: number; confirmSlug: string }) => tenantApi.purge(id, confirmSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant purged');
      setPurgeTenant(null);
      setPurgeConfirmSlug('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to purge tenant'),
  });

  const resyncMutation = useMutation({
    mutationFn: (id: number) => tenantApi.resyncCatalog(id),
    onSuccess: () => toast.success('Tenant catalog resynced'),
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to resync catalog'),
  });

  const resyncAllMutation = useMutation({
    mutationFn: () => tenantApi.resyncAllCatalogs(),
    onSuccess: (result) => toast.success(`Resynced ${result.resyncedCount} tenant(s), skipped ${result.skippedCount} unprovisioned`),
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to resync all catalogs'),
  });

  const getStatusBadge = (isActive: boolean) => (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
      isActive
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }`}>
      {isActive ? 'Active' : 'Disabled'}
    </span>
  );

  const columns: Column<TenantDto>[] = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'slug', label: 'Slug', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'subscriptionPlanId',
      label: 'Plan',
      render: (_, tenant) =>
        tenant.subscriptionPlanId !== null ? (planNameById.get(tenant.subscriptionPlanId) ?? '—') : '—',
    },
    { key: 'isActive', label: 'Status', sortable: true, render: (_, tenant) => getStatusBadge(tenant.isActive) },
  ];

  const rowActions: RowAction<TenantDto>[] = [
    { icon: Pencil, label: 'Edit', onClick: (t) => setEditTenant(t), variant: 'primary' },
    { icon: Blocks, label: 'Modules', onClick: (t) => setModulesTenant(t), variant: 'secondary' },
    {
      icon: Rocket,
      label: 'Activate',
      onClick: (t) => { setProvisionTenant(t); setProvisionPlanId(t.subscriptionPlanId ? String(t.subscriptionPlanId) : ''); },
      variant: 'secondary',
      show: (t) => !t.isProvisioned,
    },
    {
      icon: LinkIcon,
      label: 'Registration Link',
      onClick: (t) => { setLinkTenant(t); setRegistrationLink(null); registrationLinkMutation.mutate(t.id); },
      variant: 'secondary',
      show: (t) => !t.isProvisioned,
    },
    {
      icon: PackageCheck,
      label: 'Assign Plan',
      onClick: (t) => { setAssignPlanTenant(t); setAssignPlanId(t.subscriptionPlanId ? String(t.subscriptionPlanId) : ''); },
      variant: 'secondary',
      show: (t) => t.isProvisioned,
    },
    {
      icon: BadgeCheck,
      label: 'License',
      onClick: (t) => setLicenseTenant(t),
      variant: 'secondary',
      show: (t) => t.isProvisioned,
    },
    { icon: Globe, label: 'Domains', onClick: (t) => { setDomainsTenant(t); setNewDomain(''); }, variant: 'secondary' },
    { icon: Download, label: 'Export Data', onClick: (t) => exportMutation.mutate(t), variant: 'secondary' },
    {
      icon: RefreshCw,
      label: 'Resync Catalog',
      onClick: (t) => resyncMutation.mutate(t.id),
      variant: 'secondary',
      show: (t) => t.isProvisioned,
    },
    { icon: Ban, label: 'Disable', onClick: (t) => setDisableTenantId(t.id), variant: 'danger', show: (t) => t.isActive },
    {
      icon: Trash2,
      label: 'Purge',
      onClick: (t) => { setPurgeTenant(t); setPurgeConfirmSlug(''); },
      variant: 'danger',
      show: (t) => !t.isActive,
    },
  ];

  const createFields: FormField[] = [
    { name: 'slug', label: 'Slug', type: 'text', required: true, placeholder: 'e.g. acme-corp' },
    { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g. Acme Corp' },
  ];

  const editFields: FormField[] = [
    { name: 'name', label: 'Name', type: 'text', required: true, defaultValue: editTenant?.name || '' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tenants</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage tenant registrations</p>
        </div>
        <button
          type="button"
          onClick={() => resyncAllMutation.mutate()}
          disabled={resyncAllMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          title="Re-run RBAC/menu defaults for every provisioned tenant"
        >
          <RotateCw className={`w-4 h-4 ${resyncAllMutation.isPending ? 'animate-spin' : ''}`} />
          Resync All Catalogs
        </button>
      </div>

      <DataTable
        columns={columns}
        data={tenants}
        isLoading={isLoading}
        error={error?.message}
        searchable
        searchPlaceholder="Search tenants..."
        emptyState={{ title: 'No tenants found', description: 'Register a new tenant to get started' }}
        actions={{ add: { label: 'Add Tenant', onClick: () => setShowAddModal(true) } }}
        rowActions={rowActions}
        onRetry={() => refetch()}
      />

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Register New Tenant" size="md">
        <DynamicForm
          fields={createFields}
          onSubmit={(data) => createMutation.mutate({ slug: data.slug, name: data.name })}
          submitLabel="Create Tenant"
          onCancel={() => setShowAddModal(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal isOpen={editTenant !== null} onClose={() => setEditTenant(null)} title="Edit Tenant" size="md">
        {editTenant && (
          <DynamicForm
            key={editTenant.id}
            fields={editFields}
            onSubmit={(data) => updateMutation.mutate({ id: editTenant.id, dto: { name: data.name } })}
            submitLabel="Update Tenant"
            onCancel={() => setEditTenant(null)}
            isLoading={updateMutation.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={disableTenantId !== null}
        onClose={() => setDisableTenantId(null)}
        onConfirm={() => disableTenantId !== null && disableMutation.mutate(disableTenantId)}
        title="Disable Tenant"
        message="Are you sure you want to disable this tenant? Its users will lose access until it is re-enabled."
        confirmText="Disable"
        variant="danger"
      />

      <Modal
        isOpen={modulesTenant !== null}
        onClose={() => setModulesTenant(null)}
        title={`Modules for "${modulesTenant?.name ?? ''}"`}
        size="md"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Toggle which modules this tenant has access to. Disabling a module immediately revokes its permissions for this tenant.
        </p>
        {loadingModules ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : modules.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No optional modules are available yet</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {modules.map((module) => (
              <div key={module.id} className="flex items-center justify-between py-3">
                <div className="min-w-0 pr-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{module.name}</p>
                  {module.description && <p className="text-xs text-gray-400 truncate">{module.description}</p>}
                </div>
                <ToggleSwitch
                  checked={module.isEnabled}
                  disabled={moduleToggleMutation.isPending && pendingModuleId === module.id}
                  onChange={() => moduleToggleMutation.mutate({ moduleId: module.id, enable: !module.isEnabled })}
                />
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={provisionTenant !== null}
        onClose={() => setProvisionTenant(null)}
        title={`Activate "${provisionTenant?.name ?? ''}"`}
        size="md"
      >
        {loadingPendingRegistration ? (
          <div className="p-8 text-center text-gray-400">Checking for a pending request...</div>
        ) : (
          <>
            {pendingRegistration ? (
              <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Pending request awaiting approval</p>
                <p className="text-sm text-blue-800 dark:text-blue-400 mt-1">
                  {pendingRegistration.fullName} ({pendingRegistration.email})
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                  Submitted {new Date(pendingRegistration.submittedAtUtc).toLocaleString()}
                </p>
              </div>
            ) : null}
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {pendingRegistration
                ? 'Approving seeds default roles, menus, and creates the admin account above with the credentials they submitted.'
                : 'Seeds default roles, menus and a generic admin user for this tenant. Safe to re-run.'}{' '}
              Optionally pick a subscription plan to entitle its modules at the same time; leave blank to entitle only
              the Core module.
            </p>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subscription Plan</label>
                <select
                  value={provisionPlanId}
                  onChange={(e) => setProvisionPlanId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No plan (Core module only)</option>
                  {subscriptionPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setProvisionTenant(null)}
                  disabled={provisionMutation.isPending || approveRegistrationMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={provisionMutation.isPending || approveRegistrationMutation.isPending}
                  onClick={() => {
                    if (!provisionTenant) return;
                    const subscriptionPlanId = provisionPlanId ? Number(provisionPlanId) : null;
                    if (pendingRegistration) {
                      approveRegistrationMutation.mutate({ id: provisionTenant.id, subscriptionPlanId });
                    } else {
                      provisionMutation.mutate({ id: provisionTenant.id, subscriptionPlanId });
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {pendingRegistration ? 'Approve & Activate' : 'Activate'}
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>

      <Modal
        isOpen={linkTenant !== null}
        onClose={() => { setLinkTenant(null); setRegistrationLink(null); }}
        title={`Registration Link for "${linkTenant?.name ?? ''}"`}
        size="md"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Share this link with the tenant's admin (email, SMS, chat — however you'd send a message). Opening it lets
          them submit their name, email and password as a request — it does not grant access on its own. Review it
          under "Activate" for this tenant once they've submitted, and approve to actually activate the tenant.
          Valid for 7 days or until submitted.
        </p>
        {registrationLinkMutation.isPending ? (
          <div className="p-8 text-center text-gray-400">Generating link...</div>
        ) : registrationLink ? (
          <div className="space-y-4">
            <div className="flex items-stretch gap-2">
              <input
                type="text"
                readOnly
                value={registrationLink.url}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 text-sm truncate"
              />
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(registrationLink.url);
                  setLinkCopied(true);
                  toast.success('Link copied to clipboard');
                }}
                className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 shrink-0"
              >
                {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {linkCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Expires {new Date(registrationLink.expiresAtUtc).toLocaleString()}
            </p>
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => { setLinkTenant(null); setRegistrationLink(null); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={assignPlanTenant !== null}
        onClose={() => setAssignPlanTenant(null)}
        title={`Assign Subscription Plan to "${assignPlanTenant?.name ?? ''}"`}
        size="md"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Resyncs this tenant's modules to exactly match the selected plan (adds and removes as needed; Core is
          always kept) and updates its user limit. For an already-provisioned tenant changing plans.
        </p>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Subscription Plan<span className="text-red-500 ml-1">*</span>
            </label>
            <select
              value={assignPlanId}
              onChange={(e) => setAssignPlanId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a plan</option>
              {subscriptionPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>{plan.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setAssignPlanTenant(null)}
              disabled={assignPlanMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={assignPlanMutation.isPending || !assignPlanId}
              onClick={() =>
                assignPlanTenant &&
                assignPlanId &&
                assignPlanMutation.mutate({ id: assignPlanTenant.id, subscriptionPlanId: Number(assignPlanId) })
              }
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Assign Plan
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={licenseTenant !== null}
        onClose={() => setLicenseTenant(null)}
        title={`License for "${licenseTenant?.name ?? ''}"`}
        size="md"
      >
        {loadingLicense ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <div className="space-y-5">
            {licenseStatus && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Current status:</span>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${LICENSE_STATUS_STYLES[licenseStatus.status]}`}>
                  {LICENSE_STATUS_LABELS[licenseStatus.status]}
                </span>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Trial</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={trialDate}
                  onChange={(e) => setTrialDate(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  type="button"
                  disabled={!trialDate || startTrialMutation.isPending}
                  onClick={() => licenseTenant && startTrialMutation.mutate({ id: licenseTenant.id, trialEndsAtUtc: new Date(trialDate).toISOString() })}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shrink-0"
                >
                  Start
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">License Expiry</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  type="button"
                  disabled={!expiryDate || setExpiryMutation.isPending}
                  onClick={() => licenseTenant && setExpiryMutation.mutate({ id: licenseTenant.id, licenseExpiresAtUtc: new Date(expiryDate).toISOString() })}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shrink-0"
                >
                  Set
                </button>
                <button
                  type="button"
                  disabled={setExpiryMutation.isPending}
                  onClick={() => licenseTenant && setExpiryMutation.mutate({ id: licenseTenant.id, licenseExpiresAtUtc: null })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 shrink-0"
                >
                  Clear
                </button>
              </div>
              <p className="text-xs text-gray-400">No expiry means an unmanaged/perpetual license.</p>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              {licenseStatus?.status === 4 ? (
                <button
                  type="button"
                  disabled={unsuspendMutation.isPending}
                  onClick={() => licenseTenant && unsuspendMutation.mutate(licenseTenant.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  Unsuspend
                </button>
              ) : (
                <button
                  type="button"
                  disabled={suspendMutation.isPending}
                  onClick={() => licenseTenant && suspendMutation.mutate(licenseTenant.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Suspend
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={domainsTenant !== null}
        onClose={() => setDomainsTenant(null)}
        title={`Domains for "${domainsTenant?.name ?? ''}"`}
        size="md"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Custom domains and subdomains that resolve to this tenant for anonymous requests (e.g. the login page).
        </p>
        {loadingDomains ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <div className="space-y-4">
            {domains.length === 0 ? (
              <div className="p-6 text-center text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                No custom domains configured
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                {domains.map((d) => (
                  <div key={d.id} className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm text-gray-900 dark:text-white">{d.domain}</span>
                    <button
                      type="button"
                      disabled={removeDomainMutation.isPending}
                      onClick={() => domainsTenant && removeDomainMutation.mutate({ id: domainsTenant.id, domainId: d.id })}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="e.g. shop.acme.com"
                className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="button"
                disabled={!newDomain.trim() || addDomainMutation.isPending}
                onClick={() => domainsTenant && addDomainMutation.mutate({ id: domainsTenant.id, domain: newDomain.trim() })}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shrink-0"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={purgeTenant !== null}
        onClose={() => { setPurgeTenant(null); setPurgeConfirmSlug(''); }}
        title={`Purge "${purgeTenant?.name ?? ''}"`}
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm font-medium text-red-900 dark:text-red-300">This is irreversible</p>
            <p className="text-sm text-red-800 dark:text-red-400 mt-1">
              Permanently deletes every user, role, menu, site setting, feature flag, module entitlement and domain
              for this tenant, plus the tenant record itself. Audit log entries referencing this tenant are kept.
              Only allowed once the tenant has been disabled and stayed disabled past the configured cooling-off
              period — if it's too soon, the server will reject this with the remaining wait time.
            </p>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Type <span className="font-mono">{purgeTenant?.slug}</span> to confirm
            </label>
            <input
              type="text"
              value={purgeConfirmSlug}
              onChange={(e) => setPurgeConfirmSlug(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => { setPurgeTenant(null); setPurgeConfirmSlug(''); }}
              disabled={purgeMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={purgeMutation.isPending || purgeConfirmSlug !== purgeTenant?.slug}
              onClick={() => purgeTenant && purgeMutation.mutate({ id: purgeTenant.id, confirmSlug: purgeConfirmSlug })}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Permanently Purge
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
