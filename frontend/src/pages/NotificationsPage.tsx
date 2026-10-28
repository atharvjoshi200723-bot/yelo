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
      <div className="max-w-lg mx-auto px-4 pt-20 pb-24">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-20 pb-24">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-navy-500 hover:text-navy-700 mb-4">
        <ArrowLeft size={18} /> Back
      </button>

      <h1 className="font-display text-display-sm text-navy-900 mb-6">Notifications</h1>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-cream-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Bell size={28} className="text-navy-300" />
          </div>
          <p className="font-display text-display-sm text-navy-800 mb-2">No notifications</p>
          <p className="text-sm text-navy-400">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => {
            const route = getNotificationRoute(notif);
            return (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                disabled={!route}
                className={`w-full text-left p-4 rounded-2xl transition-all duration-200 ${
                  notif.is_read
                    ? 'bg-white hover:bg-cream-50'
                    : 'bg-amber-50/50 hover:bg-amber-50 border border-amber-200/50'
                } ${route ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-cream-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${notif.is_read ? 'text-navy-600' : 'text-navy-900'}`}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-navy-500 mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-xs text-navy-300 mt-1">
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
