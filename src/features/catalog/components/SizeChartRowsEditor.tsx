import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from '../../../components/ui/Toast/toast.store';
import { sizeChartApi, SizeChartRowDto } from '../pages/SizeChartsPage';

const inputClasses =
  'w-24 px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500';

const parseMeasurements = (json: string): Record<string, string> => {
  try {
    const parsed = JSON.parse(json);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
};

// Columns vary per chart (a shoe chart might track length/width, a shirt chart chest/sleeve), so
// this can't be a static DynamicForm -- it computes its column set from whatever measurement keys
// already exist across the chart's rows, plus any the user adds.
export const SizeChartRowsEditor: React.FC<{ sizeChartId: number; rows: SizeChartRowDto[] }> = ({ sizeChartId, rows }) => {
  const queryClient = useQueryClient();
  const [extraColumns, setExtraColumns] = useState<string[]>([]);
  const [newColumnName, setNewColumnName] = useState('');
  const [drafts, setDrafts] = useState<Record<number, { sizeLabel: string; measurements: Record<string, string> }>>({});
  const [newRowLabel, setNewRowLabel] = useState('');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['catalog', 'size-charts'] });

  const parsedRows = useMemo(() => rows.map((r) => ({ row: r, measurements: parseMeasurements(r.measurementsJson) })), [rows]);
  const columns = useMemo(() => {
    const keys = new Set<string>(extraColumns);
    parsedRows.forEach(({ measurements }) => Object.keys(measurements).forEach((k) => keys.add(k)));
    return Array.from(keys);
  }, [parsedRows, extraColumns]);

  const addRowMutation = useMutation({
    mutationFn: () => sizeChartApi.addRow(sizeChartId, newRowLabel.trim(), '{}'),
    onSuccess: () => {
      invalidate();
      setNewRowLabel('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to add row'),
  });

  const updateRowMutation = useMutation({
    mutationFn: ({ rowId, sizeLabel, measurements }: { rowId: number; sizeLabel: string; measurements: Record<string, string> }) =>
      sizeChartApi.updateRow(sizeChartId, rowId, sizeLabel, JSON.stringify(measurements)),
    onSuccess: (_, { rowId }) => {
      invalidate();
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[rowId];
        return next;
      });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to save row'),
  });

  const deleteRowMutation = useMutation({
    mutationFn: (rowId: number) => sizeChartApi.deleteRow(sizeChartId, rowId),
    onSuccess: invalidate,
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to delete row'),
  });

  const getDraft = (row: SizeChartRowDto, measurements: Record<string, string>) => drafts[row.id] ?? { sizeLabel: row.sizeLabel, measurements };
  const setDraft = (rowId: number, base: { sizeLabel: string; measurements: Record<string, string> }, patch: Partial<{ sizeLabel: string; measurements: Record<string, string> }>) =>
    setDrafts((prev) => ({ ...prev, [rowId]: { ...base, ...prev[rowId], ...patch } }));

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50">
              <th className="px-3 py-2 text-left font-medium text-gray-500">Size</th>
              {columns.map((col) => (
                <th key={col} className="px-3 py-2 text-left font-medium text-gray-500">{col}</th>
              ))}
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {parsedRows.map(({ row, measurements }) => {
              const draft = getDraft(row, measurements);
              return (
                <tr key={row.id}>
                  <td className="px-3 py-2">
                    <input className={inputClasses} value={draft.sizeLabel} onChange={(e) => setDraft(row.id, draft, { sizeLabel: e.target.value })} />
                  </td>
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-2">
                      <input
                        className={inputClasses}
                        value={draft.measurements[col] ?? ''}
                        onChange={(e) => setDraft(row.id, draft, { measurements: { ...draft.measurements, [col]: e.target.value } })}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => updateRowMutation.mutate({ rowId: row.id, sizeLabel: draft.sizeLabel, measurements: draft.measurements })}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => deleteRowMutation.mutate(row.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (newRowLabel.trim()) addRowMutation.mutate();
          }}
        >
          <input className={`${inputClasses} w-32`} placeholder="e.g. Medium" value={newRowLabel} onChange={(e) => setNewRowLabel(e.target.value)} />
          <button type="submit" className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add Size
          </button>
        </form>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (newColumnName.trim() && !columns.includes(newColumnName.trim())) {
              setExtraColumns((prev) => [...prev, newColumnName.trim()]);
              setNewColumnName('');
            }
          }}
        >
          <input className={`${inputClasses} w-32`} placeholder="e.g. Chest (cm)" value={newColumnName} onChange={(e) => setNewColumnName(e.target.value)} />
          <button type="submit" className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add Measurement
          </button>
        </form>
      </div>
    </div>
  );
};
