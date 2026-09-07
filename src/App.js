import React from 'react'
import { BrowserRouter, Switch, Route } from 'react-router-dom'

import Home from './pages/Home' 
import Play from './pages/Play' 
import NotFound from './pages/errors/NotFound' 
import { AuthProvider } from './context/AuthContext'

import './App.css'

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/play/:id" component={Play} />
          <Route component={NotFound} />
        </Switch>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
