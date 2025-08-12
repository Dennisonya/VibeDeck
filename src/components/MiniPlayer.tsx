"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Play, Pause, SkipBack, SkipForward } from "lucide-react"
import "./MiniPlayer.css"

declare global {
  interface Window {
    Spotify?: SpotifyNamespace;
    onSpotifyWebPlaybackSDKReady?: () => void;
  }

  interface SpotifyNamespace {
    Player: new (options: SpotifyPlayerInit) => SpotifyPlayer;
  }

  interface SpotifyPlayerInit {
    name: string;
    getOAuthToken: (cb: (token: string) => void) => void;
    volume?: number;
  }

  interface SpotifyPlaybackState {
    duration: number;
    position: number;
    paused: boolean;
  }

  interface SpotifyPlayer {
    connect: () => Promise<boolean>;
    disconnect: () => void;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    seek: (position_ms: number) => Promise<void>;
    getCurrentState: () => Promise<SpotifyPlaybackState | null>;
    addListener: (
      event: string,
      callback: (state: any) => void
    ) => boolean;
  }
}

interface Track {
  title: string
  artist: string
  coverArt: string
  spotifyUri: string | null
  id: string
}

interface MiniPlayerProps {
  track: Track
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  accessToken: string 
}

export default function MiniPlayer({ track, isPlaying, setIsPlaying, accessToken }: MiniPlayerProps) {
  const [player, setPlayer] = useState<SpotifyPlayer | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [currentPosition, setCurrentPosition] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    if (!accessToken) return;

    let playerInstance: SpotifyPlayer | null = null;

    window.onSpotifyWebPlaybackSDKReady = () => {
      playerInstance = new window.Spotify!.Player({
        name: "VibeDeck Player",
        getOAuthToken: (cb) => cb(accessToken),
        volume: 0.5,
      });

      setPlayer(playerInstance);

      playerInstance.addListener("ready", ({ device_id }) => {
        console.log("Spotify Web Playback ready, device ID:", device_id);
        setDeviceId(device_id);
      });

      playerInstance.addListener("not_ready", ({ device_id }) => {
        console.log("Device ID is not ready:", device_id);
      });

      playerInstance.addListener("player_state_changed", (state) => {
        if (!state) return;
        // Removed position & duration updates here to handle in interval polling
        // But keep updating play/pause status immediately:
        setIsPlaying(!state.paused);
      });

      playerInstance.connect();
    };

    if (!window.Spotify) {
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    } else {
      window.onSpotifyWebPlaybackSDKReady?.();
    }

    return () => {
      if (playerInstance) playerInstance.disconnect();
      delete window.onSpotifyWebPlaybackSDKReady;
    };
  }, [accessToken, setIsPlaying]);

  // Interval polling to update progress bar and current time every second
  useEffect(() => {
    if (!player) return;

    let intervalId: NodeJS.Timeout | null = null;

    const updatePosition = async () => {
      const state = await player.getCurrentState();
      if (state) {
        setCurrentPosition(state.position);
        setDuration(state.duration);
        setIsPlaying(!state.paused);
      }
    };

    if (isPlaying) {
      updatePosition(); // immediate update
      intervalId = setInterval(updatePosition, 1000);
    } else if (intervalId) {
      clearInterval(intervalId);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying, player, setIsPlaying]);

  const playTrack = () => {
    if (!deviceId || !track) return;

    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uris: [track.spotifyUri],
      }),
    }).catch(console.error);
  };

  const togglePlayPause = () => {
    if (!player) return;

    player.getCurrentState().then(state => {
      if (!state) {
        playTrack();
        return;
      }

      if (state.paused) {
        player.resume();
      } else {
        player.pause();
      }
    });
  };

  const skipTime = (seconds: number) => {
    if (!player) return;

    player.getCurrentState().then(state => {
      if (!state) return;

      const newPosition = Math.min(state.duration, Math.max(0, state.position + seconds * 1000));
      player.seek(newPosition);
    });
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60000); // ms to minutes
    const seconds = Math.floor((time % 60000) / 1000); // remainder ms to seconds
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

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

        {track.spotifyUri ? (
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
              <span className="time-display">{formatTime(currentPosition)}</span>
              <div className="progress-bar">
                <div
                  className="progress-track"
                  style={{ width: `${(currentPosition / duration) * 100 || 0}%` }}
                />
              </div>
              <span className="time-display">{formatTime(duration)}</span>
            </div>
          </div>
        ) : (
          <div className="connect-spotify">
            <p>This track doesn’t have a preview. Connect Spotify to play full songs.</p>
          </div>
        )}
      </div>
    </div>
  );
}
