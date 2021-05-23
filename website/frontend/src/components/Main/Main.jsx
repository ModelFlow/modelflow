import React, { Component } from 'react';
import './Main.css';
import { connect } from 'react-redux';
import actions from '../../state/actions';
import ResultsView from '../ResultsView/ResultsView';
import FlowView from '../FlowView/FlowView';
import Header from '../Header/Header';
import { updateUrlWithTemplate } from '../../services/Utilities';

class Main extends Component {
  componentDidMount() {
    const url = new URL(window.location.href);
    // TODO: If scenario is blank then show an exception page
    let scenarioId = url.searchParams.get('scenario') || '1';
    let templateId = url.searchParams.get('template') || '';
    this.fetchData(scenarioId, templateId);
  }

  fetchData = async (scenarioId, templateId) => {
    const { loadScenario, loadTemplate, runSim, setSimError } = this.props;
    // TODO: I don't like that two https requests in serial are needed here.
    // Perhaps get params will be included in the scenario view
    // await getParams();
    // TODO: don't do await for load template
    // TODO: Add error for invalid templates

    // This is just used for potential interactivity
    const info = await loadScenario(scenarioId);
    if (info.error) {
      await setSimError('Scenario Not Found');
    } else {
      const url = new URL(window.location.href);
      let templateId = url.searchParams.get('template') || '';
      if (!templateId) {
        templateId = info.default_template;
        console.log('updating default template id');
        updateUrlWithTemplate(templateId);
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
    const { mainViewType } = this.props;
    let mainView = null;
    if (mainViewType === 'flow') {
      mainView = (
        <div className="flow-container">
          <FlowView />
        </div>
      );
    } else {
      // TODO: Re-enable parameter inputs once ready
      /*
          <div className="paramsCabinet">
            <AttributeInputs />
          </div>
      */
      mainView = (
        <div className="grid-container">
          <div className="resultsDisplay">
            <ResultsView />
          </div>
        </div>
      );
    }

    return (
      <>
        <Header />
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
};

const mapStateToProps = (state) => ({
  mainViewType: state.common.mainViewType,
  currentScenarioDefaultTemplateId:
    state.scenarios.currentScenarioDefaultTemplateId,
});

export default connect(mapStateToProps, mapDispatchToProps)(Main);
