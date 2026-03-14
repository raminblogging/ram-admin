import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './lib/context'
import AppShell from './components/AppShell'

import Login          from './pages/Login'
import Dashboard      from './pages/Dashboard'
import Apps           from './pages/Apps'
import Tasks          from './pages/Tasks'
import Notes          from './pages/Notes'
import Calendar       from './pages/Calendar'
import Blog           from './pages/Blog'
import Messages       from './pages/Messages'
import Subscriptions  from './pages/Subscriptions'
import Categories     from './pages/Categories'
import Settings       from './pages/Settings'
import AI             from './pages/AI'
import Habits         from './pages/Habits'
import Ideas          from './pages/Ideas'
import { Gym, Drawing, Learning, Tracker, Productivity } from './pages/LifestylePages'

function ProtectedRoute({ children }) {
  const { isAuth } = useApp()
  return isAuth ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { isAuth } = useApp()

  return (
    <Routes>
      <Route path="/login" element={isAuth ? <Navigate to="/dashboard" replace /> : <Login />} />

      <Route path="/dashboard"     element={<ProtectedRoute><AppShell><Dashboard /></AppShell></ProtectedRoute>} />
      <Route path="/apps"          element={<ProtectedRoute><AppShell><Apps /></AppShell></ProtectedRoute>} />
      <Route path="/tasks"         element={<ProtectedRoute><AppShell><Tasks /></AppShell></ProtectedRoute>} />
      <Route path="/notes"         element={<ProtectedRoute><AppShell><Notes /></AppShell></ProtectedRoute>} />
      <Route path="/calendar"      element={<ProtectedRoute><AppShell><Calendar /></AppShell></ProtectedRoute>} />
      <Route path="/blog"          element={<ProtectedRoute><AppShell><Blog /></AppShell></ProtectedRoute>} />
      <Route path="/messages"      element={<ProtectedRoute><AppShell><Messages /></AppShell></ProtectedRoute>} />
      <Route path="/subscriptions" element={<ProtectedRoute><AppShell><Subscriptions /></AppShell></ProtectedRoute>} />
      <Route path="/categories"    element={<ProtectedRoute><AppShell><Categories /></AppShell></ProtectedRoute>} />
      <Route path="/settings"      element={<ProtectedRoute><AppShell><Settings /></AppShell></ProtectedRoute>} />
      <Route path="/ai"            element={<ProtectedRoute><AppShell><AI /></AppShell></ProtectedRoute>} />
      <Route path="/habits"        element={<ProtectedRoute><AppShell><Habits /></AppShell></ProtectedRoute>} />
      <Route path="/ideas"         element={<ProtectedRoute><AppShell><Ideas /></AppShell></ProtectedRoute>} />
      <Route path="/gym"           element={<ProtectedRoute><AppShell><Gym /></AppShell></ProtectedRoute>} />
      <Route path="/drawing"       element={<ProtectedRoute><AppShell><Drawing /></AppShell></ProtectedRoute>} />
      <Route path="/learning"      element={<ProtectedRoute><AppShell><Learning /></AppShell></ProtectedRoute>} />
      <Route path="/tracker"       element={<ProtectedRoute><AppShell><Tracker /></AppShell></ProtectedRoute>} />
      <Route path="/productivity"  element={<ProtectedRoute><AppShell><Productivity /></AppShell></ProtectedRoute>} />

      <Route path="/"  element={<Navigate to="/login" replace />} />
      <Route path="*"  element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
