import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Loader2, UploadCloud, Archive, Send, X } from 'lucide-react';
import { Loader } from '../../../components/ui/Loader/Loader';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import { toast } from '../../../components/ui/Toast/toast.store';
import { useAuthStore } from '../../auth/store/auth.store';
import { taxonomyApi, TaxonomyDto } from './TaxonomiesPage';
import { categoryApi } from './CategoriesPage';
import { brandApi, BrandDto } from './BrandsPage';
import { attributeSetApi, AttributeSetDto } from './AttributeSetsPage';
import {
  productApi,
  productMediaUploadApi,
  ProductDto,
  ProductTypeDto,
  ProductUpdateDto,
} from './ProductsPage';
import { AttributeValueForm } from '../components/AttributeValueForm';
import { VariantMatrixGrid } from '../components/VariantMatrixGrid';
import { ProductOptionsEditor, BundleItemsEditor, RelatedProductsEditor } from '../components/MerchandisingSections';

const inputClasses =
  'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50';
const labelClasses = 'block text-sm font-medium text-gray-700 dark:text-gray-300';
const sectionClasses = 'space-y-4 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900';
const sectionTitleClasses = 'text-base font-semibold text-gray-900 dark:text-white';

interface FlatCategory {
  id: number;
  name: string;
  depth: number;
  taxonomyName: string;
}

// Eagerly walks every taxonomy's full category tree so the picker can show every level at once --
// unlike CategoriesPage's lazy accordion (built for tree management), a product's category picker
// needs the whole tree visible to pick from immediately.
const useAllCategoriesFlat = () => {
  const { data: taxonomies = [] } = useQuery({ queryKey: ['catalog', 'taxonomies'], queryFn: () => taxonomyApi.getAll() });

  return useQuery({
    queryKey: ['catalog', 'categories', 'flat', taxonomies.map((t) => t.id)],
    queryFn: async () => {
      const result: FlatCategory[] = [];

      const walk = async (taxonomy: TaxonomyDto, parentId: number | undefined, depth: number) => {
        const page = await categoryApi.getPaged(taxonomy.id, parentId);
        for (const category of page.items) {
          result.push({ id: category.id, name: category.name, depth, taxonomyName: taxonomy.name });
          await walk(taxonomy, category.id, depth + 1);
        }
      };

      for (const taxonomy of taxonomies) {
        await walk(taxonomy, undefined, 0);
      }

      return result;
    },
    enabled: taxonomies.length > 0,
  });
};

interface CategorySelection {
  categoryId: number;
  categoryName: string;
}

const CategoryPicker: React.FC<{
  selected: CategorySelection[];
  primaryCategoryId: number | null;
  onToggle: (category: CategorySelection) => void;
  onSetPrimary: (categoryId: number) => void;
}> = ({ selected, primaryCategoryId, onToggle, onSetPrimary }) => {
  const { data: categories = [], isLoading } = useAllCategoriesFlat();
  const selectedIds = new Set(selected.map((s) => s.categoryId));

  if (isLoading) return <Loader />;

  if (categories.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">No categories exist yet -- create one on the Categories page first.</p>;
  }

  let lastTaxonomy = '';

  return (
    <div className="space-y-4">
      <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
        {categories.map((category) => {
          const showTaxonomyHeader = category.taxonomyName !== lastTaxonomy && category.depth === 0;
          lastTaxonomy = category.taxonomyName;

          return (
            <div key={category.id}>
              {showTaxonomyHeader && (
                <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 bg-gray-50 dark:bg-gray-800/50">
                  {category.taxonomyName}
                </div>
              )}
              <label
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                style={{ paddingLeft: `${12 + category.depth * 16}px` }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(category.id)}
                  onChange={() => onToggle({ categoryId: category.id, categoryName: category.name })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-900 dark:text-white">{category.name}</span>
              </label>
            </div>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="space-y-2">
          <span className={labelClasses}>Selected categories -- pick one as primary</span>
          <div className="flex flex-wrap gap-2">
            {selected.map((s) => (
              <button
                type="button"
                key={s.categoryId}
                onClick={() => onSetPrimary(s.categoryId)}
                className={`px-3 py-1.5 text-xs rounded-full border flex items-center gap-1.5 ${
                  primaryCategoryId === s.categoryId
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                {primaryCategoryId === s.categoryId && <Check className="w-3 h-3" />}
                {s.categoryName}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface FormState {
  sku: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  brandId: number | null;
  productTypeId: number | null;
  basePrice: string;
  compareAtPrice: string;
  costPrice: string;
  currency: string;
  trackInventory: boolean;
  countryOfOrigin: string;
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  shippingClass: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  categories: CategorySelection[];
  primaryCategoryId: number | null;
  attributeSetId: number | null;
}

const emptyForm: FormState = {
  sku: '', slug: '', name: '', shortDescription: '', description: '', brandId: null, productTypeId: null,
  basePrice: '', compareAtPrice: '', costPrice: '', currency: 'USD', trackInventory: false,
  countryOfOrigin: '', weightKg: '', lengthCm: '', widthCm: '', heightCm: '', shippingClass: '',
  seoTitle: '', seoDescription: '', canonicalUrl: '', categories: [], primaryCategoryId: null, attributeSetId: null,
};

const toFormState = (product: ProductDto): FormState => ({
  sku: product.sku,
  slug: product.slug,
  name: product.name,
  shortDescription: product.shortDescription,
  description: product.description,
  brandId: product.brandId,
  productTypeId: product.productTypeId,
  basePrice: product.variant?.basePrice?.toString() ?? '',
  compareAtPrice: product.variant?.compareAtPrice?.toString() ?? '',
  costPrice: product.variant?.costPrice?.toString() ?? '',
  currency: product.variant?.currency ?? 'USD',
  trackInventory: product.variant?.trackInventory ?? false,
  countryOfOrigin: product.countryOfOrigin ?? '',
  weightKg: product.weightKg?.toString() ?? '',
  lengthCm: product.lengthCm?.toString() ?? '',
  widthCm: product.widthCm?.toString() ?? '',
  heightCm: product.heightCm?.toString() ?? '',
  shippingClass: product.shippingClass ?? '',
  seoTitle: product.seoTitle,
  seoDescription: product.seoDescription,
  canonicalUrl: product.canonicalUrl ?? '',
  categories: product.categories.map((c) => ({ categoryId: c.categoryId, categoryName: c.categoryName })),
  primaryCategoryId: product.categories.find((c) => c.isPrimary)?.categoryId ?? null,
  attributeSetId: product.attributeSetId,
});

const toNullableNumber = (value: string): number | null => (value.trim() === '' ? null : Number(value));

// Mirrors the server's AllowedImageContentTypes (ProductService.cs) -- the file input's `accept`
// attribute only steers the OS picker, it doesn't stop a drag-and-drop or a renamed file, so this
// is the actual client-side gate.
const ALLOWED_IMAGE_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const ProductEditorPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = id !== undefined;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission, tokenPayload } = useAuthStore();
  const canPublish = tokenPayload?.platform_admin === 'true' || hasPermission('catalog-products.publish');

  const [form, setForm] = useState<FormState>(emptyForm);
  const [uploading, setUploading] = useState(false);

  const productId = isEdit ? Number(id) : undefined;

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['catalog', 'products', productId],
    queryFn: () => productApi.getById(productId!),
    enabled: isEdit,
  });

  const { data: brandsPage } = useQuery({ queryKey: ['catalog', 'brands', 'all'], queryFn: () => brandApi.getPaged({ page: 1, pageSize: 200 }) });
  const { data: productTypes = [] } = useQuery({ queryKey: ['catalog', 'product-types'], queryFn: () => productApi.getProductTypes() });
  const { data: attributeSets = [] } = useQuery({ queryKey: ['catalog', 'attribute-sets'], queryFn: () => attributeSetApi.getAll() });

  useEffect(() => {
    if (product) setForm(toFormState(product));
  }, [product]);

  const invalidateList = () => queryClient.invalidateQueries({ queryKey: ['catalog', 'products'] });
  const invalidateDetail = () => productId !== undefined && queryClient.invalidateQueries({ queryKey: ['catalog', 'products', productId] });

  const createMutation = useMutation({
    mutationFn: () =>
      productApi.create({
        sku: form.sku.trim(),
        slug: form.slug.trim().toLowerCase(),
        name: form.name.trim(),
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        brandId: form.brandId,
        productTypeId: form.productTypeId,
        categoryIds: form.categories.map((c) => c.categoryId),
        primaryCategoryId: form.primaryCategoryId!,
        basePrice: Number(form.basePrice || 0),
        currency: form.currency.trim().toUpperCase(),
      } as any),
    onSuccess: (created) => {
      invalidateList();
      toast.success('Product created -- continue editing to add images and publish');
      navigate(`/catalog/products/${created.id}`, { replace: true });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to create product'),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      const dto: ProductUpdateDto = {
        sku: form.sku.trim(),
        slug: form.slug.trim().toLowerCase(),
        name: form.name.trim(),
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        brandId: form.brandId,
        categoryIds: form.categories.map((c) => c.categoryId),
        primaryCategoryId: form.primaryCategoryId!,
        basePrice: Number(form.basePrice || 0),
        compareAtPrice: toNullableNumber(form.compareAtPrice),
        costPrice: toNullableNumber(form.costPrice),
        currency: form.currency.trim().toUpperCase(),
        trackInventory: form.trackInventory,
        countryOfOrigin: form.countryOfOrigin.trim() || null,
        weightKg: toNullableNumber(form.weightKg),
        lengthCm: toNullableNumber(form.lengthCm),
        widthCm: toNullableNumber(form.widthCm),
        heightCm: toNullableNumber(form.heightCm),
        shippingClass: form.shippingClass.trim() || null,
        seoTitle: form.seoTitle.trim(),
        seoDescription: form.seoDescription.trim(),
        canonicalUrl: form.canonicalUrl.trim() || null,
        attributeSetId: form.attributeSetId,
      };
      return productApi.update(productId!, dto);
    },
    onSuccess: () => {
      invalidateList();
      invalidateDetail();
      toast.success('Product updated successfully');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to update product'),
  });

  const submitForReviewMutation = useMutation({
    mutationFn: () => productApi.submitForReview(productId!),
    onSuccess: () => {
      invalidateList();
      invalidateDetail();
      toast.success('Product submitted for review');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to submit product for review'),
  });

  const publishMutation = useMutation({
    mutationFn: () => productApi.publish(productId!),
    onSuccess: () => {
      invalidateList();
      invalidateDetail();
      toast.success('Product published successfully');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to publish product'),
  });

  const archiveMutation = useMutation({
    mutationFn: () => productApi.archive(productId!),
    onSuccess: () => {
      invalidateList();
      invalidateDetail();
      toast.success('Product archived successfully');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to archive product'),
  });

  const deleteMediaMutation = useMutation({
    mutationFn: (mediaId: number) => productApi.deleteMedia(productId!, mediaId),
    onSuccess: () => {
      invalidateDetail();
      toast.success('Image removed');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to remove image'),
  });

  const handleUpload = async (file: File) => {
    if (!productId) return;
    if (!ALLOWED_IMAGE_CONTENT_TYPES.has(file.type)) {
      toast.error('Only JPEG, PNG, WebP, or GIF images are allowed.');
      return;
    }
    setUploading(true);
    try {
      await productMediaUploadApi.upload(productId, file, form.name, product?.media.length ?? 0);
      invalidateDetail();
      toast.success('Image uploaded');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const missingForPublish = useMemo(() => {
    if (!product) return [];
    const missing: string[] = [];
    if (!product.variant || product.variant.basePrice <= 0) missing.push('a price greater than zero');
    if (product.media.length === 0) missing.push('at least one image');
    return missing;
  }, [product]);

  if (isEdit && isLoading) return <Loader />;
  if (isEdit && error) return <ErrorState message={(error as Error).message} />;

  const canSubmitBasics = form.sku.trim() && form.slug.trim() && form.name.trim() && form.categories.length > 0 && form.primaryCategoryId !== null
    && (isEdit || form.productTypeId !== null);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/catalog/products')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isEdit ? form.name || 'Edit Product' : 'New Product'}</h1>
          {product && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Status: <span className="font-medium">{product.status}</span>
            </span>
          )}
        </div>
      </div>

      {/* Basic Info */}
      <section className={sectionClasses}>
        <h2 className={sectionTitleClasses}>Basic Info</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={labelClasses}>SKU<span className="text-red-500 ml-1">*</span></label>
            <input className={inputClasses} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className={labelClasses}>Slug<span className="text-red-500 ml-1">*</span></label>
            <input className={inputClasses} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1">
          <label className={labelClasses}>Name<span className="text-red-500 ml-1">*</span></label>
          <input className={inputClasses} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-1">
          <label className={labelClasses}>Short Description</label>
          <input className={inputClasses} value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
        </div>
        <div className="space-y-1">
          <label className={labelClasses}>Description</label>
          <textarea rows={4} className={`${inputClasses} resize-none`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        {!isEdit && (
          <div className="space-y-1">
            <label className={labelClasses}>Product Type<span className="text-red-500 ml-1">*</span></label>
            <select
              className={inputClasses}
              value={form.productTypeId ?? ''}
              onChange={(e) => setForm({ ...form, productTypeId: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Select a product type...</option>
              {productTypes.map((pt: ProductTypeDto) => (
                <option key={pt.id} value={pt.id}>{pt.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={labelClasses}>Price<span className="text-red-500 ml-1">*</span></label>
            <input type="number" step="0.01" className={inputClasses} value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className={labelClasses}>Currency</label>
            <input className={inputClasses} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} maxLength={3} />
          </div>
        </div>
        {isEdit && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelClasses}>Compare-at Price</label>
                <input type="number" step="0.01" className={inputClasses} value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className={labelClasses}>Cost Price</label>
                <input type="number" step="0.01" className={inputClasses} value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={form.trackInventory} onChange={(e) => setForm({ ...form, trackInventory: e.target.checked })} className="rounded border-gray-300" />
                Track inventory
              </label>
              {/* Stock itself lives per-warehouse now (Task Group 05) -- manage it on the
                  Inventory page rather than as a single number here. */}
              {form.trackInventory && product?.variant && (
                <Link to={`/catalog/inventory?variantId=${product.variant.id}`} className="text-sm text-blue-600 hover:underline">
                  Manage stock in Inventory →
                </Link>
              )}
            </div>
          </>
        )}
      </section>

      {/* Category / Brand */}
      <section className={sectionClasses}>
        <h2 className={sectionTitleClasses}>Category &amp; Brand</h2>
        <div className="space-y-1">
          <label className={labelClasses}>Brand</label>
          <select className={inputClasses} value={form.brandId ?? ''} onChange={(e) => setForm({ ...form, brandId: e.target.value ? Number(e.target.value) : null })}>
            <option value="">No brand</option>
            {brandsPage?.items.map((b: BrandDto) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className={labelClasses}>Categories<span className="text-red-500 ml-1">*</span></label>
          <CategoryPicker
            selected={form.categories}
            primaryCategoryId={form.primaryCategoryId}
            onToggle={(category) =>
              setForm((prev) => {
                const exists = prev.categories.some((c) => c.categoryId === category.categoryId);
                const categories = exists
                  ? prev.categories.filter((c) => c.categoryId !== category.categoryId)
                  : [...prev.categories, category];
                const primaryCategoryId = exists && prev.primaryCategoryId === category.categoryId
                  ? categories[0]?.categoryId ?? null
                  : prev.primaryCategoryId ?? category.categoryId;
                return { ...prev, categories, primaryCategoryId };
              })
            }
            onSetPrimary={(categoryId) => setForm((prev) => ({ ...prev, primaryCategoryId: categoryId }))}
          />
        </div>
        {isEdit && (
          <div className="space-y-1">
            <label className={labelClasses}>Attribute Set Override</label>
            <select
              className={inputClasses}
              value={form.attributeSetId ?? ''}
              onChange={(e) => setForm({ ...form, attributeSetId: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Use category's default attribute set</option>
              {attributeSets.map((s: AttributeSetDto) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}
      </section>

      {/* Specifications -- Task Group 03, schema-driven from the product's effective attribute set */}
      {isEdit && productId !== undefined && (
        <section className={sectionClasses}>
          <h2 className={sectionTitleClasses}>Specifications</h2>
          <AttributeValueForm productId={productId} />
        </section>
      )}

      {/* Variants -- Task Group 04 */}
      {isEdit && productId !== undefined && (
        <section className={sectionClasses}>
          <h2 className={sectionTitleClasses}>Variants</h2>
          <VariantMatrixGrid productId={productId} />
        </section>
      )}

      {/* Options & add-ons -- Task Group 04 */}
      {isEdit && productId !== undefined && (
        <section className={sectionClasses}>
          <h2 className={sectionTitleClasses}>Options &amp; Add-ons</h2>
          <ProductOptionsEditor productId={productId} />
        </section>
      )}

      {/* Bundle items -- Task Group 04 */}
      {isEdit && productId !== undefined && (
        <section className={sectionClasses}>
          <h2 className={sectionTitleClasses}>Bundle Items</h2>
          <BundleItemsEditor productId={productId} />
        </section>
      )}

      {/* Related products -- Task Group 04 */}
      {isEdit && productId !== undefined && (
        <section className={sectionClasses}>
          <h2 className={sectionTitleClasses}>Related Products</h2>
          <RelatedProductsEditor productId={productId} />
        </section>
      )}

      {/* Media gallery */}
      <section className={sectionClasses}>
        <h2 className={sectionTitleClasses}>Media</h2>
        {!isEdit ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Save the product first to upload images.</p>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-3">
              {product?.media.map((media) => (
                <div key={media.id} className="relative group">
                  <img src={media.url} alt={media.altText} className="w-full aspect-square object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                  {media.isPrimary && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-600 text-white">Primary</span>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteMediaMutation.mutate(media.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-blue-400">
                {uploading ? <Loader2 className="w-6 h-6 animate-spin text-blue-500" /> : <UploadCloud className="w-6 h-6 text-gray-400" />}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </>
        )}
      </section>

      {/* SEO */}
      {isEdit && (
        <section className={sectionClasses}>
          <h2 className={sectionTitleClasses}>SEO &amp; Shipping</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={labelClasses}>SEO Title</label>
              <input className={inputClasses} value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>SEO Description</label>
              <input className={inputClasses} value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <label className={labelClasses}>Canonical URL</label>
            <input className={inputClasses} value={form.canonicalUrl} onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={labelClasses}>Country of Origin</label>
              <input className={inputClasses} value={form.countryOfOrigin} onChange={(e) => setForm({ ...form, countryOfOrigin: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>Shipping Class</label>
              <input className={inputClasses} value={form.shippingClass} onChange={(e) => setForm({ ...form, shippingClass: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className={labelClasses}>Weight (kg)</label>
              <input type="number" step="0.001" className={inputClasses} value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>Length (cm)</label>
              <input type="number" step="0.01" className={inputClasses} value={form.lengthCm} onChange={(e) => setForm({ ...form, lengthCm: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>Width (cm)</label>
              <input type="number" step="0.01" className={inputClasses} value={form.widthCm} onChange={(e) => setForm({ ...form, widthCm: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>Height (cm)</label>
              <input type="number" step="0.01" className={inputClasses} value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} />
            </div>
          </div>
        </section>
      )}

      {/* Publish panel */}
      {isEdit && product && (
        <section className={sectionClasses}>
          <h2 className={sectionTitleClasses}>Publish</h2>
          {product.status !== 'Published' && missingForPublish.length > 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Before publishing: {missingForPublish.join(', ')} required.
            </p>
          )}
          <div className="flex gap-3">
            {product.status === 'Draft' && (
              <button
                type="button"
                onClick={() => submitForReviewMutation.mutate()}
                disabled={submitForReviewMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" /> Submit for Review
              </button>
            )}
            {product.status !== 'Published' && canPublish && (
              <button
                type="button"
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <UploadCloud className="w-4 h-4" /> Publish
              </button>
            )}
            {product.status !== 'Archived' && (
              <button
                type="button"
                onClick={() => archiveMutation.mutate()}
                disabled={archiveMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                <Archive className="w-4 h-4" /> Archive
              </button>
            )}
          </div>
        </section>
      )}

      <div className="flex justify-end gap-3 pb-6">
        <button type="button" onClick={() => navigate('/catalog/products')} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
          Cancel
        </button>
        <button
          type="button"
          disabled={!canSubmitBasics || createMutation.isPending || updateMutation.isPending}
          onClick={() => (isEdit ? updateMutation.mutate() : createMutation.mutate())}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isEdit ? 'Save Changes' : 'Create Product'}
        </button>
      </div>
    </div>
  );
};
