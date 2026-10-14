import { useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate } from "react-router";
import { LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Brand from "@/components/Brand";

const ProtectedRoutes = () => {
  const [authenticated] = useState(() =>
    Boolean(localStorage.getItem("token")),
  );
  const navigate = useNavigate();

  if (!authenticated) return <Navigate to="/signin" replace />;

  const signOut = () => {
    localStorage.removeItem("token");
    navigate("/signin", { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="app-rail">
        <NavLink
          className="rail-brand"
          to="/dashboard"
          aria-label="Blockboard dashboard"
        >
          <Brand />
        </NavLink>
        <p className="rail-label">Workspace</p>
        <nav className="rail-navigation" aria-label="Main navigation">
          <NavLink
            className={({ isActive }) =>
              `rail-link${isActive ? " rail-link-active" : ""}`
            }
            to="/dashboard"
          >
            <LayoutDashboard aria-hidden="true" />
            <span>Boards</span>
          </NavLink>
        </nav>
        <div className="rail-footer">
          <span className="rail-footer-note">
            Built for the work in progress.
          </span>
          <Button className="signout-button" variant="ghost" onClick={signOut}>
            <LogOut aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </aside>
      <div className="app-content">
        <Outlet />
      </div>
    </div>
  );
};

export default ProtectedRoutes;
