"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Play, Pause, SkipBack, SkipForward } from "lucide-react"
import "./MiniPlayer.css"

interface Track {
  title: string
  artist: string
  coverArt: string
  audioSrc: string | null
  id: string
}

interface MiniPlayerProps {
  track: Track
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  audioRef: React.RefObject<HTMLAudioElement>
}

export default function MiniPlayer({ track, isPlaying, setIsPlaying, audioRef }: MiniPlayerProps) {
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", () => setIsPlaying(false))

    if (isPlaying) {
      audio.play().catch(console.error)
    }

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", () => setIsPlaying(false))
    }
  }, [track, audioRef, setIsPlaying, isPlaying])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(console.error)
    }
    setIsPlaying(!isPlaying)
  }

  const skipTime = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds))
  }

  const handleProgressClick = (e: React.MouseEvent) => {
    const audio = audioRef.current
    const progressBar = progressRef.current
    if (!audio || !progressBar) return

    const rect = progressBar.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    audio.currentTime = percentage * audio.duration
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handleConnectSpotify = () => {
    const CLIENT_ID = "aa2a1529be174a57825cd51c8bcc7539"
    const REDIRECT_URI = "http://127.0.0.1:5174/callback"
    const SCOPES = [
      "streaming",
      "user-read-email",
      "user-read-private",
      "user-modify-playback-state",
      "user-read-playback-state",
    ]

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;
    window.location.href = authUrl;
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0
   console.log(track.audioSrc);
  return (
    <div className="mini-player">
      <div className="mini-player-content">
        <div className="track-info">
          <div className="album-art">
            <img src={track.coverArt || "/placeholder.svg"} alt={track.title} />
          </div>
          <div className="track-details">
            <h4 className="track-title">{track.title}</h4>
            <p className="track-artist">{track.artist}</p>
          </div>
        </div>

        {track.audioSrc ? (
          <div className="player-controls">
            <div className="control-buttons">
              <button className="control-btn rewind" onClick={() => skipTime(-5)} title="Rewind 5s">
                <SkipBack className="control-icon" />
                <span className="time-label">5</span>
              </button>

              <button className="control-btn play-pause" onClick={togglePlayPause}>
                {isPlaying ? <Pause className="control-icon" /> : <Play className="control-icon" />}
              </button>

              <button className="control-btn forward" onClick={() => skipTime(5)} title="Forward 5s">
                <SkipForward className="control-icon" />
                <span className="time-label">5</span>
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
        ) : (
          <div className="connect-spotify">
            <p>This track doesn’t have a preview. Connect Spotify to play full songs.</p>
            <button className="connect-btn" onClick={handleConnectSpotify}>
              Connect to Spotify
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
