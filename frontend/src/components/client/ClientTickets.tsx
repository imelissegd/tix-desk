import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getTickets } from '../../services/ticketService';
import type { TicketResponse, TicketStatus, TicketPriority } from '../../services/ticketService';
import TicketDetailPanel from '../TicketDetailPanel';
import { useAuthStore } from '../../store/authStore';

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

const PRIORITY_ORDER: Record<TicketPriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const STATUS_ORDER: Record<TicketStatus, number> = {
  OPEN: 0,
  IN_PROGRESS: 1,
  RESOLVED: 2,
  CLOSED: 3,
};

// ── Sort ───────────────────────────────────────────────────────────────────

type SortKey = 'id' | 'title' | 'priority' | 'createdAt' | 'assignedTo' | 'status';
type SortDir = 'asc' | 'desc';

function sortTickets(data: TicketResponse[], key: SortKey, dir: SortDir): TicketResponse[] {
  return [...data].sort((a, b) => {
    let av: string | number;
    let bv: string | number;

    if (key === 'id') {
      av = a.id;
      bv = b.id;
    } else if (key === 'createdAt') {
      av = new Date(a.createdAt).getTime();
      bv = new Date(b.createdAt).getTime();
    } else if (key === 'priority') {
      av = PRIORITY_ORDER[a.priority];
      bv = PRIORITY_ORDER[b.priority];
    } else if (key === 'status') {
      av = STATUS_ORDER[a.status];
      bv = STATUS_ORDER[b.status];
    } else if (key === 'assignedTo') {
      av = (a.assignedTo?.name ?? '').toLowerCase();
      bv = (b.assignedTo?.name ?? '').toLowerCase();
    } else {
      av = (a[key] ?? '').toString().toLowerCase();
      bv = (b[key] ?? '').toString().toLowerCase();
    }

    if (typeof av === 'string' && typeof bv === 'string') {
      return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    return dir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });
}

// ── Sort Header ────────────────────────────────────────────────────────────

function SortTh({
  label,
  col,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (col: SortKey) => void;
}) {
  const active = col === sortKey;
  return (
    <th
      className={`sortable-th ${active ? 'sortable-th--active' : ''}`}
      onClick={() => onSort(col)}
    >
      {label}
      <span className="sort-arrow">
        {active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
      </span>
    </th>
  );
}

// ── Badges ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`status-badge status-badge--${status.toLowerCase().replace('_', '-')}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className={`priority-badge priority-badge--${priority.toLowerCase()}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function ClientTickets() {
  const { user } = useAuthStore();

  const { data: tickets = [], isLoading, isError } = useQuery({
    queryKey: ['tickets', user?.userId],
    queryFn: getTickets,
  });

  const [selected, setSelected] = useState<TicketResponse | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function handleSort(col: SortKey) {
    if (col === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(col);
      setSortDir('asc');
    }
  }

  const filtered = useCallback(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      const matchSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        String(t.id).includes(q);
      const matchStatus = !statusFilter || t.status === statusFilter;
      const matchPriority = !priorityFilter || t.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  const filteredTickets = filtered();
  const sorted = sortTickets(filteredTickets, sortKey, sortDir);
  const totalPages = Math.ceil(sorted.length / perPage);
  const pageTickets = sorted.slice((currentPage - 1) * perPage, currentPage * perPage);

  const isFiltered = search || statusFilter || priorityFilter;
  const countText = isFiltered
    ? `Showing ${filteredTickets.length} of ${tickets.length} ticket${tickets.length !== 1 ? 's' : ''}`
    : `${tickets.length} ticket${tickets.length !== 1 ? 's' : ''} total`;

  return (
    <div className="main-content">
      {/* Header */}
      <div className="admin-users-header">
        <h1 className="admin-users-title">My Tickets</h1>
        <Link to="/client/tickets/new" className="admin-users-add-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Ticket
        </Link>
      </div>

      {/* Controls */}
      <div className="admin-users-controls">
        <div className="admin-users-search-wrap">
          <svg className="admin-users-search-icon" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="admin-users-search-input"
            placeholder="Search by title or ID…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <select className="admin-users-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
          <option value="">All statuses</option>
          {(Object.keys(STATUS_LABELS) as TicketStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>

        <select className="admin-users-select" value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}>
          <option value="">All priorities</option>
          {(Object.keys(PRIORITY_LABELS) as TicketPriority[]).map((p) => (
            <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
          ))}
        </select>

        <select className="admin-users-select" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      {!isLoading && !isError && <p className="admin-users-count">{countText}</p>}

      {/* Table */}
      <div className="admin-users-table-wrap">
        {isError ? (
          <p className="admin-users-empty">Failed to load tickets. Please try refreshing.</p>
        ) : isLoading ? (
          <p className="admin-users-empty">Loading tickets…</p>
        ) : filteredTickets.length === 0 ? (
          <p className="admin-users-empty">
            {tickets.length === 0 ? 'No tickets yet.' : 'No tickets match your filters.'}
          </p>
        ) : (
          <table className="admin-users-table admin-tickets-table">
            <thead>
              <tr>
                <SortTh label="ID" col="id" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortTh label="Ticket" col="title" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortTh label="Priority" col="priority" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortTh label="Date Created" col="createdAt" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortTh label="Assigned Agent" col="assignedTo" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortTh label="Status" col="status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageTickets.map((ticket) => (
                <tr key={ticket.id} className="admin-ticket-row">
                  <td className="ticket-id-cell">{ticket.id}</td>
                  <td className="ticket-title-cell">
                    <span className="ticket-title-text">{ticket.title}</span>
                    {ticket.category && (
                      <span className="ticket-category">{ticket.category}</span>
                    )}
                  </td>
                  <td>
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="user-date">
                    {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td>
                    <span className="admin-readonly-cell">
                      {ticket.assignedTo?.name ?? <em className="admin-readonly-unassigned">Unassigned</em>}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="tbl-btn tbl-btn--purple"
                        onClick={() => setSelected(ticket)}
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-users-pagination">
          <button className="pagination-btn" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`pagination-btn ${p === currentPage ? 'pagination-btn--active' : ''}`}
              onClick={() => setCurrentPage(p)}
            >
              {p}
            </button>
          ))}
          <button className="pagination-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            Next →
          </button>
        </div>
      )}

      {/* Detail panel */}
      <TicketDetailPanel ticket={selected} onClose={() => setSelected(null)} />
    </div>
  );
}