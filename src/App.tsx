import { Navigate, Outlet, Route, Routes } from 'react-router'
import { RequireProfile, StartRedirect } from '@/screens/guards'
import { Placeholder } from '@/screens/Placeholder'

// Every route in the app (BUILD_PLAN P1). Screens marked Placeholder are built in later phases.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StartRedirect />} />
      <Route path="/help" element={<Placeholder title="help.title" />} />

      <Route element={<Outlet />}>
        <Route path="/profiles" element={<Placeholder title="profiles.title" />} />
        <Route path="/onboarding" element={<Placeholder title="onboarding.title" />} />
        <Route path="/credits" element={<Placeholder title="credits.title" />} />
        <Route path="/teacher" element={<Placeholder title="teacher.title" />} />
        <Route path="/reviewer" element={<Placeholder title="reviewer.title" />} />

        <Route element={<RequireProfile />}>
          <Route path="/town" element={<Placeholder title="town.title" />} />
          <Route path="/play/:id" element={<Placeholder title="play.title" />} />
          <Route path="/book" element={<Placeholder title="book.title" />} />
          <Route path="/community" element={<Placeholder title="community.title" />} />
          <Route path="/me" element={<Placeholder title="me.title" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
