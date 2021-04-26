import axios from 'axios';
import { updateUrlWithId } from '../../services/Utilities';

function collectTemplateData(state) {
  const { params, resultsView } = state;
  const { tabs, selectedTabId, tabsContent } = resultsView;
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

export const newBlankTemplate = (name) => async (dispatch, getState) => {
  const { data } = await axios.post(
    `${process.env.REACT_APP_API_URL}/rest/templates/?format.json`,
    {
      name,
      data: collectTemplateData(getState()),
    },
  );

  const { id } = data;
  updateUrlWithId(id);
  dispatch({
    type: 'TEMPLATE_SET_META',
    id,
    name: name,
  });

  dispatch({
    type: 'ADD_TO_SCENARIO_VIEW_METAS',
    id,
    name: name,
  });
};

export const saveCurrentTemplate = () => async (dispatch, getState) => {
  // const { data } =
  await axios.put(`${process.env.REACT_APP_API_URL}/templates`, {
    id: getState().scenarioViews.scenarioViewMeta.id,
    data: collectTemplateData(getState()),
  });
  // TODO: use result from status here
};

// TODO
export const duplicateCurrentTemplate = () => async (dispatch, getState) => {
  // const { data } =
  await axios.put(`${process.env.REACT_APP_API_URL}/templates`, {
    id: getState().scenarioViews.scenarioViewMeta.id,
    data: collectTemplateData(getState()),
  });
  // TODO: use result from status here
};

export const loadTemplate = (id) => async (dispatch) => {
  if (id === '') {
    return;
  }

  const { data } = await axios.get(
    `${process.env.REACT_APP_API_URL}/rest/templates/${id}/?format=json`,
  );

  const jsonData = JSON.parse(data.json_data);
  console.log(jsonData);
  // if (data.error) {
  //   dispatch({
  //     type: 'SET_SIM_ERROR',
  //     simError: data.error,
  //   });
  //   return;
  // }

  const { tabs, tabsContent, selectedTabId } = data.data;
  dispatch({
    type: 'UPDATE_TABS',
    tabs,
    tabsContent,
    selectedTabId,
  });

  // dispatch({
  //   type: 'PARAMS_SET_PARAM_VALUES',
  //   paramValues,
  // });

  dispatch({
    type: 'SET_CURRENT_TEMPLATE_METADATA',
    id: data.id,
    name: data.name,
  });

  updateUrlWithId(id);
};

export const getTemplatesForCurrentProject = () => async (dispatch) => {
  const url = new URL(window.location.href);
  let scenarioId = url.searchParams.get('scenario') || '1';
  console.log("before get templates for current project")
  const { data } = await axios.get(
    `${process.env.REACT_APP_API_URL}/api/get_templates_metadata?scenario_id=${scenarioId}`,
  );
  console.log("after get current templates")
  console.log(data);
  const { templates } = data;
  if (data.error) {
    console.log(data.error);
    return data.error;
  } else {
    dispatch({
      type: 'SET_ALL_TEMPLATES',
      templates,
    });
  }
};
