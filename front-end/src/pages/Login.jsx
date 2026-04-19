import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/login`, {
        username,
        password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role || "admin"); // Default fallback
      alert("Login berhasil 🔥");
      navigate("/dashboard");
    } catch {
      alert("Login gagal ❌");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {/* LOGO DI TENGAH */}
        <div style={styles.logoSection}>
          <div style={styles.iconWrapper}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="6" fill="#064e3b" />
              <path d="M7 9h10l-1 6H8L7 9z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
              <circle cx="10" cy="18" r="1" fill="#4ade80" />
              <circle cx="15" cy="18" r="1" fill="#4ade80" />
              <circle cx="16" cy="7" r="1.5" fill="#4ade80" />
            </svg>
          </div>
          <span style={styles.logoText}>Warung-Pintar</span>
        </div>

        {/* HEADER DI TENGAH */}
        <div style={styles.header}>
          <h2 style={styles.title}>Login</h2>
          <p style={styles.subtitle}>Silakan login untuk mengelola data dan transaksi Anda.</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Enter your username"
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            style={styles.button}
            type="submit"
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#064e3b")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#065f46")}
          >
            Sign In
          </button>
        </form>

        <div style={styles.footer}>
          Don't have an account?{" "}
          <a
            href="https://www.instagram.com/404.alpnn/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...styles.link, textDecoration: "none" }}
          >
            Contact Admin
          </a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    width: "100vw",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f7f6",
    margin: 0,
    padding: 0,
    boxSizing: "border-box",
    fontFamily: "sans-serif",
    overflow: "hidden"
  },
  card: {
    padding: "40px",
    borderRadius: "24px",
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)",
    width: "100%",
    maxWidth: "380px",
    border: "1px solid #e5e7eb",
  },
  logoSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
  },
  iconWrapper: {
    width: "60px",
    height: "60px",
    backgroundColor: "#065f46",
    borderRadius: "15px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "10px"
  },
  logoText: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#111827",
  },
  header: {
    textAlign: "center",
    marginBottom: "30px",
  },
  title: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#111827",
    margin: 0,
  },
  subtitle: {
    fontSize: "14px",
    color: "#6b7280",
    marginTop: "5px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  inputGroup: {
    textAlign: "left",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    fontSize: "14px",
    boxSizing: "border-box", // Biar input gak luber keluar card
  },
  button: {
    marginTop: "10px",
    padding: "14px",
    borderRadius: "10px",
    border: "none",
    background: "#065f46",
    color: "white",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
  footer: {
    marginTop: "20px",
    fontSize: "12px",
    color: "#6b7280",
    textAlign: "center",
  },
  link: {
    color: "#065f46",
    fontWeight: "700",
    cursor: "pointer",
  }
};