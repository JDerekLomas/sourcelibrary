import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import TapToReveal from '../components/Astrology/TapToReveal';
import ShootingStarsBackground from '../components/Astrology/ShootingStarsBackground';
import CrystalBall from '../components/Astrology/CrystalBall';
import HomeButton from '../components/ui/Buttons/HomeButton';

// --- Configuration for Animation Speed ---
// The duration for the fade-in and glow effect (in milliseconds)
const FADE_IN_DURATION = 1000;
// The delay between each number or letter appearing (in milliseconds)
const ANIMATION_INTERVAL = 1000;

// Define types for the data we expect from the backend
interface Prophecy {
  prophecy: string;
  prophecy_en: string;
}

type Grid = (number | null)[][];

const initialGrid: Grid = Array(4).fill(null).map(() => Array(4).fill(null));

// --- Audio file paths ---
const ASTRO_BG_MUSIC = '/astrology/astro_bg.ogg';
const ASTRO_SFX = '/astrology/astro_sfx.wav';

const Astrology: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loaderMessage, setLoaderMessage] = useState<string>('Gazing into the abyss...');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(true);
  const [isVerified, setIsVerified] = useState<boolean>(false);

  // State for each step of the divination
  const [grid, setGrid] = useState<Grid>(initialGrid);
  const [displayedConsonants, setDisplayedConsonants] = useState<string[]>([]);
  const [visibleConsonantCount, setVisibleConsonantCount] = useState(0);
  const [prophecy, setProphecy] = useState<Prophecy | null>(null);
  const [pendingProphecy, setPendingProphecy] = useState<Prophecy | null>(null);
  const [isConsonantAnimationComplete, setIsConsonantAnimationComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('idle');

  // --- Refs for scrolling ---
  const gridRef = React.useRef<HTMLDivElement | null>(null);
  const consonantsRef = React.useRef<HTMLDivElement | null>(null);
  const prophecyRef = React.useRef<HTMLDivElement | null>(null);

  // --- Audio refs and hooks ---
  const bgAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const sfxAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const activeSfxRef = React.useRef<HTMLAudioElement[]>([]);
  const timeoutIdsRef = React.useRef<NodeJS.Timeout[]>([]);

  // Play background music on mount and on user interaction
  useEffect(() => {
    // Create and configure background audio
    const bgAudio = new Audio(ASTRO_BG_MUSIC);
    bgAudio.loop = true;
    bgAudio.volume = 0.4;
    bgAudioRef.current = bgAudio;

    // Try to play on mount (may be blocked by browser until user interacts)
    bgAudio.play().catch(() => { });

    // Play on first user interaction if not already playing
    const resumeAudio = () => {
      if (bgAudio.paused) {
        bgAudio.play().catch(() => { });
      }
    };
    window.addEventListener('pointerdown', resumeAudio, { once: true });

    return () => {
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
        bgAudioRef.current = null;
      }
      // Also clear all scheduled timeouts on unmount
      timeoutIdsRef.current.forEach(clearTimeout);
      window.removeEventListener('pointerdown', resumeAudio);
    };
  }, []);

  // Prepare SFX audio element and manage active SFX on unmount
  useEffect(() => {
    sfxAudioRef.current = new Audio(ASTRO_SFX);
    sfxAudioRef.current.volume = 0.1;
    activeSfxRef.current = [];

    return () => {
      // When component unmounts, stop all active SFX
      activeSfxRef.current.forEach(sfx => sfx.pause());
      activeSfxRef.current = [];
    };
  }, []);

  // Helper to play SFX (replay for each call)
  const playSfx = React.useCallback(() => {
    if (sfxAudioRef.current) {
      const sfx = sfxAudioRef.current.cloneNode() as HTMLAudioElement;
      sfx.volume = sfxAudioRef.current.volume;
      sfx.play().catch(() => { });
      activeSfxRef.current.push(sfx);
      // Clean up from array after it has finished playing
      sfx.onended = () => {
        activeSfxRef.current = activeSfxRef.current.filter(a => a !== sfx);
      };
    }
  }, []);

  // Reset state for a new query
  const resetState = () => {
    // Clear any pending animation timeouts
    timeoutIdsRef.current.forEach(clearTimeout);
    timeoutIdsRef.current = [];

    setGrid(initialGrid);
    setDisplayedConsonants([]);
    setVisibleConsonantCount(0);
    setProphecy(null);
    setPendingProphecy(null);
    setIsConsonantAnimationComplete(false);
    setError(null);
    setCurrentStep('idle');
    setLoaderMessage('Gazing into the abyss...');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) {
      setError('You must pose a question to the ether.');
      return;
    }

    if (!turnstileToken || !isVerified) {
      setError('Please complete the captcha verification.');
      setShowVerificationModal(true);
      return;
    }

    resetState();
    setIsLoading(true);
    setLoaderMessage('Looking into the abyss...'); // Initial message

    try {
      const response = await apiService.getAstrologyPrediction(query, turnstileToken);

      if (!response.ok) {
        throw new Error(`The connection to the astral plane was severed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Could not read the omens.');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');

        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonData = line.substring(6);
            const data = JSON.parse(jsonData);

            if (data.error) {
              throw new Error(data.error);
            }

            switch (data.step) {
              case 'grid_calculated':
                setCurrentStep('grid');
                const finalGrid = data.data.final_grid;
                for (let r = 0; r < 4; r++) {
                  for (let c = 0; c < 4; c++) {
                    // Add a minimal delay to ensure the first cell transition is visible
                    const timeoutId = setTimeout(() => {
                      setGrid(prevGrid => {
                        const newGrid = prevGrid.map(row => [...row]);
                        newGrid[r][c] = finalGrid[r][c];
                        return newGrid;
                      });
                      playSfx(); // Play SFX on each grid cell reveal
                    }, (r * 4 + c) * ANIMATION_INTERVAL + 50);
                    timeoutIdsRef.current.push(timeoutId);
                  }
                }
                break;
              case 'consonants_derived':
                // Wait for grid animation to finish, then update status
                const consonantTimeoutId = setTimeout(() => {
                  setLoaderMessage('Decoding the resonant glyphs...');
                  setCurrentStep('consonants');
                  const derivedConsonants = data.data.consonants;

                  const itemsToDisplay: string[] = [];
                  derivedConsonants.forEach((consonant: string, index: number) => {
                    itemsToDisplay.push(consonant);
                    if (index < derivedConsonants.length - 1) {
                      itemsToDisplay.push(',');
                    }
                  });
                  setDisplayedConsonants(itemsToDisplay);

                  // Animate each consonant and comma appearing one by one by updating a counter
                  for (let i = 0; i <= itemsToDisplay.length; i++) {
                    const innerTimeoutId = setTimeout(() => {
                      setVisibleConsonantCount(i);
                      if (i > 0) playSfx(); // Play SFX on each consonant/comma reveal
                    }, i * ANIMATION_INTERVAL);
                    timeoutIdsRef.current.push(innerTimeoutId);
                  }

                  // Set loader message for prophecy after last consonant starts to fade in
                  const animationDuration = (itemsToDisplay.length) * ANIMATION_INTERVAL;
                  const loaderTimeoutId = setTimeout(() => {
                    setLoaderMessage('The Oracle is decrypting the glyphs...');
                  }, animationDuration);
                  timeoutIdsRef.current.push(loaderTimeoutId);

                  // Mark consonant animation as complete after it finishes
                  const completionTimeoutId = setTimeout(() => {
                    setIsConsonantAnimationComplete(true);
                  }, animationDuration + FADE_IN_DURATION); // Add fade-in time for safety
                  timeoutIdsRef.current.push(completionTimeoutId);

                }, 16 * ANIMATION_INTERVAL + 500);
                timeoutIdsRef.current.push(consonantTimeoutId);
                break;
              case 'prophecy_generated':
                // Store prophecy data and let useEffect handle the reveal timing (no delay)
                setPendingProphecy(data.data);
                break;
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown disturbance occurred.');
      setIsLoading(false); // Stop loading only on error
      // Reset verification on error
      setTurnstileToken('');
      setIsVerified(false);
      setShowVerificationModal(true);
      // Reset the Turnstile widget
      if ((window as any).turnstile) {
        (window as any).turnstile.reset();
      }
    }
  };

  useEffect(() => {
    // Set body background to transparent (background handled by component)
    document.body.style.background = 'transparent';
    document.body.style.minHeight = '100vh';
    document.body.style.margin = '0';
    document.body.style.width = '100vw';
    document.body.style.overflow = 'hidden'; // Prevent page scroll

    // Inject breathing animation CSS for the container and section animations
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes breathing-shadow {
        0% {
          box-shadow: 0 0 20px 0 rgba(120,80,200,0.5), 0 0 0 0 rgba(212,175,55,0.08);
        }
        50% {
          box-shadow: 0 0 40px 10px rgba(120,80,200,0.7), 0 0 20px 10px rgba(212,175,55,0.12);
        }
        100% {
          box-shadow: 0 0 20px 0 rgba(120,80,200,0.5), 0 0 0 0 rgba(212,175,55,0.08);
        }
      }
      @keyframes fadeInUpGrid {
        0% { opacity: 0; transform: translateY(40px) scale(0.98);}
        70% { opacity: 1; transform: translateY(-4px) scale(1.01);}
        100% { opacity: 1; transform: translateY(0) scale(1);}
      }
      @keyframes fadeInUpConsonants {
        0% { opacity: 0; transform: translateY(40px) scale(0.98);}
        70% { opacity: 1; transform: translateY(-4px) scale(1.01);}
        100% { opacity: 1; transform: translateY(0) scale(1);}
      }
      @keyframes fadeInUpDecree {
        0% { opacity: 0; transform: translateY(40px) scale(0.98);}
        70% { opacity: 1; transform: translateY(-4px) scale(1.01);}
        100% { opacity: 1; transform: translateY(0) scale(1);}
      }
      .animate-grid {
        animation: fadeInUpGrid 1.3s cubic-bezier(.22,1,.36,1) both;
      }
      .animate-consonants {
        animation: fadeInUpConsonants 1.3s cubic-bezier(.22,1,.36,1) both;
      }
      .animate-decree {
        animation: fadeInUpDecree 1.5s cubic-bezier(.22,1,.36,1) both;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.body.style.background = '';
      document.body.style.minHeight = '';
      document.body.style.margin = '';
      document.body.style.width = '';
      document.body.style.overflow = ''; // Reset on unmount
      document.head.removeChild(style);
    };
  }, []);

  // Auto-scroll to the current step's content
  useEffect(() => {
    const scrollOptions: ScrollIntoViewOptions = { behavior: 'smooth', block: 'nearest' };
    setTimeout(() => { // Timeout ensures content is rendered before scrolling
      if (currentStep === 'grid' && gridRef.current) {
        gridRef.current.scrollIntoView(scrollOptions);
      } else if (currentStep === 'consonants' && consonantsRef.current) {
        consonantsRef.current.scrollIntoView(scrollOptions);
      } else if (currentStep === 'prophecy' && prophecyRef.current) {
        prophecyRef.current.scrollIntoView(scrollOptions);
      }
    }, 100);
  }, [currentStep]);

  // Show prophecy only when it's available AND the consonant animation has finished.
  useEffect(() => {
    if (pendingProphecy && isConsonantAnimationComplete) {
      setProphecy(pendingProphecy);
      setCurrentStep('prophecy');
      setLoaderMessage('Your stars has spoken...');
      setPendingProphecy(null);
    }
  }, [pendingProphecy, isConsonantAnimationComplete]);

  // Hide loader message only when prophecy is actually revealed
  useEffect(() => {
    if (currentStep === 'prophecy' && prophecy) {
      // The loader message is now controlled by the above useEffect.
      // We stop the loading spinner here, but keep the message.
      setIsLoading(false);
    }
  }, [currentStep, prophecy]);

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      fontFamily: "'Cinzel', serif",
      maxWidth: '600px',
      margin: '0 auto',
      padding: '30px',
      borderRadius: '8px',
      backgroundColor: 'rgba(26,26,46,0.97)',
      color: '#e0e0e0',
      boxShadow: '0 0 20px rgba(120, 80, 200, 0.5)',
      height: 'calc(100vh - 80px)',
      display: 'flex',
      flexDirection: 'column',
      animation: 'breathing-shadow 6s ease-in-out infinite'
    },
    title: { textAlign: 'center', color: '#d4af37', fontWeight: 700, letterSpacing: '0.1em' },
    form: { display: 'flex' },
    input: { flexGrow: 1, padding: '12px', border: '1px solid #4a4a6e', borderRadius: '4px', backgroundColor: '#2a2a3e', color: 'white', fontFamily: "'Cinzel', serif" },
    button: { padding: '12px 20px', border: 'none', backgroundColor: '#d4af37', color: '#1a1a2e', borderRadius: '4px', marginLeft: '10px', cursor: 'pointer', fontWeight: 'bold', fontFamily: "'Cinzel', serif", transition: 'background-color 0.3s' },
    resultsContainer: {
      borderTop: '1px solid #4a4a6e',
      overflowY: 'auto',
      paddingRight: '15px', // Prevent scrollbar overlap
      flex: 1,
      minHeight: 0, // Fix for flexbox overflow
    },
    stepTitle: { color: '#d4af37', borderBottom: '1px solid #4a4a6e', paddingBottom: '8px', marginBottom: '15px', letterSpacing: '0.05em' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 50px)', gap: '6px', justifyContent: 'center' },
    gridContainer: { display: 'inline-block', border: '1px dashed #d4af37', padding: '15px', backgroundColor: 'rgba(255, 255, 255, 0.03)' },
    gridCell: { width: '50px', height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #4a4a6e', backgroundColor: '#2a2e3e', fontSize: '1.3em', color: '#e0e0e0' },
    fadingText: {
      transition: `opacity ${FADE_IN_DURATION}ms ease-in-out, text-shadow ${FADE_IN_DURATION}ms ease-in-out`,
      textShadow: '0 0 15px rgba(212, 175, 55, 0)'
    },
    consonants: { textAlign: 'center', fontSize: '1.2em', letterSpacing: '0.3em', color: '#e0e0e0', padding: '10px 0', height: '2em' },
    prophecyBox: { border: '1px dashed #d4af37', padding: '20px', marginTop: '15px', backgroundColor: 'rgba(255, 255, 255, 0.03)', lineHeight: '1.6' },
    error: { color: '#ff6b6b', textAlign: 'center', padding: '10px', border: '1px solid #ff6b6b', borderRadius: '4px' },
  };

  // Load Turnstile script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Add event listeners for Turnstile
  useEffect(() => {
    const handleSuccess = (event: any) => {
      setTurnstileToken(event.detail);
      setIsVerified(true);
      setShowVerificationModal(false);
    };

    const handleExpired = () => {
      setTurnstileToken('');
      setIsVerified(false);
      setShowVerificationModal(true);
    };

    const handleError = () => {
      setTurnstileToken('');
      setIsVerified(false);
      setError('Captcha verification failed. Please try again.');
    };

    window.addEventListener('turnstile-success', handleSuccess);
    window.addEventListener('turnstile-expired', handleExpired);
    window.addEventListener('turnstile-error', handleError);

    // Add global callbacks
    (window as any).onTurnstileSuccess = function (token: string) {
      window.dispatchEvent(new CustomEvent('turnstile-success', { detail: token }));
    };
    (window as any).onTurnstileExpired = function () {
      window.dispatchEvent(new CustomEvent('turnstile-expired'));
    };
    (window as any).onTurnstileError = function () {
      window.dispatchEvent(new CustomEvent('turnstile-error'));
    };

    return () => {
      window.removeEventListener('turnstile-success', handleSuccess);
      window.removeEventListener('turnstile-expired', handleExpired);
      window.removeEventListener('turnstile-error', handleError);
    };
  }, []);

  const verificationModalStyles: { [key: string]: React.CSSProperties } = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(26, 26, 46, 0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      fontFamily: "'Cinzel', serif"
    },
    modal: {
      backgroundColor: 'rgba(26, 26, 46, 0.97)',
      padding: '40px',
      borderRadius: '8px',
      textAlign: 'center',
      maxWidth: '500px',
      width: '90%',
      border: '1px solid #d4af37',
      boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)'
    },
    title: {
      color: '#d4af37',
      fontSize: '24px',
      fontWeight: 700,
      marginBottom: '20px',
      letterSpacing: '0.1em'
    },
    description: {
      color: '#e0e0e0',
      marginBottom: '30px',
      lineHeight: '1.6'
    }
  };

  return (
    <>
      {/* Back to Books (fits dark/gold theme) */}
      <div style={{ position: 'fixed', top: 16, left: 16, zIndex: 9000 }}>
        <HomeButton
          useBaseButton={false}
          className="inline-flex items-center gap-2"
          style={{
            backgroundColor: 'rgba(26,26,46,0.9)',
            color: '#d4af37',
            border: '1px solid #d4af37',
            padding: '8px 12px',
            borderRadius: '6px',
            fontFamily: "'Cinzel', serif",
            boxShadow: '0 0 10px rgba(212,175,55,0.18)',
            cursor: 'pointer'
          }}
        />
      </div>

      <ShootingStarsBackground />

      {/* Verification Modal */}
      {showVerificationModal && (
        <div style={verificationModalStyles.overlay}>
          <div style={verificationModalStyles.modal}>
            <h2 style={verificationModalStyles.title}>Mystic Verification</h2>
            <p style={verificationModalStyles.description}>
              Before consulting the oracle, you must prove your mortal essence through the sacred rite of verification.
            </p>
            <div
              className="cf-turnstile"
              data-sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              data-callback="onTurnstileSuccess"
              data-expired-callback="onTurnstileExpired"
              data-error-callback="onTurnstileError"
              data-theme="dark"
            ></div>
            {error && <p style={{ color: '#ff6b6b', marginTop: '15px', fontSize: '14px' }}>{error}</p>}
          </div>
        </div>
      )}

      {/* Main Content - Only visible after verification */}
      {isVerified && (
        <div style={{ paddingTop: '40px', paddingBottom: '40px' }}>
          <div style={styles.container}>
            <h1 style={styles.title}>The Cabalistic Oracle</h1>
            <form onSubmit={handleSubmit} style={styles.form}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pose your question to the stars..."
                style={styles.input}
                disabled={isLoading}
              />
              <button type="submit" style={styles.button} disabled={isLoading}>
                Ask the Oracle
              </button>
            </form>

            {(isLoading || (currentStep === 'prophecy' && prophecy)) && <CrystalBall message={loaderMessage} />}
            {error && <p style={styles.error}>{error}</p>}

            <div style={styles.resultsContainer}>
              {currentStep !== 'idle' && (
                <div
                  ref={gridRef}
                  className={currentStep === 'grid' ? 'animate-grid' : ''}
                  style={{
                    ...styles.fadingText,
                    opacity: currentStep === 'grid' || currentStep === 'consonants' || currentStep === 'prophecy' ? 1 : 0
                  }}
                >
                  <h3 style={styles.stepTitle}>The Celestial Matrix</h3>
                  <div style={{ textAlign: 'center', margin: '25px 0' }}>
                    <div style={styles.gridContainer}>
                      <div style={styles.grid}>
                        {grid.flat().map((cell, index) => (
                          <div key={index} style={styles.gridCell}>
                            <span style={{
                              ...styles.fadingText,
                              opacity: cell !== null ? 1 : 0,
                              textShadow: cell !== null ? '0 0 8px rgba(212, 175, 55, 0.8)' : '0 0 15px rgba(212, 175, 55, 0)'
                            }}>
                              {cell}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(currentStep === 'consonants' || currentStep === 'prophecy') && (
                <div
                  ref={consonantsRef}
                  className={currentStep === 'consonants' ? 'animate-consonants' : ''}
                  style={{
                    ...styles.fadingText,
                    opacity: currentStep === 'consonants' || currentStep === 'prophecy' ? 1 : 0
                  }}
                >
                  <h3 style={styles.stepTitle}>The Resonant Glyphs</h3>
                  <p style={styles.consonants}>
                    {displayedConsonants.map((char, index) => (
                      <span key={index} style={{
                        ...styles.fadingText,
                        opacity: index < visibleConsonantCount ? 1 : 0,
                        textShadow: index < visibleConsonantCount ? '0 0 8px rgba(212, 175, 55, 0.8)' : '0 0 15px rgba(212, 175, 55, 0)',
                        display: 'inline-block',
                        margin: char === ',' ? '0' : '0 0.15em'
                      }}>
                        {char}
                      </span>
                    ))}
                  </p>
                </div>
              )}

              {currentStep === 'prophecy' && prophecy && (
                <div
                  ref={prophecyRef}
                  className="animate-decree"
                  style={{
                    ...styles.fadingText,
                    opacity: currentStep === 'prophecy' && prophecy ? 1 : 0
                  }}
                >
                  <h3 style={styles.stepTitle}>The Oracle's Decree</h3>
                  <TapToReveal width={480} height={120} style={{ margin: '0 auto', display: 'block', maxWidth: '100%' }}>
                    <div style={styles.prophecyBox}>
                      <p><strong>(Interpretation):</strong> <em>{prophecy.prophecy}</em></p>
                      <p><strong>(Translation):</strong> {prophecy.prophecy_en}</p>
                    </div>
                  </TapToReveal>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Astrology;