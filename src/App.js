import logo from './logo.svg';
import './App.css';
import React from "react"
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ThreeStar from './pages/threeStar';

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<ThreeStar />}></Route>
      </Routes>
    </Router>
  );
}

export default App;
