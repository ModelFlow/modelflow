import axios from 'axios';

export const getScenariosForProject = (projectId) => async (dispatch) => {
  const { data } = await axios.get(
    `${process.env.REACT_APP_API_URL}/rest/scenarios?project=${projectId}&format=json`,
  );
  dispatch({
    type: 'SET_SCENARIOS',
    scenarios: data,
  });
};

export const loadScenario = (scenarioId) => async (dispatch) => {
  console.log('before get');

  let response = null;
  let info = {};
  try {
    response = await axios.get(
      `${process.env.REACT_APP_API_URL}/rest/scenarios/${scenarioId}?format=json`,
    );
  } catch (error) {
    // Error 😨
    if (error.response) {
      /*
       * The request was made and the server responded with a
       * status code that falls out of the range of 2xx
       */
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
      info.error = `Encountered: ${error.response.status}`
    } else if (error.request) {
      /*
       * The request was made but no response was received, `error.request`
       * is an instance of XMLHttpRequest in the browser and an instance
       * of http.ClientRequest in Node.js
       */
      console.log(error.request);
      info.error = error.request;
    } else {
      // Something happened in setting up the request and triggered an Error
      console.log('Error', error.message);
      info.error = error.message;
    }
    console.log(error);
    return info;
  }
  const { data } = response;
  const { metadata } = data;
  // Success 🎉
  console.log(data);

  // const { data } = await axios
  //   .get(
  //     `${process.env.REACT_APP_API_URL}/rest/scenarios/${scenarioId}?format=json`,
  //   )
  //   .then((response) => {})
  //   .catch((error) => {
  //     console.log({ ...error });
  //   });
  console.log('sdfsdf');
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

  info.default_template = data.default_template;
  return info;
};

export const createScenario = (name, projectId) => async (dispatch) => {
  const { data } = await axios.post(
    `${process.env.REACT_APP_API_URL}/rest/scenarios/?format=json`,
    {
      name,
      project: projectId,
    },
  );
  console.log(data);
  // dispatch({
  //   type: 'CREATE_SCENARIO',
  //   name,
  // });
};

export const hideScenario = (scenarioId) => async (dispatch) => {
  const { data } = await axios.put(
    `${process.env.REACT_APP_API_URL}/rest/scenarios/${scenarioId}?format=json`,
    {
      is_hidden: true,
    },
  );
  console.log(data);
  // dispatch({
  //   type: 'HIDE_SCENARIO',
  //   projectId,
  // });
};

export const renameScenario = (scenarioId, name) => async (dispatch) => {
  const { data } = await axios.put(
    `${process.env.REACT_APP_API_URL}/rest/scenarios/${scenarioId}?format=json`,
    {
      name,
    },
  );
  console.log(data);

  // dispatch({
  //   type: 'RENAME_SCENARIO',
  //   projectId,
  // });
};
