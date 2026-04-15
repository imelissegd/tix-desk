import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { getComments, addComment } from '../services/commentService';
import type { TicketResponse } from '../services/ticketService';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import { useAuthStore } from '../store/authStore';

interface Props {
  ticket: TicketResponse | null;
  onClose: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function TicketDetailPanel({ ticket, onClose }: Props) {
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', ticket?.id],
    queryFn: () => getComments(ticket!.id),
    enabled: !!ticket,
  });

  const mutation = useMutation({
    mutationFn: ({ content }: { content: string }) =>
      addComment(ticket!.id, { content, isInternal: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', ticket?.id] });
      setComment('');
    },
  });

  // Trap focus and close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!ticket) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-white z-50 shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-surface-200 bg-surface-50">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-xs font-medium text-brand-600 font-body uppercase tracking-widest mb-1">
              Ticket #{ticket.id}
            </p>
            <h2 className="text-lg font-bold text-gray-900 font-display leading-snug line-clamp-2">
              {ticket.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 rounded-lg hover:bg-surface-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* Metadata grid */}
          <div className="px-6 py-5 grid grid-cols-2 gap-4 border-b border-surface-100">
            <div>
              <p className="text-xs text-gray-400 font-body mb-1 uppercase tracking-wide">Status</p>
              <StatusBadge status={ticket.status} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-body mb-1 uppercase tracking-wide">Priority</p>
              <PriorityBadge priority={ticket.priority} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-body mb-1 uppercase tracking-wide">Assigned To</p>
              <p className="text-sm font-medium text-gray-700 font-body">
                {ticket.assignedTo?.name ?? <span className="text-gray-400 italic">Unassigned</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-body mb-1 uppercase tracking-wide">Category</p>
              <p className="text-sm font-medium text-gray-700 font-body">
                {ticket.category ?? <span className="text-gray-400 italic">None</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-body mb-1 uppercase tracking-wide">Created</p>
              <p className="text-sm text-gray-600 font-body">{formatDate(ticket.createdAt)}</p>
            </div>
            {ticket.resolvedAt && (
              <div>
                <p className="text-xs text-gray-400 font-body mb-1 uppercase tracking-wide">Resolved</p>
                <p className="text-sm text-gray-600 font-body">{formatDate(ticket.resolvedAt)}</p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="px-6 py-5 border-b border-surface-100">
            <p className="text-xs text-gray-400 font-body mb-2 uppercase tracking-wide">Description</p>
            <p className="text-sm text-gray-700 font-body leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          {/* Comments */}
          <div className="px-6 py-5">
            <p className="text-xs text-gray-400 font-body mb-4 uppercase tracking-wide">
              Comments {comments.length > 0 && `(${comments.length})`}
            </p>

            {commentsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="animate-pulse flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-200 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-surface-200 rounded w-1/3" />
                      <div className="h-3 bg-surface-200 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <p className="text-sm text-gray-400 font-body italic">No comments yet. Be the first to add one.</p>
            ) : (
              <div className="space-y-4">
                {comments.map((c) => {
                  const isMe = c.author.email === user?.email;
                  return (
                    <div key={c.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex-shrink-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-brand-700 font-body">
                          {c.author.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className={`flex-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div className={`flex items-center gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <span className="text-xs font-semibold text-gray-700 font-body">{c.author.name}</span>
                          <span className="text-xs text-gray-400 font-body">{formatDate(c.createdAt)}</span>
                        </div>
                        <div className={`px-3 py-2 rounded-xl text-sm font-body leading-relaxed max-w-[85%] ${
                          isMe
                            ? 'bg-brand-600 text-white rounded-tr-sm'
                            : 'bg-surface-100 text-gray-700 rounded-tl-sm'
                        }`}>
                          {c.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Add comment footer */}
        <div className="px-6 py-4 border-t border-surface-200 bg-surface-50">
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 resize-none rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm font-body text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (comment.trim()) mutation.mutate({ content: comment.trim() });
                }
              }}
            />
            <button
              onClick={() => { if (comment.trim()) mutation.mutate({ content: comment.trim() }); }}
              disabled={!comment.trim() || mutation.isPending}
              className="flex-shrink-0 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium font-body hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {mutation.isPending ? '...' : 'Send'}
            </button>
          </div>
          <p className="text-xs text-gray-400 font-body mt-1.5">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </>
  );
}