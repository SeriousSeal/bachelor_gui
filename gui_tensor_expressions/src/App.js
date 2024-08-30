import React from 'react';
import './App.css';
import EinsumTreeVisualizer from './components/EinsumTreeVisualizer';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Einsum Tree Compilation Visualizer</h1>
      </header>
      <main>
        <EinsumTreeVisualizer />
      </main>
    </div>
  );
}

export default App;