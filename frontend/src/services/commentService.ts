import api from '../axios';
import type { UserSummary } from './ticketService';

export interface CommentResponse {
  id: number;
  ticketId: number;
  author: UserSummary;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface AddCommentRequest {
  content: string;
  isInternal: boolean;
}

export const getComments = async (ticketId: number): Promise<CommentResponse[]> => {
  const { data } = await api.get(`/tickets/${ticketId}/comments`);
  return data;
};

export const addComment = async (
  ticketId: number,
  payload: AddCommentRequest
): Promise<CommentResponse> => {
  const { data } = await api.post(`/tickets/${ticketId}/comments`, payload);
  return data;
};