import React, { Component, useRef, useState } from 'react';
import './ModelInstance.css';
import { connect } from 'react-redux';
import actions from '../../state/actions';
import {
  AnchorButton,
  ButtonGroup,
  Button,
  Classes,
  Dialog,
  Intent,
  InputGroup,
  FormGroup,
  Checkbox,
  Tooltip,
  MenuItem,
  TextArea,
  Navbar,
  NavbarDivider,
  NavbarGroup,
  NumericInput,
  NavbarHeading,
  Alignment,
  Menu,
  MenuDivider,
  H5,
} from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';

class ModelInstance extends Component {
  // Can't put this here because currently depends on current project which comes from other component
  // componentDidMount() {
  //   const { getModelClassesForCurrentProject } = this.props;
  //   getModelClassesForCurrentProject();
  // }

  handleSelectModelClass = (newItem) => {
    const { updateInstanceField } = this.props;
    updateInstanceField('modelClassId', newItem.id);
    updateInstanceField('modelClassLabel', newItem.label);
  };

  handleSelectParentInstanceId = (newItem) => {
    const { updateInstanceField } = this.props;
    updateInstanceField('parentInstanceId', newItem.id);
    updateInstanceField('parentInstanceLabel', newItem.label);
  };

  filterMenuItem = (query, item) =>
    item.label.toLowerCase().indexOf(query.toLowerCase()) >= 0;

  renderMenuItem = (item, { handleClick, modifiers }) => {
    if (!modifiers.matchesPredicate) {
      return null;
    }
    return (
      <MenuItem
        style={{ width: 270 }}
        active={modifiers.active}
        key={item.id}
        onClick={handleClick}
        text={item.label}
      />
    );
  };

  render() {
    /*
    key = models.CharField(max_length=120)
    label = models.CharField(max_length=120)
    scenario = models.ForeignKey('Scenario', on_delete=models.SET_NULL, null=True, related_name='model_instances')
    model_class = models.ForeignKey('ModelClass', on_delete=models.SET_NULL, null=True)
    initial_parent_name = models.CharField(max_length=120) 

    // TODO!!! Make it so you can have multiple instances that are at root and then automatically 
    // make an encapsulating root component.
    */

    const {
      name,
      modelClasses,
      modelClassId,
      modelClassLabel,
      model_instances,
      updateInstanceField,
      parentInstanceId,
      parentInstanceLabel,
      scale,
    } = this.props;

    const model_instancesWithRoot = [
      {
        id: 0,
        label: 'None (root level)',
      },
      ...model_instances,
    ];

    console.log('model classes with root:');

    console.log(modelClasses, model_instancesWithRoot);
    console.log(modelClassId)

    return (
      <div className="InstanceForm">
        <FormGroup label="Model Class" labelFor="instance-name-input" labelInfo="(required)">
          <Select
            items={modelClasses}
            activeItem={modelClassId}
            usePortal={false}
            noResults={<MenuItem disabled text="No results." />}
            onItemSelect={this.handleSelectModelClass}
            itemRenderer={this.renderMenuItem}
            itemPredicate={this.filterMenuItem}
          >
            {/* There seems to be a blueprint bug with setting the width of select
                to be 100%. https://github.com/palantir/blueprint/issues/2956 */}
            <Button
              icon="database"
              text={`Class: ${modelClassLabel}`}
              style={{ width: 280 }}
            />
          </Select>
        </FormGroup>

        {/* <FormGroup label="Name" labelFor="instance-name-input">
          <InputGroup
            id="instance-name-input"
            placeholder="Name"
            value={name}
            onChange={(e) => updateInstanceField('name', e.target.value)}
          />
        </FormGroup> */}

        <FormGroup
          label="Initial Parent Instance"
          labelFor="instance-name-input"
          labelInfo="(required)"
        >
          <Select
            items={model_instancesWithRoot}
            activeItem={parentInstanceId}
            noResults={<MenuItem disabled text="No results." />}
            onItemSelect={this.handleSelectScenarioMenuItem}
            itemRenderer={this.renderMenuItem}
            itemPredicate={this.filterMenuItem}
          >
            <Button
              icon="database"
              text={`Parent: ${parentInstanceLabel}`}
              style={{ width: 280 }}
            />
          </Select>
        </FormGroup>

        {/* <FormGroup label="Scale" labelFor="scale-input" labelInfo="(required)">
          <NumericInput
            id="scale-input"
            placeholder="Name"
            value={1}
            fill={true}
            disabled={true}
          />
        </FormGroup> */}
      </div>
    );
  }
}

const mapDispatchToProps = {
  updateInstanceField: actions.instanceForm.updateInstanceField,
};

const mapStateToProps = (state) => ({
  modelClasses: state.modelClassForm.modelClasses,
  model_instances: state.scenarios.currentScenario.model_instances,
  modelClassId: state.instanceForm.modelClassId,
  modelClassLabel: state.instanceForm.modelClassLabel,
  parentInstanceId: state.instanceForm.parentInstanceId,
  parentInstanceLabel: state.instanceForm.parentInstanceLabel,

});

export default connect(mapStateToProps, mapDispatchToProps)(ModelInstance);
