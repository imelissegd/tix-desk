import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getTickets, type TicketResponse } from '../../services/ticketService';
import { StatusBadge, PriorityBadge } from '../StatusBadge';
import TicketDetailPanel from '../TicketDetailPanel';
import { useAuthStore } from '../../store/authStore';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[1, 2, 3, 4, 5].map(i => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 bg-surface-200 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export default function ClientTickets() {
  const [selected, setSelected] = useState<TicketResponse | null>(null);

  const { user } = useAuthStore();
  
  const { data: tickets = [], isLoading, isError } = useQuery({
    queryKey: ['tickets', user?.userId],
    queryFn: getTickets,
  });

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-display">My Tickets</h1>
            <p className="text-sm text-gray-500 font-body mt-1">
              Track the status of your support requests
            </p>
          </div>
          <Link
            to="/client/tickets/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium font-body rounded-xl transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Ticket
          </Link>
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl shadow-sm border border-surface-200 overflow-hidden">
          {isError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                    {['Title', 'Priority', 'Status', 'Agent Assigned', 'Reporter', 'Created'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 font-body uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {isLoading ? (
                    <>{[1, 2, 3, 4].map(i => <SkeletonRow key={i} />)}</>
                  ) : tickets.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                          <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
                            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <p className="text-sm font-semibold text-gray-700 font-body">No tickets yet</p>
                          <p className="text-xs text-gray-400 font-body mt-1 mb-4">Submit your first support request to get started</p>
                          <Link
                            to="/client/tickets/new"
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium font-body rounded-lg hover:bg-brand-700 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Ticket
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    tickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        onClick={() => setSelected(ticket)}
                        className="hover:bg-surface-50 cursor-pointer transition-colors group"
                      >
                        <td className="px-4 py-3.5">
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
                          <p className="text-gray-600 font-body">
                            {ticket.assignedTo?.name ?? (
                              <span className="text-gray-400 italic">Unassigned</span>
                            )}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-gray-600 font-body">
                            {ticket.createdBy?.name ?? (
                              <span className="text-gray-400 italic">Unassigned</span>
                            )}
                          </p>
                        </td>                        
                        <td className="px-4 py-3.5">
                          <p className="text-gray-500 font-body">{formatDate(ticket.createdAt)}</p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {tickets.length > 0 && !isLoading && (
          <p className="text-xs text-gray-400 font-body mt-3 text-right">
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} total
          </p>
        )}
      </div>

      {/* Detail panel */}
      <TicketDetailPanel ticket={selected} onClose={() => setSelected(null)} />
    </div>
  );
}