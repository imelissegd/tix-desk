import type { TicketStatus, TicketPriority } from '../services/ticketService';

const statusConfig: Record<TicketStatus, { label: string; classes: string }> = {
  OPEN:        { label: 'Open',        classes: 'bg-blue-100 text-blue-700 ring-blue-200' },
  IN_PROGRESS: { label: 'In Progress', classes: 'bg-yellow-100 text-yellow-700 ring-yellow-200' },
  RESOLVED:    { label: 'Resolved',    classes: 'bg-green-100 text-green-700 ring-green-200' },
  CLOSED:      { label: 'Closed',      classes: 'bg-gray-100 text-gray-600 ring-gray-200' },
};

const priorityConfig: Record<TicketPriority, { label: string; classes: string; dot: string }> = {
  LOW:      { label: 'Low',      classes: 'bg-green-100 text-green-700 ring-green-200',   dot: 'bg-green-500' },
  MEDIUM:   { label: 'Medium',   classes: 'bg-yellow-100 text-yellow-700 ring-yellow-200', dot: 'bg-yellow-500' },
  HIGH:     { label: 'High',     classes: 'bg-orange-100 text-orange-700 ring-orange-200', dot: 'bg-orange-500' },
  CRITICAL: { label: 'Critical', classes: 'bg-red-100 text-red-700 ring-red-200',         dot: 'bg-red-500' },
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset font-body ${config.classes}`}>
      {config.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const config = priorityConfig[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset font-body ${config.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}