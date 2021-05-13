import React, { Component } from 'react';
import './Header.css';
import { connect } from 'react-redux';
import actions from '../../state/actions';
import {
  AnchorButton,
  Button,
  Classes,
  Dialog,
  Intent,
  Tooltip,
  MenuItem,
} from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import { AppToaster } from '../Toaster.jsx';
import { newBlankTemplate } from '../../state/actions/templates';

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

  clickedSaveScenarioView = () => {
    const { saveScenarioView } = this.props;
    // TODO: Add proper error handling for saving scenario
    saveScenarioView();

    AppToaster.show({
      message: 'Saved scenario',
      intent: Intent.SUCCESS,
      icon: 'tick',
    });
  };

  clickedSwitchFlowOrResults = () => {
    const { switchMainViewType } = this.props;
    console.log('switch main view type');
    switchMainViewType();
  };

  clickedLoadScenarioView = () => { };

  handleOpen = () => {
    this.setState({ isOpen: true });
  };

  handleClose = () => {
    this.setState({ isOpen: false });
  };

  handleNewTemplate = () => {
    const { newScenarioView } = this.props;
    const { newName } = this.state;
    newBlankTemplate(newName);
    this.setState({ newName: '', isOpen: false });
    AppToaster.show({
      message: 'Created new scenario',
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
    const { loadScenarioView, runSim } = this.props;
    const { id } = newItem;
    await loadScenarioView(id);
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
    } = this.props;
    const { isOpen, newName } = this.state;
    return (
      <>
        <div className="global-header">
          <img
            className="logo"
            alt="logo"
            src="/model_flow_horizontal.png"
            height="30"
          />
          <div className="nameSection">
            <span className="bp3-heading">{currentProjectMetadata.name}</span>
            {' > '}
            <span className="bp3-heading">
              {currentScenarioMetadata.name}
            </span>
            {' | '}
            <span className="bp3-text-muted">
              {currentTemplateMetadata.name}
            </span>
          </div>
          <Button
            className="heading-button"
            icon="add"
            text="Add Card"
            onClick={this.clickedAddCard}
          />
          <Button
            className="save-button"
            icon="floppy-disk"
            text="Save As"
            onClick={this.clickedSaveTemplate}
          />
          <Button
            className="save-button"
            icon="floppy-disk"
            text="Save"
            onClick={this.clickedSaveTemplate}
          />
          <Select
            className="load-button"
            items={templates}
            activeItem={''}
            noResults={<MenuItem disabled text="No results." />}
            onItemSelect={this.handleValueChange}
            itemRenderer={this.renderItem}
            itemPredicate={this.filterItem}
          >
            <Button
              icon="folder-open"
              text="Load"
              onClick={this.clickedLoadTemplate}
            />
          </Select>

          <Button
            className="flow-results-switch"
            icon={
              mainViewType === 'flow' ? 'timeline-line-chart' : 'data-lineage'
            }
            text={mainViewType === 'flow' ? 'Model' : 'Flow'}
            onClick={this.clickedSwitchFlowOrResults}
          />
        </div>

        <Dialog
          icon="info-sign"
          onClose={this.handleClose}
          title="Save New View"
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
                onClick={this.handleNewTemplate}
                target="_blank"
              >
                Create
              </AnchorButton>
            </div>
          </div>
        </Dialog>
      </>
    );
  }
}

const mapDispatchToProps = {
  addCard: actions.resultsView.addCard,
  newBlankTemplate: actions.templates.newBlankTemplate,
  saveCurrentTemplate: actions.templates.saveCurrentTemplate,
  loadTemplate: actions.templates.loadTemplate,
  getTemplatesForCurrentProject:
    actions.templates.getTemplatesForCurrentProject,
  switchMainViewType: actions.common.switchMainViewType,
  runSim: actions.sim.runSim,
};

const mapStateToProps = (state) => ({
  templates: state.templates.templates,
  currentProjectMetadata: state.projects.currentProjectMetadata,
  currentTemplateMetadata: state.templates.currentTemplateMetadata,
  currentScenarioMetadata: state.scenarios.currentScenarioMetadata,
  mainViewType: state.common.mainViewType,
});

export default connect(mapStateToProps, mapDispatchToProps)(Header);
