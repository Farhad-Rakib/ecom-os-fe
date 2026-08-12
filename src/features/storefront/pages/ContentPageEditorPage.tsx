import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, UploadCloud, ArchiveRestore } from 'lucide-react';
import { Loader } from '../../../components/ui/Loader/Loader';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import { toast } from '../../../components/ui/Toast/toast.store';
import { contentPageApi, ContentPageWriteDto } from './ContentPagesPage';

const inputClasses =
  'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50';
const labelClasses = 'block text-sm font-medium text-gray-700 dark:text-gray-300';
const sectionClasses = 'space-y-4 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900';
const sectionTitleClasses = 'text-base font-semibold text-gray-900 dark:text-white';

const emptyForm: ContentPageWriteDto = { title: '', slug: '', bodyHtml: '', seoTitle: '', seoDescription: '' };

const slugify = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const ContentPageEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pageId = id ? Number(id) : undefined;
  const isNew = pageId === undefined;

  const [form, setForm] = useState<ContentPageWriteDto>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);

  const { data: page, isLoading, error } = useQuery({
    queryKey: ['storefront', 'content-pages', pageId],
    queryFn: () => contentPageApi.getById(pageId!),
    enabled: !isNew,
  });

  useEffect(() => {
    if (page) {
      setForm({
        title: page.title,
        slug: page.slug,
        bodyHtml: page.bodyHtml,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
      });
      setSlugTouched(true);
    }
  }, [page]);

  const invalidateList = () => queryClient.invalidateQueries({ queryKey: ['storefront', 'content-pages'] });

  const createMutation = useMutation({
    mutationFn: (dto: ContentPageWriteDto) => contentPageApi.create(dto),
    onSuccess: (created) => {
      invalidateList();
      toast.success('Page created');
      navigate(`/storefront/pages/${created.id}`, { replace: true });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to create page'),
  });

  const updateMutation = useMutation({
    mutationFn: (dto: ContentPageWriteDto) => contentPageApi.update(pageId!, dto),
    onSuccess: () => {
      invalidateList();
      queryClient.invalidateQueries({ queryKey: ['storefront', 'content-pages', pageId] });
      toast.success('Page saved');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to save page'),
  });

  const publishMutation = useMutation({
    mutationFn: () => contentPageApi.publish(pageId!),
    onSuccess: () => {
      invalidateList();
      queryClient.invalidateQueries({ queryKey: ['storefront', 'content-pages', pageId] });
      toast.success('Page published');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to publish page'),
  });

  const unpublishMutation = useMutation({
    mutationFn: () => contentPageApi.unpublish(pageId!),
    onSuccess: () => {
      invalidateList();
      queryClient.invalidateQueries({ queryKey: ['storefront', 'content-pages', pageId] });
      toast.success('Page unpublished');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to unpublish page'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.slug.trim()) return;
    const dto: ContentPageWriteDto = {
      title: form.title.trim(),
      slug: form.slug.trim().toLowerCase(),
      bodyHtml: form.bodyHtml,
      seoTitle: form.seoTitle.trim(),
      seoDescription: form.seoDescription.trim(),
    };
    if (isNew) createMutation.mutate(dto);
    else updateMutation.mutate(dto);
  };

  if (!isNew && isLoading) return <Loader />;
  if (!isNew && error) return <ErrorState message={(error as Error).message} />;

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to="/storefront/pages" className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isNew ? 'New Page' : 'Edit Page'}</h1>
          {page && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Status: <span className="font-medium">{page.status}</span>
            </p>
          )}
        </div>

        {!isNew && page && (
          <div className="ml-auto flex gap-2">
            {page.status === 'Draft' ? (
              <button
                type="button"
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <UploadCloud className="w-4 h-4" />
                Publish
              </button>
            ) : (
              <button
                type="button"
                onClick={() => unpublishMutation.mutate()}
                disabled={unpublishMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-50"
              >
                <ArchiveRestore className="w-4 h-4" />
                Unpublish
              </button>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={sectionClasses}>
          <h2 className={sectionTitleClasses}>Content</h2>
          <div className="space-y-1">
            <label className={labelClasses}>
              Title<span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((prev) => ({ ...prev, title, slug: slugTouched ? prev.slug : slugify(title) }));
              }}
              className={inputClasses}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClasses}>
              Slug<span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm({ ...form, slug: e.target.value });
              }}
              placeholder="e.g. about-us"
              className={inputClasses}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">Must be unique among this tenant's pages.</p>
          </div>
          <div className="space-y-1">
            <label className={labelClasses}>Body</label>
            <textarea
              value={form.bodyHtml}
              onChange={(e) => setForm({ ...form, bodyHtml: e.target.value })}
              rows={12}
              className={`${inputClasses} font-mono text-sm`}
              placeholder="Page content (HTML)"
            />
          </div>
        </div>

        <div className={sectionClasses}>
          <h2 className={sectionTitleClasses}>SEO</h2>
          <div className="space-y-1">
            <label className={labelClasses}>SEO Title</label>
            <input
              type="text"
              value={form.seoTitle}
              onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
              className={inputClasses}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClasses}>SEO Description</label>
            <textarea
              value={form.seoDescription}
              onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
              rows={2}
              className={`${inputClasses} resize-none`}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isNew ? 'Create Page' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
