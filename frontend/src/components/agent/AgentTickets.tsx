// frontend/src/components/agent/AgentTickets.tsx
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllTickets, type TicketResponse, type TicketStatus, type TicketPriority } from '../../services/ticketService';
import { StatusBadge, PriorityBadge } from '../StatusBadge';
import TicketDetailPanel from '../TicketDetailPanel';
import { useAuthStore } from '../../store/authStore';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

type SortKey = 'title' | 'priority' | 'status' | 'client' | 'agent' | 'createdAt' | 'resolvedAt';
type SortDir = 'asc' | 'desc';

const PRIORITY_WEIGHT: Record<TicketPriority, number> = {
  LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4,
};
const STATUS_WEIGHT: Record<TicketStatus, number> = {
  OPEN: 1, IN_PROGRESS: 2, RESOLVED: 3, CLOSED: 4,
};

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`ml-1 inline-block transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`}>
      {dir === 'asc' ? '↑' : '↓'}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 bg-surface-200 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export default function AgentTickets() {
  const [selected, setSelected] = useState<TicketResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'ALL'>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const { data: tickets = [], isLoading, isError } = useQuery({
    queryKey: ['allTickets'],
    queryFn: getAllTickets,
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    return tickets
      .filter((t) => statusFilter === 'ALL' || t.status === statusFilter)
      .filter((t) => priorityFilter === 'ALL' || t.priority === priorityFilter)
      .sort((a, b) => {
        let cmp = 0;
        switch (sortKey) {
          case 'title':
            cmp = a.title.localeCompare(b.title);
            break;
          case 'priority':
            cmp = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
            break;
          case 'status':
            cmp = STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status];
            break;
          case 'client':
            cmp = a.createdBy.name.localeCompare(b.createdBy.name);
            break;
          case 'agent':
            cmp = (a.assignedTo?.name || '').localeCompare(b.assignedTo?.name || '');
          break;
          case 'createdAt':
            cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          case 'resolvedAt':
            cmp = (a.resolvedAt ? new Date(a.resolvedAt).getTime() : Infinity)
              - (b.resolvedAt ? new Date(b.resolvedAt).getTime() : Infinity);
            break;
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [tickets, statusFilter, priorityFilter, sortKey, sortDir]);

  const columns: { key: SortKey; label: string }[] = [
    { key: 'title', label: 'Title' },
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status' },
    { key: 'client', label: 'Client' },
    { key: 'agent', label: 'Agent' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'resolvedAt', label: 'Resolved At' },
  ];

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-display">All Tickets</h1>
            <p className="text-sm text-gray-500 font-body mt-1">
              Browse all tickets across the system.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 font-body uppercase tracking-wide">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'ALL')}
              className="text-sm font-body border border-surface-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-400 transition shadow-sm"
            >
              <option value="ALL">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 font-body uppercase tracking-wide">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | 'ALL')}
              className="text-sm font-body border border-surface-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-400 transition shadow-sm"
            >
              <option value="ALL">All priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {(statusFilter !== 'ALL' || priorityFilter !== 'ALL') && (
            <button
              onClick={() => { setStatusFilter('ALL'); setPriorityFilter('ALL'); }}
              className="text-xs font-body text-brand-600 hover:text-brand-700 px-3 py-2 rounded-xl hover:bg-brand-50 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-surface-200 overflow-hidden">
          {isError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700 font-body">Failed to load tickets</p>
              <p className="text-xs text-gray-400 font-body mt-1">Please try refreshing the page</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-100 bg-surface-50">
                    {columns.map(({ key, label }) => (
                      <th
                        key={key}
                        onClick={() => handleSort(key)}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 font-body uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none transition-colors whitespace-nowrap"
                      >
                        {label}
                        <SortIcon active={sortKey === key} dir={sortDir} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {isLoading ? (
                    <>{[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}</>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                          <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
                            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <p className="text-sm font-semibold text-gray-700 font-body">No tickets found</p>
                          <p className="text-xs text-gray-400 font-body mt-1">
                            {statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                              ? 'Try adjusting your filters'
                              : 'No tickets have been assigned to you yet'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((ticket) => (
                      <tr
                        key={ticket.id}
                        onClick={() => setSelected(ticket)}
                        className="hover:bg-surface-50 cursor-pointer transition-colors group"
                      >
                        <td className="px-4 py-3.5 max-w-[240px]">
                          <p className="font-medium text-gray-900 font-body group-hover:text-brand-600 transition-colors line-clamp-1">
                            {ticket.title}
                          </p>
                          {ticket.category && (
                            <p className="text-xs text-gray-400 font-body mt-0.5">{ticket.category}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <PriorityBadge priority={ticket.priority} />
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-gray-600 font-body">{ticket.createdBy.name}</p>
                          <p className="text-xs text-gray-400 font-body">{ticket.createdBy.email}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          {ticket.assignedTo ? (
                            <>
                              <p className="text-gray-600">{ticket.assignedTo.name}</p>
                              <p className="text-xs text-gray-400">{ticket.assignedTo.email}</p>
                            </>
                          ) : (
                            <span className="text-gray-300 italic text-xs">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="text-gray-500 font-body">{formatDate(ticket.createdAt)}</p>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {ticket.resolvedAt ? (
                            <p className="text-gray-500 font-body">{formatDate(ticket.resolvedAt)}</p>
                          ) : (
                            <span className="text-gray-300 font-body italic text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!isLoading && !isError && (
          <p className="text-xs text-gray-400 font-body mt-3 text-right">
            {filtered.length} of {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <TicketDetailPanel ticket={selected} onClose={() => setSelected(null)} />
    </div>
  );
}