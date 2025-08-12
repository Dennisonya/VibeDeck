import { useNavigate } from "react-router";
import {gsap } from "gsap"
import { Draggable } from "gsap/all";
import  { ScrollTrigger } from "gsap/ScrollTrigger";
import MiniPlayer from "./MiniPlayer.tsx";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useRef, useEffect } from 'react';
import EntryDetails from "./EntryDetails.jsx";
import "./Dashboard.css";

gsap.registerPlugin(Draggable,ScrollTrigger)

export default function Dashboard() {
  
  const [vibes, setVibes] = useState([]);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("userInfo"));
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeVibeId, setActiveVibeId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const carouselRef = useRef(null)
  const vibesCarouselRef = useRef(null)
  const vibesScrollRef = useRef(null)
  const audioRef = useRef(null)
  const dragProxyRef = useRef(null)
  const accessToken = JSON.parse(localStorage.getItem("spotifyAccessToken"))
  const vibesBoxesRef = useRef(null);
  const loopRef = useRef(null)
  const loopHeadRef = useRef(null)
  const scrubRef = useRef(null)
  const triggerRef = useRef(null)
  const iterationRef = useRef(0)
// Haptic feedback utility
const triggerHaptic = (type = "light") => {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    switch (type) {
      case "light":
        navigator.vibrate(10)
        break
      case "medium":
        navigator.vibrate(20)
        break
      case "heavy":
        navigator.vibrate([30, 10, 30])
        break
      case "success":
        navigator.vibrate([50, 25, 50])
        break
      default:
        navigator.vibrate(10)
    }
  }
}
  const actionSlides = [
    {
      title: "What song are you vibing to today?",
      buttonText: "+ Create vibe entry",
      action: () => navigate("/createEntry"),
    },
    {
      title: "View your past entries",
      buttonText: "View Entries",
      action: () => navigate("/entries"),
    },
    {
      title: "Get similar song suggestions based on recent entries",
      buttonText: "Get Songs",
      action: () => navigate("/songs"),
    },
  ]

  const goToSlide = (index) => {
    if (carouselRef.current) {
      const slides = carouselRef.current.children
      setCurrentSlide(index)
      gsap.to(slides, {
        x: (i) => (i - index) * 100 + "%",
        duration: 0.8,
        ease: "power2.inOut",
      })
    }
  }

  const nextSlide = () => {
    const next = (currentSlide + 1) % actionSlides.length
    goToSlide(next)
  }

  const prevSlide = () => {
    const prev = (currentSlide - 1 + actionSlides.length) % actionSlides.length
    goToSlide(prev)
  }



const togglePlayer = async (vibeId, audioUrl, vibe,event) => {


  if (activeVibeId === vibeId) {
    // toggle play/pause
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  } else {
    // switch to a new song
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCurrentTrack({
      title: vibe.song_title,
      artist: vibe.artist,
      coverArt: vibe.image,
      spotifyUri: audioUrl,
      id: vibeId,
    })
    setActiveVibeId(vibeId);
    setIsPlaying(true);
  }

};


  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (!userInfo?.token) return;
    fetch("http://localhost:5000/api/users/userVibes", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userInfo.token}`,
      },
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          navigate("/");
          return null;
        }
        if (!res.ok) throw new Error("Not authorized");
        return res.json();
      })
      .then((data) => setVibes(data.vibes))
      .catch((err) => console.error(err));
  }, [navigate]);

   useEffect(() => {
    // Initialize action carousel
    if (carouselRef.current) {
      const slides = carouselRef.current.children
      gsap.set(slides, { x: (i) => i * 100 + "%" })

      // Auto-slide every 4 seconds
       const interval = setInterval(() => {
        nextSlide()
      }, 4000)


      Draggable.create(carouselRef.current, {
        type: "x",
        bounds: { minX: -200, maxX: 200 },
        inertia: true,
        snap: {
          x: (endValue) => {
            const slideWidth = carouselRef.current.offsetWidth
            return Math.round(endValue / slideWidth) * slideWidth
          },
        },
        onDragEnd: function () {
          const dragDistance = this.x
          if (dragDistance > 50) {
            prevSlide()
          } else if (dragDistance < -50) {
            nextSlide()
          }
          gsap.set(carouselRef.current, { x: 0 })
        },
      })

      return () => clearInterval(interval)
    }
  }, [currentSlide])


   useEffect(() => {
    // Initialize GSAP ScrollTrigger infinite scroll for vibes
    if (vibesScrollRef.current && vibes.length > 0) {
      const boxes = vibesScrollRef.current.querySelectorAll(".vibe-box")

      if (boxes.length === 0) return

      // Set initial state: ensure boxes are visible and at default scale/opacity
      gsap.set(".vibe-box", {
        yPercent: -50,
        display: "block",
        opacity: 1, // Ensure visible
        scale: 1, // Ensure default scale
      })

      const STAGGER = 0.1
      const DURATION = 1
      const OFFSET = 0

      // Create the main loop timeline
      const LOOP = gsap.timeline({
        paused: true,
        repeat: -1,
        ease: "none",
      })

      // Create shifts array (triple the boxes for seamless loop)
      const SHIFTS = [...boxes, ...boxes, ...boxes]

      SHIFTS.forEach((BOX, index) => {
        const BOX_TL = gsap
          .timeline()
          .set(BOX, {
            xPercent: 250, // Start far right
            rotateY: -50,
            // Removed initial opacity/scale settings here as they are now set globally
          })
          // Panning
          .fromTo(
            BOX,
            {
              xPercent: 250,
            },
            {
              xPercent: -350,
              duration: 1,
              immediateRender: false,
              ease: "power1.inOut",
            },
            0,
          )
          // Rotations
          .fromTo(
            BOX,
            {
              rotateY: -50,
            },
            {
              rotateY: 50,
              immediateRender: false,
              duration: 1,
              ease: "power4.inOut",
            },
            0,
          )
          // Scale && Z (for the pop effect)
          .to(
            BOX,
            {
              z: 100,
              scale: 1.25,
              duration: 0.1,
              repeat: 1,
              yoyo: true,
            },
            0.4,
          )
          .fromTo(
            BOX,
            {
              zIndex: 1,
            },
            {
              zIndex: boxes.length,
              repeat: 1,
              yoyo: true,
              ease: "none",
              duration: 0.5,
              immediateRender: false,
            },
            0,
          )

        LOOP.add(BOX_TL, index * STAGGER)
      })

      loopRef.current = LOOP

      const CYCLE_DURATION = STAGGER * boxes.length
      const START_TIME = CYCLE_DURATION + DURATION * 0.5 + OFFSET

      const LOOP_HEAD = gsap.fromTo(
        LOOP,
        {
          totalTime: START_TIME,
        },
        {
          totalTime: `+=${CYCLE_DURATION}`,
          duration: 1,
          ease: "none",
          repeat: -1,
          paused: true,
        },
      )

      loopHeadRef.current = LOOP_HEAD

      const PLAYHEAD = { position: 0 }
      const POSITION_WRAP = gsap.utils.wrap(0, LOOP_HEAD.duration())

      const SCRUB = gsap.to(PLAYHEAD, {
        position: 0,
        onUpdate: () => {
          LOOP_HEAD.totalTime(POSITION_WRAP(PLAYHEAD.position))
        },
        paused: true,
        duration: 0.25,
        ease: "power3",
      })

      scrubRef.current = SCRUB

      // Modified ScrollTrigger to not interfere with page scroll
      const TRIGGER = ScrollTrigger.create({
        trigger: vibesScrollRef.current,
        start: "top center",
        end: "bottom center",
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress
          const NEW_POS = progress * LOOP_HEAD.duration()
          SCRUB.vars.position = NEW_POS
          SCRUB.invalidate().restart()
        },
      })

      triggerRef.current = TRIGGER

      // Navigation functions
      const SNAP = gsap.utils.snap(1 / boxes.length)

      const scrollToPosition = (position) => {
        const SNAP_POS = SNAP(position)
        SCRUB.vars.position = SNAP_POS * LOOP_HEAD.duration()
        SCRUB.invalidate().restart()
      }

      // Store navigation functions for button controls
      window.vibeScrollNext = () => {
        const currentPos = SCRUB.vars.position / LOOP_HEAD.duration();
        const nextPos = currentPos + 1 / boxes.length;
        scrollToPosition(nextPos);
      };
      window.vibeScrollPrev = () => {
        const currentPos = SCRUB.vars.position / LOOP_HEAD.duration();
        const prevPos = currentPos - 1 / boxes.length;
        scrollToPosition(prevPos);
      };

      // Draggable functionality
      if (dragProxyRef.current) {
        Draggable.create(dragProxyRef.current, {
          type: "x",
          trigger: ".vibe-box",
          onPress() {
            this.startOffset = SCRUB.vars.position
          },
          onDrag() {
            SCRUB.vars.position = this.startOffset + (this.startX - this.x) * 0.001
            SCRUB.invalidate().restart()
          },
          onDragEnd() {
            const currentPos = SCRUB.vars.position / LOOP_HEAD.duration()
            scrollToPosition(currentPos)
          },
        })
      }

      // Cleanup function
      return () => {
        TRIGGER.kill()
        LOOP.kill()
        LOOP_HEAD.kill()
        SCRUB.kill()
      }
    }
  }, [vibes])


const tags = [
  { name: 'Chill', type: 'chill', color: 'green' },
  { name: 'Rap', type: 'rap', color: 'red' },
  { name: 'Lo-fi', type: 'lofi', color: 'blue' },
  { name: 'Jazz', type: 'jazz', color: 'yellow' },
];


  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }
  return (
    <div className="dashboard">

        <audio ref={audioRef} src={currentTrack?.link} />

       <div className="dashboard-header">
        <div className="greeting">
          <h1>Hello,</h1>
          <h1 className="username">{user?.username || "Guest"}</h1>
        </div>
        <div className="profile-avatar">
          <div className="avatar-circle"></div>
        </div>
      </div>

        {/*Action Carousel */}
      <div className="action-carousel-container">
        <div className="action-carousel" ref={carouselRef}>
          {actionSlides.map((slide, index) => (
            <div key={index} className="action-slide">
              <div className="action-card">
                <h2>{slide.title}</h2>
                <button className="action-button" onClick={slide.action}>{slide.buttonText}</button>
              </div>
            </div>
          ))}
        </div>

        <div className="pagination-dots">
          {actionSlides.map((_,index)=>(
            <div key={index} 
            className={`dot ${index=== currentSlide ? "active" : ""}`}
            onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>

 
      <div className="recent-vibes-section" ref={vibesScrollRef}>
        <h2 className="section-title">Recent Vibes</h2>
        <div className="vibes-carousel-container">
          <div className="vibes-carousel" ref={vibesCarouselRef}>
            {vibes.length > 0 ? (
              <div className="vibe-scroll-container">
                <div className="vibe-boxes-container boxes" ref={vibesBoxesRef}>
                  {vibes.map((vibe, index) => (
                    <div
                      key={vibe.id}
                      className="vibe-box"
                      style={{ "--cover": `url(${vibe.image})` }}
                    >
                      <div className="vibe-box-content">
                        <img src={vibe.image || "/placeholder.svg"} alt={vibe.song_title} />
                        <div className="vibe-info"
                         onClick={() => navigate(`/entries/${vibe.id}`)}>
                          <h3 className="vibe-song-title">{vibe.song_title}</h3>
                          <p className="vibe-artist">{vibe.artist}</p>
                          <p className="vibe-date">{formatDate(vibe.date)}</p>
                          <p className="vibe-journal">{vibe.journal_text}</p>
                          <div className="vibe-tags-container">
                            {vibe.tags?.split(",").map((tag, tagIndex) => (
                              <span key={tagIndex} className="vibe-tag">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button className="vibe-play-button" 
                        onClick={(e) => togglePlayer(vibe.id, vibe.link, vibe, e)}
                        >
                          {activeVibeId === vibe.id && isPlaying ? (
                            <Pause className="play-icon" />
                          ) : (
                            <Play className="play-icon" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                  
                </div>
                {/* Working Navigation Controls */}
                <div className="vibe-controls">
                  <button className="vibe-nav-btn prev" onClick={() => window.vibeScrollPrev?.()}>
                    <span>Previous</span>
                    <ChevronLeft />
                  </button>
                  <button className="vibe-nav-btn next" onClick={() => window.vibeScrollNext?.()}>
                    <span>Next</span>
                    <ChevronRight />
                  </button>
                </div>
                <div className="drag-proxy" ref={dragProxyRef}></div>
              </div>
            ) : (
              <div className="empty-state">
                <p>No vibes yet. Create your first one!</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {currentTrack && (
        <MiniPlayer track={currentTrack}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        accessToken={accessToken}
        />
      )}
    </div>
  );
}