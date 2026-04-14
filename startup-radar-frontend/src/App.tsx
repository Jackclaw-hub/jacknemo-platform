import React from 'react'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Startup Radar</h1>
        <p>Multi-sided marketplace for startup resources</p>
      </header>
      <main>
        <div className="role-selection">
          <h2>Select Your Role</h2>
          <div className="role-cards">
            <div className="role-card">
              <h3>Founder</h3>
              <p>Find funding, equipment, and services for your startup</p>
            </div>
            <div className="role-card">
              <h3>Supplier</h3>
              <p>Offer equipment or services to startups</p>
            </div>
            <div className="role-card">
              <h3>Investor</h3>
              <p>Discover promising startups to fund</p>
            </div>
            <div className="role-card">
              <h3>Admin</h3>
              <p>Manage platform operations and content</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App