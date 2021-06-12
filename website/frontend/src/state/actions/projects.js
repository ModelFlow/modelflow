import { apiGET, apiPATCH, apiPOST } from '../../services/Utilities';

export const getProjects = () => async (dispatch) => {
  const data = await apiGET(`/rest/projects/?format=json`);
  if (!data.error) {
    dispatch({
      type: 'SET_PROJECTS',
      projects: data,
    });
  }
  return data;
};

export const getCurrentProjectMetadata = (projectId) => async (dispatch) => {
  const data = await apiGET(`/rest/projects/${projectId}?format=json`);
  dispatch({
    type: 'SET_CURRENT_PROJECT_METADATA',
    currentProjectMetadata: data,
  });
};

export const createProject = (name) => async (dispatch) => {
  const data = await apiPOST(`/rest/projects/?format=json`, {
    name,
  });
  dispatch({
    type: 'SET_PROJECT',
    project: data,
  });
};

// TODO
export const renameProject = (projectId, name) => async (dispatch) => {
  const { data } = await apiPATCH(
    `/rest/projects/${projectId}?format=json`,
  );
  dispatch({
    type: 'SET_PROJECT',
    project: data,
  });
};

// TODO
export const hideProject = (projectId) => async (dispatch) => {
  const { data } = await apiPATCH(
    `/rest/projects/${projectId}?format=json`,
  );
  console.log(data);
  dispatch({
    type: 'HIDE_PROJECT',
    projectId,
  });
};
