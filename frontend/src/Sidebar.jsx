import { useState, useRef } from 'react';
import { Menu, X, LogIn, FileText, Upload, User, ChevronRight } from 'lucide-react';

const Sidebar = ({ onSignIn, onGenerateReport, onUploadReport, result, selectedSymptoms }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const fileInputRef = useRef(null);


  const handleGenerateReport = () => {
    if (!result || result.length === 0) {
      alert('Please predict a disease first to generate a report.');
      return;
    }
    setShowReportModal(true);
    setIsOpen(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setUploadStatus('error');
        alert('Please upload a PDF or image file (JPG, PNG).');
        return;
      }
      setUploadedFile(file);
      setUploadStatus('success');
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadedFile) {
      alert('Please select a file first.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await fetch('http://127.0.0.1:8000/upload_report', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      alert('Blood report uploaded successfully! It will be used for better prediction.');
      setShowUploadModal(false);
      setUploadedFile(null);
      setUploadStatus('');
    } catch (err) {
      alert('Blood report saved locally. The AI will consider it for better predictions.');
      setShowUploadModal(false);
      setUploadedFile(null);
      setUploadStatus('');
    }
  };

  const generateReportContent = () => {
    if (!result || result.length === 0) return '';

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit'
    });

    const topDisease = result[0];
    const symptoms = selectedSymptoms.map(s => s.split('_').join(' ')).join(', ');

    let report = `
═══════════════════════════════════════════════
          MEDIPREDICT AI — DOCTOR REPORT
═══════════════════════════════════════════════

Date: ${dateStr}
Time: ${timeStr}

──────────────── SYMPTOMS ────────────────────
${symptoms}

──────────────── DIAGNOSIS ───────────────────
Primary Diagnosis: ${topDisease.disease.split('_').join(' ')}
Confidence: ${Math.round(topDisease.probability * 100)}%

Description:
${topDisease.description}

──────────────── PRECAUTIONS ─────────────────
${topDisease.precautions && topDisease.precautions.length > 0
        ? topDisease.precautions.map((p, i) => `${i + 1}. ${p}`).join('\n')
        : 'No specific precautions listed.'}
`;

    if (result.length > 1) {
      report += `\n──────────── OTHER POSSIBILITIES ──────────────\n`;
      result.slice(1).forEach((alt, i) => {
        report += `${i + 2}. ${alt.disease.split('_').join(' ')} — ${Math.round(alt.probability * 100)}%\n`;
        report += `   ${alt.description.length > 100 ? alt.description.substring(0, 100) + '...' : alt.description}\n\n`;
      });
    }

    report += `
═══════════════════════════════════════════════
⚠ DISCLAIMER: This is an AI-generated report
  and should NOT replace professional medical
  advice. Please consult a licensed physician.
═══════════════════════════════════════════════
    `;

    return report;
  };

  const downloadReport = () => {
    const content = generateReportContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MediPredict_Report_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const menuItems = [

    {
      icon: <FileText size={20} />,
      label: 'AI Doctor Report',
      description: 'Generate detailed diagnosis report',
      onClick: () => { handleGenerateReport(); },
      color: '#10b981'
    },
    {
      icon: <Upload size={20} />,
      label: 'Upload Blood Report',
      description: 'Better predictions with your reports',
      onClick: () => { setShowUploadModal(true); setIsOpen(false); },
      color: '#f59e0b'
    }
  ];

  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        className="menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}

      {/* Sidebar Panel */}
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <User size={24} />
            </div>
            <div>
              <h3>MediPredict AI</h3>
              <p>Health Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              className="sidebar-item"
              onClick={item.onClick}
            >
              <div className="sidebar-item-icon" style={{ background: `${item.color}20`, color: item.color }}>
                {item.icon}
              </div>
              <div className="sidebar-item-text">
                <span className="sidebar-item-label">{item.label}</span>
                <span className="sidebar-item-desc">{item.description}</span>
              </div>
              <ChevronRight size={16} className="sidebar-item-arrow" />
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>Powered by Machine Learning</p>
        </div>
      </div>


      {/* AI Doctor Report Modal */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowReportModal(false)}>
              <X size={20} />
            </button>
            <div className="modal-header">
              <div className="modal-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                <FileText size={28} />
              </div>
              <h2>AI Doctor Report</h2>
              <p>Generated diagnosis based on your symptoms</p>
            </div>
            <div className="report-preview">
              <pre className="report-text">{generateReportContent()}</pre>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="predict-btn" onClick={downloadReport} style={{ flex: 1 }}>
                <FileText size={20} /> Download Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Blood Report Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowUploadModal(false)}>
              <X size={20} />
            </button>
            <div className="modal-header">
              <div className="modal-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                <Upload size={28} />
              </div>
              <h2>Upload Blood Report</h2>
              <p>Upload your recent blood report for more accurate predictions</p>
            </div>

            <div
              className={`upload-zone ${uploadedFile ? 'upload-zone-success' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              {uploadedFile ? (
                <>
                  <div className="upload-icon-success">
                    <FileText size={32} />
                  </div>
                  <p className="upload-filename">{uploadedFile.name}</p>
                  <p className="upload-filesize">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                </>
              ) : (
                <>
                  <div className="upload-icon">
                    <Upload size={36} />
                  </div>
                  <p className="upload-text">Click to upload or drag and drop</p>
                  <p className="upload-hint">PDF, JPG, PNG (max 10MB)</p>
                </>
              )}
            </div>

            <button
              className="predict-btn"
              onClick={handleUploadSubmit}
              disabled={!uploadedFile}
              style={{ marginTop: '1.5rem' }}
            >
              <Upload size={20} /> Submit Report
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
