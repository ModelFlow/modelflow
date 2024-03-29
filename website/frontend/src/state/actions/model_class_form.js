import { apiGET, apiPOST } from '../../services/Utilities';

export const setupExistingModelClass = (key) => async (dispatch, getState) => {
  const modelInstances = getState().scenarios.currentScenario.model_instances;
  console.log('------');
  console.log(modelInstances);
  console.log(key);
  const modelClassMap = {};
  modelInstances.forEach((modelInstance) => {
    modelClassMap[modelInstance.model_class.key] = modelInstance.model_class;
  });
  const modelClass = modelClassMap[key];
  const parameters = [];
  const states = [];
  // TODO: handle attribute overrides
  modelClass.default_attributes.forEach((default_attr) => {
    if (default_attr.kind === 'state') {
      states.push(default_attr);
    } else {
      parameters.push(default_attr);
    }
  });
  dispatch({
    type: 'SET_MODEL_CLASS_FORM',
    name: modelClass.key,
    description: modelClass.description,
    parameters: parameters,
    states: states,
    run_step_code: modelClass.run_step_code,
    status: '',
    error: null,
  });
};

export const updateModelClassField = (field, value) => async (dispatch) => {
  dispatch({
    type: 'UPDATE_MODEL_CLASS_FIELD',
    field,
    value,
  });
};

export const newDefaultAttribute = (attrType) => async (dispatch) => {
  dispatch({
    type: 'NEW_DEFAULT_ATTRIBUTE',
    attrType,
  });
};

export const removeDefaultAttribute = (attrType, idx) => async (dispatch) => {
  dispatch({
    type: 'REMOVE_DEFAULT_ATTRIBUTE',
    attrType,
    idx,
  });
};

export const updateDefaultAttributeField = (
  attrType,
  idx,
  field,
  value,
) => async (dispatch) => {
  dispatch({
    type: 'UPDATE_DEFAULT_ATTRIBUTE_FIELD',
    attrType,
    idx,
    field,
    value,
  });
};

export const getModelClassesForCurrentProject = () => async (
  dispatch,
  getState,
) => {
  const projectId = getState().projects.currentProjectMetadata.id;
  const data = await apiGET(
    `/rest/model_classes/?format=json&project=${projectId}`,
  );
  dispatch({
    type: 'SET_MODEL_CLASSES_FOR_PROJECT',
    modelClasses: data,
  });
  return data;
};

export const submitModelClass = () => async (dispatch, getState) => {
  const { modelClassForm, projects } = getState();
  modelClassForm['project'] = projects.currentProjectMetadata.id;

  dispatch({
    type: 'SET_MODEL_CLASS_FORM_STATUS',
    status: 'running',
  });

  const data = await apiPOST(
    `/api/create_or_update_model_class`,
    modelClassForm,
  );
  if (data.error) {
    dispatch({
      type: 'SET_MODEL_CLASS_FORM_STATUS',
      status: 'error',
      error: data.error,
    });
  } else {
    dispatch({
      type: 'SET_MODEL_CLASS_FORM_STATUS',
      status: 'success',
    });
    dispatch({
      type: 'RESET_MODEL_CLASS_FORM',
    });
  }

  return data;
};

export const resetModelClassForm = () => async (dispatch) => {
  dispatch({
    type: 'RESET_MODEL_CLASS_FORM',
  });
};

// TODO: Have a function that seeds existing class
