import { useNavigate } from "react-router-dom";
import "../css/Sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <div className="sidebar">
      <h3 className="sidebar-title">P</h3>

      <button
        className="sidebar-button"
        onClick={() => navigate("/admin")}
      >
        O
      </button>

      <button
        className="sidebar-button"
        onClick={() => navigate("/products")}
      >
        O
      </button>

      <button
        className="sidebar-button"
        onClick={() => alert("Otra opción")}
      >
        O
      </button>
    </div>
  );
}
