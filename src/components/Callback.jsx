import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function Callback (){
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("userInfo"));
    console.log(user);
    useEffect(()=>{
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if(code){
            fetch(`http://localhost:5000/api/users/spotify/callback?code=${code}`)
            .then(res=> res.json())
            .then(data => {
                console.log("spotify token data:", data);

                localStorage.setItem("spotifyAccessToken", data.access_token);
                localStorage.setItem("spotifyRefreshToken", data.refresh_token);

                navigate(`/${user.userId}/dashboard`)
            })
            .catch(console.error);
        }
    }, [navigate]);

    return <p>Connecting to Spotify...</p>;
}