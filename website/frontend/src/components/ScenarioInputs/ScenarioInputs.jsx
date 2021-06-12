import React, { Component } from 'react';
import { connect } from 'react-redux';
import actions from '../../state/actions';
import {
  FormGroup,
  NumericInput,
  Button,
  Dialog,
  Classes,
  Tooltip,
  AnchorButton,
  Intent,
  Icon,
} from '@blueprintjs/core';
import ModelClass from '../ModelClass/ModelClass.jsx';
import ModelInstance from '../ModelInstance/ModelInstance.jsx';

class ScenarioInputs extends Component {
  state = {
    newModelClassDialogIsOpen: false,
    newInstanceDialogIsOpen: false,
  };

  handleNewModelClassDialogOpen = () => {
    this.setState({ newModelClassDialogIsOpen: true });
  };

  handleNewModelClassDialogClose = () => {
    this.setState({ newModelClassDialogIsOpen: false });
  };

  handleNewModelClassSubmit = async () => {
    const { submitModelClass, getModelClassesForCurrentProject } = this.props;
    const data = await submitModelClass();
    if (!data.error) {
      getModelClassesForCurrentProject();
      this.setState({ newModelClassDialogIsOpen: false });
    }
  };

  handleNewInstanceSubmit = async () => {
    const { submitInstance } = this.props;
    const data = await submitInstance();
    if (!data.error) {
      this.setState({ newInstanceDialogIsOpen: false });
    }
  }

  handleNewInstanceDialogOpen = () => {
    this.setState({ newInstanceDialogIsOpen: true });
  };

  handleNewInstanceDialogClose = () => {
    this.setState({ newInstanceDialogIsOpen: false });
  };

  handleInputMaxSteps = async (_, valueStr) => {
    const { setCurrentScenarioMaxSteps, runSim } = this.props;
    await setCurrentScenarioMaxSteps(valueStr);
    await runSim();
  };

  render() {
    const {
      maxSteps,
      modelClassStatus,
      modelClassError,
      fullState,
    } = this.props;
    const { newModelClassDialogIsOpen, newInstanceDialogIsOpen } = this.state;
    console.log('inside scenarioinputs render');
    console.log(JSON.stringify(fullState));

    // TODO: Add search
    const modelInstances = [];

    let modelClassStatusJSX = null;
    if (modelClassStatus === 'running') {
      modelClassStatusJSX = (
        <span style={{ position: 'absolute', marginTop: 7 }}>
          <Icon icon="walk" intent="warning"></Icon> Submitting...
        </span>
      );
    } else if (modelClassStatus === 'error') {
      modelClassStatusJSX = (
        <span style={{ position: 'absolute', marginTop: 7 }}>
          <Icon icon="error" intent="danger"></Icon> {modelClassError}
        </span>
      );
    }

    let instanceStatus = null;

    const newModelClassDialog = (
      <Dialog
        icon="graph"
        onClose={this.handleNewModelClassDialogClose}
        title="New Model Class"
        autoFocus={true}
        canEscapeKeyClose={false}
        canOutsideClickClose={false}
        enforceFocus={false}
        isOpen={newModelClassDialogIsOpen}
        usePortal={true}
      >
        <ModelClass />
        <div className={Classes.DIALOG_FOOTER}>
          {modelClassStatusJSX}

          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Tooltip content="This button is hooked up to close the dialog.">
              <Button onClick={this.handleNewModelClassDialogClose}>
                Cancel
              </Button>
            </Tooltip>
            <AnchorButton
              intent={Intent.PRIMARY}
              onClick={this.handleNewModelClassSubmit}
              target="_blank"
            >
              Create
            </AnchorButton>
          </div>
        </div>
      </Dialog>
    );

    const newInstanceDialog = (
      <Dialog
        style={{ width: 300 }}
        icon="new-object"
        onClose={this.handleNewInstanceDialogClose}
        title="New Instance"
        autoFocus={true}
        canEscapeKeyClose={true}
        canOutsideClickClose={true}
        enforceFocus={false}
        isOpen={newInstanceDialogIsOpen}
        usePortal={true}
      >
        <ModelInstance />
        <div className={Classes.DIALOG_FOOTER}>
          {instanceStatus}

          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Tooltip content="This button is hooked up to close the dialog.">
              <Button onClick={this.handleNewInstanceDialogClose}>
                Cancel
              </Button>
            </Tooltip>
            <AnchorButton
              intent={Intent.PRIMARY}
              onClick={this.handleNewInstanceSubmit}
              target="_blank"
            >
              Create
            </AnchorButton>
          </div>
        </div>
      </Dialog>
    );

    return (
      <>
        <FormGroup label="Max Steps" labelFor="text-input">
          <NumericInput
            onValueChange={this.handleInputMaxSteps}
            value={maxSteps}
            buttonPosition={'none'}
          />

          <Button onClick={this.handleNewModelClassDialogOpen}>
            New Model Class
          </Button>
          <Button onClick={this.handleNewInstanceDialogOpen}>
            New Instance
          </Button>
        </FormGroup>
        {modelInstances.map((modelInstance) => {
          const paramInputs = null;
          const stateInputs = null;
          return (
            <div>
              <h1>Instance Name: {modelInstance.name}</h1>
              <b>ModelClass: {modelInstance.model_class.name}</b>
              <h3>Parameters</h3>
              {paramInputs}
              <h3>Initial States</h3>
              {stateInputs}
              <br />
            </div>
          );
        })}
        {newModelClassDialog}
        {newInstanceDialog}
      </>
    );
  }
}

/*
            <FormGroup label="Max Steps" labelFor="text-input">
              <NumericInput
                onValueChange={this.handleInputMaxSteps}
                value={maxSteps}
                buttonPosition={'none'}
              />
            </FormGroup>
*/

const mapDispatchToProps = {
  setCurrentScenarioMaxSteps: actions.scenarios.setCurrentScenarioMaxSteps,
  submitModelClass: actions.modelClassForm.submitModelClass,
  submitInstance: actions.instanceForm.submitInstance,
  runSim: actions.sim.runSim,
  getModelClassesForCurrentProject:
    actions.modelClassForm.getModelClassesForCurrentProject,
};

const mapStateToProps = (state) => ({
  maxSteps: state.scenarios.currentScenario.max_steps,
  modelClassStatus: state.modelClassForm.status,
  modelClassError: state.modelClassForm.error,
  fullState: state.modelClassForm,
});

export default connect(mapStateToProps, mapDispatchToProps)(ScenarioInputs);
