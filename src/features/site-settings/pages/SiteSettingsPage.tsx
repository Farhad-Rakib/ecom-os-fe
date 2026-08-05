import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { siteSettingsApi, SiteSettingDto } from '../../../core/api/services/site-settings.api';
import { toast } from '../../../components/ui/Toast/toast.store';
import { useSiteSettingsStore } from '../../../core/stores/site-settings.store';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { Modal } from '../../../components/ui/Modal/Modal';

export const SiteSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { setSettings } = useSiteSettingsStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<SiteSettingDto | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ key: '', value: '', description: '' });

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => siteSettingsApi.getAll(),
  });

  useEffect(() => {
    if (settings.length > 0) {
      setSettings(settings);
    }
  }, [settings, setSettings]);

  const createMutation = useMutation({
    mutationFn: (dto: SiteSettingDto) => siteSettingsApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings-all'] });
      toast.success('Setting created');
      setShowAddModal(false);
      setFormData({ key: '', value: '', description: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to create setting'),
  });

  const updateMutation = useMutation({
    mutationFn: (dto: SiteSettingDto) => siteSettingsApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings-all'] });
      toast.success('Setting updated');
      setEditItem(null);
      setFormData({ key: '', value: '', description: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to update setting'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => siteSettingsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings-all'] });
      toast.success('Setting deleted');
      setDeleteId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to delete setting'),
  });

  const openEditModal = (setting: SiteSettingDto) => {
    setEditItem(setting);
    setFormData({ key: setting.key, value: setting.value || '', description: setting.description || '' });
  };

  const openAddModal = () => {
    setFormData({ key: '', value: '', description: '' });
    setShowAddModal(true);
  };

  const inputCls = 'w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow';
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Site Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage application settings</p>
      </div>

      {/* Key-Value Settings Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Key-value configuration entries (e.g. site_title, site_description)</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Setting
          </button>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : settings.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">No settings configured yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Key</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Value</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                  <th className="w-28 px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {settings.map((setting) => (
                  <tr key={setting.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{setting.key}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">{setting.value || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{setting.description || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(setting)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(setting.id)}
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

      {/* Add Setting Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Setting" size="md">
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Key</label>
            <input
              value={formData.key}
              onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
              className={inputCls}
              placeholder="e.g. site_title"
            />
          </div>
          <div>
            <label className={labelCls}>Value</label>
            <input
              value={formData.value}
              onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
              className={inputCls}
              placeholder="Setting value"
            />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={`${inputCls} resize-none`}
              rows={2}
              placeholder="Optional description"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => createMutation.mutate({ id: 0, key: formData.key, value: formData.value, description: formData.description })}
              disabled={!formData.key || createMutation.isPending}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Setting Modal */}
      <Modal isOpen={editItem !== null} onClose={() => setEditItem(null)} title="Edit Setting" size="md">
        {editItem && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Key</label>
              <input
                value={formData.key}
                onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                className={inputCls}
                placeholder="e.g. site_title"
              />
            </div>
            <div>
              <label className={labelCls}>Value</label>
              <input
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                className={inputCls}
                placeholder="Setting value"
              />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={`${inputCls} resize-none`}
                rows={2}
                placeholder="Optional description"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEditItem(null)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => updateMutation.mutate({ id: editItem.id, key: formData.key, value: formData.value, description: formData.description })}
                disabled={!formData.key || updateMutation.isPending}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        title="Delete Setting"
        message="Are you sure you want to delete this setting? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
