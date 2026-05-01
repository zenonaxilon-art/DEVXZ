import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth, UserProfile } from '../contexts/AuthContext';
import { Send, User as UserIcon } from 'lucide-react';

export const Messages = () => {
  const { session, profile } = useAuth();
  const [contacts, setContacts] = useState<UserProfile[]>([]);
  const [activeContact, setActiveContact] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session) {
      fetchContacts();
    }
  }, [session]);

  useEffect(() => {
    if (activeContact && session) {
      fetchMessages();
      
      // Subscribe to real-time changes
      const channel = supabase
        .channel('messages_channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `sender_id=eq.${activeContact.id}`, // Listen for messages from them to us
          },
          (payload) => {
             // Only add if it's meant for us
             if (payload.new.receiver_id === session.user.id) {
               setMessages(prev => [...prev, payload.new]);
             }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `sender_id=eq.${session.user.id}`, // Listen for messages from us to them (multi-device sync)
          },
          (payload) => {
             if (payload.new.receiver_id === activeContact.id) {
               const exists = messages.find(m => m.id === payload.new.id);
               if (!exists) setMessages(prev => [...prev, payload.new]);
             }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeContact, session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchContacts = async () => {
    if (!session) return;
    try {
      // Get all users for now since this is a demo, in a real app you'd get users you have messages with.
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('id', session.user.id) // Exclude current user
        .limit(20);

      if (error) throw error;
      setContacts(data || []);
      if (data && data.length > 0) {
        setActiveContact(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!session || !activeContact) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${activeContact.id}),and(sender_id.eq.${activeContact.id},receiver_id.eq.${session.user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !session || !activeContact) return;

    const msgText = newMessage.trim();
    setNewMessage(''); // optimistic clear
    
    // Optimistic UI update
    const tempMsg = {
       id: 'temp-' + Date.now(),
       sender_id: session.user.id,
       receiver_id: activeContact.id,
       content: msgText,
       created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: session.user.id,
          receiver_id: activeContact.id,
          content: msgText,
        });

      if (error) throw error;
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove temp message if failed
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    }
  };

  if (loading) return <div className="text-gray-500 p-8 text-center text-sm uppercase tracking-widest mt-10">Loading messages...</div>;

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-64px)] flex text-[#E5E5E5] w-full flex-1">
      
      {/* Contacts Sidebar */}
      <div className="w-80 border-r border-[#262626] bg-[#0A0A0A] flex flex-col">
        <div className="p-6 border-b border-[#262626] bg-[#0D0D0D]">
          <h2 className="font-serif italic text-xl">Conversations</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map(contact => (
            <div 
              key={contact.id}
              onClick={() => setActiveContact(contact)}
              className={`p-4 border-b border-[#262626] cursor-pointer hover:bg-[#111] transition flex items-center space-x-3 ${activeContact?.id === contact.id ? 'bg-[#111] border-l-2 border-l-[#D4AF37]' : ''}`}
            >
              <div className="w-10 h-10 rounded-full bg-[#1A1A1A] overflow-hidden border border-[#D4AF37]">
                {contact.avatar ? (
                  <img src={contact.avatar} alt={contact.username} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-6 h-6 text-gray-500 m-2" />
                )}
              </div>
              <div>
                <div className="font-bold text-xs flex items-center uppercase tracking-widest text-[#E5E5E5]">
                  {contact.username}
                  {contact.verified && <span className="text-[#D4AF37] ml-2 text-[10px]">âœ“</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-[#111] flex flex-col relative border-l border-[#262626]">
        {activeContact ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-[#262626] bg-[#0A0A0A] flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#1A1A1A] overflow-hidden border border-[#D4AF37]">
                {activeContact.avatar ? (
                  <img src={activeContact.avatar} alt={activeContact.username} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-6 h-6 text-gray-500 m-2" />
                )}
              </div>
              <div>
                <div className="font-bold text-xs uppercase tracking-widest text-[#E5E5E5]">{activeContact.username}</div>
                <div className="text-[9px] uppercase tracking-widest text-[#D4AF37] mt-1 pr-1 font-bold">Online</div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-[10px] uppercase tracking-widest font-bold">
                  No messages yet. Send a message to start chatting!
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.sender_id === session?.user.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-sm px-5 py-3 ${isMine ? 'bg-[#D4AF37] text-black rounded-tr-none' : 'bg-[#1A1A1A] border border-[#262626] text-[#E5E5E5] rounded-tl-none'}`}>
                        <div className="text-xs">{msg.content}</div>
                        <div className={`text-[9px] mt-2 uppercase tracking-widest font-bold ${isMine ? 'text-black/60 text-right' : 'text-gray-500 text-left'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[#262626] bg-[#0A0A0A]">
              <form onSubmit={sendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="TYPE A MESSAGE..."
                  className="flex-1 bg-[#1A1A1A] border border-[#262626] rounded-full px-5 py-3 text-xs focus:outline-none focus:border-white/20 transition uppercase tracking-widest placeholder:text-gray-600"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-[#D4AF37] text-black p-3 rounded-full hover:opacity-80 disabled:opacity-50 transition"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-[10px] uppercase tracking-widest font-bold">
            Select a conversation to start messaging
          </div>
        )}
      </div>

    </div>
  );
};
