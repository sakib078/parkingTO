import React from 'react';
import './App.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import Header from './components/layout/Header.jsx';
import Main from './components/layout/Main.jsx';
import { DataContextProvider } from './store/context.jsx';



function App() {

  return (
    <DataContextProvider>
      <div className="min-h-screen">
        <Header />
        <Main />
      </div>
    </DataContextProvider>
  );
}

export default App;
