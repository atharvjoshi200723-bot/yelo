import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Notification } from '../types';
import { Bell, UserPlus, MessageCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function getNotificationIcon(type: string) {
  switch (type) {
    case 'buddy_request': return <UserPlus size={18} className="text-amber-500" />;
    case 'buddy_accepted': return <CheckCircle size={18} className="text-sage-500" />;
    case 'rental_request': return <MessageCircle size={18} className="text-navy-500" />;
    case 'rental_accepted': return <CheckCircle size={18} className="text-sage-500" />;
    default: return <Bell size={18} className="text-navy-400" />;
  }
}

function getNotificationRoute(notification: Notification): string | null {
  const data = notification.data as Record<string, unknown> | undefined;

  switch (notification.type) {
    case 'buddy_request': {
      const requestId = data?.requestId as string | undefined;
      if (requestId) return `/buddy/requests/${requestId}`;
      return null;
    }
    case 'buddy_accepted': {
      const convId = data?.conversationId as string | undefined;
      if (convId) return `/messages?conv=${convId}`;
      return '/messages';
    }
    case 'rental_request': {
      const rawRequestId = data?.requestId;
      const requestId = typeof rawRequestId === 'string'
        ? rawRequestId
        : ((rawRequestId as Record<string, unknown>)?.id as string | undefined);
      if (requestId) return `/rentals/requests/${requestId}`;
      const listingId = data?.listingId as string | undefined;
      if (listingId) return `/rent/${listingId}`;
      return '/messages';
    }
    case 'rental_accepted': {
      const convId = data?.conversationId as string | undefined;
      if (convId) return `/messages?conv=${convId}`;
      const rawRequestId = data?.requestId;
      const requestId = typeof rawRequestId === 'string'
        ? rawRequestId
        : ((rawRequestId as Record<string, unknown>)?.id as string | undefined);
      if (requestId) return `/rentals/requests/${requestId}`;
      return '/messages';
    }
    case 'message': {
      const convId = data?.conversationId as string | undefined;
      if (convId) return `/messages?conv=${convId}`;
      return '/messages';
    }
    case 'forum_reply': {
      const postId = data?.postId as string | undefined;
      if (postId) return `/forums/post/${postId}`;
      return '/forums';
    }
    default:
      return null;
  }
}

function getIconCircle(type: string) {
  switch (type) {
    case 'buddy_request':
      return (
        <div className="w-10 h-10 rounded-full border-2 border-[#1B1250] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#9A63E6' }}>
          <UserPlus size={16} className="text-white" />
        </div>
      );
    case 'buddy_accepted':
      return (
        <div className="w-10 h-10 rounded-full border-2 border-[#1B1250] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#3F8A12' }}>
          <CheckCircle size={16} className="text-white" />
        </div>
      );
    case 'rental_request':
      return (
        <div className="w-10 h-10 rounded-full border-2 border-[#1B1250] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E8622B' }}>
          <MessageCircle size={16} className="text-white" />
        </div>
      );
    case 'rental_accepted':
      return (
        <div className="w-10 h-10 rounded-full border-2 border-[#1B1250] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#3F8A12' }}>
          <CheckCircle size={16} className="text-white" />
        </div>
      );
    case 'message':
      return (
        <div className="w-10 h-10 rounded-full border-2 border-[#1B1250] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#2FA3B5' }}>
          <MessageCircle size={16} className="text-white" />
        </div>
      );
    default:
      return (
        <div className="w-10 h-10 rounded-full border-2 border-[#1B1250] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#1B1250' }}>
          <Bell size={16} style={{ color: '#F6FBD4' }} />
        </div>
      );
  }
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications')
      .then(res => {
        setNotifications(res.data.notifications || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      try {
        await api.post(`/notifications/${notification.id}/read`);
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        );
      } catch { /* ignore */ }
    }

    // Navigate to relevant page
    const route = getNotificationRoute(notification);
    if (route) {
      navigate(route);
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24" style={{ backgroundColor: '#EAE4FB', minHeight: '100vh' }}>
        {/* Header skeleton */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full border-3 border-[#1B1250] bg-[#F6FBD4] animate-pulse" />
          <div className="h-7 w-40 rounded-full bg-[#1B1250]/10 animate-pulse border border-dashed border-[#1B1250]/30" />
        </div>
        {/* Skeleton cards */}
        <div className="space-y-4">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="bg-[#F6FBD4] border-dashed border-[#1B1250]/30 border-3 rounded-[24px] p-4 animate-pulse"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1B1250]/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#1B1250]/10 rounded-full w-3/4" />
                  <div className="h-3 bg-[#1B1250]/10 rounded-full w-full" />
                  <div className="h-3 bg-[#1B1250]/10 rounded-full w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24" style={{ backgroundColor: '#EAE4FB', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-[#F6FBD4] border-3 border-[#1B1250] shadow-neo flex items-center justify-center flex-shrink-0 hover:shadow-neo-pressed transition-all"
        >
          <ArrowLeft size={18} className="text-[#1B1250]" />
        </button>
        <h1 className="font-display font-black text-2xl text-[#1B1250]">Notifications</h1>
      </div>

      {notifications.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-20 h-20 rounded-[22px] border-3 border-[#1B1250] shadow-neo bg-[#F6FBD4] flex items-center justify-center mb-5">
            <span className="text-4xl">🔔</span>
          </div>
          <p className="font-display font-black text-xl text-[#1B1250] mb-2">No notifications yet</p>
          <p className="text-sm font-bold text-[#1B1250]/60">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif, idx) => {
            const route = getNotificationRoute(notif);
            const rotate = idx % 2 === 0 ? '-rotate-1' : 'rotate-1';
            return (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                disabled={!route}
                className={`w-full text-left bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[24px] shadow-[4px_5px_0_#1B1250] p-4 transition-all duration-200 hover:rotate-0 ${rotate} ${route ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="flex items-start gap-3">
                  {getIconCircle(notif.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-sm text-[#1B1250] line-clamp-1">{notif.title}</p>
                      {!notif.is_read && (
                        <span className="w-2.5 h-2.5 bg-[#C5F030] border-2 border-[#1B1250] rounded-full flex-shrink-0 animate-bounce" />
                      )}
                    </div>
                    <p className="font-bold text-sm text-[#1B1250]/70 mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#1B1250]/60 mt-1.5">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
