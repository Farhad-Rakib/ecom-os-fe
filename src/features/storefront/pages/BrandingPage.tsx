import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader } from '../../../components/ui/Loader/Loader';
import { ImageUpload } from '../../../components/ui/ImageUpload/ImageUpload';
import { toast } from '../../../components/ui/Toast/toast.store';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';

export interface StorefrontBrandingDto {
  faviconUrl: string | null;
  logoUrl: string | null;
  siteTitle: string;
  tagline: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  linkedinUrl: string | null;
}

interface BrandingWriteDto {
  siteTitle: string;
  tagline: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  linkedinUrl: string | null;
}

class StorefrontBrandingApi extends BaseRepository {
  constructor() { super('/storefront/branding'); }
  async fetch(): Promise<StorefrontBrandingDto> {
    const res = await this.get<ApiResponse<StorefrontBrandingDto>>('');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async update(dto: BrandingWriteDto): Promise<StorefrontBrandingDto> {
    const res = await this.put<ApiResponse<StorefrontBrandingDto>>('', dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

// A separate instance because uploads must let the browser set the multipart boundary itself --
// BaseRepository fixes a Content-Type header on the underlying axios instance at construction
// time, so a JSON-default instance can never be reused for this call (same pattern as Catalog's
// ProductMediaUploadApi in ProductsPage.tsx).
class StorefrontBrandingUploadApi extends BaseRepository {
  constructor() { super('/storefront/branding', 'multipart/form-data'); }
  async uploadFavicon(file: File): Promise<StorefrontBrandingDto> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await this.post<ApiResponse<StorefrontBrandingDto>>('/favicon', formData);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async uploadLogo(file: File): Promise<StorefrontBrandingDto> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await this.post<ApiResponse<StorefrontBrandingDto>>('/logo', formData);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

export const storefrontBrandingApi = new StorefrontBrandingApi();
export const storefrontBrandingUploadApi = new StorefrontBrandingUploadApi();

const inputClasses =
  'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50';
const labelClasses = 'block text-sm font-medium text-gray-700 dark:text-gray-300';

interface FormState {
  siteTitle: string;
  tagline: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
  linkedinUrl: string;
}

const emptyForm: FormState = {
  siteTitle: '', tagline: '', facebookUrl: '', instagramUrl: '', twitterUrl: '', youtubeUrl: '', tiktokUrl: '', linkedinUrl: '',
};

const toFormState = (dto: StorefrontBrandingDto): FormState => ({
  siteTitle: dto.siteTitle,
  tagline: dto.tagline ?? '',
  facebookUrl: dto.facebookUrl ?? '',
  instagramUrl: dto.instagramUrl ?? '',
  twitterUrl: dto.twitterUrl ?? '',
  youtubeUrl: dto.youtubeUrl ?? '',
  tiktokUrl: dto.tiktokUrl ?? '',
  linkedinUrl: dto.linkedinUrl ?? '',
});

export const BrandingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data, isLoading, error } = useQuery({
    queryKey: ['storefront', 'branding'],
    queryFn: () => storefrontBrandingApi.fetch(),
  });

  useEffect(() => {
    if (data) setForm(toFormState(data));
  }, [data]);

  // The write endpoints all return the full, fresh row -- writing it straight into the query cache
  // (instead of just invalidating and waiting on a refetch) avoids a flash where the just-uploaded
  // image would otherwise briefly revert to the old one until the background refetch lands.
  const setCache = (dto: StorefrontBrandingDto) => queryClient.setQueryData(['storefront', 'branding'], dto);

  const saveMutation = useMutation({
    mutationFn: (dto: BrandingWriteDto) => storefrontBrandingApi.update(dto),
    onSuccess: (dto) => {
      setCache(dto);
      toast.success('Branding saved');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to save branding'),
  });

  const faviconMutation = useMutation({
    mutationFn: (file: File) => storefrontBrandingUploadApi.uploadFavicon(file),
    onSuccess: (dto) => {
      setCache(dto);
      toast.success('Favicon uploaded');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to upload favicon'),
  });

  const logoMutation = useMutation({
    mutationFn: (file: File) => storefrontBrandingUploadApi.uploadLogo(file),
    onSuccess: (dto) => {
      setCache(dto);
      toast.success('Logo uploaded');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to upload logo'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.siteTitle.trim()) return;
    saveMutation.mutate({
      siteTitle: form.siteTitle.trim(),
      tagline: form.tagline.trim() || null,
      facebookUrl: form.facebookUrl.trim() || null,
      instagramUrl: form.instagramUrl.trim() || null,
      twitterUrl: form.twitterUrl.trim() || null,
      youtubeUrl: form.youtubeUrl.trim() || null,
      tiktokUrl: form.tiktokUrl.trim() || null,
      linkedinUrl: form.linkedinUrl.trim() || null,
    });
  };

  if (isLoading) return <Loader />;
  if (error) return <p className="text-sm text-red-600 dark:text-red-400">{(error as Error).message}</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Branding &amp; Site Identity</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Set the favicon, logo, name, and social links your storefront will use</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <ImageUpload
          label="Favicon"
          hint="Uploading a new favicon replaces the current one."
          value={data?.faviconUrl ?? undefined}
          onUpload={(file) => faviconMutation.mutateAsync(file).then((dto) => dto.faviconUrl ?? '')}
          onChange={() => {}}
          previewSize="sm"
        />
        <ImageUpload
          label="Logo"
          hint="Uploading a new logo replaces the current one."
          value={data?.logoUrl ?? undefined}
          onUpload={(file) => logoMutation.mutateAsync(file).then((dto) => dto.logoUrl ?? '')}
          onChange={() => {}}
          previewSize="md"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="space-y-1">
          <label className={labelClasses}>
            Site Title<span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            required
            value={form.siteTitle}
            onChange={(e) => setForm({ ...form, siteTitle: e.target.value })}
            className={inputClasses}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClasses}>Tagline</label>
          <input
            type="text"
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            className={inputClasses}
          />
        </div>

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Social Links</h2>
          <div className="grid grid-cols-2 gap-4">
            {([
              ['facebookUrl', 'Facebook'],
              ['instagramUrl', 'Instagram'],
              ['twitterUrl', 'X / Twitter'],
              ['youtubeUrl', 'YouTube'],
              ['tiktokUrl', 'TikTok'],
              ['linkedinUrl', 'LinkedIn'],
            ] as [keyof FormState, string][]).map(([field, label]) => (
              <div key={field} className="space-y-1">
                <label className={labelClasses}>{label}</label>
                <input
                  type="text"
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  placeholder="https://"
                  className={inputClasses}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};
