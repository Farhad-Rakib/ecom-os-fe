import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ShieldOff, ShieldCheck } from 'lucide-react';
import { toast } from '../../../components/ui/Toast/toast.store';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { customerApi, customerName } from './CustomersPage';

const sectionClasses = 'rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-900';
const sectionTitleClasses = 'text-lg font-semibold text-gray-900 dark:text-white mb-4';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const customerId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customers', customerId],
    queryFn: () => customerApi.getById(customerId),
    enabled: Number.isFinite(customerId),
  });

  const statusMutation = useMutation({
    mutationFn: (isActive: boolean) => customerApi.setActive(customerId, isActive),
    onSuccess: (updated) => {
      toast.success(updated.isActive ? 'Customer reactivated' : 'Customer deactivated');
      setIsConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setIsConfirmOpen(false);
    },
  });

  if (isLoading) {
    return <div className="text-gray-600 dark:text-gray-400">Loading customer…</div>;
  }

  if (error || !customer) {
    return <div className="text-red-600 dark:text-red-400">{error?.message ?? 'Customer not found.'}</div>;
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate('/customers')}
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" /> Back to customers
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            {customerName(customer)}
            {!customer.isActive && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                Deactivated
              </span>
            )}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{customer.email}</p>
        </div>

        <button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white ${
            customer.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {customer.isActive ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          {customer.isActive ? 'Deactivate account' : 'Reactivate account'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <section className={sectionClasses}>
          <h2 className={sectionTitleClasses}>Profile</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Email</dt>
              <dd className="text-gray-900 dark:text-white">{customer.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Phone</dt>
              <dd className="text-gray-900 dark:text-white">{customer.phone || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Registered</dt>
              <dd className="text-gray-900 dark:text-white">{new Date(customer.createdAt).toLocaleDateString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Status</dt>
              <dd className="text-gray-900 dark:text-white">{customer.isActive ? 'Active' : 'Deactivated'}</dd>
            </div>
            {/* Absent entirely for an account whose status has never been changed -- which is what
                distinguishes "always been active" from "was deactivated and restored". */}
            {customer.statusChangedAt && (
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Status last changed</dt>
                <dd className="text-gray-900 dark:text-white text-right">
                  {new Date(customer.statusChangedAt).toLocaleString()}
                  {customer.statusChangedByUserId !== null && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">by user #{customer.statusChangedByUserId}</div>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </section>

        <section className={sectionClasses}>
          <h2 className={sectionTitleClasses}>Addresses</h2>
          {customer.addresses.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No saved addresses</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {customer.addresses.map((address) => (
                <li key={address.id} className="text-gray-900 dark:text-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{address.recipientName}</span>
                    {address.isDefault && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {address.line1}{address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} {address.postalCode}, {address.country}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={sectionClasses}>
        <h2 className={sectionTitleClasses}>Orders</h2>
        {customer.orders.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">This customer has not placed any orders</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400">
                <th className="pb-2 font-medium">Order</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Total</th>
                <th className="pb-2 font-medium">Placed</th>
              </tr>
            </thead>
            <tbody>
              {customer.orders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="py-2 text-gray-900 dark:text-white">#{order.id}</td>
                  <td className="py-2 text-gray-900 dark:text-white">{order.status}</td>
                  <td className="py-2 text-gray-900 dark:text-white">{order.currency} {order.total.toFixed(2)}</td>
                  <td className="py-2 text-gray-600 dark:text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => statusMutation.mutate(!customer.isActive)}
        title={customer.isActive ? 'Deactivate this account?' : 'Reactivate this account?'}
        // States the session consequence plainly, because it is immediate and not obvious: the
        // backend revokes refresh tokens AND rejects the access token already in their browser.
        message={
          customer.isActive
            ? `${customerName(customer)} will be signed out everywhere immediately and will not be able to log in. Their order history is kept.`
            : `${customerName(customer)} will be able to log in again.`
        }
        confirmText={customer.isActive ? 'Deactivate' : 'Reactivate'}
        variant={customer.isActive ? 'danger' : 'info'}
      />
    </div>
  );
};
