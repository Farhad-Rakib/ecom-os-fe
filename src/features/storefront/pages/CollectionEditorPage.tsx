import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { Loader } from '../../../components/ui/Loader/Loader';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import { Autocomplete, AutocompleteOption } from '../../../components/ui/Autocomplete/Autocomplete';
import { toast } from '../../../components/ui/Toast/toast.store';
import { productApi } from '../../catalog/pages/ProductsPage';
import { collectionApi, CollectionItemDto } from './CollectionsPage';

const useProductSearchOptions = (excludeIds: Set<number>) => {
  const [search, setSearch] = useState('');
  const { data } = useQuery({
    queryKey: ['storefront', 'collections', 'product-search', search],
    queryFn: () => productApi.getPaged({ page: 1, pageSize: 20, search: search || undefined }),
  });
  const options: AutocompleteOption[] = (data?.items ?? [])
    .filter((p) => !excludeIds.has(p.id))
    .map((p) => ({ label: `${p.name} (${p.sku})`, value: String(p.id) }));
  return { options, onSearch: setSearch };
};

export const CollectionEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const collectionId = Number(id);
  const [selectedProductId, setSelectedProductId] = useState('');

  const { data: collection, isLoading: collectionLoading, error: collectionError } = useQuery({
    queryKey: ['storefront', 'collections', collectionId],
    queryFn: () => collectionApi.getById(collectionId),
  });

  const { data: items = [], isLoading: itemsLoading, error: itemsError } = useQuery({
    queryKey: ['storefront', 'collections', collectionId, 'items'],
    queryFn: () => collectionApi.getItems(collectionId),
  });

  const { options: productOptions, onSearch } = useProductSearchOptions(new Set(items.map((i) => i.productId)));

  const invalidateItems = () => {
    queryClient.invalidateQueries({ queryKey: ['storefront', 'collections', collectionId, 'items'] });
    queryClient.invalidateQueries({ queryKey: ['storefront', 'collections'] });
  };

  const addMutation = useMutation({
    mutationFn: (productId: number) => collectionApi.addItem(collectionId, productId),
    onSuccess: () => {
      invalidateItems();
      toast.success('Product added');
      setSelectedProductId('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to add product'),
  });

  const removeMutation = useMutation({
    mutationFn: (productId: number) => collectionApi.removeItem(collectionId, productId),
    onSuccess: () => {
      invalidateItems();
      toast.success('Product removed');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to remove product'),
  });

  const reorderMutation = useMutation({
    mutationFn: (productIdsInOrder: number[]) => collectionApi.reorderItems(collectionId, productIdsInOrder),
    onSuccess: () => invalidateItems(),
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to reorder products'),
  });

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    reorderMutation.mutate(reordered.map((i) => i.productId));
  };

  if (collectionLoading || itemsLoading) return <Loader />;
  if (collectionError) return <ErrorState message={(collectionError as Error).message} />;
  if (itemsError) return <ErrorState message={(itemsError as Error).message} />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to="/storefront/collections" className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{collection?.name}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{items.length} product{items.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      <div className="space-y-4 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Add a product</h2>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Autocomplete
              options={productOptions}
              value={selectedProductId}
              onChange={setSelectedProductId}
              onSearch={onSearch}
              placeholder="Search for a product..."
            />
          </div>
          <button
            type="button"
            disabled={!selectedProductId || addMutation.isPending}
            onClick={() => addMutation.mutate(Number(selectedProductId))}
            className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      <div className="space-y-4 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Products in this collection</h2>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No products yet -- add one above.</p>
        ) : (
          <ul className="space-y-1">
            {items.map((item: CollectionItemDto, index: number) => (
              <li
                key={item.productId}
                className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.productName}</p>
                  <p className="text-xs text-gray-400 font-mono">{item.sku}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0 || reorderMutation.isPending}
                    className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, 1)}
                    disabled={index === items.length - 1 || reorderMutation.isPending}
                    className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeMutation.mutate(item.productId)}
                    className="p-1.5 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
