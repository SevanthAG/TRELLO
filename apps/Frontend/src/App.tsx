import "./App.css";
import ProtectedRoutes from "./components/ProtectedRoutes";
import Board from "./Pages/Board";
import Dashboard from "./Pages/Dashboard";
import Setting from "./Pages/Setting";
import Signin from "./Pages/Signin";
import Signup from "./Pages/Signup";
import { BrowserRouter, Routes, Route } from "react-router";

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<ProtectedRoutes />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/organization/:orgId/settings" element={<Setting />} />
            <Route path="/organization/:orgId/board/:boardId" element={<Board />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
