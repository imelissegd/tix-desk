import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTicket, type TicketPriority } from '../../services/ticketService';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be under 200 characters'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const),
  category: z.string().max(100).optional(),
});

type FormData = z.infer<typeof schema>;

const priorities: { value: TicketPriority; label: string; desc: string }[] = [
  { value: 'LOW',      label: 'Low',      desc: 'Minor issue, no urgency' },
  { value: 'MEDIUM',   label: 'Medium',   desc: 'Needs attention soon' },
  { value: 'HIGH',     label: 'High',     desc: 'Impacting work significantly' },
  { value: 'CRITICAL', label: 'Critical', desc: 'Completely blocked' },
];

const priorityColors: Record<TicketPriority, string> = {
  LOW:      'border-green-300 bg-green-50 text-green-700',
  MEDIUM:   'border-yellow-300 bg-yellow-50 text-yellow-700',
  HIGH:     'border-orange-300 bg-orange-50 text-orange-700',
  CRITICAL: 'border-red-300 bg-red-50 text-red-700',
};

const prioritySelected: Record<TicketPriority, string> = {
  LOW:      'ring-2 ring-green-400 border-green-400 bg-green-50',
  MEDIUM:   'ring-2 ring-yellow-400 border-yellow-400 bg-yellow-50',
  HIGH:     'ring-2 ring-orange-400 border-orange-400 bg-orange-50',
  CRITICAL: 'ring-2 ring-red-400 border-red-400 bg-red-50',
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-500 font-body mt-1">{message}</p>;
}

export default function ClientNewTicket() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'MEDIUM' },
  });

  const selectedPriority = watch('priority');

  const mutation = useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      navigate('/client/tickets');
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate({
      title: data.title,
      description: data.description,
      priority: data.priority,
      category: data.category || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <Link
            to="/client/tickets"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-body mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to My Tickets
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 font-display">New Support Ticket</h1>
          <p className="text-sm text-gray-500 font-body mt-1">
            Describe your issue and we'll get back to you as soon as possible
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-sm border border-surface-200 overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)}>

            <div className="p-6 space-y-6">

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('title')}
                  type="text"
                  placeholder="Brief summary of the issue"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-body text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition ${
                    errors.title ? 'border-red-300 bg-red-50' : 'border-surface-200 bg-white'
                  }`}
                />
                <FieldError message={errors.title?.message} />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('description')}
                  rows={5}
                  placeholder="Describe the problem in detail — what happened, what you expected, and any steps to reproduce..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-body text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition resize-none ${
                    errors.description ? 'border-red-300 bg-red-50' : 'border-surface-200 bg-white'
                  }`}
                />
                <FieldError message={errors.description?.message} />
              </div>

              {/* Priority — card selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 font-body mb-2">
                  Priority <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {priorities.map(({ value, label, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setValue('priority', value)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        selectedPriority === value
                          ? prioritySelected[value]
                          : 'border-surface-200 bg-white hover:border-surface-300'
                      }`}
                    >
                      <p className={`text-sm font-semibold font-body ${
                        selectedPriority === value ? '' : 'text-gray-700'
                      }`}>
                        {label}
                      </p>
                      <p className={`text-xs font-body mt-0.5 ${
                        selectedPriority === value ? 'opacity-80' : 'text-gray-400'
                      }`}>
                        {desc}
                      </p>
                    </button>
                  ))}
                </div>
                <FieldError message={errors.priority?.message} />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
                  Category <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  {...register('category')}
                  type="text"
                  placeholder="e.g. Billing, Account, Technical"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 bg-white text-sm font-body text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                />
                <FieldError message={errors.category?.message} />
              </div>

              {/* Submission error */}
              {mutation.isError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-600 font-body">Failed to submit ticket. Please try again.</p>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-surface-50 border-t border-surface-100">
              <Link
                to="/client/tickets"
                className="px-4 py-2.5 text-sm font-medium font-body text-gray-600 hover:text-gray-800 hover:bg-surface-100 rounded-xl transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || mutation.isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium font-body rounded-xl transition-colors shadow-sm"
              >
                {mutation.isPending ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Submitting…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Submit Ticket
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}