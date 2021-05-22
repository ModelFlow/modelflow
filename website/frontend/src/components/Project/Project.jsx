import React, { Component } from 'react';
import './Project.css';
import { connect } from 'react-redux';
import actions from '../../state/actions';
// import { useParams } from 'react-router-dom';

class Project extends Component {
  componentDidMount() {
    const { projectId } = this.props.match.params;
    const { getCurrentProjectMetadata, getScenariosForProject } = this.props;
    getCurrentProjectMetadata(projectId);
    getScenariosForProject(projectId);
  }

  render() {
    const { scenarios, currentProjectMetadata } = this.props;
    const scenarioItems = scenarios.map((scenario) => {
      let defaultTemplateId = '';
      if (scenario.defaultTemplateId) {
        defaultTemplateId = '&template=' + scenario.defaultTemplateId;
      }
      return (
        <li key={scenario.id}>
          {scenario.id} {/* The id is only for debugging */}
          <a href={`/sim?scenario=${scenario.id}${defaultTemplateId}`}>
            {scenario.name}
          </a>{' | '}
          <a href={`/TODO_copy/${scenario.id}`}>Duplicate</a>
        </li>
      );
    });

    return (
      <>
        <a href="/">Projects</a>
        <br />
        <h1>Project: {currentProjectMetadata.name}</h1>
        <h2>Scenarios:</h2>
        <div>
          <ul>{scenarioItems}</ul>
        </div>
        <a href="/todo">New Blank Scenario</a>
        <hr />
        <a href="/todo">Model Library</a>
      </>
    );
  }
}

const mapDispatchToProps = {
  getScenariosForProject: actions.scenarios.getScenariosForProject,
  getCurrentProjectMetadata: actions.projects.getCurrentProjectMetadata,
};

const mapStateToProps = (state) => ({
  scenarios: state.scenarios.scenarios,
  currentProjectMetadata: state.projects.currentProjectMetadata,
});

export default connect(mapStateToProps, mapDispatchToProps)(Project);
