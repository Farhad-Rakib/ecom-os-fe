import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Autocomplete, AutocompleteOption } from '../../../components/ui/Autocomplete/Autocomplete';
import { taxonomyApi } from '../../catalog/pages/TaxonomiesPage';
import { categoryApi, CategoryDto } from '../../catalog/pages/CategoriesPage';
import { brandApi } from '../../catalog/pages/BrandsPage';
import { productApi } from '../../catalog/pages/ProductsPage';
import { collectionApi } from '../pages/CollectionsPage';
import { contentPageApi } from '../pages/ContentPagesPage';

// Mirrors EcomOs.Domain.Storefront.Enums.LinkTargetType exactly (int-serialized on the wire, not a
// string enum -- see the backend's Program.cs, which registers no JsonStringEnumConverter).
export type LinkTargetKind = 'Category' | 'Product' | 'Brand' | 'Collection' | 'ContentPage' | 'CustomUrl' | 'Taxonomy';

export const LINK_TARGET_TYPE_VALUES: Record<LinkTargetKind, number> = {
  Category: 0,
  Product: 1,
  Brand: 2,
  Collection: 3,
  ContentPage: 4,
  CustomUrl: 5,
  Taxonomy: 6,
};

const LINK_TARGET_TYPE_BY_VALUE: Record<number, LinkTargetKind> = Object.fromEntries(
  Object.entries(LINK_TARGET_TYPE_VALUES).map(([kind, value]) => [value, kind as LinkTargetKind])
) as Record<number, LinkTargetKind>;

const LINK_TARGET_TYPE_LABELS: Record<LinkTargetKind, string> = {
  Category: 'Category',
  Product: 'Product',
  Brand: 'Brand',
  Collection: 'Collection',
  ContentPage: 'Content Page',
  CustomUrl: 'Custom URL',
  Taxonomy: 'Taxonomy',
};

export interface LinkTargetValue {
  linkTargetType: number | null;
  linkTargetId: number | null;
  linkCustomUrl: string | null;
}

const inputClasses =
  'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50';
const labelClasses = 'block text-sm font-medium text-gray-700 dark:text-gray-300';

// Eagerly walks every taxonomy's full category tree, same shape as ProductEditorPage's own
// useAllCategoriesFlat -- duplicated locally (rather than importing a private, unexported hook)
// since this component lives outside the Catalog feature.
const useCategoryOptions = () => {
  const { data: taxonomies = [] } = useQuery({ queryKey: ['catalog', 'taxonomies'], queryFn: () => taxonomyApi.getAll() });

  return useQuery({
    queryKey: ['catalog', 'categories', 'flat', taxonomies.map((t) => t.id)],
    queryFn: async () => {
      const result: CategoryDto[] = [];
      const walk = async (taxonomyId: number, parentId: number | undefined) => {
        const page = await categoryApi.getPaged(taxonomyId, parentId);
        for (const category of page.items) {
          result.push(category);
          await walk(taxonomyId, category.id);
        }
      };
      for (const taxonomy of taxonomies) await walk(taxonomy.id, undefined);
      return result;
    },
    enabled: taxonomies.length > 0,
  });
};

const useProductOptions = (search: string, currentTargetId: number | null) => {
  const { data } = useQuery({
    queryKey: ['storefront', 'link-target', 'products', search],
    queryFn: () => productApi.getPaged({ page: 1, pageSize: 20, search: search || undefined }),
  });

  // The currently-selected product may not be present in the freshly-searched page (or in no page
  // at all, before the admin has typed anything) -- fetch it directly so Autocomplete can still
  // show its label instead of a blank/id-only selection when editing an existing link.
  const { data: currentProduct } = useQuery({
    queryKey: ['storefront', 'link-target', 'products', 'byId', currentTargetId],
    queryFn: () => productApi.getById(currentTargetId!),
    enabled: currentTargetId !== null,
  });

  const options: AutocompleteOption[] = (data?.items ?? []).map((p) => ({ label: `${p.name} (${p.sku})`, value: String(p.id) }));
  if (currentProduct && !options.some((o) => o.value === String(currentProduct.id))) {
    options.unshift({ label: `${currentProduct.name} (${currentProduct.sku})`, value: String(currentProduct.id) });
  }
  return options;
};

interface LinkTargetPickerProps {
  allowedKinds: LinkTargetKind[];
  allowNone?: boolean;
  value: LinkTargetValue;
  onChange: (value: LinkTargetValue) => void;
}

export const LinkTargetPicker: React.FC<LinkTargetPickerProps> = ({ allowedKinds, allowNone = false, value, onChange }) => {
  const [productSearch, setProductSearch] = useState('');
  const currentKind: LinkTargetKind | 'none' =
    value.linkTargetType === null || value.linkTargetType === undefined ? 'none' : LINK_TARGET_TYPE_BY_VALUE[value.linkTargetType];

  const { data: categories = [] } = useCategoryOptions();
  const { data: taxonomies = [] } = useQuery({ queryKey: ['catalog', 'taxonomies'], queryFn: () => taxonomyApi.getAll(), enabled: currentKind === 'Taxonomy' });
  const { data: brands } = useQuery({
    queryKey: ['catalog', 'brands', 'all'],
    queryFn: () => brandApi.getPaged({ page: 1, pageSize: 200 }),
    enabled: currentKind === 'Brand',
  });
  const { data: collections = [] } = useQuery({
    queryKey: ['storefront', 'collections'],
    queryFn: () => collectionApi.getAll(),
    enabled: currentKind === 'Collection',
  });
  const { data: contentPages } = useQuery({
    queryKey: ['storefront', 'content-pages', 'all'],
    queryFn: () => contentPageApi.getPaged({ page: 1, pageSize: 200 }),
    enabled: currentKind === 'ContentPage',
  });

  const handleKindChange = (kind: LinkTargetKind | 'none') => {
    if (kind === 'none') {
      onChange({ linkTargetType: null, linkTargetId: null, linkCustomUrl: null });
    } else if (kind === 'CustomUrl') {
      onChange({ linkTargetType: LINK_TARGET_TYPE_VALUES.CustomUrl, linkTargetId: null, linkCustomUrl: '' });
    } else {
      onChange({ linkTargetType: LINK_TARGET_TYPE_VALUES[kind], linkTargetId: null, linkCustomUrl: null });
    }
  };

  const productOptions = useProductOptions(productSearch, currentKind === 'Product' ? value.linkTargetId : null);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className={labelClasses}>Link Target</label>
        <select
          value={currentKind}
          onChange={(e) => handleKindChange(e.target.value as LinkTargetKind | 'none')}
          className={inputClasses}
        >
          {allowNone && <option value="none">None</option>}
          {allowedKinds.map((kind) => (
            <option key={kind} value={kind}>
              {LINK_TARGET_TYPE_LABELS[kind]}
            </option>
          ))}
        </select>
      </div>

      {currentKind === 'Category' && (
        <select
          value={value.linkTargetId ?? ''}
          onChange={(e) => onChange({ ...value, linkTargetId: e.target.value ? Number(e.target.value) : null })}
          className={inputClasses}
        >
          <option value="">Select a category...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}

      {currentKind === 'Taxonomy' && (
        <select
          value={value.linkTargetId ?? ''}
          onChange={(e) => onChange({ ...value, linkTargetId: e.target.value ? Number(e.target.value) : null })}
          className={inputClasses}
        >
          <option value="">Select a taxonomy...</option>
          {taxonomies.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      )}

      {currentKind === 'Brand' && (
        <select
          value={value.linkTargetId ?? ''}
          onChange={(e) => onChange({ ...value, linkTargetId: e.target.value ? Number(e.target.value) : null })}
          className={inputClasses}
        >
          <option value="">Select a brand...</option>
          {(brands?.items ?? []).map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      )}

      {currentKind === 'Collection' && (
        <select
          value={value.linkTargetId ?? ''}
          onChange={(e) => onChange({ ...value, linkTargetId: e.target.value ? Number(e.target.value) : null })}
          className={inputClasses}
        >
          <option value="">Select a collection...</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}

      {currentKind === 'ContentPage' && (
        <select
          value={value.linkTargetId ?? ''}
          onChange={(e) => onChange({ ...value, linkTargetId: e.target.value ? Number(e.target.value) : null })}
          className={inputClasses}
        >
          <option value="">Select a page...</option>
          {(contentPages?.items ?? []).map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      )}

      {currentKind === 'Product' && (
        <Autocomplete
          options={productOptions}
          value={value.linkTargetId !== null ? String(value.linkTargetId) : ''}
          onChange={(v) => onChange({ ...value, linkTargetId: v ? Number(v) : null })}
          onSearch={setProductSearch}
          placeholder="Search for a product..."
        />
      )}

      {currentKind === 'CustomUrl' && (
        <input
          type="text"
          value={value.linkCustomUrl ?? ''}
          onChange={(e) => onChange({ ...value, linkCustomUrl: e.target.value })}
          placeholder="https://"
          className={inputClasses}
        />
      )}
    </div>
  );
};
