import './App.css'
import Organization from './Pages/Organization';
import Signin from './Pages/Signin'
import Signup from './Pages/Signup'
import { BrowserRouter, Routes, Route, Navigate } from "react-router";

function App() {

  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/signin" replace />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Navigate to="/signin" replace />} />
          <Route path="/organization" element={<Organization />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
