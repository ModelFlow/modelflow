import { apiPOST } from '../../services/Utilities';

export const setSimError = (error) => async (dispatch, getState) => {
  dispatch({
    type: 'SET_SIM_ERROR',
    error,
  });
};

export const runSim = () => async (dispatch, getState) => {
  const keysNeeded = [];
  Object.values(getState().resultsView.tabsContent).forEach((tab) => {
    tab.layout.lg.forEach((item) => {
      keysNeeded.push(tab.cards[item.i].outputKey);
    });
  });

  dispatch({
    type: 'SET_SIM_STATUS',
    status: 'running',
  });
  const currentScenario = getState().scenarios.currentScenario;
  console.log("pre sim:")
  console.log(currentScenario)
  const data = await apiPOST(`/api/run_sim`, {
    scenario: currentScenario,
    output_keys: keysNeeded,
  });
  // console.log(data)
  dispatch({
    type: 'SIM_UPDATE_RESULTS',
    results: data,
  });
};

// NOTE: No idea what this does anymore
export const requestForceUpdate = () => async (dispatch) => {
  dispatch({
    type: 'INCREMENT_FORCE_UPDATE_COUNTER',
  });
};
