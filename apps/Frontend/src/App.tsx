import ProtectedRoutes from "./components/ProtectedRoutes";
import Dashboard from "./Pages/Dashboard";
import Setting from "./Pages/Setting";
import Signin from "./Pages/Signin";
import Signup from "./Pages/Signup";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";

const Board = lazy(() => import("./Pages/Board"));

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<ProtectedRoutes />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/organization/:orgId/settings" element={<Setting />} />
            <Route
              path="/organization/:orgId/board/:boardId"
              element={
                <Suspense
                  fallback={
                    <main className="page-stack">
                      <div className="state-panel" role="status">
                        Loading board…
                      </div>
                    </main>
                  }
                >
                  <Board />
                </Suspense>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
