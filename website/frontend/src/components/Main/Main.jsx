import React, { Component } from 'react';
import './Main.css';
import { connect } from 'react-redux';
import ParamInputs from '../ParamInputs/ParamInputs';
import ResultsGrid from '../ResultsGrid/ResultsGrid';
import actions from '../../state/actions';
import {
  AnchorButton,
  Button,
  Classes,
  Dialog,
  Intent,
  Tooltip,
} from '@blueprintjs/core';

class Main extends Component {
  state = {
    isOpen: false,
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
    saveScenarioView();
  };

  clickedLoadScenarioView = () => {
    const { saveScenarioView } = this.props;
    saveScenarioView();
  };

  handleOpen = () => {
    this.setState({ isOpen: true });
  };

  handleClose = () => {
    this.setState({ isOpen: false });
  };

  render() {
    const { isOpen } = this.state;
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
          <Button
            className="heading-button"
            icon="add"
            text="Add Card"
            onClick={this.clickedAddCard}
          />
          <Button
            className="save-button"
            icon="floppy-disk"
            text="Save"
            onClick={this.clickedSaveScenarioView}
          />
          <Button
            className="load-button"
            icon="folder-open"
            text="Load"
            onClick={this.clickedLoadScenarioView}
          />
        </div>
        <div className="grid-container">
          <div className="paramsCabinet">
            <ParamInputs />
          </div>
          <div className="resultsDisplay">
            <ResultsGrid />
          </div>
        </div>
        <Button onClick={this.handleOpen}>Show dialog</Button>
        <Dialog
          icon="info-sign"
          onClose={this.handleClose}
          title="Palantir Foundry"
          autoFocus={true}
          canEscapeKeyClose={true}
          canOutsideClickClose={true}
          enforceFocus={false}
          isOpen={isOpen}
          usePortal={true}
        >
          <div className={Classes.DIALOG_BODY}>
            <p>
              Start the revolution. Unleash the power of data integration with
              Palantir Foundry.
            </p>
          </div>
          <div className={Classes.DIALOG_FOOTER}>
            <div className={Classes.DIALOG_FOOTER_ACTIONS}>
              <Tooltip content="This button is hooked up to close the dialog.">
                <Button onClick={this.handleClose}>Close</Button>
              </Tooltip>
              <AnchorButton
                intent={Intent.PRIMARY}
                href="https://www.palantir.com/palantir-foundry/"
                target="_blank"
              >
                Submit
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
  getScenarioViewsList: actions.scenarioViews.getScenarioViewsList,
};

const mapStateToProps = (state) => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Main);
