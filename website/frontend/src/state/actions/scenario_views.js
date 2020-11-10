import axios from 'axios';
import { updateUrlWithId } from '../../services/Utilities';

function getScenarioData(state) {
  const { params, resultViews } = state;
  const { tabs, selectedTabId, tabsContent } = resultViews;
  const paramValues = {};
  params.params.forEach((param) => {
    paramValues[param.key] = param.value;
  });
  return {
    paramValues,
    tabs,
    selectedTabId,
    tabsContent,
  };
}

export const newScenarioView = (title) => async (dispatch, getState) => {
  const { data } = await axios.post(
    `${process.env.REACT_APP_API_URL}/new_scenario_view`,
    {
      title,
      data: getScenarioData(getState()),
    },
  );

  const { id } = data;
  updateUrlWithId(id);
  dispatch({
    type: 'SCENARIO_VIEW_SET_META',
    id,
    title,
  });

  dispatch({
    type: 'ADD_TO_SCENARIO_VIEW_METAS',
    id,
    title,
  });
};

export const saveScenarioView = () => async (dispatch, getState) => {
  const { data } = await axios.post(
    `${process.env.REACT_APP_API_URL}/update_scenario_view`,
    {
      id: getState().scenarioViews.scenarioViewMeta.id,
      data: getScenarioData(getState()),
    },
  );
  // TODO: use result from status here
};

export const loadScenarioView = (id) => async (dispatch) => {
  const { data } = await axios.get(
    `${process.env.REACT_APP_API_URL}/scenario_view?id=${id}`,
  );
  if (data.error) {
    dispatch({
      type: 'SET_SIM_ERROR',
      simError: data.error,
    });
    return;
  }

  const { paramValues, tabs, tabsContent, selectedTabId } = data.data;
  dispatch({
    type: 'UPDATE_TABS',
    tabs,
    tabsContent,
    selectedTabId,
  });

  dispatch({
    type: 'PARAMS_SET_PARAM_VALUES',
    paramValues,
  });

  dispatch({
    type: 'SCENARIO_VIEW_SET_META',
    id: data.id,
    title: data.title,
  });

  updateUrlWithId(id);
};

export const getScenarioViewsList = () => async (dispatch) => {
  const { data } = await axios.get(
    `${process.env.REACT_APP_API_URL}/scenario_views`,
  );
  const { scenario_views } = data;

  dispatch({
    type: 'SET_ALL_SCENARIO_VIEWS',
    scenarioViews: scenario_views,
  });
};
