import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { DataTable, Column } from '../../../components/table/DataTable';
import { Autocomplete, AutocompleteOption } from '../../../components/ui/Autocomplete/Autocomplete';
import { toast } from '../../../components/ui/Toast/toast.store';
import { productApi, ProductBundleItemDto, ProductOptionDto, ProductRelationDto } from '../pages/ProductsPage';

const inputClasses =
  'px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500';

const useProductSearchOptions = (excludeProductId: number) => {
  const [search, setSearch] = useState('');
  const { data } = useQuery({
    queryKey: ['catalog', 'products', 'search', search],
    queryFn: () => productApi.getPaged({ page: 1, pageSize: 20, search: search || undefined }),
  });

  const options: AutocompleteOption[] = (data?.items ?? [])
    .filter((p) => p.id !== excludeProductId)
    .map((p) => ({ label: `${p.name} (${p.sku})`, value: String(p.id) }));

  return { options, onSearch: setSearch };
};

export const ProductOptionsEditor: React.FC<{ productId: number }> = ({ productId }) => {
  const queryClient = useQueryClient();
  const [newOptionName, setNewOptionName] = useState('');
  const [newValueDraft, setNewValueDraft] = useState<Record<number, { label: string; priceModifier: string }>>({});

  const { data: options = [], isLoading } = useQuery({ queryKey: ['catalog', 'products', productId, 'options'], queryFn: () => productApi.getOptions(productId) });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['catalog', 'products', productId, 'options'] });

  const addOptionMutation = useMutation({
    mutationFn: () => productApi.addOption(productId, newOptionName.trim()),
    onSuccess: () => {
      invalidate();
      setNewOptionName('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to add option'),
  });

  const deleteOptionMutation = useMutation({
    mutationFn: (optionId: number) => productApi.deleteOption(productId, optionId),
    onSuccess: invalidate,
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to remove option'),
  });

  const addValueMutation = useMutation({
    mutationFn: (optionId: number) =>
      productApi.addOptionValue(productId, optionId, {
        label: newValueDraft[optionId]?.label.trim() ?? '',
        priceModifier: Number(newValueDraft[optionId]?.priceModifier || 0),
        isDefault: false,
      }),
    onSuccess: (_, optionId) => {
      invalidate();
      setNewValueDraft((prev) => ({ ...prev, [optionId]: { label: '', priceModifier: '' } }));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to add option value'),
  });

  const deleteValueMutation = useMutation({
    mutationFn: ({ optionId, valueId }: { optionId: number; valueId: number }) => productApi.deleteOptionValue(productId, optionId, valueId),
    onSuccess: invalidate,
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to remove option value'),
  });

  if (isLoading) return null;

  return (
    <div className="space-y-4">
      {options.map((option: ProductOptionDto) => (
        <div key={option.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900 dark:text-white">{option.name}</span>
            <button type="button" onClick={() => deleteOptionMutation.mutate(option.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {option.values.map((v) => (
              <span key={v.id} className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                {v.label} {v.priceModifier !== 0 && `(+${v.priceModifier})`}
                <button type="button" onClick={() => deleteValueMutation.mutate({ optionId: option.id, valueId: v.id })} className="text-red-500">
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (newValueDraft[option.id]?.label?.trim()) addValueMutation.mutate(option.id);
            }}
          >
            <input
              className={`${inputClasses} text-sm flex-1`}
              placeholder="Value label (e.g. Engrave name)"
              value={newValueDraft[option.id]?.label ?? ''}
              onChange={(e) => setNewValueDraft((prev) => ({ ...prev, [option.id]: { label: e.target.value, priceModifier: prev[option.id]?.priceModifier ?? '' } }))}
            />
            <input
              type="number"
              step="0.01"
              className={`${inputClasses} text-sm w-28`}
              placeholder="Price +"
              value={newValueDraft[option.id]?.priceModifier ?? ''}
              onChange={(e) => setNewValueDraft((prev) => ({ ...prev, [option.id]: { label: prev[option.id]?.label ?? '', priceModifier: e.target.value } }))}
            />
            <button type="submit" className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">Add</button>
          </form>
        </div>
      ))}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (newOptionName.trim()) addOptionMutation.mutate();
        }}
      >
        <input className={`${inputClasses} flex-1`} placeholder="New option name (e.g. Engraving)" value={newOptionName} onChange={(e) => setNewOptionName(e.target.value)} />
        <button type="submit" disabled={addOptionMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          <Plus className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export const BundleItemsEditor: React.FC<{ productId: number }> = ({ productId }) => {
  const queryClient = useQueryClient();
  const { options: productOptions, onSearch } = useProductSearchOptions(productId);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState('1');

  const { data: summary, isLoading } = useQuery({ queryKey: ['catalog', 'products', productId, 'bundle-items'], queryFn: () => productApi.getBundleItems(productId) });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['catalog', 'products', productId, 'bundle-items'] });

  const addMutation = useMutation({
    mutationFn: () => productApi.addBundleItem(productId, { componentProductId: Number(selectedProductId), componentVariantId: null, quantity: Number(quantity), isOptional: false, priceOverride: null }),
    onSuccess: () => {
      invalidate();
      setSelectedProductId('');
      setQuantity('1');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to add bundle item'),
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: number) => productApi.deleteBundleItem(productId, itemId),
    onSuccess: invalidate,
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to remove bundle item'),
  });

  const columns: Column<ProductBundleItemDto>[] = [
    { key: 'componentProductName', label: 'Component' },
    { key: 'quantity', label: 'Qty', width: '80px' },
    { key: 'effectiveUnitPrice', label: 'Unit Price', width: '110px', render: (_, i) => i.effectiveUnitPrice.toFixed(2) },
    { key: 'isOptional', label: 'Optional', width: '90px', render: (_, i) => (i.isOptional ? 'Yes' : 'No') },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={summary?.items ?? []}
        isLoading={isLoading}
        searchable={false}
        sortable={false}
        emptyState={{ title: 'No bundle items yet' }}
        rowActions={[{ icon: Trash2, label: 'Remove', onClick: (item) => deleteMutation.mutate(item.id), variant: 'danger' }]}
      />
      {summary && summary.items.length > 0 && (
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Combined price: {summary.combinedPrice.toFixed(2)}</p>
      )}
      <form
        className="flex gap-2 items-end"
        onSubmit={(e) => {
          e.preventDefault();
          if (selectedProductId) addMutation.mutate();
        }}
      >
        <div className="flex-1">
          <Autocomplete options={productOptions} value={selectedProductId} onChange={setSelectedProductId} onSearch={onSearch} placeholder="Search for a product to add..." />
        </div>
        <input type="number" min={1} className={`${inputClasses} w-20`} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <button type="submit" disabled={!selectedProductId || addMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          Add
        </button>
      </form>
    </div>
  );
};

const RELATION_TYPES = ['CrossSell', 'UpSell', 'Accessory'];

export const RelatedProductsEditor: React.FC<{ productId: number }> = ({ productId }) => {
  const queryClient = useQueryClient();
  const { options: productOptions, onSearch } = useProductSearchOptions(productId);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [relationType, setRelationType] = useState(RELATION_TYPES[0]);

  const { data: relations = [], isLoading } = useQuery({ queryKey: ['catalog', 'products', productId, 'relations'], queryFn: () => productApi.getRelations(productId) });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['catalog', 'products', productId, 'relations'] });

  const addMutation = useMutation({
    mutationFn: () => productApi.addRelation(productId, Number(selectedProductId), relationType),
    onSuccess: () => {
      invalidate();
      setSelectedProductId('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to add relation'),
  });

  const deleteMutation = useMutation({
    mutationFn: (relationId: number) => productApi.deleteRelation(productId, relationId),
    onSuccess: invalidate,
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to remove relation'),
  });

  const columns: Column<ProductRelationDto>[] = [
    { key: 'relatedProductName', label: 'Product' },
    { key: 'relationType', label: 'Type', width: '120px' },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={relations}
        isLoading={isLoading}
        searchable={false}
        sortable={false}
        emptyState={{ title: 'No related products yet' }}
        rowActions={[{ icon: Trash2, label: 'Remove', onClick: (r) => deleteMutation.mutate(r.id), variant: 'danger' }]}
      />
      <form
        className="flex gap-2 items-end"
        onSubmit={(e) => {
          e.preventDefault();
          if (selectedProductId) addMutation.mutate();
        }}
      >
        <div className="flex-1">
          <Autocomplete options={productOptions} value={selectedProductId} onChange={setSelectedProductId} onSearch={onSearch} placeholder="Search for a related product..." />
        </div>
        <select className={inputClasses} value={relationType} onChange={(e) => setRelationType(e.target.value)}>
          {RELATION_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button type="submit" disabled={!selectedProductId || addMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          Add
        </button>
      </form>
    </div>
  );
};
