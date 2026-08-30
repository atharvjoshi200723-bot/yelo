import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { getSocket, disconnectSocket } from '../lib/socket';
import { Conversation, Message } from '../types';
import { Send, ArrowLeft, MessageCircle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { ErrorState, EmptyState, ListSkeleton } from '../components/ui/FeedbackStates';

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

  // --- Real-time Socket.IO ---
  useEffect(() => {
    let socket;
    try {
      socket = getSocket();
    } catch {
      return; // No token — not logged in
    }

    const handleNewMessage = (msg: Message & { conversation_id: string }) => {
      // If the message belongs to the currently open conversation, append it
      if (selectedConv && msg.conversation_id === selectedConv.id) {
        // Deduplicate: don't add if we already have this message id
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }

      // Update the conversation list: move the affected conversation to top, update last_message
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === msg.conversation_id);
        if (idx === -1) return prev; // Conversation not in our list — ignore
        const updated = [...prev];
        const conv = { ...updated[idx] };
        conv.last_message = msg.content;
        conv.last_message_at = msg.created_at;
        // Increment unread if it's not the currently open conversation
        if (!selectedConv || selectedConv.id !== msg.conversation_id) {
          conv.unread_count = (conv.unread_count || 0) + 1;
        }
        // Move to top
        updated.splice(idx, 1);
        updated.unshift(conv);
        return updated;
      });
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [selectedConv]);

  // Clean up socket on logout/unmount
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
    const labels: Record<string, { label: string; color: string }> = {
      rental: { label: '📦 Rental', color: 'bg-amber-500/10 text-amber-600' },
      buddy: { label: '👥 Buddy', color: 'bg-sage-500/10 text-sage-600' },
      general: { label: '💬 General', color: 'bg-navy-100 text-navy-600' },
    };
    return labels[type] || labels.general;
  };

  if (loading) return <ListSkeleton count={4} height="h-20" />;

  if (error) return <ErrorState message={error} onRetry={fetchConversations} />;

  // Conversation list view
  if (!selectedConv) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="font-display text-display-lg text-navy-900">
            Who are you<br />talking to?
          </h1>
        </div>

        {conversations.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-cream-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={28} className="text-navy-300" />
            </div>
            <p className="font-display text-display-sm text-navy-800 mb-2">No conversations yet</p>
            <p className="text-sm text-navy-400">Your conversations will appear here</p>
          </div>
        ) : (
          <>
            {/* Unread section */}
            {conversations.some(c => (c.unread_count ?? 0) > 0) && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-navy-400 tracking-wider uppercase mb-3">Unread</p>
                <div className="space-y-2">
                  {conversations.filter(c => (c.unread_count ?? 0) > 0).map(conv => {
                    const ctx = getConversationContext(conv);
                    return (
                      <button key={conv.id} onClick={() => setSelectedConv(conv)}
                        className="w-full bg-white rounded-2xl p-4 shadow-soft card-hover text-left flex items-center gap-4 animate-fade-in">
                        <div className="w-12 h-12 bg-navy-900 rounded-2xl flex items-center justify-center flex-shrink-0">
                          <span className="text-cream-50 font-medium">{conv.other_user?.name?.charAt(0) || '?'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-navy-900 text-sm">{conv.other_user?.name || 'Unknown'}</p>
                            <span className="text-[10px] text-navy-400">
                              {conv.last_message_at && formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
                            </span>
                          </div>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${ctx.color} mt-1`}>
                            {ctx.label}
                          </span>
                          <p className="text-xs text-navy-500 truncate mt-1">{conv.last_message || 'No messages yet'}</p>
                        </div>
                        <span className="w-5 h-5 bg-coral-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                          {conv.unread_count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All conversations */}
            <p className="text-xs font-semibold text-navy-400 tracking-wider uppercase mb-3">
              {conversations.some(c => (c.unread_count ?? 0) > 0) ? 'All conversations' : 'Conversations'}
            </p>
            <div className="space-y-2">
              {conversations.map(conv => {
                const ctx = getConversationContext(conv);
                const isUnread = (conv.unread_count ?? 0) > 0;
                return (
                  <button key={conv.id} onClick={() => setSelectedConv(conv)}
                    className={`w-full rounded-2xl p-4 card-hover text-left flex items-center gap-4 animate-fade-in transition-all ${
                      isUnread ? 'bg-white shadow-soft' : 'bg-white/60'
                    }`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      isUnread ? 'bg-navy-900' : 'bg-navy-100'
                    }`}>
                      <span className={`font-medium ${isUnread ? 'text-cream-50' : 'text-navy-600'}`}>
                        {conv.other_user?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm ${isUnread ? 'font-semibold text-navy-900' : 'font-medium text-navy-700'}`}>
                          {conv.other_user?.name || 'Unknown'}
                        </p>
                        <span className="text-[10px] text-navy-400">
                          {conv.last_message_at && formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
                        </span>
                      </div>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${ctx.color} mt-1`}>
                        {ctx.label}
                      </span>
                      <p className="text-xs text-navy-400 truncate mt-1">{conv.last_message || 'No messages yet'}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // Chat view
  return (
    <div className="flex flex-col -mx-4 -mt-4" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Chat header */}
      <div className="px-4 py-3 bg-white/95 backdrop-blur-lg border-b border-navy-100/20 flex items-center gap-3">
        <button onClick={() => setSelectedConv(null)} className="p-1 hover:bg-navy-50 rounded-xl transition-colors">
          <ArrowLeft size={20} className="text-navy-600" />
        </button>
        <div className="w-10 h-10 bg-navy-900 rounded-2xl flex items-center justify-center">
          <span className="text-cream-50 font-medium text-sm">{selectedConv.other_user?.name?.charAt(0) || '?'}</span>
        </div>
        <div>
          <p className="font-semibold text-navy-900 text-sm">{selectedConv.other_user?.name || 'Unknown'}</p>
          <div className="flex items-center gap-1">
            <CheckCircle size={10} className="text-sage-500" />
            <span className="text-[10px] text-navy-400">Verified · Dehradun</span>
          </div>
        </div>
      </div>

      {/* Context object */}
      <div className="mx-4 mt-3 bg-cream-100 rounded-xl p-3">
        <p className="text-[10px] font-semibold text-navy-400 tracking-wider uppercase">Context</p>
        <p className="text-xs font-medium text-navy-700 mt-0.5">
          {selectedConv.title || 'General conversation'}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${msg.sender_id === user?.id ? '' : 'flex items-end gap-2'}`}>
              {msg.sender_id !== user?.id && (
                <div className="w-7 h-7 bg-navy-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] text-navy-600">{msg.sender_name?.charAt(0) || '?'}</span>
                </div>
              )}
              <div>
                <div className={`px-4 py-2.5 rounded-2xl ${
                  msg.sender_id === user?.id
                    ? 'bg-navy-900 text-cream-50 rounded-br-md'
                    : 'bg-white text-navy-800 rounded-bl-md shadow-soft'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
                <p className={`text-[10px] text-navy-400 mt-1 ${msg.sender_id === user?.id ? 'text-right' : ''}`}>
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-navy-100/20">
        <div className="flex gap-3 items-center">
          <input type="text" value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            className="flex-1 px-4 py-3 bg-cream-50 border border-navy-100/30 rounded-2xl text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-amber-500/30 transition-all"
            placeholder="Message..." />
          <button onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            className="w-11 h-11 bg-navy-900 text-cream-50 rounded-2xl flex items-center justify-center hover:bg-navy-800 disabled:opacity-50 transition-all btn-press">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
