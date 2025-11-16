import PlannerUI from './components/PlannerUI'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6">
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Intelligenter Kalender & KI-Planer</h1>
        <a href="/test" className="text-sm text-blue-600 hover:underline">Systemtest</a>
      </header>
      <main>
        <PlannerUI />
      </main>
    </div>
  )
}

export default App
