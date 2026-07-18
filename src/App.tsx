import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getSession, logOut } from "./lib/auth";
import type { Profile } from "./types";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import SkillPath from "./pages/SkillPath";
import Lesson from "./pages/Lesson";
import Stats from "./pages/Stats";

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(getSession());

  function handleAuthed() {
    setProfile(getSession());
  }

  function handleLogOut() {
    logOut();
    setProfile(null);
  }

  return (
    <BrowserRouter>
      {profile && (
        <nav className="topbar">
          <span>{profile.display_name}</span>
          <button onClick={handleLogOut}>Log out</button>
        </nav>
      )}
      <Routes>
        <Route path="/login" element={profile ? <Navigate to="/" /> : <Login onAuthed={handleAuthed} />} />
        <Route path="/signup" element={profile ? <Navigate to="/" /> : <SignUp onAuthed={handleAuthed} />} />
        <Route path="/" element={profile ? <SkillPath profile={profile} /> : <Navigate to="/login" />} />
        <Route path="/lesson/:lessonId" element={profile ? <Lesson profile={profile} /> : <Navigate to="/login" />} />
        <Route path="/stats" element={profile ? <Stats profile={profile} /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
