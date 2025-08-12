import { useEffect, useState, useRef } from "react";
import {Search, X, ChevronDown, Upload, Check} from "lucide-react";
import './CreateVibe.css'
import VibeSavedModal from "./VibeSavedModal";

const moodTags = [
  { id: "chill", name: "Chill", color: "#4ade80" },
  { id: "rap", name: "Rap", color: "#ef4444" },
  { id: "jazz", name: "Jazz", color: "#f59e0b" },
  { id: "afro", name:"AfroBeats", color:"grey"},
  { id: "lofi", name: "Lo-Fi", color: "#8b5cf6" },
  { id: "rock", name: "Rock", color: "#f97316" },
  { id: "pop", name: "Pop", color: "#ec4899" },
  { id: "electronic", name: "Electronic", color: "#06b6d4" },
  { id: "indie", name: "Indie", color: "#84cc16" },
  { id: "classical", name: "Classical", color: "#6366f1" },
  { id: "rnb", name: "R&B", color: "#d946ef" }
]


const moodEmojis = [
  { id: "happy", emoji: "😊", label: "Happy" },
  { id: "neutral", emoji: "😐", label: "Neutral" },
  { id: "sad", emoji: "😔", label: "Sad" },
]

export default function CreateVibe (){
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedSong, setSelectedSong] = useState(null);
    const [selectedMoodTags, setSelectedMoodTags] = useState([]);
    const [selectedMoodEmoji, setSelectedMoodEmoji] = useState("");
    const [journalEntry, setJournalEntry] = useState("");
    const [showMoodDropdown, setShowMoodDropdown] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [customImage, setCustomImage] = useState(null);
    const [songImage, setSongImage] = useState(false);
    const [showModal, setShowModal] = useState(false);
    
    const moodDropdownRef = useRef(null)
    const searchRef = useRef(null)
    const fileInputRef = useRef(null)
    const debounceTimeout = useRef(null);


    //Handle search
    const handleSearch = async (searchQuery) => {
    try {
        const res = await fetch(`http://localhost:5000/api/users/spotify/search?query=${encodeURIComponent(searchQuery)}`, {
            method: "GET",
        });
        const data = await res.json();
        setSearchResults(data.tracks);
        console.log(data.tracks);
        setShowSearchResults(true);
    } catch (error) {
        console.error("Error searching:", error);
    }
};

const handleKeyDown = (e) => {
    if (e.key === "Enter") {
        handleSearch(searchQuery);
    }
};



useEffect(() => {
  if (!searchQuery) return;

  if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

  debounceTimeout.current = setTimeout(() => {
    handleSearch(searchQuery);
  }, 800); // 800ms after user stops typing
}, [searchQuery]);

    //Close dropdowns when clicking outside
    useEffect(()=> {
        const handleClickOutside = (event) => {
            if(moodDropdownRef.current && !moodDropdownRef.current.contains(event.target)){
                setShowMoodDropdown(false)
            }if (searchRef.current && !searchRef.current.contains(event.target)){
                setShowSearchResults(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () =>document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleMoodTagToggle = (tagId) => {
        setSelectedMoodTags((prev) => (prev.includes (tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
    }

    const handleSongSelect = (song) => {
        setSelectedSong(song)
        setSearchQuery(`${song.artist} - ${song.title}`)
        setShowSearchResults(false);
    }

   const  handleImageUpload = (event) =>{
        const file = event.target.files[0]
        if(file) {
            const reader = new FileReader()
            reader.onload = (e) => setCustomImage(e.target.result)
            reader.readAsDataURL(file)
        }
    }
    
  const clearSearch = () => {
    setSearchQuery("")
    setSelectedSong(null)
    setJournalEntry("")
    setSelectedMoodTags([])
    setShowSearchResults(false)
  }

    async function handleSaveEntry(){
        const {title, image, artist, spotify_url} = selectedSong;
        const vibeEntry = {
            songTitle: title,
            artist: artist,
            link: spotify_url,
            journalText: journalEntry,
            mood: selectedMoodEmoji,
            tags: selectedMoodTags,
            image: image,
        }
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        console.log(userInfo.token);
    try{
        const res = await fetch("http://localhost:5000/api/users/vibes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${userInfo.token}`,
            },
            body: JSON.stringify(vibeEntry),
        })

        if(res.ok){
            const data = await res.json();
            setShowModal(true);
            clearSearch();
        }else{
            console.error("Failed to save entry");
        }
    }catch(error){
        console.error(`Error: ${error}`);
    } 
  };


    return (
        <div className="create-vibe">
            <div className="creat-vibe-container">
                {/* Header */}
                <div className="header">
                    <h1 className="logo">VibeDeck</h1>
                </div>

                {/* Main Content */}
                <div className="main-content">
                    <h2 className="main-title">What's your vibe today?</h2>

                    {/* Mood Tags Selector */}
                    <div className="form-section">
                        <label className="form-label">Mood</label>
                        <div className="mood-dropdown" ref={moodDropdownRef}>
                            <button className="mood-dropdown-trigger" onClick={() => setShowMoodDropdown(!showMoodDropdown)}>
                                <span className="mood-dropdown-text">
                                    {selectedMoodTags.length > 0
                                    ? `${selectedMoodTags.length} mood${selectedMoodTags.length > 1 ? "s" : ""} selected`
                                    : "Select mood"}
                                </span>
                                <ChevronDown className={`dropdown-icon ${showMoodDropdown ? "rotated" : ""}`} />
                            </button>

                            {showMoodDropdown && (
                                <div className="mood-dropdown-content">
                                    {moodTags.map((tag) => (
                                        <div
                                        key={tag.id}
                                        className={`mood-option ${selectedMoodTags.includes
                                            (tag.id) ? "selected" : ""}`}
                                            onClick={() => handleMoodTagToggle(tag.id)}>

                                            <div className="mood-option-content">
                                            <div className="mood-color" style={{ backgroundColor: tag.color }} />
                                            <span className="mood-name">{tag.name}</span>
                                                </div>
                                             {selectedMoodTags.includes(tag.id) && <Check className="check-icon" />}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* Selected Tags Display */}
                        {selectedMoodTags.length > 0  && (
                            <div className="selected-tags">
                                {selectedMoodTags.map((tagId) => {
                                    const tag = moodTags.find((t) => t.id === tagId)
                                    return(
                                        <span key={tagId} className="selected-tag" style={{ backgroundColor: tag.color }}>
                                        {tag.name}
                                        <button className="remove-tag" onClick={() => handleMoodTagToggle(tagId)}>
                                        <X size={14} />
                                        </button>
                                        </span>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                        {/* song Search */}
                        <div className="form-section">
                            <div className="search-container" ref={searchRef}>
                                <div className="search-input-container">
                                    <Search className="search-icon" />
                                    <input type="text" 
                                        className="search-input"
                                        placeholder="Search for a song..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                    />
                                    {searchQuery && (
                                    <button className="clear-search" onClick={clearSearch}>
                                    <X size={20} />
                                    </button>
                                    )}
                                </div>

                                {/* Search Results */}
                                {showSearchResults && searchResults.length> 0 &&  (
                                    <div className="search-results">
                                        {searchResults.map((song) => (
                                            <div key={song.id} className="search-result" onClick={() => handleSongSelect(song)}>
                                                <img src={song.image} className="result-image" />
                                                <div className="result-info">
                                                    <h4 className="result-title">{song.title}</h4>
                                                    <p className="result-artist">{song.artist}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                                {/* Selected SOng Display */}
                        {selectedSong && (
                            <div className="selected-song">
                                        <img src={customImage || selectedSong.image} alt={selectedSong.title} className="song-cover" />
                                        <div className="song-info">
                                        <h3 className="song-title">{selectedSong.title}</h3>
                                        <p className="song-artist">{selectedSong.artist}</p>
                                    </div>
                                <button className="edit-song" onClick={clearSearch}>
                                    ✏️
                                </button>
                            </div>
                        )}

                {/* Mood Emoji Selector */}
            <div className="form-section">
                <div className="emoji-selector">
                        {moodEmojis.map((mood) => (
                    <button
                        key={mood.id}
                        className={`emoji-button ${selectedMoodEmoji === mood.id ? "selected" : ""}`}
                        onClick={() => setSelectedMoodEmoji(mood.id)}
                        title={mood.label}
                        >
                        {mood.emoji}
                    </button>
              ))}
            </div>
          </div>

                {/* Journal Entry */}
                <div className="form-section">
                    <textarea
                        className="journal-textarea"
                        placeholder="Write your journal entry..."
                        value={journalEntry}
                        onChange={(e) => setJournalEntry(e.target.value)}
                        rows={6}
                    />
                </div>
            

              {/* Custom Image Upload */}
              <div className="form-section">
            <div className="upload-section">
              <div className="upload-prompt">
                <p>Couldn't fetch cover art — feel free to upload your own!</p>
                <button className="upload-button" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={20} />
                  Upload image
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
              </div>
            </div>
          </div>

                {/* vibe save modal */}
                {showModal && <VibeSavedModal onClose={() => setShowModal(false)} />}

                    <div className="form-section">
                        <button className="save-button" onClick={handleSaveEntry}>
                            Save Entry
                        </button>
                    </div>


                </div>
            </div>
        </div>
    )
    
} 