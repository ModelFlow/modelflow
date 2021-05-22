import axios from 'axios';

export const getProjects = () => async (dispatch) => {
  const { data } = await axios.get(
    `${process.env.REACT_APP_API_URL}/rest/projects/?format=json`,
  );
  dispatch({
    type: 'SET_PROJECTS',
    projects: data,
  });
};

export const getCurrentProjectMetadata = (projectId) => async (dispatch) => {
  const { data } = await axios.get(
    `${process.env.REACT_APP_API_URL}/rest/projects/${projectId}?format=json`,
  );
  console.log(data);
  dispatch({
    type: 'SET_CURRENT_PROJECT_METADATA',
    currentProjectMetadata: data,
  });
};

// TODO
export const createProject = (name) => async (dispatch) => {
  const { data } = await axios.post(
    `${process.env.REACT_APP_API_URL}/rest/projects/?format=json`,
  );
  dispatch({
    type: 'SET_PROJECT',
    project: data,
  });
};

// TODO
export const renameProject = (projectId, name) => async (dispatch) => {
  const { data } = await axios.put(
    `${process.env.REACT_APP_API_URL}/rest/projects/${projectId}?format=json`,
  );
  dispatch({
    type: 'SET_PROJECT',
    project: data,
  });
};

// TODO
export const hideProject = (projectId) => async (dispatch) => {
  const { data } = await axios.get(
    `${process.env.REACT_APP_API_URL}/rest/projects/${projectId}?format=json`,
  );
  console.log(data);
  dispatch({
    type: 'HIDE_PROJECT',
    projectId,
  });
};
