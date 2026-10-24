import type { ReactNode } from 'react';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { SocialPost } from '../../types';
import { formatPlanDateTime, type PlanDetails } from '../../lib/plans';

interface PlanCardProps {
  post: SocialPost;
  plan: PlanDetails;
  actions: ReactNode;
}

export default function PlanCard({ post, plan, actions }: PlanCardProps) {
  return (
    <div className="bg-white rounded-3xl shadow-soft overflow-hidden animate-fade-in">
      <div className={`bg-gradient-to-br ${plan.activity.gradient} px-5 py-4 text-cream-50`}>
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-[11px] font-medium">
            {plan.activity.emoji} {plan.activity.label}
          </span>
          {plan.isPast ? (
            <span className="px-2.5 py-1 rounded-full bg-navy-900/45 text-[10px] font-semibold uppercase tracking-wider">
              Ended
            </span>
          ) : (
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cream-50/70">
              LinkUp
            </span>
          )}
        </div>

        <h2 className="font-display text-xl leading-snug mt-3">
          {post.title || plan.activity.label}
        </h2>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={14} className="opacity-80" />
            {formatPlanDateTime(plan.startsAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={14} className="opacity-80" />
            {plan.capacity} spots available
          </span>
        </div>
      </div>

      <div className="px-5 pt-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-navy-900 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-cream-50 text-xs font-medium">{post.author_name?.charAt(0) || '?'}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-navy-900 truncate">{post.author_name || 'YELO member'}</p>
            <p className="text-[11px] text-navy-400 truncate">
              {post.author_city || 'Dehradun'} · posted {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>

        {plan.description && (
          <p className="text-sm text-navy-800 whitespace-pre-wrap leading-relaxed mt-3">
            {plan.description}
          </p>
        )}

        {post.location_name && (
          <div className="flex items-center gap-1.5 text-sm text-navy-400 mt-3">
            <MapPin size={14} />
            <span>{post.location_name}</span>
          </div>
        )}
      </div>

      <div className="px-5 py-3 mt-4 border-t border-navy-100/20 flex items-center gap-5">
        {actions}
      </div>
    </div>
  );
}
