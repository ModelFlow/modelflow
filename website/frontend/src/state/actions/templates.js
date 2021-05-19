import axios from 'axios';
import { updateUrlWithTemplate } from '../../services/Utilities';

function collectTemplateData(state) {
  const { resultsView } = state;
  const { tabs, selectedTabId, tabsContent } = resultsView;
  return {
    tabs,
    selectedTabId,
    tabsContent,
  };
}

export const saveAsCurrentTemplate = (name) => async (dispatch, getState) => {
  const state = getState();
  const { data } = await axios.post(
    `${process.env.REACT_APP_API_URL}/rest/templates/?format.json`,
    {
      name,
      json_data: JSON.stringify(collectTemplateData(state)),
      project: state.projects.currentProjectMetadata.id,
    },
  );
  console.log(data);
  const { id } = data;
  updateUrlWithTemplate(id);
  dispatch({
    type: 'SET_CURRENT_TEMPLATE_METADATA',
    id,
    name: name,
  });

  dispatch({
    type: 'ADD_TEMPLATE',
    id,
    name: name,
  });
};

export const saveCurrentTemplate = () => async (dispatch, getState) => {
  // const { data } =
  const templateId = getState().templates.currentTemplateMetadata.id;
  const templateName = getState().templates.currentTemplateMetadata.name;
  const projectId = getState().templates.currentProjectMetadata.id;

  await axios.put(
    `${process.env.REACT_APP_API_URL}/rest/templates/${templateId}/?format=json`,
    {
      json_data: JSON.stringify(collectTemplateData(getState())),
      project: projectId,
      name: templateName,
    },
  );
  // TODO: use result from status here
};

export const loadTemplate = (id) => async (dispatch) => {
  if (id === '') {
    return;
  }

  const { data } = await axios.get(
    `${process.env.REACT_APP_API_URL}/rest/templates/${id}/?format=json`,
  );

  console.log(data);

  const jsonData = JSON.parse(data.json_data);
  console.log(jsonData);
  // if (data.error) {
  //   dispatch({
  //     type: 'SET_SIM_ERROR',
  //     simError: data.error,
  //   });
  //   return;
  // }

  const { tabs, tabsContent, selectedTabId } = jsonData;
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

  updateUrlWithTemplate(id);
};

export const getTemplatesForCurrentProject = () => async (dispatch) => {
  const url = new URL(window.location.href);
  let scenarioId = url.searchParams.get('scenario') || '1';
  console.log('before get templates for current project');
  const { data } = await axios.get(
    `${process.env.REACT_APP_API_URL}/api/get_templates_metadata?scenario_id=${scenarioId}`,
  );
  console.log('after get current templates');
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
