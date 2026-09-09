import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DataTable, Column } from '../../../components/table/DataTable';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';

export interface CustomerSummaryDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerAddressSummaryDto {
  id: number;
  recipientName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface CustomerOrderSummaryDto {
  id: number;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
}

export interface CustomerDetailDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  statusChangedAt: string | null;
  statusChangedByUserId: number | null;
  createdAt: string;
  addresses: CustomerAddressSummaryDto[];
  orders: CustomerOrderSummaryDto[];
}

interface CustomerPageDto {
  items: CustomerSummaryDto[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export const customerName = (customer: Pick<CustomerSummaryDto, 'firstName' | 'lastName'>): string =>
  `${customer.firstName} ${customer.lastName}`.trim();

class CustomerApi extends BaseRepository {
  constructor() { super('/admin/customers'); }

  async getPaged(params: { search?: string; includeInactive: boolean; page: number; pageSize: number }): Promise<CustomerPageDto> {
    const res = await this.get<ApiResponse<CustomerPageDto>>('', { params });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async getById(id: number): Promise<CustomerDetailDto> {
    const res = await this.get<ApiResponse<CustomerDetailDto>>(`/${id}`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async setActive(id: number, isActive: boolean): Promise<CustomerDetailDto> {
    const res = await this.patch<ApiResponse<CustomerDetailDto>>(`/${id}/active`, { isActive });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

export const customerApi = new CustomerApi();

export const CustomersPage: React.FC = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['customers', 'list', { search, includeInactive, page, pageSize }],
    queryFn: () => customerApi.getPaged({ search: search || undefined, includeInactive, page, pageSize }),
  });

  const totalPages = Math.max(1, Math.ceil((data?.totalCount ?? 0) / (data?.pageSize ?? pageSize)));

  const columns: Column<CustomerSummaryDto>[] = [
    {
      key: 'name',
      label: 'Customer',
      render: (_, customer) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{customerName(customer)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{customer.email}</div>
        </div>
      ),
    },
    { key: 'phone', label: 'Phone', width: '160px', render: (_, c) => c.phone || '—' },
    {
      key: 'isActive',
      label: 'Status',
      width: '120px',
      render: (_, customer) => (
        <span
          className={`px-2.5 py-1 text-xs font-medium rounded-full ${
            customer.isActive
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {customer.isActive ? 'Active' : 'Deactivated'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Registered',
      width: '130px',
      render: (_, customer) => new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Registered customer accounts</p>
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={includeInactive}
          onChange={(e) => {
            setIncludeInactive(e.target.checked);
            setPage(1);
          }}
          className="rounded border-gray-300 dark:border-gray-600"
        />
        Show deactivated accounts
      </label>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        error={error?.message}
        // One box, not four: the backend matches a single term across email, first name, last name
        // and phone, because an admin on a support call has one piece of information and does not
        // know which field it belongs to.
        searchable
        searchPlaceholder="Search by name, email or phone"
        onSearch={(term) => {
          setSearch(term);
          setPage(1);
        }}
        sortable={false}
        onRowClick={(customer) => navigate(`/customers/${customer.id}`)}
        pagination={{
          currentPage: data?.page ?? page,
          totalPages,
          pageSize: data?.pageSize ?? pageSize,
          total: data?.totalCount ?? 0,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
        emptyState={{
          title: 'No customers found',
          description: search ? 'No account matches that search' : 'Customer accounts will appear here once shoppers register',
        }}
        onRetry={() => refetch()}
      />
    </div>
  );
};
