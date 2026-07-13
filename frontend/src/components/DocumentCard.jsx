import { FileText, Trash2, Clock, FileCheck, Loader2, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const STATUS_STYLES = {
  done: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
};

const TYPE_STYLES = {
  Invoice: 'bg-purple-100 text-purple-700',
  Resume: 'bg-blue-100 text-blue-700',
  Receipt: 'bg-orange-100 text-orange-700',
  Passport: 'bg-green-100 text-green-700',
  Contract: 'bg-red-100 text-red-700',
  'Bank Statement': 'bg-cyan-100 text-cyan-700',
  'Utility Bill': 'bg-yellow-100 text-yellow-700',
  Other: 'bg-slate-100 text-slate-700',
  Unknown: 'bg-slate-100 text-slate-500',
};

export default function DocumentCard({ doc, onDelete }) {
  const navigate = useNavigate();
  const isPending =
    doc.ocr_status === 'pending' || doc.ocr_status === 'processing' ||
    doc.extraction_status === 'pending' || doc.extraction_status === 'processing';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">

        {/* Filename + type */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-2 min-w-0">
            <FileText className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="text-sm font-medium text-slate-800 truncate">
              {doc.filename}
            </span>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${TYPE_STYLES[doc.document_type] || TYPE_STYLES['Other']}`}>
            {doc.document_type}
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center space-x-3 text-xs text-slate-500">
          <span className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{doc.processing_time}s</span>
          </span>
          <span className="flex items-center space-x-1">
            <FileCheck className="h-3 w-3" />
            <span>{doc.page_count} {doc.page_count === 1 ? 'page' : 'pages'}</span>
          </span>
          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
        </div>

        {/* OCR Status */}
        <div className="flex items-center space-x-2">
          {isPending && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[doc.ocr_status] || STATUS_STYLES['pending']}`}>
            {isPending ? 'Processing...' : doc.ocr_status}
          </span>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => navigate(`/documents/${doc.id}`)}
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete(doc.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}