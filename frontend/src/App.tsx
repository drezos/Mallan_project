import { Routes, Route } from 'react-router-dom'
import { SignedIn, SignedOut, SignIn } from '@clerk/clerk-react'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Competitors } from './pages/Competitors'
import { Alerts } from './pages/Alerts'
import { Settings } from './pages/Settings'

function App() {
  return (
    <>
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <SignIn routing="hash" />
        </div>
      </SignedOut>
      <SignedIn>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="competitors" element={<Competitors />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </SignedIn>
    </>
  )
}

export default App
