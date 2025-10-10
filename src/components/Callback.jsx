import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

export default function Callback() {
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const spotifyError = params.get("error");

        console.log("Callback mounted - Code:", code ? "Present" : "Missing");

        if (spotifyError) {
            console.error("Spotify authorization error:", spotifyError);
            setError(`Spotify error: ${spotifyError}`);
            setTimeout(() => navigate('/'), 3000);
            return;
        }

        // Check for user info BEFORE checking code
        const userStr = localStorage.getItem("userInfo");
        if (!userStr) {
            console.error("No user info found in localStorage");
            setError("Session expired. Please login again.");
            setTimeout(() => navigate('/'), 2000);
            return;
        }

        let userInfo;
        try {
            userInfo = JSON.parse(userStr);
            console.log("User info parsed:", { userId: userInfo.userId, hasToken: !!userInfo.token });
        } catch (e) {
            console.error("Failed to parse user info:", e);
            setError("Invalid session data. Please login again.");
            localStorage.removeItem("userInfo");
            setTimeout(() => navigate('/'), 2000);
            return;
        }

        if (!code) {
            console.error("No authorization code received from Spotify");
            setError("No authorization code from Spotify");
            setTimeout(() => navigate('/'), 2000);
            return;
        }

        // Fetch tokens from your backend
        console.log("Fetching Spotify tokens...");
        fetch(`http://localhost:3001/api/users/spotify/callback?code=${code}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Include auth token if your backend needs it
                'Authorization': `Bearer ${userInfo.token}`
            }
        })
        .then(res => {
            console.log("Backend response status:", res.status);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log("Spotify token response:", {
                hasAccessToken: !!data.access_token,
                hasRefreshToken: !!data.refresh_token
            });

            if (data.access_token) {
                localStorage.setItem("spotifyAccessToken", data.access_token);
                if (data.refresh_token) {
                    localStorage.setItem("spotifyRefreshToken", data.refresh_token);
                }
                
                // Navigate to dashboard
                const dashboardPath = `/${userInfo.userId}/dashboard`;
                console.log("Navigating to:", dashboardPath);
                navigate(dashboardPath);
            } else {
                console.error("No access token in response:", data);
                setError("Failed to receive Spotify access token");
                setTimeout(() => navigate('/'), 3000);
            }
        })
        .catch(error => {
            console.error("Error during Spotify callback:", error);
            setError(`Connection error: ${error.message}`);
            setTimeout(() => navigate('/'), 3000);
        });
    }, [navigate]);

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '100vh',
            padding: '20px',
            textAlign: 'center'
        }}>
            {error ? (
                <>
                    <p style={{ color: '#ff4444', marginBottom: '10px' }}>❌ {error}</p>
                    <p style={{ color: '#666' }}>Redirecting to login...</p>
                </>
            ) : (
                <>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎵</div>
                    <p>Connecting to Spotify...</p>
                    <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
                        Please wait while we complete the authentication
                    </p>
                </>
            )}
        </div>
    );
}

export function handleSpotifyRedirectAndSave() {
  // Spotify can return tokens either in query params (if you used response_type=token)
  // or you might have the backend redirect with access_token in query/hash. This covers both.
  try {
    const url = window.location.href;
    const hash = window.location.hash; // e.g., #access_token=...&refresh_token=... or might be empty
    const search = window.location.search; // ?access_token=...&refresh_token=...
    const params = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : (search || ''));

    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    const expires_in = params.get('expires_in');

    if (!access_token) {
      // Nothing to store — return false so caller knows
      return false;
    }

    const expiryMs = expires_in ? Date.now() + Number(expires_in) * 1000 : null;

    const spotifyToken = {
      accessToken: access_token,
      refreshToken: refresh_token || null,
      expiresAt: expiryMs, // ms timestamp
    };

    localStorage.setItem('spotifyToken', JSON.stringify(spotifyToken));

    // Clean URL so tokens aren't visible
    if (hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    } else {
      const cleanUrl = window.location.origin + window.location.pathname + window.location.search;
      history.replaceState(null, '', cleanUrl);
    }

    return true;
  } catch (err) {
    console.error('Failed to capture spotify token from redirect:', err);
    return false;
  }
}
