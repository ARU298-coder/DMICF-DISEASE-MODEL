import { useState, useEffect, useRef } from 'react';
import { Search, X, Activity, ShieldPlus, ChevronRight, Stethoscope, Brain, FileText, ArrowRight, Info, Heart, Phone } from 'lucide-react';
import LoginPage from './LoginPage';
import UserForm from './UserForm';
import Navbar from './Navbar';

function App() {
  // 'login' → 'signup' → 'main'  OR  'login' → 'main' (guest/google)
  const [currentPage, setCurrentPage] = useState('main');
  const [userName, setUserName] = useState('');
  const [allSymptoms, setAllSymptoms] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPredicting, setIsPredicting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [navModal, setNavModal] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchRef = useRef(null);

  useEffect(() => {
    // Fetch available symptoms on load
    fetch('http://127.0.0.1:8000/symptoms')
      .then(res => res.json())
      .then(data => setAllSymptoms(data.symptoms))
      .catch(err => console.error("Error fetching symptoms:", err));
      
    // Handle click outside for suggestions
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSymptoms = allSymptoms.filter(s => 
    s.toLowerCase().includes(searchTerm.toLowerCase()) && 
    !selectedSymptoms.includes(s)
  );

  const addSymptom = (symptom) => {
    setSelectedSymptoms([...selectedSymptoms, symptom]);
    setSearchTerm('');
    setShowSuggestions(false);
    setResult(null);
  };

  const removeSymptom = (symptomToRemove) => {
    setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptomToRemove));
    setResult(null);
  };

  const handlePredict = async () => {
    if (selectedSymptoms.length === 0) {
      setError("Please select at least one symptom.");
      return;
    }
    
    setError('');
    setIsPredicting(true);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symptoms: selectedSymptoms }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || "Failed to predict");
      }
      
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPredicting(false);
    }
  };

  const formatText = (text) => {
    return text.split('_').join(' ');
  };

  // Called from UserForm after signup
  const handleSignupLogin = (name) => {
    setUserName(name);
    setCurrentPage('main');
  };

  // Called from LoginPage for Google login
  const handleGoogleLogin = () => {
    setUserName('Google User');
    setCurrentPage('main');
  };

  // Called from LoginPage for Guest login
  const handleGuestLogin = () => {
    setUserName('Guest');
    setCurrentPage('main');
  };

  const handleNavClick = (action) => {
    if (action === 'about') {
      setNavModal({
        title: 'About MediPredict AI',
        content: 'MediPredict AI uses an advanced Random Forest Machine Learning model trained on extensive medical datasets. It correlates your symptoms with potential conditions to provide a preliminary diagnostic assessment.',
        icon: <Info size={28} />,
        color: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.15)'
      });
    } else if (action === 'tips') {
      setNavModal({
        title: 'Daily Health Tip',
        content: "Stay hydrated! Drinking at least 8 glasses of water a day helps maintain your body's vital functions, boosts your immune system, and keeps your skin healthy.",
        icon: <Heart size={28} />,
        color: '#ec4899',
        bg: 'rgba(236, 72, 153, 0.15)'
      });
    } else if (action === 'emergency') {
      setNavModal({
        title: 'Emergency Protocol',
        content: "If you are experiencing a life-threatening medical emergency (e.g., severe chest pain, difficulty breathing, or severe bleeding), please call your local emergency number (like 911 or 112) immediately. Do not rely on AI predictions for emergencies.",
        icon: <Phone size={28} />,
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.15)'
      });
    }
  };

  // Show Login Page
  if (currentPage === 'login') {
    return (
      <LoginPage
        onGoogleLogin={handleGoogleLogin}
        onGuestLogin={handleGuestLogin}
        onSignUp={() => setCurrentPage('signup')}
      />
    );
  }

  // Show Sign Up (UserForm)
  if (currentPage === 'signup') {
    return <UserForm onLogin={handleSignupLogin} onBack={() => setCurrentPage('login')} />;
  }

  // Main app (currentPage === 'main')
  return (
    <>
    <Navbar 
      userName={userName} 
      onLoginClick={() => setCurrentPage('login')} 
      onLogout={() => setUserName('')}
      onNavClick={handleNavClick}
      result={result}
      selectedSymptoms={selectedSymptoms}
    />
    
    <div className="app-container" style={{ paddingTop: '100px' }}>
      <header>
        <h1 style={{ fontSize: '3.5rem' }}>MediPredict AI</h1>
        <p>Intelligent symptom analysis and disease prediction powered by Machine Learning</p>
      </header>

      {userName && (
        <div className="welcome-banner">
          <span className="welcome-wave">👋</span>
          <div className="welcome-text">
            <h2>Welcome, <span className="welcome-name">{userName}</span>!</h2>
            <p>Start by searching and selecting your symptoms below.</p>
          </div>
        </div>
      )}

      {userName ? (
        <div className="glass-panel">
          <div className="input-section">
            <div className="search-container" ref={searchRef}>
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#cbd5e1' }} size={20} />
                <input 
                  type="text" 
                  autoComplete="off"
                  className="search-input"
                  placeholder="Search and add your symptoms..." 
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  style={{ paddingLeft: '3rem' }}
                />
              </div>
              
              {showSuggestions && searchTerm && filteredSymptoms.length > 0 && (
                <div className="suggestions">
                  {filteredSymptoms.map(s => (
                    <div 
                      key={s} 
                      className="suggestion-item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        addSymptom(s);
                      }}
                    >
                      {formatText(s)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="selected-symptoms">
              {selectedSymptoms.map(s => (
                <div key={s} className="symptom-tag">
                  <Activity size={14} />
                  {formatText(s)}
                  <button onClick={() => removeSymptom(s)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            {error && <div style={{ color: 'var(--danger)', marginTop: '0.5rem' }}>{error}</div>}

            <button 
              className="predict-btn" 
              onClick={handlePredict}
              disabled={isPredicting || selectedSymptoms.length === 0}
            >
              {isPredicting ? (
                <><div className="loader"></div> Analyzing...</>
              ) : (
                <><Stethoscope size={24} /> Predict Potential Disease</>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="workflow-container glass-panel">
          <h2 className="workflow-title">How It Works</h2>
          <p className="workflow-subtitle">Sign in to start using the MediPredict AI engine in three simple steps.</p>
          
          <div className="workflow-steps">
            <div className="workflow-step">
              <div className="step-icon">
                <Search size={28} />
              </div>
              <h3>1. Select Symptoms</h3>
              <p>Search and add your current symptoms from our comprehensive medical database.</p>
            </div>
            
            <div className="step-arrow">
              <ArrowRight size={24} />
            </div>

            <div className="workflow-step">
              <div className="step-icon step-icon-ai">
                <Brain size={28} />
              </div>
              <h3>2. AI Analysis</h3>
              <p>Our ML model analyzes your symptoms against patterns from thousands of medical cases.</p>
            </div>

            <div className="step-arrow">
              <ArrowRight size={24} />
            </div>

            <div className="workflow-step">
              <div className="step-icon step-icon-success">
                <FileText size={28} />
              </div>
              <h3>3. Get Diagnosis</h3>
              <p>Receive potential disease predictions, detailed descriptions, and recommended precautions.</p>
            </div>
          </div>
          
          <button className="predict-btn workflow-cta" onClick={() => setCurrentPage('login')}>
            Sign In to Start
          </button>
        </div>
      )}

      {result && result.length > 0 && (
        <div className="results-container">
          <div className="primary-result">
            <h2 className="section-title" style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: '500' }}>
              Top Prediction
            </h2>
            <div className="disease-card">
              <div className="disease-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h2 style={{ marginBottom: 0 }}>{formatText(result[0].disease)}</h2>
                <div className="confidence-badge" style={{ 
                  background: 'rgba(16, 185, 129, 0.2)', 
                  color: 'var(--success)', 
                  padding: '0.5rem 1rem', 
                  borderRadius: '20px', 
                  fontWeight: '600',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  {Math.round(result[0].probability * 100)}% Match
                </div>
              </div>
              <p>{result[0].description}</p>
              
              {result[0].precautions && result[0].precautions.length > 0 && (
                <div className="precautions-section">
                  <h3 style={{ marginBottom: '1.5rem', marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldPlus color="var(--accent)" /> Recommended Precautions
                  </h3>
                  <div className="precautions-grid">
                    {result[0].precautions.map((precaution, idx) => (
                      <div key={idx} className="precaution-item">
                        <div className="precaution-icon">
                          <ChevronRight size={24} />
                        </div>
                        <div className="precaution-text">
                          {precaution}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {result.length > 1 && (
            <div className="alternative-results">
              <h3 className="section-title" style={{ marginTop: '3rem', marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: '500' }}>
                Other Possibilities
              </h3>
              <div className="alternatives-grid" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                {result.slice(1).map((alt, idx) => (
                  <div key={idx} className="alternative-card" style={{ 
                    background: 'var(--bg-card)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    borderRadius: '16px', 
                    padding: '1.5rem' 
                  }}>
                    <div className="alt-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: 0 }}>{formatText(alt.disease)}</h4>
                      <span className="alt-confidence" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {Math.round(alt.probability * 100)}%
                      </span>
                    </div>
                    <div className="confidence-bar-bg" style={{ 
                      width: '100%', 
                      height: '6px', 
                      background: 'rgba(255, 255, 255, 0.1)', 
                      borderRadius: '3px',
                      marginBottom: '1rem',
                      overflow: 'hidden'
                    }}>
                      <div className="confidence-bar-fill" style={{ 
                        width: `${alt.probability * 100}%`, 
                        height: '100%', 
                        background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                        borderRadius: '3px'
                      }}></div>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
                      {alt.description.length > 120 ? alt.description.substring(0, 120) + '...' : alt.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
      {/* Navbar Feature Modal */}
      {navModal && (
        <div className="modal-overlay" onClick={() => setNavModal(null)} style={{ zIndex: 2000 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setNavModal(null)}>
              <X size={20} />
            </button>
            <div className="modal-header">
              <div className="modal-icon" style={{ background: navModal.bg, color: navModal.color }}>
                {navModal.icon}
              </div>
              <h2>{navModal.title}</h2>
            </div>
            <div style={{ 
              color: 'var(--text-muted)', 
              fontSize: '1rem', 
              lineHeight: '1.6', 
              textAlign: 'center',
              padding: '0 1rem 1rem 1rem'
            }}>
              {navModal.content}
            </div>
            <button 
              className="predict-btn" 
              onClick={() => setNavModal(null)}
              style={{ marginTop: '1rem' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </>
  );
}

export default App;
