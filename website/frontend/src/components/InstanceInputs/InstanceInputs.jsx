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

class InstanceInputs extends Component {
  deleteInstance = () => {
    console.log('delete instance');
  };

  openEditModelClass = (key) => {
    console.log(`inside open edit model class ${key}`);
    // Change var from state to param
    // call blocking change default data for model class form
    // change backend call to edit a model class if given an id
    const { setModelClassDialogState, setupExistingModelClass } = this.props;
    setupExistingModelClass(key);
    setModelClassDialogState(true);
  };

  render() {
    const { modelInstances } = this.props;
    // <AttributeInputs
    return (
      <>
        {modelInstances.map((modelInstance) => {
          const { key, label, model_class } = modelInstance;
          return (
            <div key={key}>
              <b>{label}</b>
              <a onClick={() => this.openEditModelClass(model_class.key)}>
                {model_class.label}
              </a>
              <Button
                icon={'small-cross'}
                minimal={true}
                onClick={this.deleteInstance}
              ></Button>
              <br />
            </div>
          );
        })}
      </>
    );
  }
}

const mapDispatchToProps = {
  setModelClassDialogState: actions.attributesInput.setModelClassDialogState,
  setupExistingModelClass: actions.modelClassForm.setupExistingModelClass,
};

const mapStateToProps = (state) => ({
  modelInstances: state.scenarios.currentScenario.model_instances,
});

export default connect(mapStateToProps, mapDispatchToProps)(InstanceInputs);
