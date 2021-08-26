import React, { Component } from 'react';
import './SimHeader.css';
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

class SimHeader extends Component {
  state = {
    newTemplateDialogIsOpen: false,
    newScenarioDialogIsOpen: false,
    helpIsOpen: false,
    newTemplateName: '',
    newScenarioName: '',
  };

  // componentDidMount() {
  // }

  clickedAddCard = (cardType) => {
    console.log('🃏 AddCard detected in SimHeader.jsx, type: ' + cardType)
    const { addCard } = this.props;
    addCard(cardType);
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

  handleSaveAsTemplate = () => {
    const { saveAsCurrentTemplate } = this.props;
    const { newTemplateName } = this.state;

    // TODO: Check uniqueness of name of template
    // TODO: Change to blocking after network call
    saveAsCurrentTemplate(newTemplateName);

    this.setState({ newTemplateName: '', newTemplateDialogIsOpen: false });
    AppToaster.show({
      message: `Saved new template: ${newTemplateName}`,
      intent: Intent.SUCCESS,
      icon: 'tick',
    });
  };

  clickedSaveScenario = () => {
    // TODO: If current template is blank then save as instead

    const { saveCurrentScenario } = this.props;
    // TODO: Add proper error handling for saving template
    saveCurrentScenario();

    AppToaster.show({
      message: 'Saved scenario',
      intent: Intent.SUCCESS,
      icon: 'tick',
    });
  };

  handleSaveAsScenario = () => {
    const { saveAsCurrentScenario } = this.props;
    const { newScenarioName } = this.state;

    saveAsCurrentScenario(newScenarioName);

    AppToaster.show({
      message: `Saved new scenario: ${newScenarioName}`,
      intent: Intent.SUCCESS,
      icon: 'tick',
    });

    this.setState({ newScenarioName: '', newScenarioDialogIsOpen: false });

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
    // TODO: Make working again
    const { switchMainViewType } = this.props;
    console.log('switch main view type');
    switchMainViewType();
  };

  handleNewTemplateOpen = () => {
    this.setState({ newTemplateDialogIsOpen: true });
  };

  handleNewTemplateClose = () => {
    this.setState({ newTemplateDialogIsOpen: false });
  };

  handleHelpOpen = () => {
    this.setState({ helpIsOpen: true });
  };

  handleHelpClose = () => {
    this.setState({ helpIsOpen: false });
  };

  handleNewTemplateNameInput = (e) => {
    this.setState({ newTemplateName: e.target.value });
  };

  handleNewScenarioOpen = () => {
    this.setState({ newScenarioDialogIsOpen: true });
  };

  handleNewScenarioClose = () => {
    this.setState({ newScenarioDialogIsOpen: false });
  };

  handleNewScenarioNameInput = (e) => {
    this.setState({ newScenarioName: e.target.value });
  };

  handleSelectTemplateMenuItem = (newItem) => {
    this.fetchData(newItem);
  };

  fetchData = async (newItem) => {
    const { loadTemplate, runSim } = this.props;
    const { id } = newItem;
    await loadTemplate(id);
    await runSim();
  };

  handleSelectScenarioMenuItem = (newItem) => {
    this.fetchScenario(newItem);
  };

  fetchScenario = async (newItem) => {
    const { loadScenario, runSim } = this.props;
    const { id } = newItem;
    await loadScenario(id);
    await runSim();
  };

  filterMenuItem = (query, item) =>
    item.name.toLowerCase().indexOf(query.toLowerCase()) >= 0;

  renderMenuItem = (item, { handleClick, modifiers }) => {
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
      scenarios,
      currentProjectMetadata,
      currentScenarioMetadata,
      currentTemplateMetadata,
      // mainViewType,
      sim,
    } = this.props;
    const {
      newTemplateDialogIsOpen,
      newScenarioDialogIsOpen,
      helpIsOpen,
      newTemplateName,
      newScenarioName,
    } = this.state;

    console.log('the render function for header:');
    console.log(scenarios);

    const scenarioSaveMenu = (
      <Menu>
        <MenuItem
          icon="floppy-disk"
          text="Save (Overwrite)"
          onClick={this.clickedSaveScenario}
        />
        <MenuItem
          icon="floppy-disk"
          text="Save As (Duplicate)"
          onClick={this.handleNewScenarioOpen}
        />
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
          onClick={this.handleNewTemplateOpen}
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
        onClose={this.handleNewTemplateClose}
        title="Save New Template"
        autoFocus={true}
        canEscapeKeyClose={true}
        canOutsideClickClose={true}
        enforceFocus={false}
        isOpen={newTemplateDialogIsOpen}
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
            onChange={this.handleNewTemplateNameInput}
            value={newTemplateName}
          />
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Tooltip content="This button is hooked up to close the dialog.">
              <Button onClick={this.handleNewTemplateClose}>Cancel</Button>
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

    const scenarioSaveAsDialog = (
      <Dialog
        icon="info-sign"
        onClose={this.handleNewScenarioClose}
        title="Save New Scenario"
        autoFocus={true}
        canEscapeKeyClose={true}
        canOutsideClickClose={true}
        enforceFocus={false}
        isOpen={newScenarioDialogIsOpen}
        usePortal={true}
      >
        <div className={Classes.DIALOG_BODY}>
          <p>Name your scenario:</p>
          <input
            className="bp3-input"
            type="text"
            placeholder="name"
            dir="auto"
            style={{ width: '100%' }}
            onChange={this.handleNewScenarioNameInput}
            value={newScenarioName}
          />
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Tooltip content="This button is hooked up to close the dialog.">
              <Button onClick={this.handleNewScenarioClose}>Cancel</Button>
            </Tooltip>
            <AnchorButton
              intent={Intent.PRIMARY}
              onClick={this.handleSaveAsScenario}
              target="_blank"
            >
              Create
            </AnchorButton>
          </div>
        </div>
      </Dialog>
    );

    // For adding specific Card type
    const templateAddCard = (
      <Menu>
        <MenuItem
          text="Tree Hierarchy"
          onClick={this.clickedAddCard.bind(this, 'TREEVIEW')}
        />
        <MenuItem
          text="Mission Component"
          onClick={this.clickedAddCard.bind(this, 'COMPONENT')}
        />
      </Menu>
    );

    const helpDialog = (
      <Dialog
        icon="info-sign"
        onClose={this.handleHelpClose}
        title="Help"
        autoFocus={true}
        canEscapeKeyClose={true}
        canOutsideClickClose={true}
        enforceFocus={false}
        isOpen={helpIsOpen}
        usePortal={true}
      >
        <div className={Classes.DIALOG_BODY}>
          <p>Scenarios</p>
          <p>Template</p>
        </div>
      </Dialog>
    );
      
    // 👇 TODO: Just want multi-option "Add Card" later
    return (
      <>
        <Navbar style={{ padding: '0px 10px' }}>
          <Navbar.Group align={Alignment.LEFT}>
            <a href="/">
              <img alt="logo" src="/model_flow_horizontal.png" height="24" />
            </a>
            <div>
              <span className="bp3-heading">
                <a href={`/projects/${currentProjectMetadata.id}`}>
                  {currentProjectMetadata.name}
                </a>
              </span>
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
              <Select
                items={scenarios}
                activeItem={''}
                noResults={<MenuItem disabled text="No results." />}
                onItemSelect={this.handleSelectScenarioMenuItem}
                itemRenderer={this.renderMenuItem}
                itemPredicate={this.filterMenuItem}
              >
                <Button icon="database" text="Scenarios" />
              </Select>

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
                onItemSelect={this.handleSelectTemplateMenuItem}
                itemRenderer={this.renderMenuItem}
                itemPredicate={this.filterMenuItem}
              >
                <Button icon="control" text="Templates" />
              </Select>
              <Popover2 content={templateSaveMenu} minimal={true}>
                <AnchorButton icon="floppy-disk" rightIcon="caret-down" />
              </Popover2>
            </ButtonGroup>

            <div style={{ width: 5 }}></div>
            {/* ORIGINAL ADD BUTTON ==> <Button icon="add" text="Card (original)" onClick={this.clickedAddCard} /> */}
            <div style={{ width: 5 }}></div>
            <Popover2 content={templateAddCard} minimal={true}>
              <AnchorButton icon="add" text="Card" rightIcon="caret-down" />
            </Popover2>

            <div style={{ width: 5 }}></div>
            <Button icon="cog" disabled={true} />
            <div style={{ width: 5 }}></div>
            <Button icon="help" onClick={this.handleHelpOpen} />
          </Navbar.Group>
        </Navbar>

        {templateSaveAsDialog}
        {scenarioSaveAsDialog}
        {helpDialog}
      </>
    );
    //       <Button
    //         className="flow-results-switch"
    //         icon={
    //           mainViewType === 'flow' ? 'timeline-line-chart' : 'data-lineage'
    //         }
    //         text={mainViewType === 'flow' ? 'Model' : 'Flow'}
    //         onClick={this.clickedSwitchFlowOrResults}
    //       />
  }
}

const SimStatus = (props) => {
  const { sim } = props;
  const { status } = sim;

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
  saveCurrentScenario: actions.scenarios.saveCurrentScenario,
  saveAsCurrentScenario: actions.scenarios.saveAsCurrentScenario,
  loadTemplate: actions.templates.loadTemplate,
  setCurrentTemplateAsDefaultForCurrentScenario:
    actions.scenarios.setCurrentTemplateAsDefaultForCurrentScenario,
  switchMainViewType: actions.common.switchMainViewType,
  runSim: actions.sim.runSim,
};

const mapStateToProps = (state) => ({
  templates: state.templates.templates,
  scenarios: state.scenarios.scenarios,
  currentProjectMetadata: state.projects.currentProjectMetadata,
  currentTemplateMetadata: state.templates.currentTemplateMetadata,
  currentScenarioMetadata: state.scenarios.currentScenarioMetadata,
  mainViewType: state.common.mainViewType,
  sim: state.sim,
});

export default connect(mapStateToProps, mapDispatchToProps)(SimHeader);
