import { useState, useRef, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Trash2, MoreVertical } from "lucide-react"
import "./EntryDetails.css"

gsap.registerPlugin(ScrollTrigger)

export default function EntryDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [entry, setEntry] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
 const userInfo = JSON.parse(localStorage.getItem("userInfo"))
  const audioRef = useRef(null)
  const coverImageRef = useRef(null)
  const backgroundRef = useRef(null)
  const contentRef = useRef(null)
  const progressRef = useRef(null)

  useEffect(() => {
   
    if (!userInfo?.token) return

    fetch(`http://localhost:5000/api/users/vibes/${id}`, {
      headers: {
        method: "GET",
        Authorization: `Bearer ${userInfo.token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch entry")
        return res.json()
      })
      .then((data) => setEntry(data.vibe))
      .catch((err) => console.error(err))
  }, [id])

  console.log(entry)
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", () => setIsPlaying(false))

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", () => setIsPlaying(false))
    }
  }, [entry])

  useEffect(() => {
    if (!coverImageRef.current || !contentRef.current) return
    ScrollTrigger.create({
      trigger: contentRef.current,
      start: "top center",
      end: "bottom center",
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress
        gsap.to(coverImageRef.current, {
          opacity: 1 - progress * 0.8,
          y: -progress * 100,
          scale: 1 - progress * 0.2,
          duration: 0.1,
        })
      },
    })

    return () => ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
  }, [])

  const togglePlayPause = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      try {
        await audio.play()
        setIsPlaying(true)
      } catch (error) {
        console.error("Error playing audio:", error)
        setIsPlaying(false)
      }
    }
  }

  const skipTime = (seconds) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds))
  }

  const handleProgressClick = (e) => {
    const audio = audioRef.current
    const progressBar = progressRef.current
    if (!audio || !progressBar) return

    const rect = progressBar.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    audio.currentTime = percentage * audio.duration
  }

  const handleDelete = async () => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"))
    if (!userInfo?.token) return

    if (showDeleteConfirm) {
      try {
        const res = await fetch(`http://localhost:5000/api/users/vibes/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        })

        if (!res.ok) throw new Error("Failed to delete entry")
        navigate(`/:id/dashboard`) // Go back to dashboard
      } catch (err) {
        console.error(err)
      }
    } else {
      setShowDeleteConfirm(true)
      setTimeout(() => setShowDeleteConfirm(false), 3000)
    }
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  if (!entry) return <div className="loading">Loading vibe entry...</div>

  return (
    <div className="entry-details">
      <audio ref={audioRef} src={entry.link} />
      <div className="background-blur" ref={backgroundRef} style={{ backgroundImage: `url(${entry.image || "/placeholder.svg"})` }} />

      <div className="entry-header">
        <button className="back-button" onClick={() =>  navigate(-1)}>
          <ArrowLeft className="back-icon" />
        </button>
        <button className="menu-button" onClick={handleDelete}>
          {showDeleteConfirm ? <Trash2 className="delete-icon" /> : <MoreVertical className="menu-icon" />}
        </button>
      </div>

      <div className="date-display">
        <h1 className="entry-date">{formatDate(entry.date)}</h1>
      </div>

      <div className="main-content" ref={contentRef}>
        <div className="cover-container" ref={coverImageRef}>
          <div className="cover-image">
            <img src={entry.image || "/placeholder.svg"} alt={entry.song_title} />
          </div>
        </div>

        <div className="song-info-car">
          <div className="song-details">
            <h2 className="song-title">{entry.song_title}</h2>
            <p className="artist-name">{entry.artist}</p>

            <div className="tags-container">
              {entry.tags?.split(",").map((tag, index) => (
                <span key={index} className="tag" data-tag={tag.trim().toLowerCase()}>
                  {tag.trim()}
                </span>
              ))}
              {entry.mood_emoji && <span className="mood-emoji">{entry.mood_emoji}</span>}
            </div>
          </div>

          <div className="journal-section">
            <div className="journal-text">
              <p>{entry.journal_text}</p>
            </div>
          </div>

          <div className="audio-controls">
            <div className="control-buttons">
              <button className="control-btn" onClick={() => skipTime(-10)}>
                <SkipBack className="control-icon" />
                <span className="time-label">10</span>
              </button>
              <button className="control-btn play-pause" onClick={togglePlayPause}>
                {isPlaying ? <Pause className="control-icon" /> : <Play className="control-icon" />}
              </button>
              <button className="control-btn" onClick={() => skipTime(10)}>
                <SkipForward className="control-icon" />
                <span className="time-label">10</span>
              </button>
            </div>

            <div className="progress-container">
              <span className="time-display">{formatTime(currentTime)}</span>
              <div className="progress-bar" ref={progressRef} onClick={handleProgressClick}>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progressPercentage}%` }} />
                </div>
              </div>
              <span className="time-display">{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && <div className="delete-confirmation"><p>Tap again to delete this vibe</p></div>}
    </div>
  )
}
