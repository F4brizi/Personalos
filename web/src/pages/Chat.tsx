import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { Mic, Square } from 'lucide-react';

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
  
  // Grabación de voz
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
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
          const userMessage: Message = { id: tempId, role: 'user', content: '🎤 [Nota de voz enviada]' };
          setMessages(prev => [...prev, userMessage]);

          const res = await api.sendAiAudio(currentThreadId, audioBlob);
          const modelMessage: Message = { id: Math.random().toString(), role: 'model', content: res.response };
          setMessages(prev => [...prev, modelMessage]);

        } catch (error) {
          console.error(error);
          alert('Error enviando audio');
        } finally {
          setLoading(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accediendo al micrófono:', err);
      alert('No se pudo acceder al micrófono');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-zinc-900 rounded-lg shadow-sm border border-zinc-800 overflow-hidden">
      <div className="bg-zinc-800 p-4 border-b border-zinc-700 flex justify-between items-center z-10">
        <div>
          <h2 className="font-semibold text-zinc-200">Gemini (Obsidian)</h2>
          <p className="text-xs text-green-500">Online - Conectado a tu bóveda local</p>
        </div>
        <button 
          onClick={() => {
            setThreadId(null);
            localStorage.removeItem('ai_thread_id');
            setMessages([]);
          }}
          className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20"
        >
          Limpiar Chat
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
        {messages.length === 0 && !loading && (
          <div className="text-center text-zinc-500 mt-10">
            <p>Comienza una conversación con Gemini.</p>
            <p className="text-sm mt-2">Puedes pedirle que busque en Obsidian o escribir por ti.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-tl-none shadow-sm'
            }`}>
              <div className="whitespace-pre-wrap font-sans text-sm">{msg.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 text-zinc-500 border border-zinc-700 rounded-2xl rounded-tl-none px-4 py-2 shadow-sm flex gap-1">
              <span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <div className="p-3 bg-zinc-800 border-t border-zinc-700 flex gap-2 z-10 items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Escribe un mensaje a Gemini..."
          className="flex-1 bg-zinc-900 text-zinc-200 rounded-lg px-4 py-2 resize-none outline-none focus:ring-1 focus:ring-blue-500 max-h-32"
          rows={1}
        />
        
        <button
          onClick={toggleRecording}
          disabled={loading}
          className={`p-2.5 rounded-lg font-medium transition-colors flex items-center justify-center shrink-0 ${
            isRecording 
              ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
          title={isRecording ? "Detener grabación" : "Grabar nota de voz"}
        >
          {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 h-[44px]"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
