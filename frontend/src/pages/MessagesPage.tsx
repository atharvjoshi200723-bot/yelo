import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { getSocket, disconnectSocket } from '../lib/socket';
import { Conversation, Message } from '../types';
import { Send, ArrowLeft, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { ErrorState, ListSkeleton } from '../components/ui/FeedbackStates';
import { CandyBall } from '../components/neo/Decorations';

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoSelectRef = useRef<string | null>(null);
  const selectedConvRef = useRef<Conversation | null>(null);

  const fetchConversations = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get('/messages').then(res => {
      const convs = res.data.conversations || [];
      setConversations(convs);
      setLoading(false);
      // Auto-select conversation from ?conv= query param
      const convId = searchParams.get('conv');
      if (convId && !autoSelectRef.current) {
        autoSelectRef.current = convId;
        const match = convs.find((c: Conversation) => c.id === convId);
        if (match) {
          setSelectedConv(match);
        }
      }
    }).catch((err: unknown) => {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr.response?.data?.error || 'Failed to load conversations');
      setLoading(false);
    });
  }, [searchParams]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (selectedConv) {
      api.get(`/messages/${selectedConv.id}/messages`).then(res => {
        setMessages(res.data.messages || []);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });
      // Clear unread count for this conversation
      setConversations(prev => prev.map(c =>
        c.id === selectedConv.id ? { ...c, unread_count: 0 } : c
      ));
    }
  }, [selectedConv]);

  // Keep selectedConvRef in sync with selectedConv state
  useEffect(() => {
    selectedConvRef.current = selectedConv;
  }, [selectedConv]);

  // --- Real-time Socket.IO ---
  useEffect(() => {
    let socket;
    try {
      socket = getSocket();
    } catch {
      return; // No token — not logged in
    }

    const handleNewMessage = (msg: Message & { conversation_id: string }) => {
      const currentConv = selectedConvRef.current;

      // If the message belongs to the currently open conversation, append it
      if (currentConv && msg.conversation_id === currentConv.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }

      // Update the conversation list: move the affected conversation to top, update last_message
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === msg.conversation_id);
        if (idx === -1) return prev;
        const updated = [...prev];
        const conv = { ...updated[idx] };
        conv.last_message = msg.content;
        conv.last_message_at = msg.created_at;
        if (!currentConv || currentConv.id !== msg.conversation_id) {
          conv.unread_count = (conv.unread_count || 0) + 1;
        }
        updated.splice(idx, 1);
        updated.unshift(conv);
        return updated;
      });
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, []);

  // Clean up socket on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  const sendMessage = async () => {
    if (!selectedConv || !newMessage.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/messages/${selectedConv.id}/messages`, { content: newMessage });
      setMessages([...messages, res.data.message]);
      setNewMessage('');
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      alert(apiErr.response?.data?.error || 'Failed to send message');
    }
    setSending(false);
  };

  const getConversationContext = (conv: Conversation) => {
    const type = conv.type || 'general';
    const labels: Record<string, { label: string; badgeClass: string }> = {
      rental: {
        label: '📦 Rental',
        badgeClass: 'bg-[#E8622B] text-white border-2 border-[#1B1250] shadow-[1px_1px_0_#1B1250]',
      },
      buddy: {
        label: '👥 Buddy',
        badgeClass: 'bg-[#C5F030] text-[#1B1250] border-2 border-[#1B1250] shadow-[1px_1px_0_#1B1250]',
      },
      general: {
        label: '💬 General',
        badgeClass: 'bg-[#2FA3B5] text-white border-2 border-[#1B1250] shadow-[1px_1px_0_#1B1250]',
      },
    };
    return labels[type] || labels.general;
  };

  const ringColors = ['ring-[#E8622B]', 'ring-[#2FA3B5]', 'ring-[#9A63E6]', 'ring-[#C5F030]'];

  if (loading) return <ListSkeleton count={4} height="h-20" />;

  if (error) return <ErrorState message={error} onRetry={fetchConversations} />;

  // 1. Conversation List View
  if (!selectedConv) {
    return (
      <div className="w-full relative pb-14">
        {/* Heading with Yellow Highlight */}
        <div className="mb-5 pt-1">
          <h1 className="font-display font-black text-3xl sm:text-4xl text-[#1B1250] tracking-tight leading-[1.08]">
            Who are you <br />
            <span className="inline-block bg-[#FFD41F] text-[#1B1250] border-2.5 border-[#1B1250] shadow-[2px_3px_0_#1B1250] px-3 py-0.5 rounded-[10px] -rotate-1 mt-1">
              talking to?
            </span>
          </h1>
        </div>

        {/* Empty State: Big Candy-Ball Illustration */}
        {conversations.length === 0 ? (
          <div className="text-center py-14 bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[28px] shadow-[6px_8px_0_#1B1250] p-8 -rotate-1 relative overflow-hidden">
            {/* Big Candy Ball Illustration */}
            <div className="flex justify-center mb-5">
              <CandyBall color="purple" size={96} float />
            </div>
            <p className="font-display font-black text-2xl text-[#1B1250] mb-1">
              No conversations yet
            </p>
            <p className="text-xs font-bold text-[#1B1250]/70">
              Your conversations will appear here
            </p>
          </div>
        ) : (
          <div>
            {/* "CONVERSATIONS" Section Label */}
            <p className="text-xs font-black text-[#1B1250] tracking-wider uppercase mb-3 px-1">
              CONVERSATIONS
            </p>

            {/* Speech-Bubble Sticker Cards */}
            <div className="space-y-4">
              {conversations.map((conv, index) => {
                const ctx = getConversationContext(conv);
                const isUnread = (conv.unread_count ?? 0) > 0;
                const otherUserName = conv.other_user?.name || 'Unknown';
                const initial = otherUserName.charAt(0)?.toUpperCase() || '?';
                const avatarRing = ringColors[index % ringColors.length];
                const rotation = index % 2 === 0 ? '-rotate-1 hover:rotate-0' : 'rotate-1 hover:rotate-0';

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setSelectedConv(conv)}
                    className={`w-full bg-[#F6FBD4] text-[#1B1250] border-3 border-[#1B1250] rounded-[24px] rounded-tl-sm p-4.5 sm:p-5 shadow-[4px_6px_0_#1B1250] hover:shadow-[6px_8px_0_#1B1250] text-left transition-all duration-150 active:translate-x-0.5 active:translate-y-0.5 relative select-none ${rotation}`}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Avatar with Colored Ring Overlapping the Bubble Corner */}
                      <div className="relative -ml-2 -mt-1 shrink-0">
                        <div
                          className={`w-12 h-12 rounded-full bg-[#1B1250] border-2.5 border-[#1B1250] ring-3 ${avatarRing} shadow-[2px_2px_0_#1B1250] flex items-center justify-center`}
                        >
                          <span className="text-[#F6FBD4] font-black text-base">
                            {initial}
                          </span>
                        </div>
                      </div>

                      {/* Main Message Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="font-display font-black text-base text-[#1B1250] truncate">
                            {otherUserName}
                          </p>

                          {/* Time as a Small Caps Label */}
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#1B1250]/60 shrink-0">
                            {conv.last_message_at
                              ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })
                              : ''}
                          </span>
                        </div>

                        {/* Category Tag as a Small Badge */}
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${ctx.badgeClass}`}>
                            {ctx.label}
                          </span>

                          {/* Unread indicator: lime dot with bounce & count */}
                          {isUnread && (
                            <div className="flex items-center gap-1 ml-auto">
                              <span className="w-2.5 h-2.5 bg-[#C5F030] border-2 border-[#1B1250] rounded-full animate-bounce" />
                              <span className="px-2 py-0.5 bg-[#C5F030] text-[#1B1250] text-[10px] font-black rounded-full border-2 border-[#1B1250] shadow-[1px_1px_0_#1B1250]">
                                {conv.unread_count}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Last message preview */}
                        <p className={`text-xs mt-1.5 truncate ${isUnread ? 'font-black text-[#1B1250]' : 'font-medium text-[#1B1250]/75'}`}>
                          {conv.last_message || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Active Chat View
  const otherUserName = selectedConv.other_user?.name || 'Unknown';
  const initial = otherUserName.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="flex flex-col -mx-4 -mt-4 bg-[#EAE4FB]/30" style={{ height: 'calc(100dvh - 4rem)' }}>
      {/* Neo Chat Header Bar */}
      <div className="px-4 py-3 bg-[#F6FBD4] border-b-3 border-[#1B1250] shadow-[0_2px_0_#1B1250] flex items-center justify-between gap-3 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedConv(null)}
            className="w-8 h-8 rounded-full bg-white border-2 border-[#1B1250] shadow-[1px_1px_0_#1B1250] flex items-center justify-center text-[#1B1250] active:scale-95 transition-transform"
            aria-label="Back to conversations"
          >
            <ArrowLeft size={16} strokeWidth={3} />
          </button>

          <div className="w-9 h-9 rounded-full bg-[#1B1250] border-2 border-[#1B1250] ring-3 ring-[#9A63E6] flex items-center justify-center shrink-0">
            <span className="text-[#F6FBD4] font-black text-xs">{initial}</span>
          </div>

          <div>
            <p className="font-display font-black text-[#1B1250] text-sm leading-tight">
              {otherUserName}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <CheckCircle size={10} className="text-[#3F8A12] fill-[#3F8A12]" />
              <span className="text-[10px] font-black text-[#1B1250]/70 uppercase tracking-wide">
                Verified · Dehradun
              </span>
            </div>
          </div>
        </div>

        {/* Context pill */}
        <span className="text-[10px] font-black bg-[#C5F030] text-[#1B1250] border-2 border-[#1B1250] shadow-[1px_1px_0_#1B1250] px-2.5 py-0.5 rounded-full uppercase tracking-wider truncate max-w-[120px]">
          {selectedConv.title || 'Chat'}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 no-scrollbar">
        {messages.map(msg => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[82%] ${isMe ? '' : 'flex items-end gap-2'}`}>
                {!isMe && (
                  <div className="w-7 h-7 rounded-full bg-[#1B1250] border-1.5 border-[#1B1250] flex items-center justify-center shrink-0 mb-1">
                    <span className="text-[10px] font-black text-[#F6FBD4]">
                      {msg.sender_name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                <div>
                  <div
                    className={`px-4 py-2.5 border-2.5 border-[#1B1250] font-bold text-xs sm:text-sm leading-relaxed ${
                      isMe
                        ? 'bg-[#C5F030] text-[#1B1250] rounded-[20px] rounded-br-sm shadow-[3px_3px_0_#1B1250]'
                        : 'bg-[#F6FBD4] text-[#1B1250] rounded-[20px] rounded-bl-sm shadow-[3px_3px_0_#1B1250]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  <p className={`text-[9px] font-black uppercase tracking-wider text-[#1B1250]/50 mt-1 ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Neo Message Input Bar */}
      <div className="px-4 py-3 bg-[#F6FBD4] border-t-3 border-[#1B1250] shrink-0">
        <div className="flex gap-2.5 items-center">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            className="flex-1 px-4 py-3 bg-white border-2.5 border-[#1B1250] rounded-full shadow-[2px_2px_0_#1B1250] text-xs sm:text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 focus:outline-none focus:shadow-[3px_3px_0_#1B1250]"
            placeholder="Message..."
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            className="w-11 h-11 bg-[#C5F030] hover:bg-[#bcf01a] text-[#1B1250] border-2.5 border-[#1B1250] shadow-[2px_3px_0_#1B1250] rounded-full flex items-center justify-center disabled:opacity-50 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all shrink-0"
            aria-label="Send message"
          >
            <Send size={16} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}
