import './App.css'
import Board from './Pages/Board';
import Dashboard from './Pages/Dashboard';
import Setting from './Pages/Setting';
import Signin from './Pages/Signin'
import Signup from './Pages/Signup'
import { BrowserRouter, Routes, Route, Navigate } from "react-router";

function App() {

  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/organization/:orgId/board/:boardId" element={<Board />} />
          <Route path="/organization/:orgId/settings" element={<Setting />} />
          

       
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
