import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Ban, CheckCircle } from 'lucide-react';

interface BlockButtonProps {
  targetUserId: string;
  onBlockChange?: (blocked: boolean) => void;
}

export default function BlockButton({ targetUserId, onBlockChange }: BlockButtonProps) {
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if already blocked by looking for the user in blocked list
    // We'll just show the block button and let the user toggle
    setChecking(false);
  }, [targetUserId]);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (blocked) {
        await api.post(`/users/${targetUserId}/unblock`);
        setBlocked(false);
        onBlockChange?.(false);
      } else {
        if (!confirm('Block this user? They won\'t be able to see your profile or contact you.')) {
          setLoading(false);
          return;
        }
        await api.post(`/users/${targetUserId}/block`);
        setBlocked(true);
        onBlockChange?.(true);
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      alert(apiErr.response?.data?.error || 'Failed');
    }
    setLoading(false);
  };

  if (checking) return null;

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        blocked
          ? 'bg-sage-50 text-sage-600 hover:bg-sage-100'
          : 'bg-red-50 text-red-600 hover:bg-red-100'
      }`}
      aria-label={blocked ? `Unblock user` : `Block user`}
      aria-pressed={blocked}
    >
      {blocked ? (
        <>
          <CheckCircle size={16} aria-hidden="true" />
          {loading ? 'Unblocking...' : 'Unblock'}
        </>
      ) : (
        <>
          <Ban size={16} aria-hidden="true" />
          {loading ? 'Blocking...' : 'Block'}
        </>
      )}
    </button>
  );
}
