import axios from 'axios';

export const runSim = () => async (dispatch, getState) => {
  const { data } = await axios.post(
    `${process.env.REACT_APP_API_URL}/run_sim`,
    {
      params: getState().params.params,
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
