import { useEffect, useState } from "react";
import Dashboard from "./Dashboard.jsx";
import Login from "./login.jsx";
import Register from "./register.jsx";
import Sobre from "./sobre.jsx";
import Layout from "./layout.jsx";

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [screen, setScreen] = useState("login");

  useEffect(() => {
    const token = localStorage.getItem("token");
    setAuthenticated(!!token);
    if (token) setScreen("dashboard");
  }, []);

  function handleLogin(token) {
    localStorage.setItem("token", token);
    setAuthenticated(true);
    setScreen("dashboard");
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setAuthenticated(false);
    setScreen("login");
  }

  function goRegister() {
    setScreen("register");
  }
  function goLogin() {
    setScreen("login");
  }
  function goSobre() {
    setScreen("sobre");
  }
  function goBack() {
    if (authenticated) setScreen("dashboard");
    else setScreen("login");
  }

  let content;
  if (screen === "sobre") content = <Sobre goBack={goBack} />;
  else if (authenticated) content = <Dashboard onLogout={handleLogout} />;
  else if (screen === "login")
    content = <Login onLogin={handleLogin} goRegister={goRegister} />;
  else content = <Register goLogin={goLogin} />;

  return <Layout onNavigate={setScreen}>{content}</Layout>;
}