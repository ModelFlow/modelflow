import React, { Component } from 'react';
import './Main.css';
import { connect } from 'react-redux';
import actions from '../../state/actions';
// import AttributeInputs from '../AttributeInputs/AttributeInputs';
// import ResultsGrid from '../ResultsGrid/ResultsGrid';
import ResultsView from '../ResultsView/ResultsView';
import FlowView from '../FlowView/FlowView';
import Header from '../Header/Header';
import { setSimStatus } from '../../state/actions/sim';

class Main extends Component {
  componentDidMount() {
    const url = new URL(window.location.href);
    // TODO: If scenarioId is blank then raise exception
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
    // await loadTemplate(templateId);
    console.log("after template")
    // This is just used for potential interactivity
    const error = await loadScenario(scenarioId);
    if (error) {
      await setSimError('Scenario Not Found');
    } else {
      console.log("run sim")
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
});

export default connect(mapStateToProps, mapDispatchToProps)(Main);
