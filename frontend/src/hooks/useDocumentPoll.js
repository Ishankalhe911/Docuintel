import { useState, useEffect, useRef } from 'react';
import { documentsApi } from '../api/endpoints';

export const useDocumentPoll = (documentId, initialStatus) => {
  const [document, setDocument] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef(null);

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  };

  const startPolling = () => {
    if (intervalRef.current) return;
    setIsPolling(true);

    intervalRef.current = setInterval(async () => {
      try {
        const data = await documentsApi.getById(documentId);
        setDocument(data);

        if (data.ocr_status === 'done' || data.ocr_status === 'failed') {
          if (data.extraction_status === 'done' || data.extraction_status === 'failed') {
            stopPolling();
          }
        }
      } catch (error) {
        stopPolling();
      }
    }, 3000);
  };

  useEffect(() => {
    if (
      initialStatus?.ocr_status === 'pending' ||
      initialStatus?.ocr_status === 'processing' ||
      initialStatus?.extraction_status === 'pending' ||
      initialStatus?.extraction_status === 'processing'
    ) {
      startPolling();
    }

    return () => stopPolling();
  }, [documentId]);

  return { document, isPolling, startPolling, stopPolling };
};