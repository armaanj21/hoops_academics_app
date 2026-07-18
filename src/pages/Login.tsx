import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { logIn } from "../lib/auth";

export default function Login({ onAuthed }: { onAuthed: () => void }) {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await logIn(username, pin);
      onAuthed();
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <h1>Welcome back</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          PIN
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4,6}"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>
      <p>
        New here? <Link to="/signup">Create a profile</Link>
      </p>
    </div>
  );
}
