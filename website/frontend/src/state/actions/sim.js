import axios from 'axios';

export const runSim = () => async (dispatch, getState) => {
  const keysNeeded = [];
  Object.values(getState().resultViews.tabsContent).forEach((tab) => {
    tab.layout.lg.forEach((item) => {
      keysNeeded.push(tab.cards[item.i].outputKey);
    });
  });

  dispatch({
    type: 'SET_SIM_STATUS',
    status: 'running',
  });

  const { data } = await axios.post(
    `${process.env.REACT_APP_API_URL}/run_sim`,
    {
      params: getState().params.params,
      output_keys: keysNeeded,
    },
  );
  dispatch({
    type: 'SIM_UPDATE_RESULTS',
    results: data,
  });
};

export const requestForceUpdate = () => async (dispatch) => {
  dispatch({
    type: 'INCREMENT_FORCE_UPDATE_COUNTER',
  });
};
