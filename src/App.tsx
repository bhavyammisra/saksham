import { Route, Routes } from 'react-router'

// The empty shell. Real screens and routes arrive in Phase 1.
function Home() {
  return <main />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  )
}
