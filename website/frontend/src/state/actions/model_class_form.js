import { apiGET, apiPOST } from '../../services/Utilities';

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

export const getModelClassesForCurrentProject = () => async (dispatch, getState) => {
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

  const data = await apiPOST(`/api/new_model_class`, modelClassForm);
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
      type: 'SUBMITTED_MODEL_CLASS',
    });
  }
  console.log('inside returning stuff');
  console.log(data);
  return data;
};

// TODO: Have a function that seeds existing class
