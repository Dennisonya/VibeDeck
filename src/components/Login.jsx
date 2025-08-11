import { useState } from "react";
import {useNavigate} from "react-router";
import "./Auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      localStorage.setItem("userInfo",
            JSON.stringify({
                userId: `${data.user.id}`,
                token: `${data.token}`,
                username:`${data.user.username}`,
                email: `${data.user.email}`
            })
        );
      setMessage("Login successful!");
      // redirect or do something after login
      navigate(`/${data.user.id}/dashboard`)
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>Login to VibeDeck</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Login</button>
        <p className="message">{message}</p>
      </form>
    </div>
  );
}
