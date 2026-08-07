import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, ArrowUp, ArrowDown, Folder } from 'lucide-react';
import { Loader } from '../../../components/ui/Loader/Loader';
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { Modal } from '../../../components/ui/Modal/Modal';
import { toast } from '../../../components/ui/Toast/toast.store';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';
import { taxonomyApi } from './TaxonomiesPage';
import { attributeSetApi, AttributeSetDto } from './AttributeSetsPage';

export interface CategoryDto {
  id: number;
  taxonomyId: number;
  parentCategoryId: number | null;
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  seoTitle: string;
  seoDescription: string;
  attributeSetId: number | null;
}

interface PagedResultDto<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface CategoryWriteDto {
  taxonomyId: number;
  parentCategoryId: number | null;
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
  seoTitle: string;
  seoDescription: string;
  attributeSetId: number | null;
}

// A tree level rarely has more than a couple hundred siblings, so each level is fetched in one
// page rather than wiring pagination controls into every branch of the tree.
const TREE_LEVEL_PAGE_SIZE = 200;

class CategoryApi extends BaseRepository {
  constructor() { super('/categories'); }
  async getPaged(taxonomyId: number, parentCategoryId: number | undefined): Promise<PagedResultDto<CategoryDto>> {
    const res = await this.get<ApiResponse<PagedResultDto<CategoryDto>>>('', {
      params: { taxonomyId, parentCategoryId, page: 1, pageSize: TREE_LEVEL_PAGE_SIZE },
    });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async create(dto: CategoryWriteDto): Promise<CategoryDto> {
    const res = await this.post<ApiResponse<CategoryDto>>('', dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async update(id: number, dto: Omit<CategoryWriteDto, 'taxonomyId'>): Promise<CategoryDto> {
    const res = await this.put<ApiResponse<CategoryDto>>(`/${id}`, dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async reorder(id: number, siblingIdsInOrder: number[]): Promise<void> {
    await this.post<any>(`/${id}/reorder`, { siblingIdsInOrder });
  }
  async remove(id: number): Promise<void> {
    await this.delete<any>(`/${id}`);
  }
}

export const categoryApi = new CategoryApi();

const inputClasses =
  'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50';

interface CategoryFormValues {
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  seoTitle: string;
  seoDescription: string;
  attributeSetId: number | null;
}

const emptyForm: CategoryFormValues = {
  slug: '', name: '', description: '', imageUrl: '', seoTitle: '', seoDescription: '', attributeSetId: null,
};

const CategoryForm: React.FC<{
  initial: CategoryFormValues;
  isEdit: boolean;
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: (values: CategoryFormValues) => void;
}> = ({ initial, isEdit, isLoading, onCancel, onSubmit }) => {
  const [form, setForm] = useState(initial);
  const { data: attributeSets = [] } = useQuery({ queryKey: ['catalog', 'attribute-sets'], queryFn: () => attributeSetApi.getAll() });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.slug.trim() || !form.name.trim()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Slug<span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="text"
          required
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          placeholder="e.g. running-shoes"
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
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={inputClasses}
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          className={`${inputClasses} resize-none`}
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Image URL</label>
        <input
          type="text"
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          className={inputClasses}
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Attribute Set</label>
        <select
          value={form.attributeSetId ?? ''}
          onChange={(e) => setForm({ ...form, attributeSetId: e.target.value ? Number(e.target.value) : null })}
          className={inputClasses}
        >
          <option value="">No default attribute set</option>
          {attributeSets.map((s: AttributeSetDto) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400">Products created in this category get this set's fields by default.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SEO Title</label>
          <input
            type="text"
            value={form.seoTitle}
            onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
            className={inputClasses}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SEO Description</label>
          <input
            type="text"
            value={form.seoDescription}
            onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
            className={inputClasses}
          />
        </div>
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
          {isEdit ? 'Update Category' : 'Create Category'}
        </button>
      </div>
    </form>
  );
};

interface TreeActions {
  onAddChild: (parentCategoryId: number) => void;
  onEdit: (category: CategoryDto) => void;
  onDelete: (category: CategoryDto) => void;
}

const CategoryTreeLevel: React.FC<{
  taxonomyId: number;
  parentCategoryId: number | undefined;
  depth: number;
  actions: TreeActions;
}> = ({ taxonomyId, parentCategoryId, depth, actions }) => {
  const queryClient = useQueryClient();
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const queryKey = ['catalog', 'categories', taxonomyId, parentCategoryId ?? 'root'];
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => categoryApi.getPaged(taxonomyId, parentCategoryId),
  });

  const reorderMutation = useMutation({
    mutationFn: ({ id, siblingIdsInOrder }: { id: number; siblingIdsInOrder: number[] }) => categoryApi.reorder(id, siblingIdsInOrder),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to reorder categories'),
  });

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const moveSibling = (items: CategoryDto[], index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;

    const reordered = [...items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    reorderMutation.mutate({ id: items[index].id, siblingIdsInOrder: reordered.map((c) => c.id) });
  };

  if (isLoading) {
    return depth === 0 ? <Loader /> : null;
  }

  if (error) {
    return depth === 0 ? <ErrorState message={(error as Error).message} /> : null;
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return depth === 0 ? (
      <EmptyState title="No categories yet" description="Add a root category to start building this taxonomy's tree" />
    ) : null;
  }

  return (
    <ul className={depth === 0 ? 'space-y-1' : 'space-y-1 mt-1 border-l border-gray-200 dark:border-gray-700 pl-4'}>
      {items.map((category, index) => {
        const isExpanded = expandedIds.has(category.id);
        return (
          <li key={category.id}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <button
                type="button"
                onClick={() => toggleExpanded(category.id)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              <Folder className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
              <span className="text-xs text-gray-400 font-mono">{category.slug}</span>
              {!category.isActive && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  Inactive
                </span>
              )}

              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveSibling(items, index, -1)}
                  disabled={index === 0 || reorderMutation.isPending}
                  className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveSibling(items, index, 1)}
                  disabled={index === items.length - 1 || reorderMutation.isPending}
                  className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => actions.onAddChild(category.id)}
                  className="p-1.5 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  title="Add subcategory"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => actions.onEdit(category)}
                  className="p-1.5 rounded text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => actions.onDelete(category)}
                  className="p-1.5 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {isExpanded && (
              <CategoryTreeLevel taxonomyId={taxonomyId} parentCategoryId={category.id} depth={depth + 1} actions={actions} />
            )}
          </li>
        );
      })}
    </ul>
  );
};

export const CategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedTaxonomyId, setSelectedTaxonomyId] = useState<number | null>(null);
  const [createParentId, setCreateParentId] = useState<number | null | undefined>(undefined);
  const [editCategory, setEditCategory] = useState<CategoryDto | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<CategoryDto | null>(null);

  const { data: taxonomies = [], isLoading: taxonomiesLoading } = useQuery({
    queryKey: ['catalog', 'taxonomies'],
    queryFn: () => taxonomyApi.getAll(),
  });

  const activeTaxonomyId = selectedTaxonomyId ?? taxonomies[0]?.id ?? null;

  const invalidateTree = () => queryClient.invalidateQueries({ queryKey: ['catalog', 'categories'] });

  const createMutation = useMutation({
    mutationFn: (dto: CategoryWriteDto) => categoryApi.create(dto),
    onSuccess: () => {
      invalidateTree();
      toast.success('Category created successfully');
      setCreateParentId(undefined);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to create category'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Omit<CategoryWriteDto, 'taxonomyId'> }) => categoryApi.update(id, dto),
    onSuccess: () => {
      invalidateTree();
      toast.success('Category updated successfully');
      setEditCategory(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to update category'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoryApi.remove(id),
    onSuccess: () => {
      invalidateTree();
      toast.success('Category deleted successfully');
      setDeleteCategory(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to delete category'),
  });

  const actions: TreeActions = {
    onAddChild: (parentCategoryId) => setCreateParentId(parentCategoryId),
    onEdit: (category) => setEditCategory(category),
    onDelete: (category) => setDeleteCategory(category),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Organize products into a browsable tree</p>
        </div>
        {activeTaxonomyId !== null && (
          <button
            type="button"
            onClick={() => setCreateParentId(null)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Root Category
          </button>
        )}
      </div>

      {taxonomies.length > 1 && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Taxonomy</label>
          <select
            value={activeTaxonomyId ?? ''}
            onChange={(e) => setSelectedTaxonomyId(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {taxonomies.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {taxonomiesLoading ? (
        <Loader />
      ) : taxonomies.length === 0 ? (
        <EmptyState
          title="No taxonomies yet"
          description="Create a taxonomy on the Taxonomies page before adding categories"
        />
      ) : (
        activeTaxonomyId !== null && (
          <CategoryTreeLevel taxonomyId={activeTaxonomyId} parentCategoryId={undefined} depth={0} actions={actions} />
        )
      )}

      <Modal isOpen={createParentId !== undefined} onClose={() => setCreateParentId(undefined)} title="Create Category" size="md">
        {activeTaxonomyId !== null && (
          <CategoryForm
            initial={emptyForm}
            isEdit={false}
            isLoading={createMutation.isPending}
            onCancel={() => setCreateParentId(undefined)}
            onSubmit={(values) =>
              createMutation.mutate({
                taxonomyId: activeTaxonomyId,
                parentCategoryId: createParentId ?? null,
                slug: values.slug.trim().toLowerCase(),
                name: values.name.trim(),
                description: values.description.trim(),
                imageUrl: values.imageUrl.trim() || null,
                seoTitle: values.seoTitle.trim(),
                seoDescription: values.seoDescription.trim(),
                attributeSetId: values.attributeSetId,
              })
            }
          />
        )}
      </Modal>

      <Modal isOpen={editCategory !== null} onClose={() => setEditCategory(null)} title="Edit Category" size="md">
        {editCategory && (
          <CategoryForm
            key={editCategory.id}
            initial={{
              slug: editCategory.slug,
              name: editCategory.name,
              description: editCategory.description,
              imageUrl: editCategory.imageUrl ?? '',
              seoTitle: editCategory.seoTitle,
              seoDescription: editCategory.seoDescription,
              attributeSetId: editCategory.attributeSetId,
            }}
            isEdit
            isLoading={updateMutation.isPending}
            onCancel={() => setEditCategory(null)}
            onSubmit={(values) =>
              updateMutation.mutate({
                id: editCategory.id,
                dto: {
                  parentCategoryId: editCategory.parentCategoryId,
                  slug: values.slug.trim().toLowerCase(),
                  name: values.name.trim(),
                  description: values.description.trim(),
                  imageUrl: values.imageUrl.trim() || null,
                  seoTitle: values.seoTitle.trim(),
                  seoDescription: values.seoDescription.trim(),
                  attributeSetId: values.attributeSetId,
                },
              })
            }
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteCategory !== null}
        onClose={() => setDeleteCategory(null)}
        onConfirm={() => deleteCategory !== null && deleteMutation.mutate(deleteCategory.id)}
        title="Delete Category"
        message="Are you sure you want to delete this category? This will fail if it still has subcategories."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
