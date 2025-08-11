import { useState } from "react";
import './TagSelector.css';

const defaultTags = [
    {name: "Chill", color: "#A3D5FF"},
    { name: "Rap", color: "#FF7B54" },
  { name: "R&B", color: "#B794F4" },
  { name: "Lo-fi", color: "#FFD66B" },
];

export default function TagSelector({ selectedTags = [], setSelectedTags = () => {} }){
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const removeTag = (tagname) =>{
        setSelectedTags(selectedTags.filter(tag=> tag.name !== tagname));
    }

    const toggleTag = (tag) => {
        const exists = selectedTags.find(t=> t.name === tag.name);

        if(exists) {
            // remove the tag if its already part of the selected tags
            setSelectedTags(selectedTags.filter(t=> t.name !== tag.name));
        }else{
            setSelectedTags(prev=> [...prev, tag])
        }
    };

    return (
        <div className="tag-selector-container">
            <div className="tag-input" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                {selectedTags.map((tag) => (
                    <span
                    key={tag.name}
                    className="tag-chip"
                    style={{backgroundColor: tag.color}}
                    >
                        {tag.name}
                        <button className="remove-btn" onClick={(e) => {
                            e.stopPropagation();
                            removeTag(tag.name);
                        }}>
                            ×
                        </button>
                    </span>
                ))}
                <input 
                className="hidden-input"
                placeholder={selectedTags.length ? '' : "Select or create tags..."}
                readOnly
                value={selectedTags.map(tag => tag.name).join(', ')}
                />
            </div>

                {isDropdownOpen && (
                    <div className="dropdown">
                        {defaultTags.map(tag=> (
                            <div
                            key={tag.name}
                            className="dropdown-tag"
                            style = {{backgroundColor: tag.color}}
                            onClick={() => toggleTag(tag)}
                            >
                                {tag.name}
                            </div>
                        ))}

                        <div className="dropdown-footer">
                            <button className="create-btn">+ Create New Tag</button>
                        </div>
                    </div>
                )}
        </div>
    );
}