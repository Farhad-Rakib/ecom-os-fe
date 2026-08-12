import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUp, ArrowDown, Plus, Pencil, Trash2, AlertTriangle, ImageOff } from 'lucide-react';
import { Loader } from '../../../components/ui/Loader/Loader';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { Modal } from '../../../components/ui/Modal/Modal';
import { ImageUpload } from '../../../components/ui/ImageUpload/ImageUpload';
import { toast } from '../../../components/ui/Toast/toast.store';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';
import { LinkTargetPicker, LinkTargetValue } from '../components/LinkTargetPicker';

export interface HeroBannerDto {
  id: number;
  imageUrl: string;
  headline: string;
  subtext: string | null;
  linkTargetType: number | null;
  linkTargetId: number | null;
  linkCustomUrl: string | null;
  displayOrder: number;
  targetMissing: boolean;
}

export interface HeroBannerWriteDto {
  headline: string;
  subtext: string | null;
  linkTargetType: number | null;
  linkTargetId: number | null;
  linkCustomUrl: string | null;
}

export interface HeroBannerPosition {
  id: number;
  displayOrder: number;
}

class HeroBannerApi extends BaseRepository {
  constructor() { super('/storefront/hero-banners'); }
  async list(): Promise<HeroBannerDto[]> {
    const res = await this.get<ApiResponse<HeroBannerDto[]>>('');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async create(dto: HeroBannerWriteDto): Promise<HeroBannerDto> {
    const res = await this.post<ApiResponse<HeroBannerDto>>('', dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async update(id: number, dto: HeroBannerWriteDto): Promise<HeroBannerDto> {
    const res = await this.put<ApiResponse<HeroBannerDto>>(`/${id}`, dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async remove(id: number): Promise<void> {
    await this.delete<any>(`/${id}`);
  }
  async reorder(positions: HeroBannerPosition[]): Promise<void> {
    await this.post<any>('/reorder', { items: positions });
  }
}

class HeroBannerUploadApi extends BaseRepository {
  constructor() { super('/storefront/hero-banners', 'multipart/form-data'); }
  async uploadImage(id: number, file: File): Promise<HeroBannerDto> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await this.post<ApiResponse<HeroBannerDto>>(`/${id}/image`, formData);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

export const heroBannerApi = new HeroBannerApi();
export const heroBannerUploadApi = new HeroBannerUploadApi();

const inputClasses =
  'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50';
const labelClasses = 'block text-sm font-medium text-gray-700 dark:text-gray-300';

// Mirrors the subset of LinkTargetPicker's own LINK_TARGET_TYPE_VALUES that hero banners allow
// (Category/Product/Collection/CustomUrl) -- kept local since the picker doesn't export its map.
const LINK_KIND_LABELS: Record<number, string> = {
  0: 'Category',
  1: 'Product',
  3: 'Collection',
};
const CUSTOM_URL_TYPE = 5;

const ctaSummary = (banner: Pick<HeroBannerDto, 'linkTargetType' | 'linkTargetId' | 'linkCustomUrl'>): string => {
  if (banner.linkTargetType === null || banner.linkTargetType === undefined) return 'No link';
  if (banner.linkTargetType === CUSTOM_URL_TYPE) return `Custom URL: ${banner.linkCustomUrl || '(not set)'}`;
  const kindLabel = LINK_KIND_LABELS[banner.linkTargetType] ?? 'Target';
  return `Links to: ${kindLabel} #${banner.linkTargetId}`;
};

interface FormState {
  headline: string;
  subtext: string;
  link: LinkTargetValue;
}

const emptyForm: FormState = { headline: '', subtext: '', link: { linkTargetType: null, linkTargetId: null, linkCustomUrl: null } };

const toFormState = (dto: HeroBannerDto): FormState => ({
  headline: dto.headline,
  subtext: dto.subtext ?? '',
  link: { linkTargetType: dto.linkTargetType, linkTargetId: dto.linkTargetId, linkCustomUrl: dto.linkCustomUrl },
});

const HeroBannerForm: React.FC<{
  initial: FormState;
  editItem: HeroBannerDto | null;
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: (form: FormState) => void;
}> = ({ initial, editItem, isLoading, onCancel, onSubmit }) => {
  const [form, setForm] = useState(initial);
  const queryClient = useQueryClient();

  const imageMutation = useMutation({
    mutationFn: (file: File) => heroBannerUploadApi.uploadImage(editItem!.id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storefront', 'hero-banners'] });
      toast.success('Banner image uploaded');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to upload banner image'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.headline.trim()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {editItem && (
        <ImageUpload
          label="Banner Image"
          hint="Uploading a new image replaces the current one."
          value={editItem.imageUrl || undefined}
          onUpload={(file) => imageMutation.mutateAsync(file).then((dto) => dto.imageUrl)}
          onChange={() => {}}
          previewSize="lg"
        />
      )}
      <div className="space-y-1">
        <label className={labelClasses}>
          Headline<span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="text"
          required
          value={form.headline}
          onChange={(e) => setForm({ ...form, headline: e.target.value })}
          className={inputClasses}
        />
      </div>
      <div className="space-y-1">
        <label className={labelClasses}>Subtext</label>
        <textarea
          value={form.subtext}
          onChange={(e) => setForm({ ...form, subtext: e.target.value })}
          rows={2}
          className={`${inputClasses} resize-none`}
        />
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Call to Action</h2>
        <LinkTargetPicker
          allowedKinds={['Category', 'Product', 'Collection', 'CustomUrl']}
          allowNone
          value={form.link}
          onChange={(link) => setForm({ ...form, link })}
        />
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
          Save
        </button>
      </div>
    </form>
  );
};

const HeroBannerRow: React.FC<{
  item: HeroBannerDto;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ item, canMoveUp, canMoveDown, onMoveUp, onMoveDown, onEdit, onDelete }) => (
  <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
    {item.imageUrl ? (
      <img src={item.imageUrl} alt="" className="w-16 h-10 rounded object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0" />
    ) : (
      <div className="w-16 h-10 rounded border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
        <ImageOff className="w-4 h-4 text-gray-400" />
      </div>
    )}
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-900 dark:text-white truncate">{item.headline}</span>
        {item.targetMissing && (
          <span title="This banner's link target no longer exists" className="text-amber-500 flex-shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
      {item.subtext && <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{item.subtext}</p>}
      <p className="text-xs text-gray-400 dark:text-gray-500">{ctaSummary(item)}</p>
    </div>
    <div className="ml-auto flex items-center gap-1 flex-shrink-0">
      <button type="button" onClick={onMoveUp} disabled={!canMoveUp} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed" title="Move up">
        <ArrowUp className="w-3.5 h-3.5" />
      </button>
      <button type="button" onClick={onMoveDown} disabled={!canMoveDown} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed" title="Move down">
        <ArrowDown className="w-3.5 h-3.5" />
      </button>
      <button type="button" onClick={onEdit} className="p-1.5 rounded text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700" title="Edit">
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button type="button" onClick={onDelete} className="p-1.5 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
);

export const HeroBannerPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<HeroBannerDto | null>(null);
  const [deleteItem, setDeleteItem] = useState<HeroBannerDto | null>(null);

  const queryKey = ['storefront', 'hero-banners'];
  const { data: items = [], isLoading, error } = useQuery({ queryKey, queryFn: () => heroBannerApi.list() });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const createMutation = useMutation({
    mutationFn: (dto: HeroBannerWriteDto) => heroBannerApi.create(dto),
    onSuccess: () => {
      invalidate();
      toast.success('Hero banner added');
      setShowAddModal(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to add hero banner'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: HeroBannerWriteDto }) => heroBannerApi.update(id, dto),
    onSuccess: () => {
      invalidate();
      toast.success('Hero banner updated');
      setEditItem(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to update hero banner'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => heroBannerApi.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success('Hero banner deleted');
      setDeleteItem(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to delete hero banner'),
  });

  const reorderMutation = useMutation({
    mutationFn: (positions: HeroBannerPosition[]) => heroBannerApi.reorder(positions),
    onSuccess: () => invalidate(),
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to reorder hero banners'),
  });

  const sorted = [...items].sort((a, b) => a.displayOrder - b.displayOrder);

  const moveSibling = (item: HeroBannerDto, direction: -1 | 1) => {
    const index = sorted.findIndex((s) => s.id === item.id);
    const target = index + direction;
    if (target < 0 || target >= sorted.length) return;
    const reordered = [...sorted];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    reorderMutation.mutate(reordered.map((item, i) => ({ id: item.id, displayOrder: i })));
  };

  if (isLoading) return <Loader />;
  if (error) return <ErrorState message={(error as Error).message} />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Homepage Hero Banners</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">The rotating promotional banners your storefront homepage leads with</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Banner
        </button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState title="No banners yet" description="Add a banner to start building your homepage hero carousel" />
      ) : (
        <ul className="space-y-1">
          {sorted.map((item, index) => (
            <li key={item.id}>
              <HeroBannerRow
                item={item}
                canMoveUp={index > 0}
                canMoveDown={index < sorted.length - 1}
                onMoveUp={() => moveSibling(item, -1)}
                onMoveDown={() => moveSibling(item, 1)}
                onEdit={() => setEditItem(item)}
                onDelete={() => setDeleteItem(item)}
              />
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Banner" size="md">
        {showAddModal && (
          <HeroBannerForm
            initial={emptyForm}
            editItem={null}
            isLoading={createMutation.isPending}
            onCancel={() => setShowAddModal(false)}
            onSubmit={(form) =>
              createMutation.mutate({
                headline: form.headline.trim(),
                subtext: form.subtext.trim() || null,
                linkTargetType: form.link.linkTargetType,
                linkTargetId: form.link.linkTargetId,
                linkCustomUrl: form.link.linkCustomUrl,
              })
            }
          />
        )}
      </Modal>

      <Modal isOpen={editItem !== null} onClose={() => setEditItem(null)} title="Edit Banner" size="md">
        {editItem && (
          <HeroBannerForm
            key={editItem.id}
            initial={toFormState(editItem)}
            editItem={editItem}
            isLoading={updateMutation.isPending}
            onCancel={() => setEditItem(null)}
            onSubmit={(form) =>
              updateMutation.mutate({
                id: editItem.id,
                dto: {
                  headline: form.headline.trim(),
                  subtext: form.subtext.trim() || null,
                  linkTargetType: form.link.linkTargetType,
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
        title="Delete Banner"
        message="Are you sure you want to delete this banner?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
