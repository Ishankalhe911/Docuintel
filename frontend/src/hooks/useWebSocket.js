import { useEffect, useRef, useState, useCallback } from 'react';

export const useWebSocket = (documentId) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef(null);
  const currentMessageRef = useRef('');

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // The "+" sign here is the magic key that deletes ALL accidental slashes
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
    
    const wsUrl = baseUrl.replace(/^http/, 'ws');
    const ws = new WebSocket(`${wsUrl}/ws/chat/${documentId}`);
    ws.onopen = () => {
      setIsConnected(true);
    };

ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'token') {
        currentMessageRef.current += data.content;
        
        // 1. Capture the value instantly so React can't lose it in the queue!
        const capturedText = currentMessageRef.current;

        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          
          if (last && last.role === 'assistant' && last.streaming) {
            updated[updated.length - 1] = {
              ...last,
              message: capturedText // Use the captured constant, NOT the ref!
            };
          } else {
            updated.push({
              role: 'assistant',
              message: capturedText, // Use the captured constant!
              streaming: true
            });
          }
          return updated;
        });
      }

      if (data.type === 'done') {
        // 2. We REMOVED the ref clearing here to prevent the race condition!
        setIsStreaming(false);
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.streaming) {
            updated[updated.length - 1] = { ...last, streaming: false };
          }
          return updated;
        });
      }

      if (data.type === 'error') {
        setIsStreaming(false);
        // Error handling can safely clear it since the stream is broken anyway
        currentMessageRef.current = ''; 
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsStreaming(false);
    };

    ws.onerror = () => {
      setIsConnected(false);
      setIsStreaming(false);
    };

    wsRef.current = ws;
  }, [documentId]);

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;

    setMessages(prev => [...prev, { role: 'user', message }]);
    setIsStreaming(true);
    currentMessageRef.current = '';

    wsRef.current.send(JSON.stringify({ message }));
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { messages, isConnected, isStreaming, sendMessage };
};