// frontend/src/components/agent/AgentQueue.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTickets, changeStatus, type TicketResponse, type TicketStatus } from '../../services/ticketService';
import { StatusBadge, PriorityBadge } from '../StatusBadge';
import TicketDetailPanel from '../TicketDetailPanel';
import { useAuthStore } from '../../store/authStore';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

const PRIORITY_ORDER: Record<string, number> = {
  CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3,
};

const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: [],
  CLOSED: [],
};

function TicketCard({
  ticket,
  onClick,
  onStatusChange,
  isPending,
}: {
  ticket: TicketResponse;
  onClick: () => void;
  onStatusChange: (status: TicketStatus) => void;
  isPending: boolean;
}) {
  const nextStatuses = STATUS_TRANSITIONS[ticket.status];

  return (
    <div
      className="bg-white rounded-xl border border-surface-200 p-4 shadow-sm hover:shadow-md hover:border-brand-200 transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Top row: priority + category */}
      <div className="flex items-center justify-between mb-2">
        <PriorityBadge priority={ticket.priority} />
        {ticket.category && (
          <span className="text-xs text-gray-400 font-body bg-surface-100 px-2 py-0.5 rounded-full">
            {ticket.category}
          </span>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-gray-900 font-body group-hover:text-brand-700 transition-colors line-clamp-2 mb-2">
        {ticket.title}
      </p>

      {/* Client + date */}
      <div className="flex items-center justify-between text-xs text-gray-400 font-body mb-3">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {ticket.createdBy.name}
        </span>
        <span>{formatDate(ticket.createdAt)}</span>
      </div>

      {/* Inline status transition — stop propagation so card click doesn't fire */}
      {nextStatuses.length > 0 && (
        <div
          className="mt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <select
            disabled={isPending}
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) onStatusChange(e.target.value as TicketStatus);
              e.target.value = '';
            }}
            className="w-full text-xs font-body border border-surface-200 rounded-lg px-2 py-1.5 text-gray-600 bg-surface-50 hover:bg-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-400 cursor-pointer disabled:opacity-50 transition"
          >
            <option value="" disabled>Move to…</option>
            {nextStatuses.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      )}

      {ticket.status === 'RESOLVED' && (
        <div className="mt-1 text-xs text-center text-gray-400 font-body py-1 bg-surface-50 rounded-lg border border-surface-100">
          Resolved {ticket.resolvedAt ? formatDate(ticket.resolvedAt) : ''}
        </div>
      )}
    </div>
  );
}

type Tab = 'OPEN' | 'IN_PROGRESS';

export default function AgentQueue() {
  const [activeTab, setActiveTab] = useState<Tab>('OPEN');
  const [selected, setSelected] = useState<TicketResponse | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: tickets = [], isLoading, isError } = useQuery({
    queryKey: ['agentTickets', user?.userId],
    queryFn: getTickets,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TicketStatus }) =>
      changeStatus(id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['agentTickets'] });
      // Keep panel in sync if the updated ticket is currently open
      if (selected?.id === updated.id) setSelected(updated);
    },
  });

  const openTickets = tickets
    .filter((t) => t.status === 'OPEN')
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  const inProgressTickets = tickets
    .filter((t) => t.status === 'IN_PROGRESS')
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  const columns: Record<Tab, { label: string; tickets: TicketResponse[]; accent: string }> = {
    OPEN: {
      label: 'Open',
      tickets: openTickets,
      accent: 'bg-blue-500',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      tickets: inProgressTickets,
      accent: 'bg-yellow-400',
    },
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-display">My Queue</h1>
          <p className="text-sm text-gray-500 font-body mt-1">
            Active tickets assigned to you
          </p>
        </div>

        {/* Summary pills */}
        <div className="flex gap-3 mb-6">
          {(Object.keys(columns) as Tab[]).map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium font-body border transition-all ${
                activeTab === key
                  ? 'bg-white border-brand-300 text-brand-700 shadow-sm'
                  : 'bg-surface-100 border-surface-200 text-gray-500 hover:bg-white hover:border-surface-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${columns[key].accent}`} />
              {columns[key].label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-body ${
                activeTab === key
                  ? 'bg-brand-100 text-brand-700'
                  : 'bg-surface-200 text-gray-400'
              }`}>
                {columns[key].tickets.length}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {isError ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 font-body">Failed to load queue</p>
            <p className="text-xs text-gray-400 font-body mt-1">Please try refreshing the page</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl border border-surface-200 p-4 h-40">
                <div className="h-3 bg-surface-200 rounded w-1/4 mb-3" />
                <div className="h-4 bg-surface-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-surface-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : columns[activeTab].tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700 font-body">
              No {columns[activeTab].label.toLowerCase()} tickets
            </p>
            <p className="text-xs text-gray-400 font-body mt-1">
              {activeTab === 'OPEN' ? 'New assignments will appear here' : 'Pick up open tickets to start working'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {columns[activeTab].tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={() => setSelected(ticket)}
                onStatusChange={(status) => statusMutation.mutate({ id: ticket.id, status })}
                isPending={statusMutation.isPending}
              />
            ))}
          </div>
        )}

        {!isLoading && !isError && (
          <p className="text-xs text-gray-400 font-body mt-4 text-right">
            {tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length} active ticket(s) total
          </p>
        )}
      </div>

      <TicketDetailPanel ticket={selected} onClose={() => setSelected(null)} />
    </div>
  );
}