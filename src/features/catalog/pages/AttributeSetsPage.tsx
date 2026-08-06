import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, ListChecks, ArrowUp, ArrowDown, Plus, X } from 'lucide-react';
import { DataTable, Column, RowAction } from '../../../components/table/DataTable';
import { Modal } from '../../../components/ui/Modal/Modal';
import { Loader } from '../../../components/ui/Loader/Loader';
import { toast } from '../../../components/ui/Toast/toast.store';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';
import { attributeApi } from './AttributesPage';
import { productApi, ProductTypeDto } from './ProductsPage';

export interface AttributeSetMemberDto {
  attributeDefinitionId: number;
  attributeCode: string;
  attributeName: string;
  dataType: string;
  displayOrder: number;
  isRequiredOverride: boolean | null;
}

export interface AttributeSetDto {
  id: number;
  name: string;
  productTypeId: number;
  members: AttributeSetMemberDto[];
}

class AttributeSetApi extends BaseRepository {
  constructor() { super('/attribute-sets'); }
  async getAll(): Promise<AttributeSetDto[]> {
    const res = await this.get<ApiResponse<AttributeSetDto[]>>('');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async create(name: string, productTypeId: number): Promise<AttributeSetDto> {
    const res = await this.post<ApiResponse<AttributeSetDto>>('', { name, productTypeId });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async update(id: number, name: string): Promise<AttributeSetDto> {
    const res = await this.put<ApiResponse<AttributeSetDto>>(`/${id}`, { name });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async replaceMembers(id: number, members: { attributeDefinitionId: number; displayOrder: number; isRequiredOverride: boolean | null }[]): Promise<AttributeSetDto> {
    const res = await this.put<ApiResponse<AttributeSetDto>>(`/${id}/attributes`, { members });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

export const attributeSetApi = new AttributeSetApi();

const inputClasses =
  'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50';

// Up/down buttons, not drag-and-drop -- DataTable has no drag-order support and this codebase's
// own precedent (Category reordering, Task Group 01) already chose the same lower-complexity
// alternative for the same reason; see decisions.md.
const AttributeSetBuilder: React.FC<{ set: AttributeSetDto; onClose: () => void }> = ({ set, onClose }) => {
  const queryClient = useQueryClient();
  const { data: allAttributes = [], isLoading } = useQuery({ queryKey: ['catalog', 'attributes'], queryFn: () => attributeApi.getAll() });
  const [members, setMembers] = useState<AttributeSetMemberDto[]>(set.members);

  const saveMutation = useMutation({
    mutationFn: () =>
      attributeSetApi.replaceMembers(
        set.id,
        members.map((m, index) => ({ attributeDefinitionId: m.attributeDefinitionId, displayOrder: index, isRequiredOverride: m.isRequiredOverride }))
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'attribute-sets'] });
      toast.success('Attribute set members saved');
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to save attribute set members'),
  });

  const assignedIds = new Set(members.map((m) => m.attributeDefinitionId));
  const available = allAttributes.filter((a) => !assignedIds.has(a.id) && a.isActive);

  const addMember = (attributeId: number) => {
    const attribute = allAttributes.find((a) => a.id === attributeId);
    if (!attribute) return;
    setMembers((prev) => [...prev, { attributeDefinitionId: attribute.id, attributeCode: attribute.code, attributeName: attribute.name, dataType: attribute.dataType, displayOrder: prev.length, isRequiredOverride: null }]);
  };

  const removeMember = (attributeId: number) => setMembers((prev) => prev.filter((m) => m.attributeDefinitionId !== attributeId));

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= members.length) return;
    setMembers((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const toggleRequiredOverride = (attributeId: number) => {
    setMembers((prev) => prev.map((m) => (m.attributeDefinitionId === attributeId ? { ...m, isRequiredOverride: m.isRequiredOverride ? null : true } : m)));
  };

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Available attributes</h3>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800 max-h-72 overflow-y-auto">
            {available.length === 0 && <p className="p-3 text-sm text-gray-400">Nothing left to add</p>}
            {available.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => addMember(a.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <span className="text-sm text-gray-900 dark:text-white">{a.name}</span>
                <Plus className="w-3.5 h-3.5 text-blue-600" />
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Assigned to this set (in order)</h3>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800 max-h-72 overflow-y-auto">
            {members.length === 0 && <p className="p-3 text-sm text-gray-400">No attributes assigned yet</p>}
            {members.map((m, index) => (
              <div key={m.attributeDefinitionId} className="flex items-center gap-2 px-3 py-2">
                <span className="text-sm text-gray-900 dark:text-white flex-1">{m.attributeName}</span>
                <label className="flex items-center gap-1 text-xs text-gray-500">
                  <input type="checkbox" checked={!!m.isRequiredOverride} onChange={() => toggleRequiredOverride(m.attributeDefinitionId)} className="rounded border-gray-300" />
                  Required
                </label>
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30">
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === members.length - 1} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30">
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => removeMember(m.attributeDefinitionId)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Save Attributes
        </button>
      </div>
    </div>
  );
};

export const AttributeSetsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editSet, setEditSet] = useState<AttributeSetDto | null>(null);
  const [buildSet, setBuildSet] = useState<AttributeSetDto | null>(null);
  const [name, setName] = useState('');
  const [productTypeId, setProductTypeId] = useState<number | ''>('');

  const { data: sets = [], isLoading, error, refetch } = useQuery({ queryKey: ['catalog', 'attribute-sets'], queryFn: () => attributeSetApi.getAll() });
  const { data: productTypes = [] } = useQuery({ queryKey: ['catalog', 'product-types'], queryFn: () => productApi.getProductTypes() });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['catalog', 'attribute-sets'] });

  const createMutation = useMutation({
    mutationFn: () => attributeSetApi.create(name.trim(), Number(productTypeId)),
    onSuccess: () => {
      invalidate();
      toast.success('Attribute set created');
      setShowAddModal(false);
      setName('');
      setProductTypeId('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to create attribute set'),
  });

  const updateMutation = useMutation({
    mutationFn: () => attributeSetApi.update(editSet!.id, name.trim()),
    onSuccess: () => {
      invalidate();
      toast.success('Attribute set updated');
      setEditSet(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to update attribute set'),
  });

  const productTypeName = (id: number) => productTypes.find((pt: ProductTypeDto) => pt.id === id)?.name ?? id;

  const columns: Column<AttributeSetDto>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'productTypeId', label: 'Product Type', width: '160px', render: (_, s) => productTypeName(s.productTypeId) },
    { key: 'members', label: 'Attributes', width: '120px', render: (_, s) => s.members.length },
  ];

  const rowActions: RowAction<AttributeSetDto>[] = [
    { icon: Pencil, label: 'Rename', onClick: (s) => { setEditSet(s); setName(s.name); }, variant: 'primary' },
    { icon: ListChecks, label: 'Manage Attributes', onClick: (s) => setBuildSet(s), variant: 'secondary' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attribute Sets</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Group attributes together and bind them as a category's default specification form</p>
      </div>

      <DataTable
        columns={columns}
        data={sets}
        isLoading={isLoading}
        error={error?.message}
        sortable={false}
        emptyState={{ title: 'No attribute sets found', description: 'Create an attribute set to get started' }}
        actions={{ add: { label: 'Add Attribute Set', onClick: () => setShowAddModal(true) } }}
        rowActions={rowActions}
        onRetry={() => refetch()}
      />

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create Attribute Set" size="sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim() && productTypeId !== '') createMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name<span className="text-red-500 ml-1">*</span></label>
            <input className={inputClasses} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Type<span className="text-red-500 ml-1">*</span></label>
            <select className={inputClasses} value={productTypeId} onChange={(e) => setProductTypeId(e.target.value ? Number(e.target.value) : '')} required>
              <option value="">Select a product type...</option>
              {productTypes.map((pt: ProductTypeDto) => (
                <option key={pt.id} value={pt.id}>{pt.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              Create
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={editSet !== null} onClose={() => setEditSet(null)} title="Rename Attribute Set" size="sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) updateMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name<span className="text-red-500 ml-1">*</span></label>
            <input className={inputClasses} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setEditSet(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
              Cancel
            </button>
            <button type="submit" disabled={updateMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              Save
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={buildSet !== null} onClose={() => setBuildSet(null)} title={`Manage Attributes -- ${buildSet?.name ?? ''}`} size="lg">
        {buildSet && <AttributeSetBuilder set={buildSet} onClose={() => setBuildSet(null)} />}
      </Modal>
    </div>
  );
};
