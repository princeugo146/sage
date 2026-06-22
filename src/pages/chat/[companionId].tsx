'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

export default function ChatPage() {
  const router = useRouter();
  const { companionId } = router.query;
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [relationship, setRelationship] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (companionId) {
      fetchRelationship();
    }
  }, [companionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchRelationship = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/relationship?companionId=${companionId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setRelationship(data);
      }
    } catch (error) {
      console.error('Error fetching relationship:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !companionId) return;

    const userMessage = input;
    setInput('');
    setMessages([...messages, { sender: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companionId,
          message: userMessage,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, { sender: 'companion', content: data.message }]);
        fetchRelationship(); // Update relationship scores
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!companionId) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg p-6 hidden md:flex flex-col">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Relationship</h2>
        {relationship ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">Stage</p>
              <p className="text-lg font-bold text-indigo-600">{relationship.stage}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Metrics</p>
              <div className="space-y-2">
                {Object.entries(relationship.metrics).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 capitalize">{key}</span>
                    <span className="text-sm font-semibold text-gray-800">{value.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">Loading relationship data...</p>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Chat</h1>
          <button
            onClick={() => router.push('/companions')}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Back to Companions
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Start a conversation...</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 p-6">
          <div className="flex space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
