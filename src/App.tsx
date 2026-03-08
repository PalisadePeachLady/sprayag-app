import { Routes, Route } from 'react-router-dom'
import BrandonSpray from './pages/BrandonSpray'
import ManagerDashboard from './pages/ManagerDashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<BrandonSpray />} />
      <Route path="/brandon-spray" element={<BrandonSpray />} />
      <Route path="/manager" element={<ManagerDashboard />} />
    </Routes>
  )
}

export default App
