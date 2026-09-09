export interface DeliveryRatingDto {
  normalizedPhone: string;
  delivered: number;
  returned: number;
  totalDecided: number;
  // Null whenever hasSufficientHistory is false -- the backend deliberately does not emit a number
  // there, because there is no defensible one to show.
  ratio: number | null;
  hasSufficientHistory: boolean;
  minimumRequired: number;
}

interface RatingBadgeProps {
  rating: DeliveryRatingDto | null | undefined;
  size?: 'sm' | 'md';
}

// THE only component in this repo that renders a delivery rating. The PRD makes three things
// acceptance criteria rather than styling, and having one implementation is what makes them hold:
//
//   1. Never a bare percentage -- the delivered/returned/decided counts always travel with it.
//   2. "Not enough history yet" is visibly and textually distinct from a poor score.
//   3. "No delivery history at all" is distinct from both.
//
// The failure being guarded against is an admin moving fast reading a blank, a dash, or a zero as
// "fine" and shipping a cash-on-delivery parcel to a serial refuser. Three call sites each
// implementing this independently would be three chances to get one of them wrong.
export const RatingBadge: React.FC<RatingBadgeProps> = ({ rating, size = 'md' }) => {
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  // State 3: never dispatched, or no settled delivery yet. The backend returns no entry at all for
  // these rather than a zero, and this must not look like a bad score.
  if (!rating) {
    return (
      <span className={`inline-block rounded-full font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 ${padding}`}>
        No delivery history
      </span>
    );
  }

  // State 2: some history, but not enough to say anything. Explicitly worded, with the counts, so
  // it can never be mistaken for a score.
  if (!rating.hasSufficientHistory) {
    return (
      <span
        className={`inline-block rounded-full font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 ${padding}`}
        title={`A rating appears after ${rating.minimumRequired} completed deliveries`}
      >
        Not enough history ({rating.totalDecided} of {rating.minimumRequired})
      </span>
    );
  }

  // State 1: a real score. The percentage never appears without its counts beside it.
  const percent = Math.round((rating.ratio ?? 0) * 100);

  const tone =
    percent >= 90
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      : percent >= 70
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

  return (
    <span
      className={`inline-block rounded-full font-medium ${tone} ${padding}`}
      title={`${rating.delivered} delivered, ${rating.returned} returned, out of ${rating.totalDecided} completed deliveries`}
    >
      {percent}% · {rating.delivered}/{rating.totalDecided} delivered
    </span>
  );
};
