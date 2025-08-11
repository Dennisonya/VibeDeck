import { useState, useRef, useEffect } from "react"
import { gsap } from "gsap"
import { useNavigate } from "react-router";
import MiniPlayer from "./MiniPlayer";
import Draggable from "gsap/Draggable"
import { ChevronDown, ArrowLeft, Play, Pause } from "lucide-react"
import EntryDetails from "./EntryDetails";
import "./ViewEntries.css"


gsap.registerPlugin(Draggable)


const sortOptions = [
  { value: "newest", label: "Newest to Oldest" },
  { value: "oldest", label: "Oldest to Newest" },
  { value: "title", label: "Song Title A-Z" },
  { value: "artist", label: "Artist A-Z" },
]

const moodOptions = [
  { value: "all", label: "All Moods" },
  { value: "happy", label: "Happy 😊" },
  { value: "neutral", label: "Neutral 😐" },
  { value: "sad", label: "Sad 😔" },
]


const tagOptions = [
  { label: "all" , value: "all"},
  { label: "chill", value: "chill" },
  { label: "Afrobeats", value: "afro"},
  { label: "rap", value: "rap", },
  { label: "jazz", value: "jazz",  },
  { label: "lofi", value: "lofi" },
  { label: "rock", value: "rock" },
  { label: "pop", value: "pop" },
  { label: "electronic", value: "electronic" },
  { label: "indie", value: "indie" },
  { label: "classical", value: "classical" },
  { label: "rnb", value: "rnb"  },
]

export default function ViewEntries ({onBack}) {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("newest")
  const [filterByMood, setFilterByMood] = useState("all")
  const [filterByTag, setFilterByTag] = useState("all")
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [showMoodDropdown, setShowMoodDropdown] = useState(false)
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const [activeVibeId, setActiveVibeId] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(null)
  const [entries, setEntries] = useState([]);
  const sortDropdownRef = useRef(null)
  const moodDropdownRef = useRef(null)
  const tagDropdownRef = useRef(null)
  const audioRef = useRef(null)


  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (!userInfo?.token) return;
    fetch("http://localhost:5000/api/users/userVibes", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userInfo.token}`,
      },
    }).then((res) => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          navigate("/");
          return null;
        }
        if (!res.ok) throw new Error("Not authorized");
        return res.json();
      })
      .then((data) => setEntries(data.vibes))
      .catch((err) => console.error(err));
  }, [navigate]);

console.log(entries)
  useEffect(() => {
    const handleClickOutside = (event) => {
        if(sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)){
            setShowSortDropdown(false)
        }
         if (moodDropdownRef.current && !moodDropdownRef.current.contains(event.target)) {
        setShowMoodDropdown(false)
      }
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target)) {
        setShowTagDropdown(false)
      }
    }


     document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)

  }, [])

  //filter and sort entries

  const filteredAndSortedEntries = () => {
    let filtered = [...entries]

    //filter by mood
    if(filterByMood !== "all"){
      filtered = filtered.filter((entry) => entry.mood=== filterByMood)
    }

    //filter by tag
    if(filterByTag !== "all"){
      filtered = filtered.filter((entry) => entry.tags.includes(filterByTag))
    }

    //Sort entries
    filtered.sort((a,b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case "oldest":
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case "title":
          return a.song_title.localeCompare(b.song_title);
        case "artist":
          return a.artist.localeCompare(b.artist)
        default:
          return 0
      }
    })
      return filtered
  }

  const groupedEntries = () => {
    const filtered = filteredAndSortedEntries()
    const grouped = {}

    filtered.forEach((entry) => {
      const date = new Date(entry.date)
      const monthYear = date.toLocaleDateString(
        "en-US", {
        month: "long",
        year: "numeric",
      })

      if(!grouped[monthYear]){
        grouped[monthYear] = []
      }
      grouped[monthYear].push(entry)
    })

    return grouped
  }

   const togglePlayer = (vibeId, audioUrl, vibe) => {
    if (activeVibeId === vibeId) {
      if (isPlaying) {
        audioRef.current?.pause()
      } else {
        audioRef.current?.play()
      }
      setIsPlaying(!isPlaying)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      setCurrentTrack({
        title: vibe.song_title,
        artist: vibe.artist,
        coverArt: vibe.image || "/placeholder.svg?height=50&width=50",
        audioSrc: audioUrl,
        id: vibeId,
      })
      setActiveVibeId(vibeId)
      setIsPlaying(true)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(
      "en-us",{
        month: "long",
        day: "numeric",
        year: "numeric",
      })
  }
  const grouped = groupedEntries()

  return(
    <div className="view-entries">
      <audio ref={audioRef} src={currentTrack?.audioSrc}/>

      {/* Header */}
      <div className="view-entries-header">
        <button className="back-button" onClick={()=> navigate(-1)}>
          <ArrowLeft className="back-icon"/>
        </button>
        <h1 className="page-title">Your Vibes</h1>
      </div>

      {/* Filters */}
    <div className="filters-container">
      {/* SOrt Dropdown */}
      <div className="filter-group" ref={sortDropdownRef}>
        <label className="filter-label">Sort By</label>
        <div className="dropdown">
          <button className="dropdown-trigger" onClick={()=> setShowSortDropdown(!showSortDropdown)}>
            <span>{sortOptions.find((opt) => opt.value === sortBy)?.label}</span>
            <ChevronDown className={`dropdown-icon ${showSortDropdown ? "rotated" : ""}`} />
          </button>

          {showSortDropdown && (
            <div className="dropdown-content">
              {sortOptions.map((option) =>(
                <div
                key={option.value}
                className={`dropdown-option ${sortBy === option.value ? "selected": ""}`}
                onClick={()=> {
                  setSortBy(option.value)
                  setShowSortDropdown(false)
                }}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

          {/* Filter By Mood */}
        <div className="filter-group" ref={moodDropdownRef}>
          <label className="filter-label">Filter by</label>
          <div className="dropdown">
            <button className="dropdown-trigger" onClick={() => setShowMoodDropdown(!showMoodDropdown)}>
              <span>{moodOptions.find((opt) => opt.value === filterByMood)?.label}</span>
              <ChevronDown className={`dropdown-icon ${showMoodDropdown ? "rotated" : ""}`} />
            </button>

            {showMoodDropdown && (
              <div className="dropdown-content">
                {moodOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`dropdown-option ${filterByMood === option.value ? "selected" : ""}`}
                    onClick={() => {
                      setFilterByMood(option.value)
                      setShowMoodDropdown(false)
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/*Filter by Tag */}
        <div className="filter-group" ref={tagDropdownRef}>
          <label className="filter-label">Tags</label>
          <div className="dropdown">
            <button className="dropdown-trigger" onClick={() => setShowTagDropdown(!showTagDropdown)}>
              <span>{tagOptions.find((opt) => opt.value === filterByTag)?.label}</span>
              <ChevronDown className={`dropdown-icon ${showTagDropdown ? "rotated" : ""}`} />
            </button>

            {showTagDropdown && (
              <div className="dropdown-content">
                {tagOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`dropdown-option ${filterByTag === option.value ? "selected" : ""}`}
                    onClick={() => {
                      setFilterByTag(option.value)
                      setShowTagDropdown(false)
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
    </div>

            {/* Monthly Sections */}
            <div className="monthly-sections">
              {Object.keys(grouped).length === 0 ? (
                <div className="empty-state">
                  <p>No Vibes found matching your filters.</p>
                </div>
              ) : (
                Object.entries(grouped).map(([monthYear, monthEntries]) => (
                  <MonthlySection 
                  key={monthYear}
                  monthYear={monthYear}
                  entries={monthEntries}
                  activeVibeId={activeVibeId}
                  isPlaying={isPlaying}
                  togglePlayer={togglePlayer}
                  formatDate={formatDate}
                  />
                ))
              )}
            </div>
    </div>
  )
}

function MonthlySection({ monthYear, entries, activeVibeId, isPlaying, togglePlayer, formatDate }) {
  const carouselTrackRef = useRef(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentTrack, setCurrentTrack]= useState(null);
  const navigate = useNavigate();
  const cardWidth = 300 + 16 // vibe-card width + gap
  
  const getMoodEmoji = (mood) => {
  switch (mood) {
    case "happy":
      return "😊";
    case "sad":
      return "😔";
    case "neutral":
      return "😐";
    default:
      return "❓";
  }
};

  useEffect(() => {
    if (carouselTrackRef.current && entries.length > 0) {
      const draggableInstance = Draggable.create(carouselTrackRef.current, {
        type: "x",
        bounds: {
          minX: -(entries.length - 1) * cardWidth,
          maxX: 0,
        },
        inertia: true,
        snap: {
          x: (endValue) => Math.round(endValue / cardWidth) * cardWidth,
        },
        onDragEnd: function () {
          const newIndex = Math.abs(Math.round(this.x / cardWidth))
          setCurrentIndex(Math.min(newIndex, entries.length - 1))
        },
      })[0] // Draggable.create returns an array, get the first instance

      return () => {
        if (draggableInstance) {
          draggableInstance.kill()
        }
      }
    }
  }, [entries.length, cardWidth])

  const goToSlide = (index) => {
    if (carouselTrackRef.current) {
      const targetX = -index * cardWidth
      gsap.to(carouselTrackRef.current, {
        x: targetX,
        duration: 0.5,
        ease: "power2.out",
      })
      setCurrentIndex(index)
    }
  }

  return (
    <div className="monthly-section">
      <h2 className="month-title">{monthYear}</h2>

      <div className="carousel-wrapper">
        {" "}
        {/* New wrapper for overflow hidden */}
        <div className="carousel-track" ref={carouselTrackRef}>
          {entries.map((entry) => (
            <div key={entry.id} className="vibe-card" onClick={()=> navigate(`/entries/${entry.id}`)} >
              <div className="card-content">
                <div className="card-image">
                  <img src={entry.image || "/placeholder.svg"} alt={entry.song_title} />
                  <div className="mood-indicator">{getMoodEmoji(entry.mood)}</div>
                </div>

                <div className="card-info">
                  <h3 className="song-title">{entry.song_title}</h3>
                  <p className="artist-name">{entry.artist}</p>
                  <p className="entry-date">{formatDate(entry.date)}</p>
                  <p className="journal-text">{entry.journal_text}</p>

                  <div className="tags-container">
                    {entry.tags.split(",").map((tag, index) => (
                      <span key={index} className="tag">
                        {tag.trim()}
                      </span>
                    ))}
                    {/* Play button moved here */}
                    <button className="play-button"
                    onClick={() => togglePlayer(entry.id, entry.link, entry)}>
                      
                      {activeVibeId === entry.id && isPlaying ? (
                        <Pause className="play-icon" />
                      ) : (
                        <Play className="play-icon" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Dots */}
      {entries.length > 1 && (
        <div className="pagination-dots">
          {entries.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentIndex ? "active" : ""}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      )}
        {currentTrack && (
              <MiniPlayer track={currentTrack}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              audioRef={audioRef}
              />
            )}
    </div>
  )
}
