import React, { Component } from 'react';
import './Project.css';
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
import Header from '../Header/Header.jsx';

// import { useParams } from 'react-router-dom';

class Project extends Component {
  state = {
    newScenarioDialogIsOpen: false,
    newScenarioName: '',
  };

  componentDidMount() {
    const { projectId } = this.props.match.params;
    const { getCurrentProjectMetadata, getScenariosForProject } = this.props;
    getCurrentProjectMetadata(projectId);
    getScenariosForProject(projectId);
  }

  handleNewScenarioOpen = () => {
    this.setState({ newScenarioDialogIsOpen: true });
  };

  handleNewScenarioClose = () => {
    this.setState({ newScenarioDialogIsOpen: false });
  };

  handleNewScenarioNameInput = (e) => {
    this.setState({ newScenarioName: e.target.value });
  };

  handleSaveNewScenario = async () => {
    const { newScenarioName } = this.state;
    const { createScenario } = this.props;
    const { projectId } = this.props.match.params;
    console.log(projectId)
    const scenarioId = await createScenario(newScenarioName, projectId);
    window.location.href = `/sim?scenario=${scenarioId}`;
  };

  render() {
    const { scenarios, currentProjectMetadata } = this.props;
    const { newScenarioDialogIsOpen, newScenarioName } = this.state;

    const scenarioItems = scenarios.map((scenario) => {
      let defaultTemplateParam = '';
      if (scenario.defaultTemplateId) {
        defaultTemplateParam = '&template=' + scenario.defaultTemplateId;
      }
      return (
        <li key={scenario.id}>
          {scenario.id} {/* The id is only for debugging */}
          <a href={`/sim?scenario=${scenario.id}${defaultTemplateParam}`}>
            {scenario.name}
          </a>
        </li>
      );
    });

    const newScenarioDialog = (
      <Dialog
        icon="info-sign"
        onClose={this.handleNewScenarioClose}
        title="New Scenario"
        autoFocus={true}
        canEscapeKeyClose={true}
        canOutsideClickClose={true}
        enforceFocus={false}
        isOpen={newScenarioDialogIsOpen}
        usePortal={true}
      >
        <div className={Classes.DIALOG_BODY}>
          <p>Scenario Name:</p>
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
            <Tooltip content="This button closes the dialog.">
              <Button onClick={this.handleNewScenarioClose}>Cancel</Button>
            </Tooltip>
            <AnchorButton
              intent={Intent.PRIMARY}
              onClick={this.handleSaveNewScenario}
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
        <Header title={`Project: ${currentProjectMetadata.name}`} />
        <br />
        <h2>Scenarios:</h2>
        <div>
          <ul>{scenarioItems}</ul>
        </div>
        <Button onClick={this.handleNewScenarioOpen}>New Scenario</Button>
        <hr />
        <a href="/todo">Model Library</a>
        {newScenarioDialog}
      </>
    );
  }
}

const mapDispatchToProps = {
  getScenariosForProject: actions.scenarios.getScenariosForProject,
  getCurrentProjectMetadata: actions.projects.getCurrentProjectMetadata,
  createScenario: actions.scenarios.createScenario,
};

const mapStateToProps = (state) => ({
  scenarios: state.scenarios.scenarios,
  currentProjectMetadata: state.projects.currentProjectMetadata,
});

export default connect(mapStateToProps, mapDispatchToProps)(Project);
