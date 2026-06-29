import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Award, Download, Share2, Printer, CheckCircle, Maximize2, Minimize2, AlertCircle, X, Shield, RefreshCw, Ban } from 'lucide-react';
import Sidebar from './Sidebar';

// Print styles for certificate
const printStyles = `
  @media print {
    @page {
      size: A4 landscape;
      margin: 0.5cm;
    }
    body {
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .print-hidden {
      display: none !important;
    }
    .print-certificate {
      width: 100% !important;
      height: auto !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      page-break-inside: avoid;
    }
    .print-certificate > div {
      width: 100% !important;
      height: auto !important;
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
  const [showReissueModal, setShowReissueModal] = useState(false);
  const [reissueReason, setReissueReason] = useState('');
  const [showRevocationModal, setShowRevocationModal] = useState(false);
  const [revocationReason, setRevocationReason] = useState('');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [usersList, setUsersList] = useState([]);

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

  // Migrate all certificates to new structure and create Mr. Kumar's certificate
  useEffect(() => {
    const certificates = JSON.parse(localStorage.getItem('certificates') || '[]');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Migrate all existing certificates to have new fields
    const updatedCertificates = certificates.map(cert => ({
      ...cert,
      isRevoked: cert.isRevoked ?? false,
      reissueCount: cert.reissueCount ?? 0,
      reissueHistory: cert.reissueHistory ?? []
    }));

    if (JSON.stringify(certificates) !== JSON.stringify(updatedCertificates)) {
      localStorage.setItem('certificates', JSON.stringify(updatedCertificates));
    }
    
    // Find or create Mr. Kumar
    let kumarUser = users.find(u => u.name?.toLowerCase().includes('kumar'));
    if (!kumarUser) {
      kumarUser = {
        id: 'user-kumar-001',
        name: 'Mr. Kumar',
        email: 'kumar@example.com',
        department: 'Quality Assurance',
        role: 'user'
      };
      users.push(kumarUser);
      localStorage.setItem('users', JSON.stringify(users));
    }

    // Check if certificate already exists for Lean Six Sigma Green Belt Training
    const existingCert = updatedCertificates.find(
      c => c.userId === kumarUser.id && c.quizTitle?.toLowerCase().includes('lean six sigma')
    );

    if (!existingCert) {
      // Create new certificate for Mr. Kumar
      const newCertificate = {
        id: `cert-${Date.now()}`,
        userId: kumarUser.id,
        userName: kumarUser.name,
        userDepartment: kumarUser.department || 'Quality Assurance',
        quizId: 'quiz-lean-six-sigma-001',
        quizTitle: 'Lean Six Sigma Green Belt Training',
        trainingType: 'Professional Certification',
        score: 95,
        passPercentage: 70,
        organizationName: 'VIBRO Technical and Engineering Solutions',
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year validity
        certificateNumber: `VIBRO-LSSGB-${Date.now().toString().slice(-8)}`,
        isRevoked: false,
        reissueCount: 0,
        reissueHistory: []
      };

      updatedCertificates.push(newCertificate);
      localStorage.setItem('certificates', JSON.stringify(updatedCertificates));
      
      // If viewing this certificate, update state
      if (certificateId === newCertificate.id) {
        setCertificate(newCertificate);
      }
    }
  }, [certificateId]);

  const generateCanvas = async () => {
    if (!certificateRef.current) return null;

    try {
      const certElement = certificateRef.current;
      
      // Wait for any pending renders
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get the actual dimensions of the certificate
      const rect = certElement.getBoundingClientRect();
      const width = Math.max(rect.scrollWidth, rect.width, 1200);
      const height = Math.max(rect.scrollHeight, rect.height, 800);

      const canvas = await html2canvas(certElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: width,
        height: height,
        windowWidth: width,
        windowHeight: height,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          // Ensure all images are loaded
          const images = clonedDoc.querySelectorAll('img');
          images.forEach(img => {
            if (!img.complete) {
              img.crossOrigin = 'anonymous';
            }
          });
        }
      });

      return canvas;
    } catch (error) {
      console.error('Canvas generation error:', error);
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

    // For desktop, use print dialog which allows save as PDF
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    
    if (!isMobile) {
      alert('Please use the Print button to save the certificate as PDF.');
      return;
    }

    // For mobile, try canvas generation
    try {
      const canvas = await generateCanvas();
      if (!canvas) {
        alert('Failed to generate certificate image. Please use Print instead.');
        return;
      }

      const fileName = `certificate-${certificate.userName.replace(/\s+/g, '-')}-${certificateId}.png`;
      
      canvas.toBlob(async (blob) => {
        if (!blob || blob.size === 0) {
          alert('Failed to generate certificate image. Please use Print instead.');
          return;
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }, 'image/png', 0.95);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download certificate. Please use Print instead.');
    }
  };

  const handleShare = async () => {
    // Load users list for sharing
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    setUsersList(users);
    setShowShareModal(true);
  };

  const handleShareWithUser = async (selectedUser) => {
    setShowShareModal(false);
    
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
    const shareText = `${certificate.userName} earned a certificate for completing "${shareTitle}" with ${shareScore}%!`;

    // Try sharing via Web Share API
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Training Certificate',
          text: `${shareText} Shared with ${selectedUser.name}.`
        });
      } else {
        navigator.clipboard.writeText(`${shareText} Shared with ${selectedUser.name}.`);
        alert(`Certificate details shared with ${selectedUser.name} and copied to clipboard!`);
      }
    } catch (error) {
      console.error('Share error:', error);
      navigator.clipboard.writeText(`${shareText} Shared with ${selectedUser.name}.`);
      alert(`Certificate details shared with ${selectedUser.name} and copied to clipboard!`);
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

  const handleReissue = () => {
    if (!reissueReason.trim()) {
      alert('Please provide a reason for reissuing the certificate.');
      return;
    }

    const certificates = JSON.parse(localStorage.getItem('certificates') || '[]');
    const updatedCertificates = certificates.map(c => {
      if (c.id === certificate.id) {
        return {
          ...c,
          reissueCount: (c.reissueCount || 0) + 1,
          reissueHistory: [
            ...(c.reissueHistory || []),
            {
              date: new Date().toISOString(),
              reason: reissueReason,
              reissuedBy: user?.name || 'Administrator'
            }
          ],
          issuedAt: new Date().toISOString(), // Update issue date
          certificateNumber: `${c.certificateNumber}-R${(c.reissueCount || 0) + 1}` // Append reissue suffix
        };
      }
      return c;
    });

    localStorage.setItem('certificates', JSON.stringify(updatedCertificates));
    setCertificate(updatedCertificates.find(c => c.id === certificate.id));
    setShowReissueModal(false);
    setReissueReason('');
    alert('Certificate reissued successfully!');
  };

  const handleRevoke = () => {
    if (!revocationReason.trim()) {
      alert('Please provide a reason for revoking the certificate.');
      return;
    }

    const certificates = JSON.parse(localStorage.getItem('certificates') || '[]');
    const updatedCertificates = certificates.map(c => {
      if (c.id === certificate.id) {
        return {
          ...c,
          isRevoked: true,
          revocationReason: revocationReason,
          revokedAt: new Date().toISOString(),
          revokedBy: user?.name || 'Administrator'
        };
      }
      return c;
    });

    localStorage.setItem('certificates', JSON.stringify(updatedCertificates));
    setCertificate(updatedCertificates.find(c => c.id === certificate.id));
    setShowRevocationModal(false);
    setRevocationReason('');
    alert('Certificate revoked successfully!');
  };

  const handleRestore = () => {
    const certificates = JSON.parse(localStorage.getItem('certificates') || '[]');
    const updatedCertificates = certificates.map(c => {
      if (c.id === certificate.id) {
        return {
          ...c,
          isRevoked: false,
          revocationReason: null,
          revokedAt: null,
          revokedBy: null
        };
      }
      return c;
    });

    localStorage.setItem('certificates', JSON.stringify(updatedCertificates));
    setCertificate(updatedCertificates.find(c => c.id === certificate.id));
    setShowRestoreModal(false);
    alert('Certificate restored successfully!');
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
  const isRevoked = certificate.isRevoked;
  
  // Determine if using HashRouter (user mode) or BrowserRouter (admin mode)
  const isUserMode = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('appMode') === 'user';
  const qrCodeUrl = isUserMode 
    ? `${window.location.origin}/#/certificate/${certificate.id}`
    : `${window.location.origin}/certificate/${certificate.id}`;

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
            {isRevoked && viewMode !== 'print' && (
              <div className="mb-4 md:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 flex items-center print:hidden">
                <Ban className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-700 text-sm font-semibold">This certificate has been revoked</p>
                  {certificate.revocationReason && <p className="text-red-600 text-xs mt-1">Reason: {certificate.revocationReason}</p>}
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setShowRestoreModal(true)}
                    className="ml-3 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                  >
                    Restore
                  </button>
                )}
              </div>
            )}

            {isExpired && viewMode !== 'print' && !isRevoked && (
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
                
                {/* This certificate is awarded to */}
                <p className="text-sm md:text-xl text-gray-600 italic mb-2 md:mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                  This certificate is awarded to
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
                
                {/* For successfully completing */}
                <p className="text-sm md:text-xl text-gray-600 italic mb-2 md:mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                  for successfully completing
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
                
                {/* Conducted by */}
                <p className="text-sm md:text-lg text-gray-500 mb-3 md:mb-4">
                  conducted by {certificate.organizationName}
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

                {/* Badge */}
                <div className="flex items-center justify-center mb-3 md:mb-4">
                  <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 py-1 rounded-full text-xs md:text-sm font-semibold shadow-md">
                    <Award className="w-4 h-4 md:w-5 md:h-5 inline mr-1" />
                    Certified Professional
                  </div>
                </div>
                
                {/* Certificate Number */}
                <p className="text-xs md:text-sm md:text-base text-yellow-700 font-semibold mt-auto mb-1 break-all">
                  Certificate No: {certificate.certificateNumber || certificate.id}
                </p>
                
                {/* Certificate ID */}
                <p className="text-xs md:text-sm text-gray-400 break-all">
                  ID: {certificate.id}
                </p>

                {/* Digital Signature and QR Code Section */}
                <div className="flex flex-col md:flex-row items-center justify-between w-full mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200">
                  {/* Digital Signature */}
                  <div className="flex flex-col items-center text-center mb-4 md:mb-0">
                    <div className="text-blue-900 font-bold text-xs md:text-base mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                      {certificate.organizationName}
                    </div>
                    <div className="text-gray-500 text-xs">
                      Authorized Signatory
                    </div>
                    <div className="flex items-center mt-2 text-blue-600">
                      <Shield className="w-4 h-4 md:w-5 md:h-5 mr-1" />
                      <span className="text-xs font-semibold">Digitally Signed</span>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-2 border border-gray-300 rounded-lg shadow-sm">
                      <QRCodeSVG
                        value={qrCodeUrl}
                        size={80}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Scan to verify
                    </div>
                  </div>
                </div>

                {/* Reissue Tracking */}
                {certificate.reissueCount > 0 && (
                  <div className="w-full mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-center text-xs text-gray-500">
                      <RefreshCw className="w-3 h-3 mr-1" />
                      <span>Reissued {certificate.reissueCount} time(s)</span>
                    </div>
                  </div>
                )}
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
                {!isRevoked && (
                  <button
                    onClick={() => setShowReissueModal(true)}
                    className="flex items-center px-4 md:px-6 py-2 md:py-3 bg-purple-600 text-white rounded-lg font-semibold text-sm hover:bg-purple-700 transition duration-200"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Reissue
                  </button>
                )}
                {!isRevoked && (
                  <button
                    onClick={() => setShowRevocationModal(true)}
                    className="flex items-center px-4 md:px-6 py-2 md:py-3 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 transition duration-200"
                  >
                    <Ban className="w-5 h-5 mr-2" />
                    Revoke
                  </button>
                )}
                <button
                  onClick={handlePrint}
                  className="flex items-center px-4 md:px-6 py-2 md:py-3 bg-gray-700 text-white rounded-lg font-semibold text-sm hover:bg-gray-800 transition duration-200"
                >
                  <Printer className="w-5 h-5 mr-2" />
                  Print / Save PDF
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

      {/* Reissue Modal */}
      {showReissueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reissue Certificate</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will generate a new certificate with an updated issue date and certificate number. The original certificate will remain in the reissue history.
            </p>
            <textarea
              value={reissueReason}
              onChange={(e) => setReissueReason(e.target.value)}
              placeholder="Reason for reissue (required)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 text-sm"
              rows="3"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowReissueModal(false);
                  setReissueReason('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReissue}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
              >
                Reissue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revocation Modal */}
      {showRevocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-red-900 mb-4">Revoke Certificate</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will mark the certificate as revoked. It will no longer be valid and will show a revoked status when viewed.
            </p>
            <textarea
              value={revocationReason}
              onChange={(e) => setRevocationReason(e.target.value)}
              placeholder="Reason for revocation (required)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 text-sm"
              rows="3"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowRevocationModal(false);
                  setRevocationReason('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-green-900 mb-4">Restore Certificate</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will restore the revoked certificate and make it valid again. Are you sure you want to proceed?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRestoreModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleRestore}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share User Selection Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Share Certificate</h3>
            <p className="text-sm text-gray-600 mb-4">Select a user to share this certificate with:</p>
            <div className="overflow-y-auto flex-1 mb-4">
              {usersList.length > 0 ? (
                usersList.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleShareWithUser(user)}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg mb-2 transition flex items-center"
                  >
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email || user.department || 'User'}</div>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No users available to share with.</p>
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Certificate;
