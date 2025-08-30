import './App.css'
import { Outlet } from 'react-router-dom'

function App() {

  return (
    <>
      <h1>HEllo World</h1>
      <Outlet />
    </>
  )
}

export default App
