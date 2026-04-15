// frontend/src/services/ticketService.ts
import api from '../axios';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'AGENT' | 'CLIENT';
}

export interface TicketResponse {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string | null;
  createdBy: UserSummary;
  assignedTo: UserSummary | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  priority: TicketPriority;
  category?: string;
}

// Returns tickets scoped to the calling user (backend filters by role)
export const getTickets = async (): Promise<TicketResponse[]> => {
  const { data } = await api.get('/tickets/my');
  return data;
};

export const getAllTickets = async (): Promise<TicketResponse[]> => {
  const { data } = await api.get('/tickets');
  return data;
};

export const getTicketById = async (id: number): Promise<TicketResponse> => {
  const { data } = await api.get(`/tickets/${id}`);
  return data;
};

export const createTicket = async (payload: CreateTicketRequest): Promise<TicketResponse> => {
  const { data } = await api.post('/tickets', payload);
  return data;
};

// Agent: update ticket status
export const changeStatus = async (
  ticketId: number,
  status: TicketStatus
): Promise<TicketResponse> => {
  const { data } = await api.patch(`/tickets/${ticketId}/status`, { status });
  return data;
};