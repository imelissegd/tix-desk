// frontend/src/components/admin/AdminReports.tsx
import { useEffect, useState } from 'react';
import { metricsService } from '../../services/metricsService';
import type { AgentPerformance } from '../../services/metricsService';

// ── Constants ──────────────────────────────────────────────────────────────

// Max workload weight units = 100% on the progress bar
const MAX_WORKLOAD = 20;

// ── Helpers ────────────────────────────────────────────────────────────────

function formatHours(hours: number): string {
  if (hours === 0) return '—';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

function workloadPct(workload: number): number {
  return Math.min((workload / MAX_WORKLOAD) * 100, 100);
}

function workloadColor(pct: number): string {
  if (pct >= 90) return 'workload-bar--critical';
  if (pct >= 70) return 'workload-bar--high';
  if (pct >= 40) return 'workload-bar--medium';
  return 'workload-bar--low';
}

// ── CSV Export ─────────────────────────────────────────────────────────────

function exportCSV(data: AgentPerformance[]) {
  const headers = [
    'Agent ID',
    'Name',
    'Email',
    'Total Assigned',
    'Total Resolved',
    'Open Tickets',
    'Avg Resolution (hrs)',
    'Current Workload',
  ];

  const rows = data.map((a) => [
    a.agentId,
    `"${a.name.replace(/"/g, '""')}"`,
    a.email,
    a.totalAssigned,
    a.totalResolved,
    a.openCount,
    a.avgResolutionHours.toFixed(2),
    a.currentWorkload,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `agent-performance-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Workload Bar ───────────────────────────────────────────────────────────

function WorkloadBar({ workload }: { workload: number }) {
  const pct = workloadPct(workload);
  const colorClass = workloadColor(pct);
  return (
    <div className="workload-wrap">
      <div className="workload-track">
        <div
          className={`workload-bar ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="workload-label">{workload}/{MAX_WORKLOAD}</span>
    </div>
  );
}

// ── User Avatar ────────────────────────────────────────────────────────────

function UserAvatar({ name }: { name: string }) {
  return (
    <div className="user-avatar">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ── Sort State ─────────────────────────────────────────────────────────────

type SortKey = keyof AgentPerformance;
type SortDir = 'asc' | 'desc';

function sortData(data: AgentPerformance[], key: SortKey, dir: SortDir): AgentPerformance[] {
  return [...data].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (typeof av === 'string' && typeof bv === 'string') {
      return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    if (typeof av === 'number' && typeof bv === 'number') {
      return dir === 'asc' ? av - bv : bv - av;
    }
    return 0;
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

// ── Main Component ─────────────────────────────────────────────────────────

export default function AdminReports() {
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    setLoading(true);
    setError(null);
    metricsService
      .getAgentPerformance()
      .then(setAgents)
      .catch(() => setError('Failed to load agent performance data.'))
      .finally(() => setLoading(false));
  }, []);

  function handleSort(col: SortKey) {
    if (col === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(col);
      setSortDir('asc');
    }
  }

  const sorted = sortData(agents, sortKey, sortDir);

  // Aggregate stats for the summary row
  const totalAssigned = agents.reduce((s, a) => s + a.totalAssigned, 0);
  const totalResolved = agents.reduce((s, a) => s + a.totalResolved, 0);
  const totalOpen = agents.reduce((s, a) => s + a.openCount, 0);
  const avgHours =
    agents.length > 0
      ? agents.reduce((s, a) => s + a.avgResolutionHours, 0) / agents.length
      : 0;

  return (
    <div className="main-content">
      {/* Header */}
      <div className="admin-users-header">
        <h1 className="admin-users-title">Agent Performance</h1>
        {!loading && !error && agents.length > 0 && (
          <button
            className="admin-users-add-btn"
            onClick={() => exportCSV(agents)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
        )}
      </div>

      {/* Summary Stats */}
      {!loading && !error && agents.length > 0 && (
        <div className="admin-cards-grid admin-cards-grid--4">
          <div className="summary-card summary-card--neutral">
            <div className="summary-card__body">
              <div className="summary-card__value">{agents.length}</div>
              <div className="summary-card__label">Active Agents</div>
            </div>
          </div>
          <div className="summary-card summary-card--open">
            <div className="summary-card__body">
              <div className="summary-card__value">{totalAssigned}</div>
              <div className="summary-card__label">Total Assigned</div>
            </div>
          </div>
          <div className="summary-card summary-card--resolved">
            <div className="summary-card__body">
              <div className="summary-card__value">{totalResolved}</div>
              <div className="summary-card__label">Total Resolved</div>
            </div>
          </div>
          <div className="summary-card summary-card--progress">
            <div className="summary-card__body">
              <div className="summary-card__value">{totalOpen}</div>
              <div className="summary-card__label">Total Open</div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {error ? (
        <p className="admin-error">{error}</p>
      ) : loading ? (
        <p className="admin-users-empty">Loading agent data…</p>
      ) : agents.length === 0 ? (
        <p className="admin-users-empty">No agents found.</p>
      ) : (
        <>
          <p className="admin-users-count">{agents.length} agent{agents.length !== 1 ? 's' : ''}</p>

          <div className="admin-users-table-wrap">
            <table className="admin-users-table admin-reports-table">
              <thead>
                <tr>
                  <th></th>
                  <SortTh label="Agent" col="name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh label="Assigned" col="totalAssigned" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh label="Resolved" col="totalResolved" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh label="Open" col="openCount" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh label="Avg Resolution" col="avgResolutionHours" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh label="Workload" col="currentWorkload" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                </tr>
              </thead>
              <tbody>
                {sorted.map((agent) => {
                  const resolutionRate =
                    agent.totalAssigned > 0
                      ? Math.round((agent.totalResolved / agent.totalAssigned) * 100)
                      : 0;
                  return (
                    <tr key={agent.agentId}>
                      <td><UserAvatar name={agent.name} /></td>
                      <td>
                        <div className="user-name">{agent.name}</div>
                        <div className="user-email">{agent.email}</div>
                      </td>
                      <td>{agent.totalAssigned}</td>
                      <td>
                        <span>{agent.totalResolved}</span>
                        {agent.totalAssigned > 0 && (
                          <span className="resolution-rate"> ({resolutionRate}%)</span>
                        )}
                      </td>
                      <td>{agent.openCount}</td>
                      <td>{formatHours(agent.avgResolutionHours)}</td>
                      <td>
                        <WorkloadBar workload={agent.currentWorkload} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Footer totals */}
              <tfoot>
                <tr className="reports-totals-row">
                  <td></td>
                  <td><strong>Totals / Avg</strong></td>
                  <td><strong>{totalAssigned}</strong></td>
                  <td><strong>{totalResolved}</strong></td>
                  <td><strong>{totalOpen}</strong></td>
                  <td><strong>{formatHours(avgHours)}</strong></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}