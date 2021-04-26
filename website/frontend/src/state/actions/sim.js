import axios from 'axios';

export const setSimError = (error) => async (dispatch, getState) => {
  dispatch({
    type: 'SET_SIM_ERROR',
    error,
  });
};

export const runSim = () => async (dispatch, getState) => {
  console.log(getState());
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

  const { data } = await axios.post(
    `${process.env.REACT_APP_API_URL}/api/run_sim`,
    {
      scenario: getState().scenarios.currentScenario,
      output_keys: keysNeeded,
    },
  );
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
