import React, { useEffect, useState, useRef, useCallback } from 'react';

// Use pdfjs-dist with worker setup
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf');

// Set worker path - use CDN matching the installed version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const PdfViewer = ({ url, onLoad, onPageChange, className }) => {
  const canvasRef = useRef(null);
  const pdfDocRef = useRef(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scale, setScale] = useState(1.5);

  const renderPage = useCallback(async (pageNum, pdfDoc, renderScale) => {
    const canvas = canvasRef.current;
    if (!canvas || !pdfDoc) return;

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: renderScale });
    const context = canvas.getContext('2d');

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';

    await page.render({
      canvasContext: context,
      viewport
    }).promise;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPdf = async () => {
      if (!url) return;
      setLoading(true);
      setError('');

      try {
        // For blob URLs, fetch the data first
        let loadingTask;
        if (url.startsWith('blob:')) {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        } else if (url.startsWith('data:')) {
          loadingTask = pdfjsLib.getDocument({ url });
        } else {
          loadingTask = pdfjsLib.getDocument({ url });
        }

        const pdfDoc = await loadingTask.promise;
        if (cancelled) return;

        pdfDocRef.current = pdfDoc;
        setNumPages(pdfDoc.numPages);
        setCurrentPage(1);
        setLoading(false);

        await renderPage(1, pdfDoc, scale);
        if (onLoad) onLoad();
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load PDF: ' + (err.message || 'Unknown error'));
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      if (pdfDocRef.current) {
        try { pdfDocRef.current.destroy(); } catch (e) {}
        pdfDocRef.current = null;
      }
    };
  }, [url]);

  useEffect(() => {
    if (pdfDocRef.current && !loading) {
      renderPage(currentPage, pdfDocRef.current, scale);
    }
  }, [currentPage, scale, renderPage, loading]);

  const goToPage = (pageNum) => {
    if (pageNum < 1 || pageNum > numPages) return;
    setCurrentPage(pageNum);
  };

  useEffect(() => {
    if (onPageChange && numPages > 0) {
      onPageChange({ currentPage, numPages, isLastPage: currentPage >= numPages });
    }
  }, [currentPage, numPages, onPageChange]);

  const zoomIn = () => setScale(s => Math.min(s + 0.5, 4));
  const zoomOut = () => setScale(s => Math.max(s - 0.5, 0.5));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 p-4">
        <div className="text-center text-red-600">
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-gray-100 ${className || ''}`}>
      {/* PDF Controls */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-3 py-2 flex-shrink-0">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 disabled:opacity-40 enabled:hover:bg-gray-200 transition"
        >
          ◀ Prev
        </button>
        <span className="text-sm text-gray-600">
          Page {currentPage} / {numPages}
        </span>
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= numPages}
          className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 disabled:opacity-40 enabled:hover:bg-gray-200 transition"
        >
          Next ▶
        </button>
      </div>

      {/* PDF Canvas */}
      <div className="flex-1 overflow-auto flex justify-center p-2">
        <canvas ref={canvasRef} className="shadow-md bg-white" />
      </div>

      {/* Zoom controls */}
      <div className="flex items-center justify-center gap-3 bg-white border-t border-gray-200 px-3 py-2 flex-shrink-0">
        <button
          onClick={zoomOut}
          disabled={scale <= 0.5}
          className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 disabled:opacity-40 enabled:hover:bg-gray-200 transition"
        >
          −
        </button>
        <span className="text-xs text-gray-500 w-12 text-center">{Math.round(scale * 100)}%</span>
        <button
          onClick={zoomIn}
          disabled={scale >= 4}
          className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 disabled:opacity-40 enabled:hover:bg-gray-200 transition"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default PdfViewer;
