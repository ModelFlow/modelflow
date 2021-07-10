import { apiGET, apiPOST } from '../../services/Utilities';

export const updateInstanceField = (field, value) => async (dispatch) => {
  dispatch({
    type: 'UPDATE_INSTANCE_FIELD',
    field,
    value,
  });
};

export const submitInstance = () => async (dispatch, getState) => {
  // NOTE: We probably don't want to call this until the user clicks save
  // it is probably fine for now.
  const { instanceForm, scenarios } = getState();
  instanceForm['scenarioId'] = scenarios.currentScenarioMetadata.id;

  dispatch({
    type: 'SET_INSTANCE_FORM_STATUS',
    status: 'running',
  });

  const data = await apiPOST(`/api/new_model_instance`, instanceForm);
  if (data.error) {
    dispatch({
      type: 'SET_INSTANCE_FORM_STATUS',
      status: 'error',
      error: data.error,
    });
  } else {
    dispatch({
      type: 'SET_INSTANCE_FORM_STATUS',
      status: 'success',
    });
    dispatch({
      type: 'SUBMITTED_INSTANCE',
    });
  }
  console.log('inside returning stuff');
  console.log(data);
  return data;
};

// TODO: Have a function that seeds existing class
