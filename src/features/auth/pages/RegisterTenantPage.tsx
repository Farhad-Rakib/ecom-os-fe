import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { Send, AlertCircle, Clock } from 'lucide-react';
import { toast } from '../../../components/ui/Toast/toast.store';
import { tenantRegistrationApi } from '../../../core/api/services/tenant-registration.api';

export const RegisterTenantPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [justSubmitted, setJustSubmitted] = useState(false);

  const { data: info, isLoading: loadingInfo, error: infoError } = useQuery({
    queryKey: ['tenant-registration-info', token],
    queryFn: () => tenantRegistrationApi.getInfo(token),
    enabled: !!token,
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: () => tenantRegistrationApi.submit({ token, fullName: form.fullName, email: form.email, password: form.password }),
    onSuccess: () => setJustSubmitted(true),
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to submit registration'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    submitMutation.mutate();
  };

  if (!token) {
    return (
      <div className="text-center py-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Missing registration link</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This page needs a registration link. Ask whoever invited you for the link they shared.
        </p>
      </div>
    );
  }

  if (loadingInfo) {
    return <div className="text-center py-8 text-gray-400">Checking your registration link...</div>;
  }

  if (infoError || !info) {
    return (
      <div className="text-center py-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Link invalid or expired</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {(infoError as any)?.response?.data?.message || (infoError as any)?.message || 'This registration link is no longer valid.'}
        </p>
        <Link to="/login" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Back to Sign In</Link>
      </div>
    );
  }

  if (justSubmitted || info.alreadySubmitted) {
    return (
      <div className="text-center py-4">
        <Clock className="w-10 h-10 text-blue-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Request submitted</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Your request to set up <strong>{info.tenantName}</strong> has been sent to an administrator for approval.
          You'll be able to sign in once it's approved — no action needed from you until then.
        </p>
        <Link to="/login" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Back to Sign In</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Set up {info.tenantName}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Submit your admin details. An administrator will review and approve before your organization goes live.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
            disabled={submitMutation.isPending}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            placeholder="Jane Doe"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            disabled={submitMutation.isPending}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={8}
            disabled={submitMutation.isPending}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
            disabled={submitMutation.isPending}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            placeholder="Re-enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={submitMutation.isPending}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitMutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit for approval
            </>
          )}
        </button>
      </form>
    </div>
  );
};
