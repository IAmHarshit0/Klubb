import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getConversations, getMessages, sendMessage } from '../api/messaging';
import { ConversationList } from '../components/messaging/ConversationList';
import { MessageThread } from '../components/messaging/MessageThread';
import { MessageInput } from '../components/messaging/MessageInput';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../components/ui/Toast';
import { MessageCircle, ShieldCheck, Lock } from 'lucide-react';
import type { Conversation, Message } from '../types/api';

export function MessagingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryConversationId = searchParams.get('conversationId');
  const queryTargetId = searchParams.get('targetId');

  const { userId } = useAuth();
  const { socket, isConnected } = useSocket();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [liveMessages, setLiveMessages] = useState<Message[]>([]);

  // 1. Fetch conversations
  const { data: convData, isLoading: loadingConvs } = useQuery({
    queryKey: ['conversations', userId],
    queryFn: getConversations,
  });

  const conversations = convData?.conversations || [];

  // Match initial conversation from query params
  useEffect(() => {
    if (conversations.length > 0) {
      if (queryConversationId) {
        const found = conversations.find((c) => c.id === queryConversationId);
        if (found) setActiveConv(found);
      } else if (queryTargetId) {
        const found = conversations.find((c) => c.participantIds.includes(queryTargetId));
        if (found) setActiveConv(found);
      } else if (!activeConv) {
        setActiveConv(conversations[0]);
      }
    }
  }, [conversations, queryConversationId, queryTargetId]);

  // 2. Fetch messages for active conversation
  const { data: msgData, isLoading: loadingMsgs } = useQuery({
    queryKey: ['messages', activeConv?.id],
    queryFn: () => getMessages(activeConv!.id),
    enabled: !!activeConv?.id,
  });

  // Keep live messages in sync with loaded messages
  useEffect(() => {
    if (msgData?.messages) {
      setLiveMessages(msgData.messages);
    }
  }, [msgData]);

  // 3. Socket.IO Room Join & Listener
  useEffect(() => {
    if (!socket || !activeConv?.id) return;

    // Join room
    socket.emit('conversation:join', { conversationId: activeConv.id }, (res: any) => {
      if (res?.error) {
        toast(`Chat security gate: ${res.error}`, 'error');
      }
    });

    // Listen for new messages in this room
    const handleNewMessage = (msg: {
      id: string;
      conversationId: string;
      senderId: string;
      text: string;
      createdAt: string;
    }) => {
      if (msg.conversationId === activeConv.id) {
        setLiveMessages((prev) => {
          if (prev.some((m) => m._id === msg.id)) return prev;
          return [
            ...prev,
            {
              _id: msg.id,
              conversationId: msg.conversationId,
              senderId: msg.senderId,
              text: msg.text,
              createdAt: msg.createdAt,
            },
          ];
        });
      }
    };

    socket.on('message:new', handleNewMessage);

    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [socket, activeConv?.id, toast]);

  // 4. Send Message Mutation
  const sendMutation = useMutation({
    mutationFn: (text: string) => sendMessage(activeConv!.id, text),
    onSuccess: (data) => {
      setLiveMessages((prev) => {
        if (prev.some((m) => m._id === data.message._id)) return prev;
        return [...prev, data.message];
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (err: any) => {
      toast(err.message || 'Failed to send message', 'error');
    },
  });

  const handleSelectConv = (conv: Conversation) => {
    setActiveConv(conv);
    setSearchParams({ conversationId: conv.id });
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col md:flex-row bg-white">
      {/* Left panel: Conversation List */}
      <div className="w-full md:w-80 border-r border-mercury-gray-100 flex flex-col h-full bg-white">
        <div className="p-4 border-b border-mercury-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-mercury-black" />
            <h1 className="text-sm font-bold tracking-tight text-mercury-black uppercase">
              Direct Messages
            </h1>
          </div>
          <span className="text-[10px] tracking-widest uppercase bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold">
            Accepted Only
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="p-6 text-center text-xs text-mercury-gray-400">Loading chats...</div>
          ) : (
            <ConversationList
              conversations={conversations}
              activeConversationId={activeConv?.id}
              onSelect={handleSelectConv}
            />
          )}
        </div>
      </div>

      {/* Right panel: Chat Thread */}
      <div className="flex-1 flex flex-col h-full bg-white">
        {activeConv ? (
          <>
            {/* Thread Header */}
            <div className="px-6 py-3.5 border-b border-mercury-gray-100 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-mercury-black text-white flex items-center justify-center text-sm font-bold shadow-mercury-sm">
                  {activeConv.otherUser?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-mercury-black">
                    {activeConv.otherUser?.name || 'Direct Chat'}
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs text-mercury-gray-400">
                    <ShieldCheck size={11} className="text-green-600" />
                    <span>Connection Verified & Authoritative</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs text-mercury-gray-400">
                <Lock size={12} />
                <span>Socket.IO Encrypted Session</span>
              </div>
            </div>

            {/* Messages Body */}
            {loadingMsgs ? (
              <div className="flex-1 flex items-center justify-center text-xs text-mercury-gray-400">
                Loading messages...
              </div>
            ) : (
              <MessageThread
                messages={liveMessages}
                currentUserId={userId}
                otherUserName={activeConv.otherUser?.name}
              />
            )}

            {/* Input Bar */}
            <MessageInput
              onSend={async (text) => {
                await sendMutation.mutateAsync(text);
              }}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-mercury-gray-400">
            <div className="w-16 h-16 rounded-3xl bg-mercury-gray-50 flex items-center justify-center mb-4">
              <MessageCircle size={28} className="text-mercury-gray-300" />
            </div>
            <h3 className="text-base font-bold text-mercury-black mb-1">Select a Conversation</h3>
            <p className="text-xs max-w-sm text-mercury-gray-500">
              Only mutual accepted connections are granted real-time messaging authorization.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
