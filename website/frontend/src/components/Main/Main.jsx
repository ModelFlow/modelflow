import React, { Component } from 'react';
import './Main.css';
import { connect } from 'react-redux';
import actions from '../../state/actions';
import ResultsView from '../ResultsView/ResultsView';
import TreeView from '../TreeView/TreeView';
import Header from '../Header/Header';
import FlowView from '../FlowView/FlowView';
import SimHeader from '../SimHeader/SimHeader';
import ScenarioInputs from '../ScenarioInputs/ScenarioInputs';
import { updateUrlParam } from '../../services/Utilities';
import { NonIdealState } from '@blueprintjs/core';

class Main extends Component {
  state = {
    error: null,
  };

  componentDidMount() {
    const url = new URL(window.location.href);
    // TODO: If scenario is blank then show an exception page
    let scenarioId = url.searchParams.get('scenario') || '';
    let templateId = url.searchParams.get('template') || '';
    if (scenarioId === '') {
      this.setState({ error: 'No URL Parameter "scenario"' });
    } else {
      this.setState({ error: null });
      this.fetchData(scenarioId, templateId);
    }
  }

  fetchData = async (scenarioId, templateId) => {
    const {
      loadScenario,
      loadTemplate,
      runSim,
      setSimError,
      getTemplatesForCurrentProject,
      getScenariosForCurrentProject,
      getModelClassesForCurrentProject,
    } = this.props;
    // TODO: I don't like that two https requests in serial are needed here.
    // Perhaps get params will be included in the scenario view
    // await getParams();
    // TODO: don't do await for load template
    // TODO: Add error for invalid templates

    // This is just used for potential interactivity
    const info = await loadScenario(scenarioId);
    if (info.error) {
      this.setState({ error: info.error });
      return;
    }
    // We need the project metadata to first be set above
    getTemplatesForCurrentProject();
    getScenariosForCurrentProject();
    getModelClassesForCurrentProject();

    if (info.error) {
      await setSimError('Scenario Not Found');
    } else {
      const url = new URL(window.location.href);
      let templateId = url.searchParams.get('template') || '';
      if (!templateId && info.default_template) {
        templateId = info.default_template;
        console.log('updating default template id');
        updateUrlParam('template', templateId);
      }
      console.log('Loading template...');

      await loadTemplate(templateId);

      console.log('Running sim...');
      // Runs sim based on the model instances, attributes stored on the frontend
      // TODO: Handle changes to classes
      await runSim();
    }
  };

  render() {
    const { error } = this.state;
    if (error) {
      return <NonIdealState icon="error" title="Error" description={error} />;
    }
    const { mainViewType } = this.props;
    let mainView = null;
    if (mainViewType === 'flow') {
      mainView = (
        <div className="flow-container">
          <TreeView />
        </div>
      );
    } else {
      // TODO: Re-enable parameter inputs once ready
      /*

      */
      mainView = (
        <div className="grid-container">
          <div className="paramsCabinet">
            <ScenarioInputs />
          </div>
          <div className="resultsDisplay">
            <TreeView />
            <ResultsView />
          </div>
        </div>
      );
    }

    return (
      <>
        <SimHeader />
        {mainView}
      </>
    );
  }
}

const mapDispatchToProps = {
  loadTemplate: actions.templates.loadTemplate,
  loadScenario: actions.scenarios.loadScenario,
  setSimError: actions.sim.setSimError,
  runSim: actions.sim.runSim,
  getTemplatesForCurrentProject:
    actions.templates.getTemplatesForCurrentProject,
  getScenariosForCurrentProject:
    actions.scenarios.getScenariosForCurrentProject,
  getModelClassesForCurrentProject:
    actions.modelClassForm.getModelClassesForCurrentProject,
};

const mapStateToProps = (state) => ({
  mainViewType: state.common.mainViewType,
  currentScenarioDefaultTemplateId:
    state.scenarios.currentScenarioDefaultTemplateId,
});

export default connect(mapStateToProps, mapDispatchToProps)(Main);
