// frontend/src/components/admin/AdminDashboard.tsx
import { useEffect, useState, useCallback } from 'react';
import { metricsService } from '../../services/metricsService';
import type { DashboardSummary, DailyVolume } from '../../services/metricsService';

// ── helpers ────────────────────────────────────────────────────────────────

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getDefaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 6); // last 7 days inclusive
  return { from: toISODate(from), to: toISODate(to) };
}

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

function formatDateLabel(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── SVG Bar Chart ──────────────────────────────────────────────────────────

const CHART_H = 180;
const CHART_PADDING = { top: 16, right: 16, bottom: 40, left: 36 };

function BarChart({ data }: { data: DailyVolume[] }) {
  if (!data.length) {
    return (
      <div className="chart-empty">No data for this range.</div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const chartWidth = Math.max(data.length * 48, 300);
  const innerW = chartWidth - CHART_PADDING.left - CHART_PADDING.right;
  const innerH = CHART_H - CHART_PADDING.top - CHART_PADDING.bottom;
  const barWidth = Math.max(Math.floor(innerW / data.length) - 6, 12);

  // Y-axis ticks
  const yTicks = [0, Math.round(maxCount / 2), maxCount];

  return (
    <div className="chart-scroll-wrap">
      <svg
        width={chartWidth}
        height={CHART_H}
        className="bar-chart-svg"
        aria-label="Daily ticket volume bar chart"
      >
        {/* Y-axis gridlines + labels */}
        {yTicks.map((tick) => {
          const y = CHART_PADDING.top + innerH - (tick / maxCount) * innerH;
          return (
            <g key={tick}>
              <line
                x1={CHART_PADDING.left}
                x2={chartWidth - CHART_PADDING.right}
                y1={y}
                y2={y}
                className="chart-gridline"
              />
              <text x={CHART_PADDING.left - 6} y={y + 4} className="chart-label chart-label--y">
                {tick}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const barH = Math.max((d.count / maxCount) * innerH, d.count > 0 ? 3 : 0);
          const x = CHART_PADDING.left + (i / data.length) * innerW + (innerW / data.length - barWidth) / 2;
          const y = CHART_PADDING.top + innerH - barH;
          const label = formatDateLabel(d.date);

          return (
            <g key={d.date} className="chart-bar-group">
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={3}
                className="chart-bar"
              />
              {/* Count label on top of bar */}
              {d.count > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  className="chart-label chart-label--count"
                >
                  {d.count}
                </text>
              )}
              {/* X-axis date label */}
              <text
                x={x + barWidth / 2}
                y={CHART_H - 8}
                className="chart-label chart-label--x"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Summary Card ───────────────────────────────────────────────────────────

interface CardProps {
  label: string;
  value: string | number;
  accent?: 'open' | 'progress' | 'resolved' | 'closed' | 'neutral';
  icon: React.ReactNode;
}

function SummaryCard({ label, value, accent = 'neutral', icon }: CardProps) {
  return (
    <div className={`summary-card summary-card--${accent}`}>
      <div className="summary-card__icon">{icon}</div>
      <div className="summary-card__body">
        <div className="summary-card__value">{value}</div>
        <div className="summary-card__label">{label}</div>
      </div>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────

const IconTicket = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2Z" />
  </svg>
);
const IconOpen = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4l3 3" />
  </svg>
);
const IconProgress = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);
const IconResolved = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconAgents = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

// ── Main Component ─────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [volumeData, setVolumeData] = useState<DailyVolume[]>([]);
  const [dateRange, setDateRange] = useState(getDefaultRange);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [volumeLoading, setVolumeLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [volumeError, setVolumeError] = useState<string | null>(null);

  // Fetch summary once
  useEffect(() => {
    setSummaryLoading(true);
    setSummaryError(null);
    metricsService
      .getDashboardSummary()
      .then(setSummary)
      .catch(() => setSummaryError('Failed to load dashboard summary.'))
      .finally(() => setSummaryLoading(false));
  }, []);

  // Fetch volume whenever date range changes
  const fetchVolume = useCallback(() => {
    setVolumeLoading(true);
    setVolumeError(null);
    metricsService
      .getTicketVolume(dateRange.from, dateRange.to)
      .then(setVolumeData)
      .catch(() => setVolumeError('Failed to load ticket volume.'))
      .finally(() => setVolumeLoading(false));
  }, [dateRange]);

  useEffect(() => {
    fetchVolume();
  }, [fetchVolume]);

  // Quick-range buttons
  const applyQuickRange = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    setDateRange({ from: toISODate(from), to: toISODate(to) });
  };

  // Build card data from summary
  const open = summary?.ticketsByStatus?.OPEN ?? 0;
  const inProgress = summary?.ticketsByStatus?.IN_PROGRESS ?? 0;
  const resolved = summary?.ticketsByStatus?.RESOLVED ?? 0;
  const closed = summary?.ticketsByStatus?.CLOSED ?? 0;

  return (
    <div className="main-content">
      {/* Header */}
      <div className="admin-dash-header">
        <h1 className="admin-dash-title">Dashboard</h1>
        <p className="admin-dash-subtitle">System overview and ticket analytics</p>
      </div>

      {/* Summary Cards */}
      {summaryError ? (
        <p className="admin-error">{summaryError}</p>
      ) : summaryLoading ? (
        <div className="admin-cards-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="summary-card summary-card--skeleton" />
          ))}
        </div>
      ) : (
        <div className="admin-cards-grid">
          <SummaryCard
            label="Total Tickets"
            value={summary?.totalTickets ?? 0}
            accent="neutral"
            icon={<IconTicket />}
          />
          <SummaryCard
            label="Open"
            value={open}
            accent="open"
            icon={<IconOpen />}
          />
          <SummaryCard
            label="In Progress"
            value={inProgress}
            accent="progress"
            icon={<IconProgress />}
          />
          <SummaryCard
            label="Resolved"
            value={resolved}
            accent="resolved"
            icon={<IconResolved />}
          />
          <SummaryCard
            label="Avg Resolution Time"
            value={formatHours(summary?.avgResolutionHours ?? 0)}
            accent="neutral"
            icon={<IconClock />}
          />
          <SummaryCard
            label="Active Agents"
            value={summary?.totalAgents ?? 0}
            accent="neutral"
            icon={<IconAgents />}
          />
        </div>
      )}

      {/* Volume Chart */}
      <div className="admin-chart-card">
        <div className="admin-chart-header">
          <div>
            <h2 className="admin-chart-title">Ticket Volume</h2>
            <p className="admin-chart-subtitle">Daily tickets created in range</p>
          </div>

          <div className="admin-chart-controls">
            {/* Quick range buttons */}
            <div className="quick-range-btns">
              {[7, 14, 30].map((days) => {
                const to = new Date();
                const from = new Date();
                from.setDate(from.getDate() - (days - 1));
                const isActive =
                  dateRange.from === toISODate(from) && dateRange.to === toISODate(to);
                return (
                  <button
                    key={days}
                    className={`quick-range-btn ${isActive ? 'quick-range-btn--active' : ''}`}
                    onClick={() => applyQuickRange(days)}
                  >
                    {days}d
                  </button>
                );
              })}
            </div>

            {/* Manual date pickers */}
            <div className="date-range-inputs">
              <input
                type="date"
                className="admin-users-select"
                value={dateRange.from}
                max={dateRange.to}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, from: e.target.value }))
                }
              />
              <span className="date-range-sep">→</span>
              <input
                type="date"
                className="admin-users-select"
                value={dateRange.to}
                min={dateRange.from}
                max={toISODate(new Date())}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, to: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        <div className="admin-chart-body">
          {volumeError ? (
            <p className="admin-error">{volumeError}</p>
          ) : volumeLoading ? (
            <div className="chart-loading">Loading chart…</div>
          ) : (
            <BarChart data={volumeData} />
          )}
        </div>
      </div>
    </div>
  );
}