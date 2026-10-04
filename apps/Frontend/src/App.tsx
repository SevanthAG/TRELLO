import './App.css'
import Dashboard from './Pages/Dashboard';
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
       
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
