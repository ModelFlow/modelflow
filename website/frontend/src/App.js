import React from 'react';
import './App.css';
import ParamInputs from './components/ParamInputs/ParamInputs'
import ResultsGrid from './components/ResultsGrid/ResultsGrid'
import { Button } from "@blueprintjs/core";


function App() {
  return (
    <>
      <div className="global-header">
        <img className="logo" alt="logo" src="model_flow_horizontal.png" height="30"></img>
        <h3 className="bp3-heading titleText">Mars Baseline Simulation</h3>
        <Button className="heading-button" icon="add" text="Add" />
      </div>
      <div className="grid-container">
        <div className="paramsCabinet">
          <ParamInputs></ParamInputs>
        </div>
        <div className="resultsDisplay">
          <ResultsGrid></ResultsGrid>
        </div>
      </div>
    </>
  )
}

export default App;
