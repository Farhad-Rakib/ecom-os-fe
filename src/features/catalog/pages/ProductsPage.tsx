import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, UploadCloud, Archive } from 'lucide-react';
import { DataTable, Column, RowAction } from '../../../components/table/DataTable';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { toast } from '../../../components/ui/Toast/toast.store';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';
import { useAuthStore } from '../../auth/store/auth.store';

export interface VariantOptionDto {
  attributeDefinitionId: number;
  attributeName: string;
  attributeOptionId: number;
  optionLabel: string;
}

export interface ProductVariantDto {
  id: number;
  sku: string;
  barcode: string | null;
  status: 'Draft' | 'Published' | 'Archived';
  basePrice: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  currency: string;
  trackInventory: boolean;
  // Task Group 05: aggregated across every warehouse -- see /catalog/inventory for the
  // per-warehouse breakdown and to edit stock. ProductVariant no longer carries its own quantity.
  availableQuantity: number;
  isPurchasable: boolean;
  isDigital: boolean;
  weightKg: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  options: VariantOptionDto[];
}

export interface DigitalAssetDto {
  id: number;
  productVariantId: number;
  fileUrl: string;
  fileName: string;
  maxDownloads: number | null;
  expiryDays: number | null;
  licenseKeyPoolId: string | null;
}

export interface DigitalAssetWriteDto {
  fileUrl: string;
  fileName: string;
  maxDownloads: number | null;
  expiryDays: number | null;
  licenseKeyPoolId: string | null;
}

export interface ProductMediaDto {
  id: number;
  productId: number;
  productVariantId: number | null;
  type: string;
  url: string;
  altText: string;
  displayOrder: number;
  isPrimary: boolean;
}

export interface ProductCategoryAssignmentDto {
  categoryId: number;
  categoryName: string;
  isPrimary: boolean;
}

export interface ProductDto {
  id: number;
  sku: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  brandId: number | null;
  brandName: string | null;
  productTypeId: number;
  status: 'Draft' | 'Published' | 'Archived';
  countryOfOrigin: string | null;
  weightKg: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  shippingClass: string | null;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string | null;
  avgRating: number;
  reviewCount: number;
  publishedAtUtc: string | null;
  variant: ProductVariantDto | null;
  categories: ProductCategoryAssignmentDto[];
  media: ProductMediaDto[];
  attributeSetId: number | null;
  variants: ProductVariantDto[];
}

export interface ProductTypeDto {
  id: number;
  code: string;
  name: string;
  supportsVariants: boolean;
  isDigital: boolean;
  isBundle: boolean;
  isService: boolean;
}

export interface ProductOptionValueDto {
  id: number;
  productOptionId: number;
  label: string;
  priceModifier: number;
  isDefault: boolean;
  displayOrder: number;
}

export interface ProductOptionDto {
  id: number;
  productId: number;
  name: string;
  displayOrder: number;
  values: ProductOptionValueDto[];
}

export interface ProductBundleItemDto {
  id: number;
  bundleProductId: number;
  componentProductId: number;
  componentProductName: string;
  componentVariantId: number | null;
  quantity: number;
  isOptional: boolean;
  priceOverride: number | null;
  effectiveUnitPrice: number;
}

export interface BundleSummaryDto {
  items: ProductBundleItemDto[];
  combinedPrice: number;
}

export interface ProductRelationDto {
  id: number;
  productId: number;
  relatedProductId: number;
  relatedProductName: string;
  relationType: string;
  displayOrder: number;
}

interface PagedResultDto<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ProductWriteDto {
  sku: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  brandId: number | null;
  categoryIds: number[];
  primaryCategoryId: number;
  basePrice: number;
  currency: string;
}

export interface ProductUpdateDto extends ProductWriteDto {
  compareAtPrice: number | null;
  costPrice: number | null;
  trackInventory: boolean;
  countryOfOrigin: string | null;
  weightKg: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  shippingClass: string | null;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string | null;
}

class ProductApi extends BaseRepository {
  constructor() { super('/products'); }

  async getProductTypes(): Promise<ProductTypeDto[]> {
    const res = await this.get<ApiResponse<ProductTypeDto[]>>('/types');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async getPaged(params: { status?: string; categoryId?: number; brandId?: number; search?: string; page: number; pageSize: number }): Promise<PagedResultDto<ProductDto>> {
    const res = await this.get<ApiResponse<PagedResultDto<ProductDto>>>('', { params });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async getById(id: number): Promise<ProductDto> {
    const res = await this.get<ApiResponse<ProductDto>>(`/${id}`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async create(dto: ProductWriteDto & Partial<ProductUpdateDto>): Promise<ProductDto> {
    const res = await this.post<ApiResponse<ProductDto>>('', dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async update(id: number, dto: ProductUpdateDto): Promise<ProductDto> {
    const res = await this.put<ApiResponse<ProductDto>>(`/${id}`, dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async publish(id: number): Promise<ProductDto> {
    const res = await this.post<ApiResponse<ProductDto>>(`/${id}/publish`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async archive(id: number): Promise<ProductDto> {
    const res = await this.post<ApiResponse<ProductDto>>(`/${id}/archive`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async remove(id: number): Promise<void> {
    await this.delete<any>(`/${id}`);
  }

  async deleteMedia(productId: number, mediaId: number): Promise<void> {
    await this.delete<any>(`/${productId}/media/${mediaId}`);
  }

  async getVariants(productId: number): Promise<ProductVariantDto[]> {
    const res = await this.get<ApiResponse<ProductVariantDto[]>>(`/${productId}/variants`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async generateVariants(productId: number, selections: { attributeDefinitionId: number; optionIds: number[] }[]): Promise<ProductVariantDto[]> {
    const res = await this.post<ApiResponse<ProductVariantDto[]>>(`/${productId}/variants/generate`, { selections });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async updateVariant(productId: number, variantId: number, dto: Record<string, any>): Promise<ProductVariantDto> {
    const res = await this.put<ApiResponse<ProductVariantDto>>(`/${productId}/variants/${variantId}`, dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async deleteVariant(productId: number, variantId: number): Promise<void> {
    await this.delete<any>(`/${productId}/variants/${variantId}`);
  }

  async getDigitalAsset(productId: number, variantId: number): Promise<DigitalAssetDto | null> {
    const res = await this.get<ApiResponse<DigitalAssetDto | null>>(`/${productId}/variants/${variantId}/digital-asset`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async saveDigitalAsset(productId: number, variantId: number, dto: DigitalAssetWriteDto): Promise<DigitalAssetDto> {
    const res = await this.put<ApiResponse<DigitalAssetDto>>(`/${productId}/variants/${variantId}/digital-asset`, dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async getOptions(productId: number): Promise<ProductOptionDto[]> {
    const res = await this.get<ApiResponse<ProductOptionDto[]>>(`/${productId}/options`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async addOption(productId: number, name: string): Promise<ProductOptionDto> {
    const res = await this.post<ApiResponse<ProductOptionDto>>(`/${productId}/options`, { name });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async deleteOption(productId: number, optionId: number): Promise<void> {
    await this.delete<any>(`/${productId}/options/${optionId}`);
  }

  async addOptionValue(productId: number, optionId: number, dto: { label: string; priceModifier: number; isDefault: boolean }): Promise<ProductOptionValueDto> {
    const res = await this.post<ApiResponse<ProductOptionValueDto>>(`/${productId}/options/${optionId}/values`, dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async deleteOptionValue(productId: number, optionId: number, valueId: number): Promise<void> {
    await this.delete<any>(`/${productId}/options/${optionId}/values/${valueId}`);
  }

  async getBundleItems(productId: number): Promise<BundleSummaryDto> {
    const res = await this.get<ApiResponse<BundleSummaryDto>>(`/${productId}/bundle-items`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async addBundleItem(productId: number, dto: { componentProductId: number; componentVariantId: number | null; quantity: number; isOptional: boolean; priceOverride: number | null }): Promise<ProductBundleItemDto> {
    const res = await this.post<ApiResponse<ProductBundleItemDto>>(`/${productId}/bundle-items`, dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async deleteBundleItem(productId: number, bundleItemId: number): Promise<void> {
    await this.delete<any>(`/${productId}/bundle-items/${bundleItemId}`);
  }

  async getRelations(productId: number): Promise<ProductRelationDto[]> {
    const res = await this.get<ApiResponse<ProductRelationDto[]>>(`/${productId}/relations`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async addRelation(productId: number, relatedProductId: number, relationType: string): Promise<ProductRelationDto> {
    const res = await this.post<ApiResponse<ProductRelationDto>>(`/${productId}/relations`, { relatedProductId, relationType });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async deleteRelation(productId: number, relationId: number): Promise<void> {
    await this.delete<any>(`/${productId}/relations/${relationId}`);
  }
}

// A separate instance because uploads must let the browser set the multipart boundary itself --
// BaseRepository fixes a Content-Type header on the underlying axios instance at construction
// time, so a JSON-default instance can never be reused for this call.
class ProductMediaUploadApi extends BaseRepository {
  constructor() { super('/products', 'multipart/form-data'); }

  async upload(productId: number, file: File, altText: string, displayOrder: number): Promise<ProductMediaDto> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('altText', altText);
    formData.append('displayOrder', String(displayOrder));

    const res = await this.post<ApiResponse<ProductMediaDto>>(`/${productId}/media`, formData);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

export const productApi = new ProductApi();
export const productMediaUploadApi = new ProductMediaUploadApi();

const statusBadgeClasses: Record<ProductDto['status'], string> = {
  Draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  Published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Archived: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission, tokenPayload } = useAuthStore();
  // Mirrors PermissionGuard: a platform super admin bypasses every permission check server-side,
  // so the client-side Publish action must not hide itself from them either.
  const canPublish = tokenPayload?.platform_admin === 'true' || hasPermission('catalog-products.publish');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['catalog', 'products', { page, pageSize, search }],
    queryFn: () => productApi.getPaged({ page, pageSize, search: search || undefined }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['catalog', 'products'] });

  const publishMutation = useMutation({
    mutationFn: (id: number) => productApi.publish(id),
    onSuccess: () => {
      invalidate();
      toast.success('Product published successfully');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to publish product'),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => productApi.archive(id),
    onSuccess: () => {
      invalidate();
      toast.success('Product archived successfully');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to archive product'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productApi.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success('Product deleted successfully');
      setDeleteProductId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to delete product'),
  });

  const columns: Column<ProductDto>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'sku', label: 'SKU', width: '140px' },
    {
      key: 'status',
      label: 'Status',
      width: '110px',
      render: (_, product) => (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusBadgeClasses[product.status]}`}>{product.status}</span>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      width: '110px',
      render: (_, product) => (product.variant ? `${product.variant.currency} ${product.variant.basePrice.toFixed(2)}` : '—'),
    },
    {
      key: 'stock',
      label: 'Stock',
      width: '90px',
      render: (_, product) => (product.variant?.trackInventory ? product.variant.availableQuantity : '—'),
    },
    {
      key: 'category',
      label: 'Category',
      render: (_, product) => product.categories.find((c) => c.isPrimary)?.categoryName || '—',
    },
  ];

  const rowActions: RowAction<ProductDto>[] = [
    { icon: Pencil, label: 'Edit', onClick: (product) => navigate(`/catalog/products/${product.id}`), variant: 'primary' },
    {
      icon: UploadCloud,
      label: 'Publish',
      onClick: (product) => publishMutation.mutate(product.id),
      variant: 'success',
      show: (product) => canPublish && product.status !== 'Published',
    },
    {
      icon: Archive,
      label: 'Archive',
      onClick: (product) => archiveMutation.mutate(product.id),
      variant: 'warning',
      show: (product) => product.status !== 'Archived',
    },
    { icon: Trash2, label: 'Delete', onClick: (product) => setDeleteProductId(product.id), variant: 'danger', show: (product) => product.status !== 'Published' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your catalog's products and publishing status</p>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        error={error?.message}
        searchable
        searchPlaceholder="Search products..."
        onSearch={(term) => {
          setSearch(term);
          setPage(1);
        }}
        sortable={false}
        pagination={{
          currentPage: data?.page ?? page,
          totalPages: data?.totalPages ?? 1,
          pageSize: data?.pageSize ?? pageSize,
          total: data?.total ?? 0,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
        emptyState={{ title: 'No products found', description: 'Create a product to get started' }}
        actions={{ add: { label: 'Add Product', onClick: () => navigate('/catalog/products/new') } }}
        rowActions={rowActions}
        onRetry={() => refetch()}
      />

      <ConfirmDialog
        isOpen={deleteProductId !== null}
        onClose={() => setDeleteProductId(null)}
        onConfirm={() => deleteProductId !== null && deleteMutation.mutate(deleteProductId)}
        title="Delete Product"
        message="Are you sure you want to delete this product? This is only possible while it is a Draft or Archived."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
