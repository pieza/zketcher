import React from 'react'
import { BrowserRouter, Switch, Route } from 'react-router-dom'

import Home from './pages/Home' 
import Play from './pages/Play' 
import NotFound from './pages/errors/NotFound' 

import './App.css'

const App = () => {
  return (
    <BrowserRouter>

      {/* routes */}
      <Switch>
        <Route exact path="/" component={Home} />
        <Route exact path="/play/:id" component={Play} />

        {/* default */}
        <Route component={NotFound} />
      </Switch>
    </BrowserRouter>
  )
}

export default App
