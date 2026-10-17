import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import { sendConnectionRequest, cancelConnectionRequest, blockUser } from '../../api/connections';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Textarea } from '../ui/Input';
import type { Connection } from '../../types/api';
import { UserPlus, MessageCircle, ShieldOff, Clock } from 'lucide-react';

interface ConnectButtonProps {
  targetUserId: string;
  connection: Connection | null;
  hasConversation?: boolean;
  conversationId?: string;
  onConnect?: () => void;
  onConversationOpen?: (convId: string) => void;
}

export function ConnectButton({
  targetUserId,
  connection,
  hasConversation,
  conversationId,
  onConnect,
  onConversationOpen,
}: ConnectButtonProps) {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [connectOpen, setConnectOpen] = useState(false);
  const [connectMsg, setConnectMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendRequest = async () => {
    if (!connectMsg.trim()) {
      toast('Please include a short message with your request.', 'error');
      return;
    }
    if (connectMsg.trim().length > 300) {
      toast('Message too long (max 300 characters)', 'error');
      return;
    }
    setLoading(true);
    try {
      await sendConnectionRequest(targetUserId, connectMsg.trim());
      toast('Connection request sent!', 'success');
      setConnectOpen(false);
      setConnectMsg('');
      onConnect?.();
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!connection) return;
    setLoading(true);
    try {
      await cancelConnectionRequest(connection._id);
      toast('Request cancelled', 'info');
      onConnect?.();
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Don't show connect button to self
  if (targetUserId === userId) return null;

  if (!connection || connection.status === 'declined' || connection.status === 'cancelled') {
    return (
      <>
        <Button onClick={() => setConnectOpen(true)}>
          <UserPlus size={15} />
          Connect
        </Button>
        <Modal isOpen={connectOpen} onClose={() => setConnectOpen(false)} title="Send Connection Request" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-mercury-gray-600">
              Personalize your request with a short message (required).
            </p>
            <Textarea
              label="Message"
              placeholder="Hi! I'm a fellow Apex student interested in..."
              value={connectMsg}
              onChange={(e) => setConnectMsg(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-mercury-gray-400">{connectMsg.length}/300</p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setConnectOpen(false)}>Cancel</Button>
              <Button
                size="sm"
                onClick={handleSendRequest}
                loading={loading}
                disabled={!connectMsg.trim()}
              >
                Send Request
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  if (connection.status === 'pending') {
    const isSender = connection.requesterId === userId;
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-mercury-gray-500 font-medium">
          <Clock size={13} />
          {isSender ? 'Request sent' : 'Request received'}
        </div>
        {isSender && (
          <Button variant="secondary" size="sm" loading={loading} onClick={handleCancel}>
            Cancel
          </Button>
        )}
      </div>
    );
  }

  if (connection.status === 'accepted') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-green-600 font-semibold bg-green-50 px-2.5 py-1 rounded-full">Connected</span>
        {hasConversation && conversationId && (
          <Button variant="secondary" size="sm" onClick={() => onConversationOpen?.(conversationId)}>
            <MessageCircle size={13} />
            Message
          </Button>
        )}
      </div>
    );
  }

  return null;
}
