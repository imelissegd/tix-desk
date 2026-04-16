// frontend/src/components/admin/AdminTickets.tsx
import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../axios';
import {
  getAllTickets,
  changeStatus,
  assignTicket,
  unassignTicket,  
  deleteTicket,
} from '../../services/ticketService';
import type { TicketResponse, TicketStatus, TicketPriority, UserSummary } from '../../services/ticketService';
import TicketDetailPanel from '../TicketDetailPanel';

// ── Types ──────────────────────────────────────────────────────────────────

interface AgentOption {
  id: number;
  name: string;
  email: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATUSES: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITIES: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

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

// ── Badge Components ───────────────────────────────────────────────────────

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

// ── Delete Confirm Modal ───────────────────────────────────────────────────

function DeleteModal({
  ticket,
  onClose,
  onConfirm,
}: {
  ticket: TicketResponse | null;
  onClose: () => void;
  onConfirm: (id: number) => void;
}) {
  if (!ticket) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon--danger">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="32" height="32" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </div>
        <h2 className="modal-title">Delete ticket?</h2>
        <p className="modal-desc">
          Ticket <strong>#{ticket.id}</strong> — <strong>{ticket.title}</strong> will be permanently deleted. This cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="modal-btn modal-btn--cancel" onClick={onClose}>Cancel</button>
          <button className="modal-btn modal-btn--danger" onClick={() => onConfirm(ticket.id)}>
            Yes, delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inline Assign Select ───────────────────────────────────────────────────

function AssignSelect({
  ticket,
  agents,
  onAssign,
}: {
  ticket: TicketResponse;
  agents: AgentOption[];
  onAssign: (ticketId: number, agentId: number | null) => void;
}) {
  const currentId = ticket.assignedTo?.id ?? '';
  return (
    <select
      className="admin-inline-select"
      value={currentId}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        const val = e.target.value;
        onAssign(ticket.id, val ? Number(val) : null);
      }}
    >
      <option value="">Unassigned</option>
      {agents.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
    </select>
  );
}

// ── Inline Status Select ───────────────────────────────────────────────────

function StatusSelect({
  ticket,
  onStatusChange,
}: {
  ticket: TicketResponse;
  onStatusChange: (ticketId: number, status: TicketStatus) => void;
}) {
  return (
    <select
      className={`admin-inline-select admin-inline-select--status admin-inline-select--${ticket.status.toLowerCase().replace('_', '-')}`}
      value={ticket.status}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        e.stopPropagation();
        onStatusChange(ticket.id, e.target.value as TicketStatus);
      }}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
      ))}
    </select>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function AdminTickets() {
  const location = useLocation();

  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [filtered, setFiltered] = useState<TicketResponse[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);

  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [search, setSearch] = useState('');

  const [perPage, setPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Apply status filter from dashboard navigation
  useEffect(() => {
    const state = location.state as { statusFilter?: string } | null;
    if (state?.statusFilter !== undefined) {
      setStatusFilter(state.statusFilter ?? '');
      setCurrentPage(1);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const [selectedTicket, setSelectedTicket] = useState<TicketResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TicketResponse | null>(null);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Load tickets + agents
  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAllTickets(),
      api.get<AgentOption[]>('/users?role=AGENT'),
    ])
      .then(([ticketData, agentRes]) => {
        setTickets(ticketData);
        setAgents(agentRes.data);
      })
      .catch(() => showToast('Failed to load tickets.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  // Filtering
  const applyFilters = useCallback(() => {
    const q = search.trim().toLowerCase();
    const result = tickets.filter((t) => {
      const matchSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        String(t.id).includes(q) ||
        t.createdBy?.name?.toLowerCase().includes(q);
      const matchStatus = !statusFilter || t.status === statusFilter;
      const matchPriority = !priorityFilter || t.priority === priorityFilter;
      const matchAgent =
        !agentFilter ||
        (agentFilter === 'unassigned'
          ? !t.assignedTo
          : String(t.assignedTo?.id) === agentFilter);
      return matchSearch && matchStatus && matchPriority && matchAgent;
    });
    // Sort: newest first
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setFiltered(result);
    setCurrentPage(1);
  }, [tickets, search, statusFilter, priorityFilter, agentFilter]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function updateTicket(updated: TicketResponse) {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    if (selectedTicket?.id === updated.id) setSelectedTicket(updated);
  }

  function removeTicket(id: number) {
    setTickets((prev) => prev.filter((t) => t.id !== id));
    if (selectedTicket?.id === id) setSelectedTicket(null);
  }

  async function handleAssign(ticketId: number, agentId: number | null) {
    try {
      let updated;

      if (agentId === null) {
        updated = await unassignTicket(ticketId);
        showToast('Ticket unassigned.', 'success');
      } else {
        updated = await assignTicket(ticketId, agentId);
        showToast('Ticket assigned.', 'success');
      }

      updateTicket(updated);
    } catch {
      showToast('Failed to update assignment.', 'error');
    }
  }

  async function handleStatusChange(ticketId: number, status: TicketStatus) {
    try {
      const updated = await changeStatus(ticketId, status);
      updateTicket(updated);
      showToast('Status updated.', 'success');
    } catch {
      showToast('Failed to update status.', 'error');
    }
  }

  async function handleDelete(ticketId: number) {
    try {
      await deleteTicket(ticketId);
      removeTicket(ticketId);
      setDeleteTarget(null);
      showToast('Ticket deleted.', 'success');
    } catch {
      setDeleteTarget(null);
      showToast('Failed to delete ticket.', 'error');
    }
  }

  // Pagination
  const totalPages = Math.ceil(filtered.length / perPage);
  const pageTickets = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const isFiltered = search || statusFilter || priorityFilter || agentFilter;
  const countText = isFiltered
    ? `Showing ${filtered.length} of ${tickets.length} ticket${tickets.length !== 1 ? 's' : ''}`
    : `${tickets.length} ticket${tickets.length !== 1 ? 's' : ''} total`;

  return (
    <div className="main-content">
      {/* Header */}
      <div className="admin-users-header">
        <h1 className="admin-users-title">All Tickets</h1>
      </div>

      {/* Controls */}
      <div className="admin-users-controls">
        {/* Search */}
        <div className="admin-users-search-wrap">
          <svg className="admin-users-search-icon" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="admin-users-search-input"
            placeholder="Search by title, ID, or requester's name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status filter */}
        <select className="admin-users-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>

        {/* Priority filter */}
        <select className="admin-users-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
          ))}
        </select>

        {/* Agent filter */}
        <select className="admin-users-select" value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)}>
          <option value="">All agents</option>
          <option value="unassigned">Unassigned</option>
          {agents.map((a) => (
            <option key={a.id} value={String(a.id)}>{a.name}</option>
          ))}
        </select>

        {/* Per page */}
        <select className="admin-users-select" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      <p className="admin-users-count">{countText}</p>

      {/* Table */}
      <div className="admin-users-table-wrap">
        {loading ? (
          <p className="admin-users-empty">Loading tickets…</p>
        ) : filtered.length === 0 ? (
          <p className="admin-users-empty">No tickets found.</p>
        ) : (
          <table className="admin-users-table admin-tickets-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Requester</th>
                <th>Ticket</th>
                <th>Priority</th>
                <th>Date Created</th>                
                <th>Assigned Agent</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="admin-ticket-row"
                >
                  <td className="ticket-id-cell">{ticket.id}</td>
                  <td>
                    <div className="user-name">{ticket.createdBy?.name ?? '—'}</div>
                    <div className="user-email">{ticket.createdBy?.email ?? ''}</div>
                  </td>
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
                    {editingRowId === ticket.id ? (
                      <AssignSelect ticket={ticket} agents={agents} onAssign={handleAssign} />
                    ) : (
                      <span className="admin-readonly-cell">
                        {ticket.assignedTo?.name ?? <em className="admin-readonly-unassigned">Unassigned</em>}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingRowId === ticket.id ? (
                      <StatusSelect ticket={ticket} onStatusChange={handleStatusChange} />
                    ) : (
                      <StatusBadge status={ticket.status} />
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="tbl-btn tbl-btn--purple"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        View
                      </button>
                      {editingRowId === ticket.id ? (
                        <button
                          className="tbl-btn tbl-btn--save"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingRowId(null);
                          }}
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          className="tbl-btn tbl-btn--edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingRowId(ticket.id);
                          }}
                        >
                          Edit
                        </button>
                      )}
                      <button
                        className="tbl-btn tbl-btn--danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(ticket);
                        }}
                      >
                        Delete
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

      {/* Ticket Detail Panel */}
      <TicketDetailPanel ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />

      {/* Delete Confirm Modal */}
      <DeleteModal
        ticket={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      {/* Toast */}
      {toast && (
        <div className={`toast toast--${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}