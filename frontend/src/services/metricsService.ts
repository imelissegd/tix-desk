// frontend/src/services/metricsService.ts
import api from '../axios';
import type { TicketStatus } from './ticketService';

export interface DashboardSummary {
  ticketsByStatus: Record<TicketStatus, number>;
  avgResolutionHours: number;
  totalTickets: number;
  totalUsers: number;
  usersByRole: Record<string, number>; // ADMIN | AGENT | CLIENT
}

export interface DailyVolume {
  date: string; // ISO date string: "2024-01-15"
  count: number;
}

export interface AgentPerformance {
  agentId: number;
  name: string;
  email: string;
  totalAssigned: number;
  totalResolved: number;
  openCount: number;
  avgResolutionHours: number;
  currentWorkload: number;
}

export const metricsService = {
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const { data } = await api.get('/admin/metrics/summary');
    return data;
  },

  getTicketVolume: async (from: string, to: string): Promise<DailyVolume[]> => {
    const { data } = await api.get('/admin/metrics/volume', {
      params: { from, to },
    });
    return data;
  },

  getAgentPerformance: async (): Promise<AgentPerformance[]> => {
    const { data } = await api.get('/admin/metrics/agents');
    return data;
  },
};