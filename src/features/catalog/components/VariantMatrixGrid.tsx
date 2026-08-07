import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, Sparkles, Download } from 'lucide-react';
import { DataTable, Column } from '../../../components/table/DataTable';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { Modal } from '../../../components/ui/Modal/Modal';
import { Loader } from '../../../components/ui/Loader/Loader';
import { toast } from '../../../components/ui/Toast/toast.store';
import { attributeApi, AttributeDefinitionDto } from '../pages/AttributesPage';
import { productApi, ProductVariantDto, DigitalAssetWriteDto } from '../pages/ProductsPage';

const inputClasses =
  'px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500';

const GenerateVariantsModal: React.FC<{ productId: number; onClose: () => void; onGenerated: () => void }> = ({ productId, onClose, onGenerated }) => {
  const { data: attributes = [], isLoading } = useQuery({ queryKey: ['catalog', 'attributes'], queryFn: () => attributeApi.getAll() });
  const variantDefining = attributes.filter((a) => a.isVariantDefining && a.isActive);
  const [selected, setSelected] = useState<Record<number, Set<number>>>({});

  const generateMutation = useMutation({
    mutationFn: () =>
      productApi.generateVariants(
        productId,
        Object.entries(selected)
          .filter(([, ids]) => ids.size > 0)
          .map(([attributeDefinitionId, ids]) => ({ attributeDefinitionId: Number(attributeDefinitionId), optionIds: Array.from(ids) }))
      ),
    onSuccess: (variants) => {
      toast.success(`${variants.length} variant(s) in the matrix`);
      onGenerated();
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to generate variants'),
  });

  const toggle = (attributeId: number, optionId: number) => {
    setSelected((prev) => {
      const set = new Set(prev[attributeId] ?? []);
      if (set.has(optionId)) set.delete(optionId);
      else set.add(optionId);
      return { ...prev, [attributeId]: set };
    });
  };

  const hasAnySelection = Object.values(selected).some((s) => s.size > 0);

  if (isLoading) return <Loader />;

  if (variantDefining.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">No attributes are marked variant-defining yet -- flag one (e.g. Size, Color) on the Attributes page first.</p>;
  }

  return (
    <div className="space-y-4">
      {variantDefining.map((attribute: AttributeDefinitionDto) => (
        <div key={attribute.id} className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{attribute.name}</h4>
          <div className="flex flex-wrap gap-2">
            {attribute.options.map((option) => {
              const isChecked = selected[attribute.id]?.has(option.id) ?? false;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggle(attribute.id, option.id)}
                  className={`px-3 py-1.5 text-xs rounded-full border ${isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
                >
                  {option.label}
                </button>
              );
            })}
            {attribute.options.length === 0 && <span className="text-xs text-gray-400">No options defined for this attribute yet</span>}
          </div>
        </div>
      ))}

      <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
          Cancel
        </button>
        <button
          type="button"
          disabled={!hasAnySelection || generateMutation.isPending}
          onClick={() => generateMutation.mutate()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Generate Variants
        </button>
      </div>
    </div>
  );
};

const DigitalAssetModal: React.FC<{ productId: number; variantId: number; onClose: () => void }> = ({ productId, variantId, onClose }) => {
  const { data: asset, isLoading } = useQuery({
    queryKey: ['catalog', 'products', productId, 'variants', variantId, 'digital-asset'],
    queryFn: () => productApi.getDigitalAsset(productId, variantId),
  });

  const [form, setForm] = useState<DigitalAssetWriteDto | null>(null);
  const current: DigitalAssetWriteDto = form ?? {
    fileUrl: asset?.fileUrl ?? '',
    fileName: asset?.fileName ?? '',
    maxDownloads: asset?.maxDownloads ?? null,
    expiryDays: asset?.expiryDays ?? null,
    licenseKeyPoolId: asset?.licenseKeyPoolId ?? null,
  };

  const saveMutation = useMutation({
    mutationFn: () => productApi.saveDigitalAsset(productId, variantId, current),
    onSuccess: () => {
      toast.success('Digital asset saved');
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to save digital asset'),
  });

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">File URL</label>
        <input
          type="text"
          className={`${inputClasses} w-full`}
          value={current.fileUrl}
          onChange={(e) => setForm({ ...current, fileUrl: e.target.value })}
          placeholder="https://..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">File Name</label>
        <input
          type="text"
          className={`${inputClasses} w-full`}
          value={current.fileName}
          onChange={(e) => setForm({ ...current, fileName: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Downloads</label>
          <input
            type="number"
            className={`${inputClasses} w-full`}
            value={current.maxDownloads ?? ''}
            onChange={(e) => setForm({ ...current, maxDownloads: e.target.value === '' ? null : Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry (days)</label>
          <input
            type="number"
            className={`${inputClasses} w-full`}
            value={current.expiryDays ?? ''}
            onChange={(e) => setForm({ ...current, expiryDays: e.target.value === '' ? null : Number(e.target.value) })}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">License Key Pool Id</label>
        <input
          type="text"
          className={`${inputClasses} w-full`}
          value={current.licenseKeyPoolId ?? ''}
          onChange={(e) => setForm({ ...current, licenseKeyPoolId: e.target.value === '' ? null : e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
          Cancel
        </button>
        <button
          type="button"
          disabled={!current.fileUrl || !current.fileName || saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export const VariantMatrixGrid: React.FC<{ productId: number }> = ({ productId }) => {
  const queryClient = useQueryClient();
  const [showGenerate, setShowGenerate] = useState(false);
  const [deleteVariantId, setDeleteVariantId] = useState<number | null>(null);
  const [digitalAssetVariantId, setDigitalAssetVariantId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, Partial<ProductVariantDto>>>({});

  const { data: variants = [], isLoading, error, refetch } = useQuery({
    queryKey: ['catalog', 'products', productId, 'variants'],
    queryFn: () => productApi.getVariants(productId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['catalog', 'products', productId, 'variants'] });

  const updateMutation = useMutation({
    mutationFn: ({ variantId, variant }: { variantId: number; variant: ProductVariantDto }) =>
      productApi.updateVariant(productId, variantId, {
        sku: variant.sku,
        barcode: variant.barcode,
        status: variant.status,
        basePrice: variant.basePrice,
        compareAtPrice: variant.compareAtPrice,
        costPrice: variant.costPrice,
        currency: variant.currency,
        trackInventory: variant.trackInventory,
        isDigital: variant.isDigital,
        weightKg: variant.weightKg,
        lengthCm: variant.lengthCm,
        widthCm: variant.widthCm,
        heightCm: variant.heightCm,
      }),
    onSuccess: (_, { variantId }) => {
      invalidate();
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[variantId];
        return next;
      });
      toast.success('Variant saved');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to save variant'),
  });

  const deleteMutation = useMutation({
    mutationFn: (variantId: number) => productApi.deleteVariant(productId, variantId),
    onSuccess: () => {
      invalidate();
      toast.success('Variant removed');
      setDeleteVariantId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to remove variant'),
  });

  const attributeColumns = useMemo(() => {
    const names = new Map<number, string>();
    variants.forEach((v) => v.options.forEach((o) => names.set(o.attributeDefinitionId, o.attributeName)));
    return Array.from(names.entries());
  }, [variants]);

  const getDraft = (variant: ProductVariantDto): ProductVariantDto => ({ ...variant, ...drafts[variant.id] });
  const setDraft = (variantId: number, patch: Partial<ProductVariantDto>) =>
    setDrafts((prev) => ({ ...prev, [variantId]: { ...prev[variantId], ...patch } }));

  const columns: Column<ProductVariantDto>[] = [
    { key: 'sku', label: 'SKU', width: '140px' },
    ...attributeColumns.map(([attributeId, name]) => ({
      key: `attr-${attributeId}`,
      label: name,
      width: '110px',
      render: (_: any, variant: ProductVariantDto) => variant.options.find((o) => o.attributeDefinitionId === attributeId)?.optionLabel ?? '—',
    })),
    {
      key: 'basePrice',
      label: 'Price',
      width: '110px',
      render: (_, variant) => {
        const draft = getDraft(variant);
        return (
          <input
            type="number"
            step="0.01"
            className={`${inputClasses} w-24`}
            value={draft.basePrice}
            onChange={(e) => setDraft(variant.id, { basePrice: Number(e.target.value) })}
          />
        );
      },
    },
    {
      // Read-only here and links out to /catalog/inventory instead of duplicating the editable
      // grid inline -- stock is now tracked per-warehouse (Task Group 05), not as a single number
      // on the variant itself.
      key: 'availableQuantity',
      label: 'Stock',
      width: '130px',
      render: (_, variant) =>
        variant.trackInventory ? (
          <Link
            to={`/catalog/inventory?variantId=${variant.id}`}
            className={`text-sm hover:underline ${variant.isPurchasable ? 'text-gray-700 dark:text-gray-300' : 'text-red-600 dark:text-red-400 font-medium'}`}
          >
            {variant.availableQuantity} available
          </Link>
        ) : (
          <span className="text-sm text-gray-400">Not tracked</span>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '120px',
      render: (_, variant) => {
        const draft = getDraft(variant);
        return (
          <select className={inputClasses} value={draft.status} onChange={(e) => setDraft(variant.id, { status: e.target.value as ProductVariantDto['status'] })}>
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Archived">Archived</option>
          </select>
        );
      },
    },
    {
      // Task Group 07: marking a variant digital clears its weight/dimensions server-side and
      // requires a digital asset (set via the row action below) before the product can publish.
      key: 'isDigital',
      label: 'Digital',
      width: '80px',
      render: (_, variant) => {
        const draft = getDraft(variant);
        return (
          <input
            type="checkbox"
            checked={draft.isDigital ?? false}
            onChange={(e) => setDraft(variant.id, { isDigital: e.target.checked })}
          />
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600 dark:text-red-400">{(error as Error).message}</p>}

      <DataTable
        columns={columns}
        data={variants}
        isLoading={isLoading}
        searchable={false}
        sortable={false}
        emptyState={{ title: 'No variants yet', description: 'Generate a variant matrix from your variant-defining attributes' }}
        actions={{ add: { label: 'Generate Variants', onClick: () => setShowGenerate(true) } }}
        rowActions={[
          {
            icon: Sparkles,
            label: 'Save',
            onClick: (variant) => updateMutation.mutate({ variantId: variant.id, variant: getDraft(variant) }),
            variant: 'success',
            show: (variant) => !!drafts[variant.id],
          },
          {
            icon: Download,
            label: 'Digital Delivery',
            onClick: (variant) => setDigitalAssetVariantId(variant.id),
            show: (variant) => variant.isDigital,
          },
          { icon: Trash2, label: 'Delete', onClick: (variant) => setDeleteVariantId(variant.id), variant: 'danger' },
        ]}
        onRetry={() => refetch()}
      />

      <Modal isOpen={showGenerate} onClose={() => setShowGenerate(false)} title="Generate Variants" size="lg">
        <GenerateVariantsModal productId={productId} onClose={() => setShowGenerate(false)} onGenerated={invalidate} />
      </Modal>

      <Modal isOpen={digitalAssetVariantId !== null} onClose={() => setDigitalAssetVariantId(null)} title="Digital Delivery" size="md">
        {digitalAssetVariantId !== null && (
          <DigitalAssetModal productId={productId} variantId={digitalAssetVariantId} onClose={() => setDigitalAssetVariantId(null)} />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteVariantId !== null}
        onClose={() => setDeleteVariantId(null)}
        onConfirm={() => deleteVariantId !== null && deleteMutation.mutate(deleteVariantId)}
        title="Delete Variant"
        message="Are you sure you want to remove this variant? A Published product must always keep at least one."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
