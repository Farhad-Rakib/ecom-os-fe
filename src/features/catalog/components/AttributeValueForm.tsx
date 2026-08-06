import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { Loader } from '../../../components/ui/Loader/Loader';
import { toast } from '../../../components/ui/Toast/toast.store';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';
import { AttributeOptionDto } from '../pages/AttributesPage';

export interface ProductAttributeValueItemDto {
  attributeDefinitionId: number;
  code: string;
  name: string;
  dataType: string;
  unit: string | null;
  isRequired: boolean;
  options: AttributeOptionDto[];
  textValue: string | null;
  numberValue: number | null;
  boolValue: boolean | null;
  dateValue: string | null;
  selectedOptionIds: number[];
}

export interface ProductAttributeValueSetDto {
  attributeSetId: number | null;
  attributeSetName: string | null;
  values: ProductAttributeValueItemDto[];
}

interface ValueInput {
  attributeDefinitionId: number;
  variantId?: number | null;
  textValue?: string | null;
  numberValue?: number | null;
  boolValue?: boolean | null;
  dateValue?: string | null;
  selectedOptionIds?: number[] | null;
}

class ProductAttributeValueApi extends BaseRepository {
  constructor() { super('/products'); }
  async getForProduct(productId: number): Promise<ProductAttributeValueSetDto> {
    const res = await this.get<ApiResponse<ProductAttributeValueSetDto>>(`/${productId}/attribute-values`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async update(productId: number, values: ValueInput[]): Promise<ProductAttributeValueSetDto> {
    const res = await this.put<ApiResponse<ProductAttributeValueSetDto>>(`/${productId}/attribute-values`, { values });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

export const productAttributeValueApi = new ProductAttributeValueApi();

const inputClasses =
  'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500';

type DraftValues = Record<number, ValueInput>;

const toDraft = (values: ProductAttributeValueItemDto[]): DraftValues =>
  Object.fromEntries(
    values.map((v) => [
      v.attributeDefinitionId,
      {
        attributeDefinitionId: v.attributeDefinitionId,
        textValue: v.textValue,
        numberValue: v.numberValue,
        boolValue: v.boolValue,
        dateValue: v.dateValue,
        selectedOptionIds: v.selectedOptionIds,
      },
    ])
  );

export const AttributeValueForm: React.FC<{ productId: number }> = ({ productId }) => {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['catalog', 'products', productId, 'attribute-values'],
    queryFn: () => productAttributeValueApi.getForProduct(productId),
  });

  const [draft, setDraft] = useState<DraftValues>({});

  useEffect(() => {
    if (data) setDraft(toDraft(data.values));
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => productAttributeValueApi.update(productId, Object.values(draft)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'products', productId, 'attribute-values'] });
      queryClient.invalidateQueries({ queryKey: ['catalog', 'products', productId] });
      toast.success('Specifications saved');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to save specifications'),
  });

  if (isLoading) return <Loader />;
  if (error) return <p className="text-sm text-red-600 dark:text-red-400">{(error as Error).message}</p>;

  if (!data || data.attributeSetId === null) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">No attribute set is bound to this product's category yet -- specifications will appear here once one is assigned.</p>;
  }

  const setField = (attributeDefinitionId: number, patch: Partial<ValueInput>) => {
    setDraft((prev) => ({
      ...prev,
      [attributeDefinitionId]: { ...prev[attributeDefinitionId], ...patch, attributeDefinitionId },
    }));
  };

  const toggleMultiSelect = (attributeDefinitionId: number, optionId: number) => {
    setDraft((prev) => {
      const current = prev[attributeDefinitionId]?.selectedOptionIds ?? [];
      const next = current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId];
      return { ...prev, [attributeDefinitionId]: { ...prev[attributeDefinitionId], selectedOptionIds: next, attributeDefinitionId } };
    });
  };

  return (
    <div className="space-y-4">
      {data.values.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">"{data.attributeSetName}" has no attributes assigned yet.</p>
      ) : (
        data.values.map((item) => {
          const value = draft[item.attributeDefinitionId] ?? {};

          return (
            <div key={item.attributeDefinitionId} className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.name}
                {item.isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>

              {(item.dataType === 'Text' || item.dataType === 'RichText') && (
                <textarea
                  rows={item.dataType === 'RichText' ? 4 : 1}
                  className={`${inputClasses} ${item.dataType === 'RichText' ? 'resize-none' : ''}`}
                  value={value.textValue ?? ''}
                  onChange={(e) => setField(item.attributeDefinitionId, { textValue: e.target.value })}
                />
              )}

              {(item.dataType === 'Number' || item.dataType === 'Measurement') && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className={inputClasses}
                    value={value.numberValue ?? ''}
                    onChange={(e) => setField(item.attributeDefinitionId, { numberValue: e.target.value === '' ? null : Number(e.target.value) })}
                  />
                  {item.unit && <span className="text-sm text-gray-500 whitespace-nowrap">{item.unit}</span>}
                </div>
              )}

              {item.dataType === 'Boolean' && (
                <input
                  type="checkbox"
                  checked={!!value.boolValue}
                  onChange={(e) => setField(item.attributeDefinitionId, { boolValue: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
              )}

              {item.dataType === 'Date' && (
                <input
                  type="date"
                  className={inputClasses}
                  value={value.dateValue?.slice(0, 10) ?? ''}
                  onChange={(e) => setField(item.attributeDefinitionId, { dateValue: e.target.value || null })}
                />
              )}

              {item.dataType === 'Select' && (
                <select
                  className={inputClasses}
                  value={value.selectedOptionIds?.[0] ?? ''}
                  onChange={(e) => setField(item.attributeDefinitionId, { selectedOptionIds: e.target.value ? [Number(e.target.value)] : [] })}
                >
                  <option value="">Select {item.name}...</option>
                  {item.options.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              )}

              {item.dataType === 'MultiSelect' && (
                <div className="flex flex-wrap gap-2">
                  {item.options.map((o) => {
                    const isSelected = (value.selectedOptionIds ?? []).includes(o.id);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => toggleMultiSelect(item.attributeDefinitionId, o.id)}
                        className={`px-3 py-1.5 text-xs rounded-full border ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {item.dataType === 'Color' && (
                <div className="flex flex-wrap gap-2">
                  {item.options.map((o) => {
                    const isSelected = (value.selectedOptionIds ?? [])[0] === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        title={o.label}
                        onClick={() => setField(item.attributeDefinitionId, { selectedOptionIds: [o.id] })}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-600' : 'border-gray-300 dark:border-gray-600'}`}
                        style={{ backgroundColor: o.swatchHex ?? undefined }}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}

      {data.values.length > 0 && (
        <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Save Specifications
          </button>
        </div>
      )}
    </div>
  );
};
