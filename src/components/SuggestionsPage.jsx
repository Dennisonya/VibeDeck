import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import './SuggestionsPage.css';
import { extractDominantColor } from '../utils/colorExtractor';
import authFetch from './authFetch';

export default function SuggestionsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [slideColors, setSlideColors] = useState({});
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const audioRef = useRef(null);
  const navigate = useNavigate();

  // Fetch recommendations from API
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const data = await authFetch('/api/recommendations', navigate);
        if (!data) {
          throw new Error('Failed to fetch recommendations');
        }
        setRecommendations(data.results || []);
        
        // Extract colors for each recommendation
        const colors = {};
        for (const rec of data.results || []) {
          if (rec.image) {
            try {
              const color = await extractDominantColor(rec.image);
              colors[rec.id] = color;
            } catch (error) {
              console.error('Error extracting color:', error);
              colors[rec.id] = { rgb: 'rgb(29, 185, 84)', hex: '#1db954' };
            }
          }
        }
        setSlideColors(colors);
         console.log(data)
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  // Auto-advance slides
  useEffect(() => {
    if (recommendations.length > 1 && isAutoPlaying) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % recommendations.length);
      }, 8000); // Change slide every 8 seconds
      
      return () => clearInterval(interval);
    }
  }, [recommendations.length, isAutoPlaying]);

  // Handle audio playback
  const togglePlay = () => {
    const currentSong = recommendations[currentIndex];
    if (!currentSong) return;

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
    } else {
      if (audioRef.current && currentSong.preview_url) {
        audioRef.current.src = currentSong.preview_url;
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
        });
        setIsPlaying(true);
      }
    }
  };

  // Handle audio ended
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  // Navigation functions
  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % recommendations.length);
  };

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev - 1 + recommendations.length) % recommendations.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          goToNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'Enter':
          e.preventDefault();
          togglePlay();
          break;
        case 'Escape':
          setIsAutoPlaying(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, recommendations.length]);

  // Loading state
  if (loading) {
    return (
      <div className="suggestions-page">
        <div className="loading">
          <div className="loading-spinner"></div>
          <h2>Discovering your perfect vibe...</h2>
          <p>Analyzing your music taste</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="suggestions-page">
        <div className="error">
          <div className="error-icon">🎵</div>
          <h2 className="error-message">Oops! Something went wrong</h2>
          <p>We couldn't load your recommendations right now.</p>
          <button className="retry-button" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No recommendations
  if (recommendations.length === 0) {
    return (
      <div className="suggestions-page">
        <div className="error">
          <div className="error-icon">🎧</div>
          <h2 className="error-message">No recommendations yet</h2>
          <p>Start adding some vibes to get personalized music suggestions!</p>
          <button className="retry-button" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentSong = recommendations[currentIndex];
  const currentColor = slideColors[currentSong?.id];

  return (
    <div className="suggestions-page">
      <audio ref={audioRef} onEnded={handleAudioEnded} />
      
      <div className="slideshow-container">
        {recommendations.map((song, index) => {
          const isActive = index === currentIndex;
          const isPrev = index === (currentIndex - 1 + recommendations.length) % recommendations.length;
          const slideColor = slideColors[song.id];
          
          return (
            <div
              key={song.id}
              className={`slide ${isActive ? 'active' : ''} ${isPrev ? 'prev' : ''}`}
              style={{
                backgroundColor: slideColor?.rgb || 'rgb(29, 185, 84)',
                backgroundImage: `linear-gradient(135deg, ${slideColor?.rgb || 'rgb(29, 185, 84)'}20, ${slideColor?.rgb || 'rgb(29, 185, 84)'}40), url(${song.image})`,
              }}
            >
              <div className="slide-content">
                {/* Story text */}
                <div className="story-text">
                  {index === 0 && (
                    <>
                      Based on your recent vibes, we found something <span className="highlight">perfect</span> for you...
                    </>
                  )}
                  {index > 0 && (
                    <>
                      {song.reason}
                    </>
                  )}
                </div>

                {/* Album art */}
                <div className="album-art-container">
                  <img 
                    src={song.image} 
                    alt={`${song.title} album art`} 
                    className="album-art"
                  />
                  <div className="play-overlay" onClick={togglePlay}>
                    {isPlaying && isActive ? (
                      <div className="equalizer">
                        <div className="bar"></div>
                        <div className="bar"></div>
                        <div className="bar"></div>
                      </div>
                    ) : (
                      <div className="play-icon">▶</div>
                    )}
                  </div>
                </div>

                {/* Song info */}
                <div className="song-info">
                  <h1 className="song-title">{song.title}</h1>
                  <h2 className="song-artist">{song.artist}</h2>
                  <p className="song-reason">{song.reason}</p>
                </div>

                {/* Navigation */}
                <div className="navigation">
                  <button 
                    className="nav-button" 
                    onClick={goToPrevious}
                    disabled={recommendations.length <= 1}
                  >
                    ← Previous
                  </button>
                  
                  <button 
                    className="nav-button primary" 
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  >
                    {isAutoPlaying ? '⏸ Pause' : '▶ Auto Play'}
                  </button>
                  
                  <button 
                    className="nav-button" 
                    onClick={goToNext}
                    disabled={recommendations.length <= 1}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress indicator */}
      <div className="progress-container">
        {recommendations.map((_, index) => (
          <div
            key={index}
            className={`progress-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
} 