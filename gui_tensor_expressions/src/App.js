import React from 'react';
import './App.css';
import EinsumTreeVisualizer from './components/EinsumTreeVisualizer';
import { ReactFlowProvider } from 'reactflow';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Einsum Tree Visualizer</h1>
      </header>
      <main>
        <EinsumTreeVisualizer />
      </main>
    </div>
  );
}

export default App;
