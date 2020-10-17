import axios from 'axios';

// TODO
export const newScenarioView = (title) => async (dispatch, getState) => {

  const { data } = await axios.post(
    `${process.env.REACT_APP_API_URL}/update_scenario_view`,
    {
      title,
      data: {
        layout:
      }
    },
  );

  dispatch({
    type: 'SET_SCENARIO_VIEW',
    params,
  });
  return params;
};

export const saveScenarioView = () => async (dispatch, getState) => {
  const { data } = await axios.post(
    `${process.env.REACT_APP_API_URL}/update_scenario_view`,
    {
      id,
      data,
    },
  );
  // dispatch({
  //   type: 'SIM_UPDATE_RESULTS',
  //   results: data,
  // });
};


export const loadScenarioView = (id) => async (dispatch) => {
  const { data } = await axios.get(
    `${process.env.REACT_APP_API_URL}/scenario_view?id=${id}`,
  );
  // TODO: Handle error case
  const { layout, cards, params } = data;
  dispatch({
    type: 'UPDATE_LAYOUT_AND_CARDS',
    layout,
    cards,
  });

  dispatch({
    type: 'PARAMS_SET_PARAMS',
    params,
  });

};

export const getScenarioViewsList = () => async (dispatch) => {
  const { data } = await axios.get(
    `${process.env.REACT_APP_API_URL}/scenario_views`,
  );
  const { scenario_views } = data;

  dispatch({
    type: 'SET_ALL_SCENARIO_VIEWS',
    views: scenario_views,
  });
  return scenario_views;
};
