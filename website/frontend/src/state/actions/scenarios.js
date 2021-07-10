import { len } from 'plotly.js-basic-dist';
import {
  apiGET,
  apiPATCH,
  apiPOST,
  updateUrlParam,
} from '../../services/Utilities';

export const getScenariosForProject = (projectId) => async (dispatch) => {
  const data = await apiGET(`/rest/scenarios?project=${projectId}&format=json`);
  // if (data.error) return error;

  dispatch({
    type: 'SET_SCENARIOS',
    scenarios: data,
  });
};

export const loadScenario = (scenarioId) => async (dispatch) => {
  const data = await apiGET(`/rest/scenarios/${scenarioId}?format=json`);
  if (data.error) {
    if (data.error === 'Encountered: 404') {
      data.error = `Scenario with id ${scenarioId} not found!`;
    }
    return data;
  }

  console.log('Loaded scenario:');
  console.log(data);
  dispatch({
    type: 'SET_CURRENT_SCENARIO_AND_METADATA',
    currentScenario: data,
  });

  dispatch({
    type: 'SET_CURRENT_SCENARIO_DEFAULT_TEMPLATE_ID',
    currentScenarioDefaultTemplateId: data.default_template,
  });

  dispatch({
    type: 'SET_CURRENT_PROJECT_METADATA',
    currentProjectMetadata: {
      name: data.project_meta.name,
      id: data.project_meta.id,
    },
  });

  // data.default_template = data.default_template;
  // return info;
  return data;
};

export const createScenario = (name, projectId) => async (dispatch) => {
  const DEFAULT_MAX_STEPS = 100;
  const data = await apiPOST(`/rest/scenarios/?format=json`, {
    name,
    project: projectId,
    max_steps: DEFAULT_MAX_STEPS,
  });
  // if (data.error) return error;

  console.log(data);
  // dispatch({
  //   type: 'CREATE_SCENARIO',
  //   name,
  // });
  return data.id;
};

export const hideScenario = (scenarioId) => async (dispatch) => {
  const data = await apiPATCH(`/rest/scenarios/${scenarioId}/?format=json`, {
    is_hidden: true,
  });
  console.log(data);
  // dispatch({
  //   type: 'HIDE_SCENARIO',
  //   projectId,
  // });
};

export const renameScenario = (scenarioId, name) => async (dispatch) => {
  const data = await apiPATCH(`/rest/scenarios/${scenarioId}/?format=json`, {
    name,
  });

  // dispatch({
  //   type: 'RENAME_SCENARIO',
  //   projectId,
  // });
};

export const setCurrentTemplateAsDefaultForCurrentScenario = () => async (
  dispatch,
  getState,
) => {
  const templateId = getState().templates.currentTemplateMetadata.id;
  const scenarioId = getState().scenarios.currentScenarioMetadata.id;

  console.log(`Template Id: ${templateId} Scenario Id: ${scenarioId}`);

  const data = await apiPATCH(`/rest/scenarios/${scenarioId}/?format=json`, {
    default_template: templateId,
  });
  // TODO: handle data.error better

  // TODO: store new default template in reducer
};

export const setCurrentScenarioMaxSteps = (maxSteps) => async (
  dispatch,
  getState,
) => {
  const scenarioId = getState().scenarios.currentScenarioMetadata.id;

  console.log(`Scenario Id: ${scenarioId} Max steps: ${maxSteps}`);

  dispatch({
    type: 'SET_SCENARIO_MAX_STEPS',
    maxSteps,
  });

  // if (maxSteps) {
  //   const data = await apiPATCH(`/rest/scenarios/${scenarioId}/?format=json`, {
  //     max_steps: parseInt(maxSteps),
  //   });
  //   // TODO: handle data.error better

  //   // TODO: store new default template in reducer
  // }
};

export const saveAsCurrentScenario = (name) => async (dispatch, getState) => {
  const state = getState();
  const dataRequest = {
    name,
    current_scenario: state.scenarios.currentScenario,

    // We don't need project id as we can get it once we load the old scenario id
    // project_id: state.projects.currentProjectMetadata.id,
    scenario_id: state.scenarios.currentScenarioMetadata.id,
  };
  console.log(dataRequest);
  const data = await apiPOST('/api/save_as_scenario', dataRequest);

  console.log(data);
  const { id } = data;

  updateUrlParam('scenario', id);

  dispatch({
    type: 'SET_CURRENT_SCENARIO_METADATA',
    currentScenarioMetadata: {
      id,
      name: name,
    },
  });

  dispatch({
    type: 'ADD_SCENARIO',
    id,
    name: name,
  });
};

export const saveCurrentScenario = () => async (dispatch, getState) => {
  // const { data } =
  const scenarioId = getState().scenarios.currentScenarioMetadata.id;

  // TODO: Also save instances etc.
  const data = await apiPATCH(`/rest/scenarios/${scenarioId}/?format=json`, {
    max_steps: parseInt(getState().scenarios.currentScenario.max_steps),
  });

  // TODO: use result from status here
};

export const getScenariosForCurrentProject = () => async (
  dispatch,
  getState,
) => {
  const projectId = getState().projects.currentProjectMetadata.id;
  const data = await apiGET(`/rest/scenarios?project=${projectId}&format=json`);
  // if (data.error) return error;

  dispatch({
    type: 'SET_SCENARIOS',
    scenarios: data,
  });
};
