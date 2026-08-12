import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUp, ArrowDown, ArrowRight, ArrowLeft as ArrowLeftIcon, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { Loader } from '../../../components/ui/Loader/Loader';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { Modal } from '../../../components/ui/Modal/Modal';
import { toast } from '../../../components/ui/Toast/toast.store';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';
import { LinkTargetPicker, LinkTargetKind, LinkTargetValue } from '../components/LinkTargetPicker';

export type MenuLocationSlug = 'header' | 'footer';

export interface MenuItemDto {
  id: number;
  location: number;
  parentItemId: number | null;
  label: string;
  linkTargetType: number;
  linkTargetId: number | null;
  linkCustomUrl: string | null;
  displayOrder: number;
  targetMissing: boolean;
}

interface MenuItemPosition {
  id: number;
  parentItemId: number | null;
  displayOrder: number;
}

interface MenuItemWriteDto {
  parentItemId: number | null;
  label: string;
  linkTargetType: number;
  linkTargetId: number | null;
  linkCustomUrl: string | null;
}

class StorefrontMenuApi extends BaseRepository {
  constructor() { super('/storefront/menus'); }
  async getMenu(location: MenuLocationSlug): Promise<MenuItemDto[]> {
    const res = await this.get<ApiResponse<MenuItemDto[]>>(`/${location}`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async addItem(location: MenuLocationSlug, dto: MenuItemWriteDto): Promise<MenuItemDto> {
    const res = await this.post<ApiResponse<MenuItemDto>>(`/${location}/items`, dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async updateItem(location: MenuLocationSlug, id: number, dto: MenuItemWriteDto): Promise<MenuItemDto> {
    const res = await this.put<ApiResponse<MenuItemDto>>(`/${location}/items/${id}`, dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async deleteItem(location: MenuLocationSlug, id: number): Promise<void> {
    await this.delete<any>(`/${location}/items/${id}`);
  }
  async reorder(location: MenuLocationSlug, items: MenuItemPosition[]): Promise<void> {
    await this.post<any>(`/${location}/items/reorder`, { items });
  }
}

export const storefrontMenuApi = new StorefrontMenuApi();

const ALL_LINK_KINDS: LinkTargetKind[] = ['Category', 'Product', 'Brand', 'Collection', 'ContentPage', 'CustomUrl', 'Taxonomy'];

const inputClasses =
  'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50';
const labelClasses = 'block text-sm font-medium text-gray-700 dark:text-gray-300';

interface ItemFormState {
  label: string;
  link: LinkTargetValue;
}

const emptyItemForm: ItemFormState = { label: '', link: { linkTargetType: 0, linkTargetId: null, linkCustomUrl: null } };

const MenuItemForm: React.FC<{
  initial: ItemFormState;
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: (form: ItemFormState) => void;
}> = ({ initial, isLoading, onCancel, onSubmit }) => {
  const [form, setForm] = useState(initial);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim() || form.link.linkTargetType === null) return;
    if (form.link.linkTargetType === 5 && !form.link.linkCustomUrl?.trim()) return; // CustomUrl = 5
    if (form.link.linkTargetType !== 5 && form.link.linkTargetId === null) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className={labelClasses}>
          Label<span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="text"
          required
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          className={inputClasses}
        />
      </div>
      <LinkTargetPicker allowedKinds={ALL_LINK_KINDS} value={form.link} onChange={(link) => setForm({ ...form, link })} />
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
          Save
        </button>
      </div>
    </form>
  );
};

const recomputePositions = (items: MenuItemDto[]): MenuItemPosition[] => {
  const bySiblingGroup = new Map<string, MenuItemDto[]>();
  for (const item of items) {
    const key = item.parentItemId === null ? 'root' : String(item.parentItemId);
    const group = bySiblingGroup.get(key) ?? [];
    group.push(item);
    bySiblingGroup.set(key, group);
  }
  const positions: MenuItemPosition[] = [];
  for (const group of bySiblingGroup.values()) {
    group
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .forEach((item, index) => positions.push({ id: item.id, parentItemId: item.parentItemId, displayOrder: index }));
  }
  return positions;
};

const MenuLocationPanel: React.FC<{ location: MenuLocationSlug }> = ({ location }) => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState<{ parentItemId: number | null } | null>(null);
  const [editItem, setEditItem] = useState<MenuItemDto | null>(null);
  const [deleteItem, setDeleteItem] = useState<MenuItemDto | null>(null);

  const queryKey = ['storefront', 'menus', location];
  const { data: items = [], isLoading, error } = useQuery({ queryKey, queryFn: () => storefrontMenuApi.getMenu(location) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const addMutation = useMutation({
    mutationFn: (dto: MenuItemWriteDto) => storefrontMenuApi.addItem(location, dto),
    onSuccess: () => {
      invalidate();
      toast.success('Menu item added');
      setShowAddModal(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to add menu item'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: MenuItemWriteDto }) => storefrontMenuApi.updateItem(location, id, dto),
    onSuccess: () => {
      invalidate();
      toast.success('Menu item updated');
      setEditItem(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to update menu item'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => storefrontMenuApi.deleteItem(location, id),
    onSuccess: () => {
      invalidate();
      toast.success('Menu item deleted');
      setDeleteItem(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to delete menu item'),
  });

  const reorderMutation = useMutation({
    mutationFn: (positions: MenuItemPosition[]) => storefrontMenuApi.reorder(location, positions),
    onSuccess: () => invalidate(),
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to reorder menu items'),
  });

  const { roots, childrenByParent } = useMemo(() => {
    const rootsList = items.filter((i) => i.parentItemId === null).sort((a, b) => a.displayOrder - b.displayOrder);
    const childMap = new Map<number, MenuItemDto[]>();
    for (const item of items) {
      if (item.parentItemId === null) continue;
      const list = childMap.get(item.parentItemId) ?? [];
      list.push(item);
      childMap.set(item.parentItemId, list);
    }
    for (const list of childMap.values()) list.sort((a, b) => a.displayOrder - b.displayOrder);
    return { roots: rootsList, childrenByParent: childMap };
  }, [items]);

  const childCountOf = (id: number) => childrenByParent.get(id)?.length ?? 0;

  const submitReorder = (mutated: MenuItemDto[]) => reorderMutation.mutate(recomputePositions(mutated));

  const moveSibling = (item: MenuItemDto, siblings: MenuItemDto[], direction: -1 | 1) => {
    const index = siblings.findIndex((s) => s.id === item.id);
    const target = index + direction;
    if (target < 0 || target >= siblings.length) return;
    const reorderedSiblings = [...siblings];
    [reorderedSiblings[index], reorderedSiblings[target]] = [reorderedSiblings[target], reorderedSiblings[index]];
    const others = items.filter((i) => !siblings.some((s) => s.id === i.id));
    submitReorder([...others, ...reorderedSiblings.map((s, i) => ({ ...s, displayOrder: i }))]);
  };

  const indent = (item: MenuItemDto) => {
    const index = roots.findIndex((r) => r.id === item.id);
    if (index <= 0) return;
    if (childCountOf(item.id) > 0) {
      toast.error('An item with its own children cannot be nested under another item.');
      return;
    }
    const newParent = roots[index - 1];
    const newParentChildren = childrenByParent.get(newParent.id) ?? [];
    const updated = items.map((i) => (i.id === item.id ? { ...i, parentItemId: newParent.id, displayOrder: newParentChildren.length } : i));
    submitReorder(updated);
  };

  const outdent = (item: MenuItemDto) => {
    if (item.parentItemId === null) return;
    const parentIndex = roots.findIndex((r) => r.id === item.parentItemId);
    const updated = items.map((i) => (i.id === item.id ? { ...i, parentItemId: null, displayOrder: parentIndex + 0.5 } : i));
    submitReorder(updated);
  };

  if (isLoading) return <Loader />;
  if (error) return <ErrorState message={(error as Error).message} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowAddModal({ parentItemId: null })}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {roots.length === 0 ? (
        <EmptyState title="No items yet" description="Add an item to start building this menu" />
      ) : (
        <ul className="space-y-1">
          {roots.map((item, index) => {
            const children = childrenByParent.get(item.id) ?? [];
            return (
              <li key={item.id} className="space-y-1">
                <MenuItemRow
                  item={item}
                  canMoveUp={index > 0}
                  canMoveDown={index < roots.length - 1}
                  canIndent={index > 0}
                  canOutdent={false}
                  onMoveUp={() => moveSibling(item, roots, -1)}
                  onMoveDown={() => moveSibling(item, roots, 1)}
                  onIndent={() => indent(item)}
                  onOutdent={() => outdent(item)}
                  onAddChild={() => setShowAddModal({ parentItemId: item.id })}
                  onEdit={() => setEditItem(item)}
                  onDelete={() => setDeleteItem(item)}
                />
                {children.length > 0 && (
                  <ul className="space-y-1 ml-8 border-l border-gray-200 dark:border-gray-700 pl-4">
                    {children.map((child, childIndex) => (
                      <li key={child.id}>
                        <MenuItemRow
                          item={child}
                          canMoveUp={childIndex > 0}
                          canMoveDown={childIndex < children.length - 1}
                          canIndent={false}
                          canOutdent
                          onMoveUp={() => moveSibling(child, children, -1)}
                          onMoveDown={() => moveSibling(child, children, 1)}
                          onIndent={() => {}}
                          onOutdent={() => outdent(child)}
                          onEdit={() => setEditItem(child)}
                          onDelete={() => setDeleteItem(child)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Modal isOpen={showAddModal !== null} onClose={() => setShowAddModal(null)} title="Add Menu Item" size="md">
        {showAddModal && (
          <MenuItemForm
            initial={emptyItemForm}
            isLoading={addMutation.isPending}
            onCancel={() => setShowAddModal(null)}
            onSubmit={(form) =>
              addMutation.mutate({
                parentItemId: showAddModal.parentItemId,
                label: form.label.trim(),
                linkTargetType: form.link.linkTargetType!,
                linkTargetId: form.link.linkTargetId,
                linkCustomUrl: form.link.linkCustomUrl,
              })
            }
          />
        )}
      </Modal>

      <Modal isOpen={editItem !== null} onClose={() => setEditItem(null)} title="Edit Menu Item" size="md">
        {editItem && (
          <MenuItemForm
            key={editItem.id}
            initial={{
              label: editItem.label,
              link: { linkTargetType: editItem.linkTargetType, linkTargetId: editItem.linkTargetId, linkCustomUrl: editItem.linkCustomUrl },
            }}
            isLoading={updateMutation.isPending}
            onCancel={() => setEditItem(null)}
            onSubmit={(form) =>
              updateMutation.mutate({
                id: editItem.id,
                dto: {
                  parentItemId: editItem.parentItemId,
                  label: form.label.trim(),
                  linkTargetType: form.link.linkTargetType!,
                  linkTargetId: form.link.linkTargetId,
                  linkCustomUrl: form.link.linkCustomUrl,
                },
              })
            }
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteItem !== null}
        onClose={() => setDeleteItem(null)}
        onConfirm={() => deleteItem !== null && deleteMutation.mutate(deleteItem.id)}
        title="Delete Menu Item"
        message={
          deleteItem && childCountOf(deleteItem.id) > 0
            ? `This item has ${childCountOf(deleteItem.id)} child item(s) that will also be deleted. Are you sure?`
            : 'Are you sure you want to delete this menu item?'
        }
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

const MenuItemRow: React.FC<{
  item: MenuItemDto;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canIndent: boolean;
  canOutdent: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onIndent: () => void;
  onOutdent: () => void;
  onAddChild?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ item, canMoveUp, canMoveDown, canIndent, canOutdent, onMoveUp, onMoveDown, onIndent, onOutdent, onAddChild, onEdit, onDelete }) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
    <span className="font-medium text-gray-900 dark:text-white">{item.label}</span>
    {item.targetMissing && (
      <span title="This item's link target no longer exists" className="text-amber-500">
        <AlertTriangle className="w-3.5 h-3.5" />
      </span>
    )}
    <div className="ml-auto flex items-center gap-1">
      <button type="button" onClick={onMoveUp} disabled={!canMoveUp} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed" title="Move up">
        <ArrowUp className="w-3.5 h-3.5" />
      </button>
      <button type="button" onClick={onMoveDown} disabled={!canMoveDown} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed" title="Move down">
        <ArrowDown className="w-3.5 h-3.5" />
      </button>
      {canIndent && (
        <button type="button" onClick={onIndent} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" title="Indent (nest under previous item)">
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
      {canOutdent && (
        <button type="button" onClick={onOutdent} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" title="Outdent (move to top level)">
          <ArrowLeftIcon className="w-3.5 h-3.5" />
        </button>
      )}
      {onAddChild && (
        <button type="button" onClick={onAddChild} className="p-1.5 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Add child item">
          <Plus className="w-3.5 h-3.5" />
        </button>
      )}
      <button type="button" onClick={onEdit} className="p-1.5 rounded text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700" title="Edit">
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button type="button" onClick={onDelete} className="p-1.5 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
);

export const StorefrontMenusPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MenuLocationSlug>('header');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Navigation Menus</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Build the header and footer navigation for your storefront</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(['header', 'footer'] as MenuLocationSlug[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <MenuLocationPanel key={activeTab} location={activeTab} />
    </div>
  );
};
