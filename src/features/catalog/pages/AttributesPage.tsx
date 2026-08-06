import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Settings2, X } from 'lucide-react';
import { DataTable, Column, RowAction } from '../../../components/table/DataTable';
import { DynamicForm, FormField } from '../../../components/form/DynamicForm';
import { Modal } from '../../../components/ui/Modal/Modal';
import { toast } from '../../../components/ui/Toast/toast.store';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';

export interface AttributeGroupDto {
  id: number;
  code: string;
  name: string;
  displayOrder: number;
}

export interface AttributeOptionDto {
  id: number;
  attributeDefinitionId: number;
  value: string;
  label: string;
  swatchHex: string | null;
  imageUrl: string | null;
  displayOrder: number;
}

export interface AttributeDefinitionDto {
  id: number;
  attributeGroupId: number;
  attributeGroupName: string;
  code: string;
  name: string;
  dataType: string;
  unit: string | null;
  isVariantDefining: boolean;
  isFilterable: boolean;
  isSearchable: boolean;
  isComparable: boolean;
  isRequired: boolean;
  validationRegex: string | null;
  minValue: number | null;
  maxValue: number | null;
  displayOrder: number;
  isActive: boolean;
  options: AttributeOptionDto[];
}

const DATA_TYPES = ['Text', 'RichText', 'Number', 'Boolean', 'Date', 'Select', 'MultiSelect', 'Color', 'Measurement'];
const OPTION_DATA_TYPES = new Set(['Select', 'MultiSelect']);

class AttributeGroupApi extends BaseRepository {
  constructor() { super('/attribute-groups'); }
  async getAll(): Promise<AttributeGroupDto[]> {
    const res = await this.get<ApiResponse<AttributeGroupDto[]>>('');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async create(code: string, name: string): Promise<AttributeGroupDto> {
    const res = await this.post<ApiResponse<AttributeGroupDto>>('', { code, name, displayOrder: 0 });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

class AttributeApi extends BaseRepository {
  constructor() { super('/attributes'); }
  async getAll(): Promise<AttributeDefinitionDto[]> {
    const res = await this.get<ApiResponse<AttributeDefinitionDto[]>>('');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async create(dto: Record<string, any>): Promise<AttributeDefinitionDto> {
    const res = await this.post<ApiResponse<AttributeDefinitionDto>>('', dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async update(id: number, dto: Record<string, any>): Promise<AttributeDefinitionDto> {
    const res = await this.put<ApiResponse<AttributeDefinitionDto>>(`/${id}`, dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async addOption(attributeId: number, dto: { value: string; label: string; swatchHex: string | null; imageUrl: string | null }): Promise<AttributeOptionDto> {
    const res = await this.post<ApiResponse<AttributeOptionDto>>(`/${attributeId}/options`, dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async deleteOption(attributeId: number, optionId: number): Promise<void> {
    await this.delete<any>(`/${attributeId}/options/${optionId}`);
  }
}

export const attributeGroupApi = new AttributeGroupApi();
export const attributeApi = new AttributeApi();

const inputClasses =
  'px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500';

const OptionsManagerModal: React.FC<{ attribute: AttributeDefinitionDto | null; onClose: () => void }> = ({ attribute, onClose }) => {
  const queryClient = useQueryClient();
  const [value, setValue] = useState('');
  const [label, setLabel] = useState('');
  const [swatchHex, setSwatchHex] = useState('');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['catalog', 'attributes'] });

  const addMutation = useMutation({
    mutationFn: () => attributeApi.addOption(attribute!.id, { value, label, swatchHex: swatchHex || null, imageUrl: null }),
    onSuccess: () => {
      invalidate();
      setValue('');
      setLabel('');
      setSwatchHex('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to add option'),
  });

  const deleteMutation = useMutation({
    mutationFn: (optionId: number) => attributeApi.deleteOption(attribute!.id, optionId),
    onSuccess: invalidate,
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to remove option'),
  });

  if (!attribute) return null;

  return (
    <Modal isOpen={attribute !== null} onClose={onClose} title={`Options for "${attribute.name}"`} size="md">
      <div className="space-y-4">
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {attribute.options.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No options yet.</p>}
          {attribute.options.map((option) => (
            <div key={option.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
              {option.swatchHex && <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: option.swatchHex }} />}
              <span className="text-sm text-gray-900 dark:text-white flex-1">{option.label}</span>
              <span className="text-xs text-gray-400 font-mono">{option.value}</span>
              <button type="button" onClick={() => deleteMutation.mutate(option.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!value.trim() || !label.trim()) return;
            addMutation.mutate();
          }}
          className="flex gap-2 items-end pt-3 border-t border-gray-200 dark:border-gray-700"
        >
          <div className="flex-1 space-y-1">
            <label className="block text-xs text-gray-500">Value</label>
            <input className={`${inputClasses} w-full`} value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. red" />
          </div>
          <div className="flex-1 space-y-1">
            <label className="block text-xs text-gray-500">Label</label>
            <input className={`${inputClasses} w-full`} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Red" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-gray-500">Swatch</label>
            <input type="color" className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600" value={swatchHex || '#000000'} onChange={(e) => setSwatchHex(e.target.value)} />
          </div>
          <button type="submit" disabled={addMutation.isPending} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>
    </Modal>
  );
};

export const AttributesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editAttribute, setEditAttribute] = useState<AttributeDefinitionDto | null>(null);
  const [optionsAttribute, setOptionsAttribute] = useState<AttributeDefinitionDto | null>(null);
  const [newGroupName, setNewGroupName] = useState('');

  const { data: attributes = [], isLoading, error, refetch } = useQuery({ queryKey: ['catalog', 'attributes'], queryFn: () => attributeApi.getAll() });
  const { data: groups = [] } = useQuery({ queryKey: ['catalog', 'attribute-groups'], queryFn: () => attributeGroupApi.getAll() });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['catalog', 'attributes'] });
    queryClient.invalidateQueries({ queryKey: ['catalog', 'attribute-groups'] });
  };

  const createGroupMutation = useMutation({
    mutationFn: () => attributeGroupApi.create(newGroupName.trim().toLowerCase().replace(/\s+/g, '-'), newGroupName.trim()),
    onSuccess: () => {
      invalidate();
      setNewGroupName('');
      toast.success('Attribute group created');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to create group'),
  });

  const createMutation = useMutation({
    mutationFn: (dto: Record<string, any>) => attributeApi.create(dto),
    onSuccess: () => {
      invalidate();
      toast.success('Attribute created successfully');
      setShowForm(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to create attribute'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Record<string, any> }) => attributeApi.update(id, dto),
    onSuccess: () => {
      invalidate();
      toast.success('Attribute updated successfully');
      setEditAttribute(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to update attribute'),
  });

  const buildFields = (isEdit: boolean): FormField[] => [
    ...(isEdit
      ? []
      : ([
          {
            name: 'attributeGroupId',
            label: 'Attribute Group',
            type: 'select',
            required: true,
            options: groups.map((g) => ({ label: g.name, value: g.id })),
          },
          { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g. nutrition-per-100g' },
        ] as FormField[])),
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'dataType', label: 'Data Type', type: 'select', required: true, options: DATA_TYPES.map((t) => ({ label: t, value: t })) },
    { name: 'unit', label: 'Unit', type: 'text', placeholder: 'e.g. kg, cm' },
    { name: 'isVariantDefining', label: 'Variant-defining', type: 'checkbox' },
    { name: 'isFilterable', label: 'Filterable', type: 'checkbox' },
    { name: 'isSearchable', label: 'Searchable', type: 'checkbox' },
    { name: 'isComparable', label: 'Comparable', type: 'checkbox' },
    { name: 'isRequired', label: 'Required', type: 'checkbox' },
    { name: 'validationRegex', label: 'Validation Regex', type: 'text' },
    { name: 'minValue', label: 'Min Value', type: 'number' },
    { name: 'maxValue', label: 'Max Value', type: 'number' },
    ...(isEdit ? ([{ name: 'isActive', label: 'Active', type: 'checkbox', defaultValue: editAttribute?.isActive ?? true }] as FormField[]) : []),
  ];

  const columns: Column<AttributeDefinitionDto>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'code', label: 'Code', width: '160px' },
    { key: 'attributeGroupName', label: 'Group', width: '140px' },
    { key: 'dataType', label: 'Type', width: '120px' },
    {
      key: 'isRequired',
      label: 'Required',
      width: '90px',
      render: (_, a) => (a.isRequired ? 'Yes' : 'No'),
    },
    {
      key: 'isActive',
      label: 'Status',
      width: '100px',
      render: (_, a) => (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${a.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
          {a.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const rowActions: RowAction<AttributeDefinitionDto>[] = [
    { icon: Pencil, label: 'Edit', onClick: (a) => setEditAttribute(a), variant: 'primary' },
    { icon: Settings2, label: 'Options', onClick: (a) => setOptionsAttribute(a), variant: 'secondary', show: (a) => OPTION_DATA_TYPES.has(a.dataType) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attributes</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Define product specification fields -- name, data type, unit, and options</p>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
        <span className="text-sm text-gray-500 dark:text-gray-400">Groups:</span>
        {groups.map((g) => (
          <span key={g.id} className="px-2.5 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">{g.name}</span>
        ))}
        <form
          className="flex gap-2 ml-auto"
          onSubmit={(e) => {
            e.preventDefault();
            if (newGroupName.trim()) createGroupMutation.mutate();
          }}
        >
          <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="New group name" className={`${inputClasses} text-sm`} />
          <button type="submit" disabled={createGroupMutation.isPending} className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
            Add Group
          </button>
        </form>
      </div>

      <DataTable
        columns={columns}
        data={attributes}
        isLoading={isLoading}
        error={error?.message}
        sortable={false}
        emptyState={{ title: 'No attributes found', description: 'Create an attribute group above, then add an attribute' }}
        actions={{ add: { label: 'Add Attribute', onClick: () => setShowForm(true) } }}
        rowActions={rowActions}
        onRetry={() => refetch()}
      />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Create Attribute" size="md">
        <DynamicForm
          fields={buildFields(false)}
          submitLabel="Create Attribute"
          onCancel={() => setShowForm(false)}
          isLoading={createMutation.isPending}
          onSubmit={(data) =>
            createMutation.mutate({
              attributeGroupId: Number(data.attributeGroupId),
              code: data.code,
              name: data.name,
              dataType: data.dataType,
              unit: data.unit || null,
              isVariantDefining: !!data.isVariantDefining,
              isFilterable: !!data.isFilterable,
              isSearchable: !!data.isSearchable,
              isComparable: !!data.isComparable,
              isRequired: !!data.isRequired,
              validationRegex: data.validationRegex || null,
              minValue: data.minValue === '' || data.minValue === undefined ? null : Number(data.minValue),
              maxValue: data.maxValue === '' || data.maxValue === undefined ? null : Number(data.maxValue),
            })
          }
        />
      </Modal>

      <Modal isOpen={editAttribute !== null} onClose={() => setEditAttribute(null)} title="Edit Attribute" size="md">
        {editAttribute && (
          <DynamicForm
            key={editAttribute.id}
            fields={buildFields(true).map((f) => ({ ...f, defaultValue: (editAttribute as any)[f.name] ?? f.defaultValue }))}
            submitLabel="Save Changes"
            onCancel={() => setEditAttribute(null)}
            isLoading={updateMutation.isPending}
            onSubmit={(data) =>
              updateMutation.mutate({
                id: editAttribute.id,
                dto: {
                  name: data.name,
                  dataType: data.dataType,
                  unit: data.unit || null,
                  isVariantDefining: !!data.isVariantDefining,
                  isFilterable: !!data.isFilterable,
                  isSearchable: !!data.isSearchable,
                  isComparable: !!data.isComparable,
                  isRequired: !!data.isRequired,
                  validationRegex: data.validationRegex || null,
                  minValue: data.minValue === '' || data.minValue === undefined ? null : Number(data.minValue),
                  maxValue: data.maxValue === '' || data.maxValue === undefined ? null : Number(data.maxValue),
                  displayOrder: editAttribute.displayOrder,
                  isActive: !!data.isActive,
                },
              })
            }
          />
        )}
      </Modal>

      <OptionsManagerModal attribute={optionsAttribute ? attributes.find((a) => a.id === optionsAttribute.id) ?? optionsAttribute : null} onClose={() => setOptionsAttribute(null)} />
    </div>
  );
};
