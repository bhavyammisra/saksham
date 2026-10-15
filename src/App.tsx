import { Navigate, Route, Routes } from 'react-router'
import { Shell } from '@/components/Shell'
import { SoundRouteSync } from '@/components/SoundRouteSync'
import { Book } from '@/screens/Book'
import { Credits } from '@/screens/Credits'
import { DevCharacters } from '@/screens/DevCharacters'
import { DevLook } from '@/screens/DevLook'
import { DevScene } from '@/screens/DevScene'
import { RequireProfile, StartRedirect } from '@/screens/guards'
import { HelpCentre } from '@/screens/HelpCentre'
import { Me, MeCharacter } from '@/screens/Me'
import { Onboarding } from '@/screens/Onboarding'
import { Placeholder } from '@/screens/Placeholder'
import { Play } from '@/screens/Play'
import { Profiles } from '@/screens/Profiles'
import { Town } from '@/screens/Town'

// Every route in the app (BUILD_PLAN P1). Screens marked Placeholder are built in later phases.
export default function App() {
  return (
    <>
      <SoundRouteSync />
      <Routes>
        <Route path="/" element={<StartRedirect />} />
        {/* The Help Centre has no shell: no Help button, nothing that moves or makes sound. */}
        <Route path="/help" element={<HelpCentre />} />

        {/* Screens with the top bar only. */}
        {/* The cover screens before the game: full-screen art under a see-through top bar. */}
        <Route element={<Shell immersive />}>
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/onboarding" element={<Onboarding />} />
        </Route>

        <Route element={<Shell />}>
          <Route path="/teacher" element={<Placeholder title="teacher.title" />} />
          <Route path="/reviewer" element={<Placeholder title="reviewer.title" />} />
          <Route path="/dev/characters" element={<DevCharacters />} />
          <Route path="/dev/scene" element={<DevScene />} />
          <Route path="/dev/look" element={<DevLook />} />
          <Route element={<RequireProfile />}>
            <Route path="/play/:id" element={<Play />} />
          </Route>
        </Route>

        {/* Screens with the top bar and the main navigation. */}
        <Route element={<Shell nav />}>
          <Route path="/credits" element={<Credits />} />
          <Route element={<RequireProfile />}>
            <Route path="/town" element={<Town />} />
            <Route path="/book" element={<Book />} />
            <Route path="/community" element={<Placeholder title="community.title" />} />
            <Route path="/me" element={<Me />} />
            <Route path="/me/character" element={<MeCharacter />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
