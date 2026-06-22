import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { ArrowLeft, Award, Download, Share2, Printer, CheckCircle, Maximize2, Minimize2, AlertCircle, X } from 'lucide-react';
import Sidebar from './Sidebar';

// Print styles for certificate
const printStyles = `
  @media print {
    @page {
      size: A4 landscape;
      margin: 0;
    }
    body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .print-certificate {
      width: 100vw !important;
      height: 100vh !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
    }
  }
`;

const Certificate = () => {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const certificateRef = useRef(null);
  
  const isModal = searchParams.get('modal') === 'true';
  
  const [certificate, setCertificate] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState('normal'); // 'normal' | 'print'
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Inject print styles
    const styleSheet = document.createElement('style');
    styleSheet.innerText = printStyles;
    document.head.appendChild(styleSheet);

    // Check if user or admin is logged in
    const userData = localStorage.getItem('currentUser');
    const adminData = localStorage.getItem('isAuthenticated');
    
    if (!userData && !adminData) {
      // Not logged in - redirect to login
      navigate('/user-login');
      return;
    }
    
    if (userData) {
      setUser(JSON.parse(userData));
      setIsAdmin(false);
    } else {
      // Admin viewing - set a generic admin user
      setUser({ name: 'Administrator', role: 'admin' });
      setIsAdmin(true);
    }

    // Load certificate
    const certificates = JSON.parse(localStorage.getItem('certificates') || '[]');
    const foundCert = certificates.find(c => c.id === certificateId);
    
    if (foundCert) {
      setCertificate(foundCert);
    }
    setLoading(false);

    // Cleanup print styles on unmount
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, [certificateId, navigate]);

  const generateCanvas = async () => {
    if (!certificateRef.current) return null;

    try {
      // Store original view mode and switch to print mode for full-screen capture
      const originalViewMode = viewMode;
      if (viewMode !== 'print') {
        setViewMode('print');
      }

      // Wait for print view to render
      await new Promise(resolve => setTimeout(resolve, 500));

      const certElement = certificateRef.current;

      const canvas = await html2canvas(certElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: certElement.scrollWidth,
        height: certElement.scrollHeight,
        windowWidth: certElement.scrollWidth,
        windowHeight: certElement.scrollHeight
      });

      // Restore original view mode
      if (originalViewMode !== 'print') {
        setViewMode(originalViewMode);
      }

      return canvas;
    } catch (error) {
      // Restore view mode even if canvas generation fails
      setViewMode('normal');
      throw error;
    }
  };

  const handlePrint = async () => {
    // window.print() doesn't work in Android WebView (Capacitor)
    // On mobile, generate image and share it instead
    const isMobile = window.matchMedia('(max-width: 768px)').matches || /Android|iPhone|iPad/i.test(navigator.userAgent);

    if (isMobile) {
      try {
        const canvas = await generateCanvas();
        if (!canvas) {
          alert('Failed to generate certificate image. Please try again.');
          return;
        }

        canvas.toBlob(async (blob) => {
          if (!blob) {
            alert('Failed to generate certificate image. Please try again.');
            return;
          }
          const file = new File([blob], `certificate-${certificateId}.png`, { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                title: 'Certificate',
                text: 'Print or save this certificate image.',
                files: [file]
              });
            } catch (shareError) {
              // Fallback: open image in new tab
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `certificate-${certificateId}.png`;
              link.click();
              setTimeout(() => URL.revokeObjectURL(url), 100);
            }
          } else {
            // Fallback: download directly
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `certificate-${certificateId}.png`;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 100);
          }
        }, 'image/png', 1.0);
      } catch (error) {
        alert('Failed to generate certificate image. Please try Download instead.');
      }
    } else {
      window.print();
    }
  };

  const handleDownload = async () => {
    if (!certificateRef.current) return;

    try {
      const canvas = await generateCanvas();
      if (!canvas) {
        alert('Failed to generate certificate image. Please try again.');
        return;
      }

      const fileName = `certificate-${certificate.userName.replace(/\s+/g, '-')}-${certificateId}.png`;

      // Try Web Share API with file (works on Android/Capacitor)
      const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
      if (isMobile && navigator.canShare) {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            alert('Failed to generate certificate image. Please try again.');
            return;
          }
          const file = new File([blob], fileName, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                title: 'Download Certificate',
                files: [file]
              });
              return;
            } catch (e) {
            }
          }
          // Fallback: download directly
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 100);
        }, 'image/png', 1.0);
      } else {
        // Desktop: use anchor download
        const link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
      }
    } catch (error) {
      alert('Failed to generate certificate image. Please try again.');
    }
  };

  const handleShare = async () => {
    // Look up the actual result title and score for sharing
    const results = JSON.parse(localStorage.getItem('quizResults') || '[]');
    const certIssuedAt = new Date(certificate.issuedAt).getTime();
    let result = results.find(r => r.id === certificate.resultId);
    if (!result) {
      const matchingResults = results
        .filter(r => r.quizId === certificate.quizId && r.userId === certificate.userId)
        .sort((a, b) => {
          const aDiff = Math.abs(new Date(a.completedAt).getTime() - certIssuedAt);
          const bDiff = Math.abs(new Date(b.completedAt).getTime() - certIssuedAt);
          return aDiff - bDiff;
        });
      result = matchingResults[0];
    }
    const shareTitle = result?.quizTitle || certificate.quizTitle || 'Unknown Training';
    const shareScore = result?.score ?? certificate.score ?? 0;
    const shareText = `I earned a certificate for completing "${shareTitle}" with ${shareScore}%!`;

    // Try sharing the certificate image via Web Share API
    try {
      const canvas = await generateCanvas();
      if (canvas && navigator.canShare) {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            // Fallback to text-only share if canvas generation fails
            if (navigator.share) {
              try {
                await navigator.share({
                  title: 'Training Certificate',
                  text: shareText
                });
              } catch (e) {
                navigator.clipboard.writeText(shareText);
                alert('Certificate details copied to clipboard!');
              }
            } else {
              navigator.clipboard.writeText(shareText);
              alert('Certificate details copied to clipboard!');
            }
            return;
          }
          const file = new File([blob], `certificate-${certificateId}.png`, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                title: 'Training Certificate',
                text: shareText,
                files: [file]
              });
              return;
            } catch (e) {
            }
          }
          // Fallback: share text only
          if (navigator.share) {
            try {
              await navigator.share({
                title: 'Training Certificate',
                text: shareText
              });
            } catch (e) {
              navigator.clipboard.writeText(shareText);
              alert('Certificate details copied to clipboard!');
            }
          } else {
            navigator.clipboard.writeText(shareText);
            alert('Certificate details copied to clipboard!');
          }
        }, 'image/png', 1.0);
      } else if (navigator.share) {
        await navigator.share({
          title: 'Training Certificate',
          text: shareText
        });
      } else {
        navigator.clipboard.writeText(shareText);
        alert('Certificate details copied to clipboard!');
      }
    } catch (error) {
      // Final fallback: copy to clipboard
      navigator.clipboard.writeText(shareText);
      alert('Certificate details copied to clipboard!');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Award className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Certificate Not Found</h2>
          <p className="text-gray-600 mb-6">The certificate you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => {
              if (window.history.length > 2) {
                navigate(-1);
              } else {
                navigate('/user-dashboard');
              }
            }}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isExpired = certificate.expiresAt && new Date(certificate.expiresAt) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <div className={`md:flex print:block ${isModal ? 'block' : ''}`}>
        {!isModal && (
          <div className="hidden md:block print:hidden">
            <Sidebar currentUser={user} />
          </div>
        )}
        
        <div className={`flex-1 print:ml-0 print:w-full ${viewMode === 'print' || isModal ? 'ml-0 w-full' : 'md:ml-64'}`}>
          {/* Header */}
          {!isModal && (
            <header className={`bg-white shadow-sm border-b border-gray-200 print:hidden ${viewMode === 'print' ? 'hidden' : ''}`}>
            <div className="max-w-5xl mx-auto px-3 md:px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-14 md:h-16">
                <div className="flex items-center">
                  <button
                    onClick={() => {
                      const storedFrom = sessionStorage.getItem('lastUserBackRoute');
                      if (storedFrom) {
                        navigate(storedFrom);
                      } else {
                        // Always navigate to dashboard on mobile to avoid history issues
                        const isMobile = window.matchMedia('(max-width: 768px)').matches || /Android|iPhone|iPad/i.test(navigator.userAgent);
                        if (isMobile) {
                          navigate('/user-dashboard');
                        } else if (window.history.length > 2) {
                          navigate(-1);
                        } else {
                          navigate('/user-dashboard');
                        }
                      }
                    }}
                    className="mr-2 md:mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition duration-200"
                    title="Back"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h1 className="text-base md:text-xl font-semibold text-gray-900">Certificate</h1>
                </div>
                
                <div className="flex items-center space-x-1 md:space-x-3">
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => setViewMode(viewMode === 'print' ? 'normal' : 'print')}
                        className={`p-2 rounded-lg transition duration-200 ${
                          viewMode === 'print'
                            ? 'text-blue-600 bg-blue-100'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                        title="Print Preview"
                      >
                        <Printer className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleDownload}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition duration-200"
                        title="Download"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleShare}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition duration-200"
                        title="Share"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={toggleFullscreen}
                    className="hidden md:inline-flex p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition duration-200"
                    title="Fullscreen"
                  >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </header>
          )}

          <main className={`${viewMode === 'print' ? 'fixed inset-0 z-50 bg-white p-0 m-0 max-w-none overflow-auto' : 'max-w-5xl mx-auto px-3 md:px-4 sm:px-6 lg:px-8 py-4 md:py-8 pb-20 md:pb-8'} print:p-0 print:max-w-none`}>
            {isExpired && viewMode !== 'print' && (
              <div className="mb-4 md:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 flex items-center print:hidden">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
                <p className="text-red-700 text-sm">This certificate has expired and is no longer valid.</p>
              </div>
            )}
          
          {/* Certificate Display */}
          <div 
            ref={certificateRef}
            className={`bg-white overflow-hidden print-certificate print:shadow-none print:rounded-none print:w-full print:h-full ${
              viewMode === 'print' 
                ? 'shadow-none rounded-none w-full min-h-screen' 
                : 'shadow-2xl rounded-lg'
            }`}
            style={{ 
              maxWidth: '100%',
              margin: '0 auto'
            }}
          >
            <div className="p-4 md:p-12 relative">
              {/* Outer Border */}
              <div className="absolute inset-2 md:inset-4 border-4 md:border-8 border-yellow-500 rounded-lg"></div>
              
              {/* Inner Border */}
              <div className="absolute inset-3 md:inset-6 border-2 md:border-4 border-blue-900 rounded-lg"></div>
              
              {/* Content */}
              <div className="relative flex flex-col items-center justify-center text-center py-6 px-4 md:py-12 md:px-8">
                {/* Organization Name */}
                <h2 className="text-base md:text-3xl font-bold text-blue-900 mb-1 md:mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                  {certificate.organizationName}
                </h2>
                
                {/* Decorative Line */}
                <div className="w-32 md:w-64 h-1 bg-yellow-500 mb-3 md:mb-4"></div>
                
                {/* Certificate Title */}
                <h1 className="text-lg md:text-5xl font-bold text-yellow-600 mb-3 md:mb-8" style={{ fontFamily: 'Georgia, serif' }}>
                  CERTIFICATE OF COMPLETION
                </h1>
                
                {/* This is to certify */}
                <p className="text-sm md:text-xl text-gray-600 italic mb-2 md:mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                  This is to certify that
                </p>
                
                {/* Recipient Name */}
                <h3 className="text-lg md:text-5xl font-bold text-blue-900 mb-1 md:mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                  {certificate.userName}
                </h3>
                
                {/* Department */}
                {certificate.userDepartment && certificate.userDepartment !== 'N/A' && (
                  <p className="text-xs md:text-lg text-gray-500 mb-2 md:mb-4">
                    Department: {certificate.userDepartment}
                  </p>
                )}
                
                {/* Decorative Line */}
                <div className="w-24 md:w-48 h-0.5 bg-yellow-500 mb-3 md:mb-6"></div>
                
                {/* Has completed */}
                <p className="text-sm md:text-xl text-gray-600 italic mb-2 md:mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                  has successfully completed
                </p>
                
                {/* Training Title */}
                <h4 className="text-base md:text-4xl font-bold text-blue-900 mb-1 md:mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                  {(() => {
                    // Look up the result title dynamically for the matching result
                    const results = JSON.parse(localStorage.getItem('quizResults') || '[]');
                    const certIssuedAt = new Date(certificate.issuedAt).getTime();
                    let result = results.find(r => r.id === certificate.resultId);
                    if (!result) {
                      const matchingResults = results
                        .filter(r => r.quizId === certificate.quizId && r.userId === certificate.userId && (r.score ?? 0) >= (r.passPercentage ?? 70))
                        .sort((a, b) => {
                          const aDiff = Math.abs(new Date(a.completedAt).getTime() - certIssuedAt);
                          const bDiff = Math.abs(new Date(b.completedAt).getTime() - certIssuedAt);
                          return aDiff - bDiff;
                        });
                      result = matchingResults[0];
                    }
                    return result?.quizTitle || certificate.quizTitle || 'Unknown Training';
                  })()}
                </h4>
                
                {/* Training Type */}
                <p className="text-sm md:text-lg text-gray-500 mb-3 md:mb-4">
                  {certificate.trainingType}
                </p>
                
                {/* Score */}
                <div className="flex items-center justify-center space-x-2 bg-yellow-50 px-3 md:px-6 py-2 md:py-3 rounded-full mb-3 md:mb-6">
                  <CheckCircle className="w-4 h-4 md:w-6 md:h-6 text-yellow-600" />
                  <span className="text-sm md:text-2xl font-bold text-yellow-700">
                    {(() => {
                      // Look up result to get actual score - match by resultId or by completion time close to certificate issue time
                      const results = JSON.parse(localStorage.getItem('quizResults') || '[]');
                      const certIssuedAt = new Date(certificate.issuedAt).getTime();
                      let result = results.find(r => r.id === certificate.resultId);
                      if (!result) {
                        const matchingResults = results
                          .filter(r => r.quizId === certificate.quizId && r.userId === certificate.userId && (r.score ?? 0) >= (r.passPercentage ?? 70))
                          .sort((a, b) => {
                            // Prefer result completed closest to certificate issue time
                            const aTime = new Date(a.completedAt).getTime();
                            const bTime = new Date(b.completedAt).getTime();
                            const aDiff = Math.abs(aTime - certIssuedAt);
                            const bDiff = Math.abs(bTime - certIssuedAt);
                            return aDiff - bDiff;
                          });
                        result = matchingResults[0];
                      }
                      const displayScore = result?.score ?? certificate.score ?? 0;
                      return <>Score: {displayScore}% (Pass: {certificate.passPercentage}%)</>;
                    })()}
                  </span>
                </div>
                
                {/* Dates */}
                <div className="flex flex-col md:flex-row items-center justify-center space-y-1 md:space-y-0 md:space-x-8 text-gray-500 mb-3 md:mb-4 text-xs md:text-sm">
                  <div>
                    <span>Issued on: </span>
                    <span className="font-semibold">
                      {new Date(certificate.issuedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  {certificate.expiresAt && (
                    <div>
                      <span>Valid until: </span>
                      <span className="font-semibold">
                        {new Date(certificate.expiresAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Certificate Number */}
                <p className="text-xs md:text-sm md:text-base text-yellow-700 font-semibold mt-auto mb-1 break-all">
                  Certificate No: {certificate.certificateNumber || certificate.id}
                </p>
                
                {/* Certificate ID */}
                <p className="text-xs md:text-sm text-gray-400 break-all">
                  ID: {certificate.id}
                </p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className={`mt-4 md:mt-8 flex flex-wrap justify-center gap-2 md:gap-4 print:hidden ${viewMode === 'print' ? 'fixed bottom-4 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm p-4 shadow-lg border-t' : ''}`}>
            {viewMode === 'print' && (
              <button
                onClick={() => setViewMode('normal')}
                className="flex items-center px-4 md:px-6 py-2 md:py-3 bg-gray-500 text-white rounded-lg font-semibold text-sm hover:bg-gray-600 transition duration-200"
              >
                <X className="w-5 h-5 mr-2" />
                Exit
              </button>
            )}
            {isAdmin && (
              <>
                <button
                  onClick={handlePrint}
                  className="flex items-center px-4 md:px-6 py-2 md:py-3 bg-gray-700 text-white rounded-lg font-semibold text-sm hover:bg-gray-800 transition duration-200"
                >
                  <Printer className="w-5 h-5 mr-2" />
                  Print
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition duration-200"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center px-4 md:px-6 py-2 md:py-3 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition duration-200"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share
                </button>
              </>
            )}
          </div>
        </main>
        </div>
      </div>
    </div>
  );
};

export default Certificate;
