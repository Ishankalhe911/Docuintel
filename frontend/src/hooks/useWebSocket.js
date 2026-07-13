import { useEffect, useRef, useState, useCallback } from 'react';

export const useWebSocket = (documentId) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef(null);
  const currentMessageRef = useRef('');

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/chat/${documentId}`);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'token') {
        currentMessageRef.current += data.content;
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'assistant' && last.streaming) {
            updated[updated.length - 1] = {
              ...last,
              message: currentMessageRef.current
            };
          } else {
            updated.push({
              role: 'assistant',
              message: currentMessageRef.current,
              streaming: true
            });
          }
          return updated;
        });
      }

      if (data.type === 'done') {
        currentMessageRef.current = '';
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