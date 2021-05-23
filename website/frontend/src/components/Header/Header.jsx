import React, { Component } from 'react';
import './Header.css';
import { connect } from 'react-redux';
import actions from '../../state/actions';
import {
  AnchorButton,
  ButtonGroup,
  Button,
  Classes,
  Dialog,
  Intent,
  Tooltip,
  MenuItem,
  Navbar,
  NavbarDivider,
  NavbarGroup,
  NavbarHeading,
  Alignment,
  Menu,
  MenuDivider,
} from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import { AppToaster } from '../Toaster.jsx';

import {
  Popover2SharedProps,
  Placement,
  PlacementOptions,
  Popover2,
  Popover2InteractionKind,
  StrictModifierNames,
} from '@blueprintjs/popover2';

class Header extends Component {
  state = {
    isOpen: false,
    newName: '',
  };

  componentDidMount() {
    const { getTemplatesForCurrentProject } = this.props;
    getTemplatesForCurrentProject();
  }

  clickedAddCard = () => {
    const { addCard } = this.props;
    addCard();
  };

  clickedSaveTemplate = () => {
    // TODO: If current template is blank then save as instead

    const { saveCurrentTemplate } = this.props;
    // TODO: Add proper error handling for saving template
    saveCurrentTemplate();

    AppToaster.show({
      message: 'Saved template',
      intent: Intent.SUCCESS,
      icon: 'tick',
    });
  };

  clickedSetDefaultTemplate = () => {
    // TODO: If current template is blank then save as instead

    const { setCurrentTemplateAsDefaultForCurrentScenario } = this.props;
    // TODO: Add proper error handling for saving template
    setCurrentTemplateAsDefaultForCurrentScenario();

    AppToaster.show({
      message: 'Set New Default Template for Scenario',
      intent: Intent.SUCCESS,
      icon: 'tick',
    });
  };

  clickedSwitchFlowOrResults = () => {
    const { switchMainViewType } = this.props;
    console.log('switch main view type');
    switchMainViewType();
  };

  handleOpen = () => {
    this.setState({ isOpen: true });
  };

  handleClose = () => {
    this.setState({ isOpen: false });
  };

  handleSaveAsTemplate = () => {
    const { saveAsCurrentTemplate } = this.props;
    const { newName } = this.state;

    // TODO: Check uniqueness of name of template
    // TODO: Change to blocking after network call
    saveAsCurrentTemplate(newName);
    this.setState({ newName: '', isOpen: false });
    AppToaster.show({
      message: `Saved new template: ${newName}`,
      intent: Intent.SUCCESS,
      icon: 'tick',
    });
  };

  handleNewNameInput = (e) => {
    this.setState({ newName: e.target.value });
  };

  handleValueChange = (newItem) => {
    this.fetchData(newItem);
  };

  fetchData = async (newItem) => {
    const { loadTemplate, runSim } = this.props;
    const { id } = newItem;
    await loadTemplate(id);
    await runSim();
  };

  filterItem = (query, item) =>
    item.name.toLowerCase().indexOf(query.toLowerCase()) >= 0;

  renderItem = (item, { handleClick, modifiers }) => {
    if (!modifiers.matchesPredicate) {
      return null;
    }
    return (
      <MenuItem
        active={modifiers.active}
        key={item.id}
        onClick={handleClick}
        text={item.name}
      />
    );
  };

  render() {
    const {
      templates,
      currentProjectMetadata,
      currentScenarioMetadata,
      currentTemplateMetadata,
      mainViewType,
      sim,
    } = this.props;
    const { isOpen, newName } = this.state;

    const scenarioSaveMenu = (
      <Menu>
        <MenuItem icon="floppy-disk" text="Save (Overwrite)" />
        <MenuItem icon="floppy-disk" text="Save As (Duplicate)" />
      </Menu>
    );

    const templateSaveMenu = (
      <Menu>
        <MenuItem
          icon="floppy-disk"
          text="Save (Overwrite)"
          onClick={this.clickedSaveTemplate}
        />
        <MenuItem
          icon="floppy-disk"
          text="Save As (Duplicate)"
          onClick={this.handleOpen}
        />
        <MenuItem
          text="Set as default"
          onClick={this.clickedSetDefaultTemplate}
        />
      </Menu>
    );

    const templateSaveAsDialog = (
      <Dialog
        icon="info-sign"
        onClose={this.handleClose}
        title="Save New Template"
        autoFocus={true}
        canEscapeKeyClose={true}
        canOutsideClickClose={true}
        enforceFocus={false}
        isOpen={isOpen}
        usePortal={true}
      >
        <div className={Classes.DIALOG_BODY}>
          <p>Name your template:</p>
          <input
            className="bp3-input"
            type="text"
            placeholder="name"
            dir="auto"
            style={{ width: '100%' }}
            onChange={this.handleNewNameInput}
            value={newName}
          />
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Tooltip content="This button is hooked up to close the dialog.">
              <Button onClick={this.handleClose}>Cancel</Button>
            </Tooltip>
            <AnchorButton
              intent={Intent.PRIMARY}
              onClick={this.handleSaveAsTemplate}
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
        <Navbar>
          <Navbar.Group align={Alignment.LEFT}>
            <img alt="logo" src="/model_flow_horizontal.png" height="24" />
            <div>
              <span className="bp3-heading">{currentProjectMetadata.name}</span>
              {' > '}
              <span className="bp3-heading">
                {currentScenarioMetadata.name}
              </span>
            </div>
            <Navbar.Divider />
            <div>
              <span className="bp3-text-muted">
                {currentTemplateMetadata.name}
              </span>
            </div>
            <Navbar.Divider />
            <SimStatus sim={sim} />
          </Navbar.Group>

          <Navbar.Group align={Alignment.RIGHT}>
            <ButtonGroup>
              <Button icon="database" text="Scenarios" />
              <Popover2 content={scenarioSaveMenu} minimal={true}>
                <AnchorButton icon="floppy-disk" rightIcon="caret-down" />
              </Popover2>
            </ButtonGroup>
            <div style={{ width: 5 }}></div>
            <ButtonGroup>
              <Select
                items={templates}
                activeItem={''}
                noResults={<MenuItem disabled text="No results." />}
                onItemSelect={this.handleValueChange}
                itemRenderer={this.renderItem}
                itemPredicate={this.filterItem}
              >
                <Button icon="control" text="Templates" />
              </Select>
              <Popover2 content={templateSaveMenu} minimal={true}>
                <AnchorButton icon="floppy-disk" rightIcon="caret-down" />
              </Popover2>
            </ButtonGroup>
            <div style={{ width: 5 }}></div>
            <Button icon="add" text="Add Card" onClick={this.clickedAddCard} />
            <div style={{ width: 5 }}></div>
            <Button icon="help" onClick={this.TODO_OPEN_HELP} />
          </Navbar.Group>
        </Navbar>

        {templateSaveAsDialog}
      </>
    );
    //     <div className="global-header">
    // <img
    //   className="logo"
    //   alt="logo"
    //   src="/model_flow_horizontal.png"
    //   height="30"
    // />;

    //       <Button
    //         className="save-button"
    //         icon="floppy-disk"
    //         text="Save As"
    //         onClick={this.handleOpen}
    //       />
    //       <Button
    //         className="save-button"
    //         icon="floppy-disk"
    //         text="Save"
    //         onClick={this.clickedSaveTemplate}
    //       />
    // <Select
    //   className="load-button"
    //   items={templates}
    //   activeItem={''}
    //   noResults={<MenuItem disabled text="No results." />}
    //   onItemSelect={this.handleValueChange}
    //   itemRenderer={this.renderItem}
    //   itemPredicate={this.filterItem}
    // >
    //   <Button icon="folder-open" text="Load" />
    // </Select>

    //       <Button
    //         className="flow-results-switch"
    //         icon={
    //           mainViewType === 'flow' ? 'timeline-line-chart' : 'data-lineage'
    //         }
    //         text={mainViewType === 'flow' ? 'Model' : 'Flow'}
    //         onClick={this.clickedSwitchFlowOrResults}
    //       />
    //     </div>

    //   </>
    // );
  }
}

const SimStatus = (props) => {
  console.log('INSIDE SINM');
  const { sim } = props;
  const { status } = sim;
  console.log(status);

  if (status === 'waiting') {
    return (
      <Button
        icon="info-sign"
        minimal={true}
        intent={Intent.NONE}
        text="Waiting"
      />
    );
  } else if (status === 'running') {
    return (
      <Button
        icon="walk"
        minimal={true}
        intent={Intent.WARNING}
        text="Running"
      />
    );
  } else if (status === 'success') {
    return (
      <Button
        icon="tick-circle"
        minimal={true}
        intent={Intent.SUCCESS}
        text=""
      />
    );
  } else if (status === 'error') {
    return (
      <Button
        icon="error"
        minimal={true}
        intent={Intent.DANGER}
        text={sim.results.error}
      />
    );
  }
};

const mapDispatchToProps = {
  addCard: actions.resultsView.addCard,
  saveCurrentTemplate: actions.templates.saveCurrentTemplate,
  saveAsCurrentTemplate: actions.templates.saveAsCurrentTemplate,
  loadTemplate: actions.templates.loadTemplate,
  getTemplatesForCurrentProject:
    actions.templates.getTemplatesForCurrentProject,
  setCurrentTemplateAsDefaultForCurrentScenario:
    actions.scenarios.setCurrentTemplateAsDefaultForCurrentScenario,
  switchMainViewType: actions.common.switchMainViewType,
  runSim: actions.sim.runSim,
};

const mapStateToProps = (state) => ({
  templates: state.templates.templates,
  currentProjectMetadata: state.projects.currentProjectMetadata,
  currentTemplateMetadata: state.templates.currentTemplateMetadata,
  currentScenarioMetadata: state.scenarios.currentScenarioMetadata,
  mainViewType: state.common.mainViewType,
  sim: state.sim,
});

export default connect(mapStateToProps, mapDispatchToProps)(Header);
