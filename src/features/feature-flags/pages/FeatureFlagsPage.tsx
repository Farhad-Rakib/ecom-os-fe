import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { featureFlagsApi, FeatureFlagDto } from '../../../core/api/services/feature-flags.api';
import { toast } from '../../../components/ui/Toast/toast.store';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { Modal } from '../../../components/ui/Modal/Modal';

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

export const FeatureFlagsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<FeatureFlagDto | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ key: '', isEnabled: true, rolloutPercentage: '100' });

  const { data: flags = [], isLoading } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: () => featureFlagsApi.getAll(),
  });

  const setMutation = useMutation({
    mutationFn: (dto: { key: string; isEnabled: boolean; rolloutPercentage: number }) => featureFlagsApi.set(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success('Feature flag saved');
      setShowAddModal(false);
      setEditItem(null);
      setFormData({ key: '', isEnabled: true, rolloutPercentage: '100' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to save feature flag'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => featureFlagsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success('Feature flag deleted');
      setDeleteId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to delete feature flag'),
  });

  // Toggling an existing flag's IsEnabled directly from the list re-sends its current
  // RolloutPercentage unchanged -- a quick on/off without opening the edit modal.
  const quickToggleMutation = useMutation({
    mutationFn: (flag: FeatureFlagDto) => featureFlagsApi.set({ key: flag.key, isEnabled: !flag.isEnabled, rolloutPercentage: flag.rolloutPercentage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to update feature flag'),
  });

  const openEditModal = (flag: FeatureFlagDto) => {
    setEditItem(flag);
    setFormData({ key: flag.key, isEnabled: flag.isEnabled, rolloutPercentage: String(flag.rolloutPercentage) });
  };

  const openAddModal = () => {
    setFormData({ key: '', isEnabled: true, rolloutPercentage: '100' });
    setShowAddModal(true);
  };

  const submitForm = () => {
    const rolloutPercentage = Number(formData.rolloutPercentage);
    if (!formData.key.trim() || Number.isNaN(rolloutPercentage) || rolloutPercentage < 0 || rolloutPercentage > 100) return;
    setMutation.mutate({ key: formData.key.trim(), isEnabled: formData.isEnabled, rolloutPercentage });
  };

  const inputCls = 'w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow';
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

  const renderForm = (onSubmit: () => void, submitLabel: string, isPending: boolean, onCancel: () => void) => (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>Key</label>
        <input
          value={formData.key}
          onChange={(e) => setFormData((prev) => ({ ...prev, key: e.target.value }))}
          className={inputCls}
          placeholder="e.g. new-checkout"
        />
      </div>
      <div className="flex items-center justify-between">
        <label className={labelCls + ' mb-0'}>Enabled</label>
        <ToggleSwitch
          checked={formData.isEnabled}
          onChange={() => setFormData((prev) => ({ ...prev, isEnabled: !prev.isEnabled }))}
        />
      </div>
      <div>
        <label className={labelCls}>Rollout Percentage</label>
        <input
          type="number"
          min={0}
          max={100}
          value={formData.rolloutPercentage}
          onChange={(e) => setFormData((prev) => ({ ...prev, rolloutPercentage: e.target.value }))}
          className={inputCls}
        />
        <p className="text-xs text-gray-400 mt-1">
          When enabled, the tenant is deterministically bucketed by this percentage (100 = always on).
        </p>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={!formData.key.trim() || isPending}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          {isPending ? 'Saving...' : submitLabel}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feature Flags</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Toggle features on or off for this tenant, with optional gradual rollout</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Flags</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Flags not listed here are treated as disabled by default</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Flag
          </button>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : flags.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">No feature flags configured yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Key</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rollout</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Enabled</th>
                  <th className="w-28 px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {flags.map((flag) => (
                  <tr key={flag.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{flag.key}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{flag.rolloutPercentage}%</td>
                    <td className="px-6 py-4">
                      <ToggleSwitch
                        checked={flag.isEnabled}
                        disabled={quickToggleMutation.isPending}
                        onChange={() => quickToggleMutation.mutate(flag)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(flag)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(flag.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Feature Flag" size="md">
        {renderForm(submitForm, 'Create', setMutation.isPending, () => setShowAddModal(false))}
      </Modal>

      <Modal isOpen={editItem !== null} onClose={() => setEditItem(null)} title="Edit Feature Flag" size="md">
        {editItem && renderForm(submitForm, 'Save Changes', setMutation.isPending, () => setEditItem(null))}
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        title="Delete Feature Flag"
        message="Are you sure you want to delete this feature flag? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
