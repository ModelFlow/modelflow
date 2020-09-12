import React, { Component } from 'react';
import './Main.css';
import { Button } from '@blueprintjs/core';
import ParamInputs from '../ParamInputs/ParamInputs';
import ResultsGrid from '../ResultsGrid/ResultsGrid';

class Main extends Component {
  componentDidMount() {}

  render() {
    return (
      <>
        <div className="global-header">
          <img
            className="logo"
            alt="logo"
            src="model_flow_horizontal.png"
            height="30"
          />
          <h3 className="bp3-heading titleText">Mars Baseline Simulation</h3>
          <Button className="heading-button" icon="add" text="Add" />
        </div>
        <div className="grid-container">
          <div className="paramsCabinet">
            <ParamInputs />
          </div>
          <div className="resultsDisplay">
            <ResultsGrid />
          </div>
        </div>
      </>
    );
  }
}

export default Main;
