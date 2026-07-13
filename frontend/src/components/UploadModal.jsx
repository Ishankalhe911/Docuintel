import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { documentsApi } from '../api/endpoints';

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];
const MAX_SIZE_MB = 10;

export default function UploadModal({ open, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setError('');
      setUploading(false);
      setProgress(0);
      setDone(false);
    }
  }, [open]);

  if (!open) return null;

  const validateFile = (f) => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      return 'Invalid file type. Only PDF, PNG, JPG allowed.';
    }
    if (f.size / (1024 * 1024) > MAX_SIZE_MB) {
      return `File too large. Maximum size is ${MAX_SIZE_MB}MB.`;
    }
    return null;
  };

  const handleFile = (f) => {
    const err = validateFile(f);
    if (err) {
      setError(err);
      setFile(null);
      return;
    }
    setError('');
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await documentsApi.upload(file, setProgress);
      setDone(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      setError('Upload failed. Please try again.');
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Upload Document</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-all"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
          />
          <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
          <p className="text-sm font-medium text-slate-700">
            Drag & drop or click to browse
          </p>
          <p className="text-xs text-slate-400 mt-1">PDF, PNG, JPG up to 10MB</p>
        </div>

        {/* Selected File */}
        {file && (
          <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-700 truncate max-w-[260px]">
                {file.name}
              </span>
            </div>
            {!uploading && (
              <X
                className="h-4 w-4 text-slate-400 cursor-pointer hover:text-red-500"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
              />
            )}
          </div>
        )}

        {/* Progress */}
        {uploading && (
          <div className="space-y-1">
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 text-right">{progress}%</p>
          </div>
        )}

        {/* Success */}
        {done && (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Uploaded! Processing in background...
            </span>
          </div>
        )}

        {/* Error */}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || uploading || done}
            className="bg-slate-900 hover:bg-slate-800 text-white"
          >
            {uploading ? `Uploading ${progress}%...` : 'Upload'}
          </Button>
        </div>
      </div>
    </div>
  );
}