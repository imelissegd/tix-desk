// frontend/src/components/shared/TicketDetailPanel.tsx
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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TicketDetailPanel({ ticket, onClose }: Props) {
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isAgent = user?.role === 'AGENT';
  const isAssignedToMe = ticket?.assignedTo?.id === user?.userId;

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', ticket?.id],
    queryFn: () => getComments(ticket!.id),
    enabled: !!ticket,
  });

  const mutation = useMutation({
    mutationFn: ({
      content,
      internal,
    }: {
      content: string;
      internal: boolean;
    }) =>
      addComment(ticket!.id, { content, isInternal: internal }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', ticket?.id] });
      setComment('');
      setIsInternal(false);
    },
  });

  const handleSend = () => {
    if (!comment.trim()) return;

    mutation.mutate({
      content: comment.trim(),
      internal: isAgent ? isInternal : false,
    });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (!ticket) setIsInternal(false);
  }, [ticket]);

  if (!ticket) return null;

  const showCommentBox = !isAgent || isAssignedToMe;

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* Metadata */}
          <div className="px-6 py-5 grid grid-cols-2 gap-4 border-b border-surface-100">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Status</p>
              <StatusBadge status={ticket.status} />
            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Priority</p>
              <PriorityBadge priority={ticket.priority} />
            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Assigned To</p>
              <p className="text-sm font-medium text-gray-700">
                {ticket.assignedTo?.name ?? (
                  <span className="text-gray-400 italic">Unassigned</span>
                )}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Category</p>
              <p className="text-sm font-medium text-gray-700">
                {ticket.category ?? (
                  <span className="text-gray-400 italic">None</span>
                )}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Created</p>
              <p className="text-sm text-gray-600">
                {formatDate(ticket.createdAt)}
              </p>
            </div>

            {ticket.resolvedAt && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Resolved</p>
                <p className="text-sm text-gray-600">
                  {formatDate(ticket.resolvedAt)}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="px-6 py-5 border-b border-surface-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
              Description
            </p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          {/* Comments */}
          <div className="px-6 py-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">
              Comments {comments.length > 0 && `(${comments.length})`}
            </p>

            {commentsLoading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-gray-400 italic"> - </p>
            ) : (
              <div className="space-y-4">
                {comments.map((c) => {
                  const isMe = c.author.email === user?.email;
                  const isInternalNote = c.isInternal;

                  return (
                    <div
                      key={c.id}
                      className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isInternalNote ? 'bg-yellow-100' : 'bg-brand-100'
                        }`}
                      >
                        <span
                          className={`text-xs font-bold ${
                            isInternalNote ? 'text-yellow-700' : 'text-brand-700'
                          }`}
                        >
                          {c.author.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-700">
                            {c.author.name}
                          </span>

                          {isInternalNote && (
                            <span className="text-xs text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded">
                              Internal
                            </span>
                          )}

                          <span className="text-xs text-gray-400">
                            {formatDate(c.createdAt)}
                          </span>
                        </div>

                        <div
                          className={`px-3 py-2 rounded-xl text-sm max-w-[85%] ${
                            isInternalNote
                              ? 'bg-yellow-50 text-yellow-900'
                              : isMe
                              ? 'bg-brand-600 text-white'
                              : 'bg-surface-100 text-gray-700'
                          }`}
                        >
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

        {/* ✅ COMMENT BOX (ONLY WHEN ASSIGNED OR NON-AGENT) */}
        {showCommentBox && (
          <div className="px-6 py-4 border-t border-surface-200 bg-surface-50">

            {/* Internal toggle — agents only */}
            {isAgent && (
              <label className="inline-flex items-center gap-2 mb-3 cursor-pointer select-none group">
                <div className={`relative w-9 h-5 rounded-full transition-colors ${
                  isInternal ? 'bg-yellow-400' : 'bg-surface-300'
                }`}>
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    isInternal ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="sr-only"
                  />
                </div>

                <span className={`text-xs font-medium font-body flex items-center gap-1 ${
                  isInternal ? 'text-yellow-700' : 'text-gray-500'
                }`}>
                  {isInternal ? 'Internal note ' : 'Public reply'}
                </span>
              </label>
            )}

            <div className="flex gap-3 items-end">
              <textarea
                ref={textareaRef}
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className={`flex-1 resize-none rounded-xl border px-3 py-2 text-sm font-body text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition ${
                  isInternal
                    ? 'bg-yellow-50 border-yellow-200 focus:ring-yellow-400'
                    : 'bg-white border-surface-200 focus:ring-brand-500'
                }`}
                placeholder={
                  isInternal
                    ? 'Write an internal note...'
                    : 'Write a comment...'
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />

              <button
                onClick={handleSend}
                disabled={!comment.trim() || mutation.isPending}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium font-body disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                  isInternal
                    ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900'
                    : 'bg-brand-600 hover:bg-brand-700 text-white'
                }`}
              >
                {mutation.isPending ? '...' : isInternal ? 'Note' : 'Send'}
              </button>
            </div>

            <p className="text-xs text-gray-400 font-body mt-1.5">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        )}
      </div>
    </>
  );
}