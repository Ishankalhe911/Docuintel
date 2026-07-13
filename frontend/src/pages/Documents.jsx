import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, RefreshCw } from 'lucide-react';
import { documentsApi } from '../api/endpoints';
import DocumentCard from '../components/DocumentCard';
import UploadModal from '../components/UploadModal';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await documentsApi.getAll();
      setDocuments(data);
    } catch (err) {
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    const interval = setInterval(fetchDocuments, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await documentsApi.delete(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      setError('Failed to delete document.');
    } finally {
      setDeleting(null);
    }
  };

  const handleUploadSuccess = () => {
    setTimeout(fetchDocuments, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Documents</h2>
          <p className="text-slate-500 mt-1">
            {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={fetchDocuments}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            className="bg-slate-900 hover:bg-slate-800 text-white"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && documents.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && documents.length === 0 && (
        <div className="text-center py-20">
          <div className="text-slate-300 text-6xl mb-4">📄</div>
          <h3 className="text-lg font-semibold text-slate-700">No documents yet</h3>
          <p className="text-slate-400 mt-1 mb-6">
            Upload your first document to get started
          </p>
          <Button
            className="bg-slate-900 hover:bg-slate-800 text-white"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>
      )}

      {/* Document Cards Grid */}
      {documents.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documents.map(doc => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onDelete={handleDelete}
              deleting={deleting === doc.id}
            />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}