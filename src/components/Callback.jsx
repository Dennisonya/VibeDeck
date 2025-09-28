import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function Callback (){
    const navigate = useNavigate();
    
    useEffect(()=>{
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const error = params.get("error");

        if (error) {
            console.error("Spotify authorization error:", error);
            navigate('/');
            return;
        }

        const user = localStorage.getItem("userInfo");
        if (!user) {
            console.error("No user info found");
            navigate('/');
            return;
        }

        const userInfo = JSON.parse(user);
        console.log("User info:", userInfo);

        if(code){
            fetch(`http://localhost:3001/api/users/spotify/callback?code=${code}`)
            .then(res=> {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                console.log("spotify token data:", data);

                if (data.access_token) {
                    localStorage.setItem("spotifyAccessToken", data.access_token);
                    localStorage.setItem("spotifyRefreshToken", data.refresh_token);
                    navigate(`/${userInfo.userId}/dashboard`);
                } else {
                    console.error("No access token received:", data);
                    navigate('/');
                }
            })
            .catch(error => {
                console.error("Error during Spotify callback:", error);
                navigate('/');
            });
        } else {
            console.error("No authorization code received");
            navigate('/');
        }
    }, [navigate]);

    return <p>Connecting to Spotify...</p>;
}