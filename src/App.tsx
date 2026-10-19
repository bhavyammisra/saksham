import { Navigate, Route, Routes } from 'react-router'
import { Shell } from '@/components/Shell'
import { SoundRouteSync } from '@/components/SoundRouteSync'
import { Book } from '@/screens/Book'
import { Credits } from '@/screens/Credits'
import { DevCharacters } from '@/screens/DevCharacters'
import { DevScene } from '@/screens/DevScene'
import { RequireProfile } from '@/screens/guards'
import { HelpCentre } from '@/screens/HelpCentre'
import { Me, MeCharacter } from '@/screens/Me'
import { Onboarding } from '@/screens/Onboarding'
import { Community } from '@/screens/Community'
import { Play } from '@/screens/Play'
import { Profiles } from '@/screens/Profiles'
import { Reviewer } from '@/screens/Reviewer'
import { Teacher } from '@/screens/Teacher'
import { Title } from '@/screens/Title'
import { Town } from '@/screens/Town'

// Every route in the app (BUILD_PLAN P1).
export default function App() {
  return (
    <>
      <SoundRouteSync />
      <Routes>
        {/* The Help Centre has no shell: no Help button, nothing that moves or makes sound. */}
        <Route path="/help" element={<HelpCentre />} />
        {/* The game itself: full screen, with its own Need help? in the corner (D-036). */}
        <Route path="/dev/scene" element={<DevScene />} />
        <Route element={<RequireProfile />}>
          <Route path="/town" element={<Town />} />
          <Route path="/play/:id" element={<Play />} />
        </Route>

        {/* Screens with the top bar only. */}
        {/* The cover screens before the game (title menu, new game, players), under a see-through top bar. */}
        <Route element={<Shell immersive />}>
          <Route path="/" element={<Title />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/onboarding" element={<Onboarding />} />
        </Route>

        <Route element={<Shell />}>
          <Route path="/teacher" element={<Teacher />} />
          <Route path="/reviewer" element={<Reviewer />} />
          <Route path="/dev/characters" element={<DevCharacters />} />
        </Route>

        {/* Screens with the top bar and the main navigation. */}
        <Route element={<Shell nav />}>
          <Route path="/credits" element={<Credits />} />
          <Route element={<RequireProfile />}>
            <Route path="/book" element={<Book />} />
            <Route path="/community" element={<Community />} />
            <Route path="/me" element={<Me />} />
            <Route path="/me/character" element={<MeCharacter />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
