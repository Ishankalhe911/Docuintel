import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft, FileText, Brain, MessageSquare,
  Loader2, Send, Clock, FileCheck
} from 'lucide-react';
import { documentsApi } from '../api/endpoints';
import { useWebSocket } from '../hooks/useWebSocket';

const STATUS_STYLES = {
  done: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
};

const TABS = ['Preview', 'OCR Text', 'Summary', 'Extracted Data', 'Chat'];

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Preview');
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);
  const pollingRef = useRef(null);

  const { messages, isConnected, isStreaming, sendMessage } = useWebSocket(id);

  const fetchDoc = async () => {
    try {
      const data = await documentsApi.getById(id);
      setDoc(data);
      return data;
    } catch (err) {
      setError('Failed to load document.');
    }
  };

  const startPolling = () => {
    pollingRef.current = setInterval(async () => {
      const data = await fetchDoc();
      if (
        data &&
        (data.ocr_status === 'done' || data.ocr_status === 'failed') &&
        (data.extraction_status === 'done' || data.extraction_status === 'failed')
      ) {
        clearInterval(pollingRef.current);
      }
    }, 3000);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const data = await fetchDoc();
      setLoading(false);
      if (
        data &&
        (data.ocr_status === 'pending' ||
          data.ocr_status === 'processing' ||
          data.extraction_status === 'pending' ||
          data.extraction_status === 'processing')
      ) {
        startPolling();
      }
    };
    init();
    return () => clearInterval(pollingRef.current);
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getStructuredData = () => {
    try {
      return JSON.parse(doc?.structured_data || '{}');
    } catch {
      return {};
    }
  };

  const isPending =
    doc?.ocr_status === 'pending' ||
    doc?.ocr_status === 'processing' ||
    doc?.extraction_status === 'pending' ||
    doc?.extraction_status === 'processing';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">{error || 'Document not found'}</p>
        <Button className="mt-4" onClick={() => navigate('/documents')}>
          Back to Documents
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/documents')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-slate-800 truncate">{doc.filename}</h2>
          <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500">
            <span className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{doc.processing_time}s OCR</span>
            </span>
            <span className="flex items-center space-x-1">
              <FileCheck className="h-3 w-3" />
              <span>{doc.page_count} pages</span>
            </span>
            <span className={`px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[doc.ocr_status]}`}>
              {doc.ocr_status}
            </span>
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
              {doc.document_type}
            </span>
          </div>
        </div>
      </div>

      {/* Processing Banner */}
      {isPending && (
        <div className="flex items-center space-x-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500 shrink-0" />
          <p className="text-sm text-blue-700">
            AI is processing your document — OCR, classification, extraction and summary running in background. This page will update automatically.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {/* Preview Tab */}
        {activeTab === 'Preview' && (
          <Card>
            <CardContent className="p-0 overflow-hidden rounded-xl">
              {doc.file_type === 'application/pdf' ? (
                <iframe
                  src={documentsApi.getFile(id)}
                  className="w-full h-[700px] border-0"
                  title="Document Preview"
                />
              ) : (
                <img
                  src={documentsApi.getFile(id)}
                  alt="Document Preview"
                  className="w-full object-contain max-h-[700px]"
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* OCR Text Tab */}
        {activeTab === 'OCR Text' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base">
                <FileText className="h-4 w-4" />
                <span>Extracted Text</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <div className="flex items-center space-x-2 text-slate-400 py-8 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Extracting text...</span>
                </div>
              ) : doc.extracted_text ? (
                <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono bg-slate-50 p-4 rounded-lg max-h-[600px] overflow-y-auto">
                  {doc.extracted_text}
                </pre>
              ) : (
                <p className="text-slate-400 text-sm text-center py-8">No text extracted</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Summary Tab */}
        {activeTab === 'Summary' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base">
                <Brain className="h-4 w-4" />
                <span>AI Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <div className="flex items-center space-x-2 text-slate-400 py-8 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Generating summary...</span>
                </div>
              ) : doc.summary ? (
                <p className="text-slate-700 leading-relaxed">{doc.summary}</p>
              ) : (
                <p className="text-slate-400 text-sm text-center py-8">No summary available</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Extracted Data Tab */}
        {activeTab === 'Extracted Data' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base">
                <Brain className="h-4 w-4" />
                <span>Structured Data — {doc.document_type}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <div className="flex items-center space-x-2 text-slate-400 py-8 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Extracting structured data...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(getStructuredData()).map(([key, value]) => (
                    <div key={key} className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-slate-800 font-medium">
                        {Array.isArray(value)
                          ? value.join(', ')
                          : typeof value === 'object' && value !== null
                          ? JSON.stringify(value)
                          : value ?? '—'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Chat Tab */}
        {activeTab === 'Chat' && (
          <Card className="flex flex-col h-[600px]">
            <CardHeader className="border-b pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat with Document</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-slate-300'}`} />
                  <span className="text-xs text-slate-400">
                    {isConnected ? 'Connected' : 'Connecting...'}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Ask anything about this document</p>
                  <div className="mt-4 space-y-2">
                    {['What is this document about?', 'Summarise this document', 'What are the key details?'].map(q => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="block w-full text-left text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-2 rounded-lg transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {msg.message}
                    {msg.streaming && (
                      <span className="inline-block w-1.5 h-3.5 bg-slate-400 ml-0.5 animate-pulse rounded-sm" />
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </CardContent>

            {/* Input */}
            <div className="border-t p-4 flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about this document..."
                disabled={isStreaming || isPending}
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:bg-slate-50 disabled:text-slate-400"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming || isPending || !isConnected}
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}