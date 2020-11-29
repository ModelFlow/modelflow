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

class Header extends Component {
  state = {
    isOpen: false,
    newName: '',
  };

  componentDidMount() {
    const { getScenarioViewsList } = this.props;
    getScenarioViewsList();
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
    console.log("switch main view type")
    switchMainViewType();
  };

  clickedLoadScenarioView = () => {};

  handleOpen = () => {
    this.setState({ isOpen: true });
  };

  handleClose = () => {
    this.setState({ isOpen: false });
  };

  handleNewScenarioView = () => {
    const { newScenarioView } = this.props;
    const { newName } = this.state;
    newScenarioView(newName);
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
    const { loadScenarioView } = this.props;
    const { id } = newItem;
    loadScenarioView(id);
  };

  filterItem = (query, item) =>
    item.title.toLowerCase().indexOf(query.toLowerCase()) >= 0;

  renderItem = (item, { handleClick, modifiers }) => {
    if (!modifiers.matchesPredicate) {
      return null;
    }
    return (
      <MenuItem
        active={modifiers.active}
        key={item.id}
        onClick={handleClick}
        text={item.title}
      />
    );
  };

  render() {
    const { scenarioViews, scenarioViewMeta, mainViewType } = this.props;
    const { title } = scenarioViewMeta;
    const { isOpen, newName } = this.state;
    return (
      <>
        <div className="global-header">
          <img
            className="logo"
            alt="logo"
            src="model_flow_horizontal.png"
            height="30"
          />
          <div className="titleSection">
            <span className="bp3-heading scenario">Mars Baseline Scenario</span>
            <span className="bp3-text-muted scenarioViewTitle">{title}</span>
          </div>
          <Button
            className="heading-button"
            icon="add"
            text="Add Card"
            onClick={this.clickedAddCard}
          />
          <Button className="new-button" onClick={this.handleOpen}>
            New
          </Button>
          <Button
            className="save-button"
            icon="floppy-disk"
            text="Save"
            onClick={this.clickedSaveScenarioView}
          />
          <Select
            className="load-button"
            items={scenarioViews}
            activeItem={''}
            noResults={<MenuItem disabled text="No results." />}
            onItemSelect={this.handleValueChange}
            itemRenderer={this.renderItem}
            itemPredicate={this.filterItem}
          >
            <Button
              icon="folder-open"
              text="Load"
              onClick={this.clickedLoadScenarioView}
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
            <p>Name your scenario view:</p>
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
                onClick={this.handleNewScenarioView}
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
  addCard: actions.resultViews.addCard,
  newScenarioView: actions.scenarioViews.newScenarioView,
  saveScenarioView: actions.scenarioViews.saveScenarioView,
  loadScenarioView: actions.scenarioViews.loadScenarioView,
  getScenarioViewsList: actions.scenarioViews.getScenarioViewsList,
  switchMainViewType: actions.common.switchMainViewType,
};

const mapStateToProps = (state) => ({
  scenarioViews: state.scenarioViews.scenarioViews,
  scenarioViewMeta: state.scenarioViews.scenarioViewMeta,
  mainViewType: state.common.mainViewType,
});

export default connect(mapStateToProps, mapDispatchToProps)(Header);
