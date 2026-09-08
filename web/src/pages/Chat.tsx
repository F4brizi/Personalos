import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  created_at?: string;
}

export function Chat() {
  const [threadId, setThreadId] = useState<string | null>(localStorage.getItem('ai_thread_id'));
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (threadId) {
      api.getAiThread(threadId)
        .then(data => {
          setMessages(data.messages || []);
        })
        .catch(err => {
          console.error(err);
          setThreadId(null);
          localStorage.removeItem('ai_thread_id');
        });
    }
  }, [threadId]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    let currentThreadId = threadId;
    
    setLoading(true);
    
    try {
      if (!currentThreadId) {
        const newThread = await api.createAiThread('Chat Principal');
        currentThreadId = newThread.id;
        setThreadId(currentThreadId);
        localStorage.setItem('ai_thread_id', currentThreadId);
      }

      const tempId = Math.random().toString();
      const userMessage: Message = { id: tempId, role: 'user', content: input };
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      const res = await api.sendAiMessage(currentThreadId, userMessage.content);
      
      const modelMessage: Message = { id: Math.random().toString(), role: 'model', content: res.response };
      setMessages(prev => [...prev, modelMessage]);

    } catch (error) {
      console.error(error);
      alert('Error enviando mensaje');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-gray-50 dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
      
      {/* Cabecera */}
      <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center z-10">
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">Gemini (Obsidian)</h2>
          <p className="text-xs text-green-500">Online - Conectado a tu bóveda local</p>
        </div>
        <button 
          onClick={() => {
            setThreadId(null);
            localStorage.removeItem('ai_thread_id');
            setMessages([]);
          }}
          className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
        >
          Limpiar Chat
        </button>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
        {messages.length === 0 && !loading && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
            <p>Comienza una conversación con Gemini.</p>
            <p className="text-sm mt-2">Puedes pedirle que busque en Obsidian o escriba por ti.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-tl-none shadow-sm'
            }`}>
              <div className="whitespace-pre-wrap font-sans text-sm">{msg.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-none px-4 py-2 shadow-sm flex gap-1">
              <span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2 z-10">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Escribe un mensaje a Gemini... (Enter para enviar)"
          className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg px-4 py-2 resize-none outline-none focus:ring-2 focus:ring-blue-500 max-h-32"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
