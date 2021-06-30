import React, { Component } from 'react';
import { connect } from 'react-redux';
import actions from '../../state/actions';
import { FormGroup, NumericInput } from '@blueprintjs/core';
import { runSim } from '../../state/actions/sim';

class ScenarioInputs extends Component {
  handleInputMaxSteps = async (_, valueStr) => {
    console.log(valueStr);
    const { setCurrentScenarioMaxSteps, runSim } = this.props;
    await setCurrentScenarioMaxSteps(valueStr);
    await runSim();
  };

  render() {
    const { maxSteps } = this.props;
    return (
      <>
        <FormGroup label="Max Steps" labelFor="text-input">
          <NumericInput
            onValueChange={this.handleInputMaxSteps}
            value={maxSteps}
            buttonPosition={'none'}
          />
        </FormGroup>
      </>
    );
  }
}

const mapDispatchToProps = {
  setCurrentScenarioMaxSteps: actions.scenarios.setCurrentScenarioMaxSteps,
  runSim: actions.sim.runSim,
};

const mapStateToProps = (state) => ({
  maxSteps: state.scenarios.currentScenario.max_steps,
});

export default connect(mapStateToProps, mapDispatchToProps)(ScenarioInputs);
