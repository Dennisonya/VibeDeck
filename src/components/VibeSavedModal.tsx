import React, { useEffect } from "react";
import "./VibeSavedModal.css";
import { CheckCircle2 } from "lucide-react";

const VibeSavedModal = ({ onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(); // auto-close after 2.5s
    }, 2500);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="checkmark-circle">
          <CheckCircle2 size={60} color="#4CAF50" className="check-icon" />
        </div>
        <h2>Vibe Saved!</h2>
        <p>Your vibe entry has been added to your deck.</p>
      </div>
    </div>
  );
};

export default VibeSavedModal;
