import React, { Component } from 'react';
import './Main.css';
import { connect } from 'react-redux';
import actions from '../../state/actions';
import ParamInputs from '../ParamInputs/ParamInputs';
// import ResultsGrid from '../ResultsGrid/ResultsGrid';
import ResultsView from '../ResultsView/ResultsView';
import Header from '../Header/Header';

class Main extends Component {
  componentDidMount() {
    const url = new URL(window.location.href);
    let id = url.searchParams.get('id') || '1';
    this.fetchData(id);
  }

  fetchData = async (id) => {
    const { loadScenarioView, getParams, runSim } = this.props;
    // TODO: I don't like that two https requests in serial are needed here.
    // Perhaps get params will be included in the scenario view
    await getParams();
    await loadScenarioView(id);
    await runSim();
  };

  render() {
    return (
      <>
        <Header />
        <div className="grid-container">
          <div className="paramsCabinet">
            <ParamInputs />
          </div>
          <div className="resultsDisplay">
            <ResultsView />
          </div>
        </div>
      </>
    );
  }
}

const mapDispatchToProps = {
  loadScenarioView: actions.scenarioViews.loadScenarioView,
  getParams: actions.params.getParams,
  runSim: actions.sim.runSim,
};

const mapStateToProps = (state) => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Main);
