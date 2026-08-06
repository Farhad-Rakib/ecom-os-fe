import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, Column } from '../../../components/table/DataTable';
import { Modal } from '../../../components/ui/Modal/Modal';
import { toast } from '../../../components/ui/Toast/toast.store';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';

export interface TaxonomyDto {
  id: number;
  key: string;
  name: string;
}

interface TaxonomyWriteDto {
  key: string;
  name: string;
}

class TaxonomyApi extends BaseRepository {
  constructor() { super('/taxonomies'); }
  async getAll(): Promise<TaxonomyDto[]> {
    const res = await this.get<ApiResponse<TaxonomyDto[]>>('');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async create(dto: TaxonomyWriteDto): Promise<TaxonomyDto> {
    const res = await this.post<ApiResponse<TaxonomyDto>>('', dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

export const taxonomyApi = new TaxonomyApi();

const inputClasses =
  'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50';

const TaxonomyForm: React.FC<{ isLoading: boolean; onCancel: () => void; onSubmit: (values: TaxonomyWriteDto) => void }> = ({
  isLoading,
  onCancel,
  onSubmit,
}) => {
  const [key, setKey] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !name.trim()) return;
    onSubmit({ key: key.trim().toLowerCase(), name: name.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Key<span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="text"
          required
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="e.g. by-room"
          className={inputClasses}
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Name<span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Shop by Room"
          className={inputClasses}
        />
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          Create Taxonomy
        </button>
      </div>
    </form>
  );
};

export const TaxonomiesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: taxonomies = [], isLoading, error, refetch } = useQuery({
    queryKey: ['catalog', 'taxonomies'],
    queryFn: () => taxonomyApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (dto: TaxonomyWriteDto) => taxonomyApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'taxonomies'] });
      toast.success('Taxonomy created successfully');
      setShowAddModal(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to create taxonomy'),
  });

  const columns: Column<TaxonomyDto>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'key', label: 'Key', width: '200px' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Taxonomies</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Independent category hierarchies a storefront can browse by — most catalogs only need one
        </p>
      </div>

      <DataTable
        columns={columns}
        data={taxonomies}
        isLoading={isLoading}
        error={error?.message}
        searchable={false}
        sortable={false}
        emptyState={{ title: 'No taxonomies found', description: 'Create one to start organizing categories' }}
        actions={{ add: { label: 'Add Taxonomy', onClick: () => setShowAddModal(true) } }}
        onRetry={() => refetch()}
      />

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create Taxonomy" size="md">
        <TaxonomyForm
          isLoading={createMutation.isPending}
          onCancel={() => setShowAddModal(false)}
          onSubmit={(values) => createMutation.mutate(values)}
        />
      </Modal>
    </div>
  );
};
