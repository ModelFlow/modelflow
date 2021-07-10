import {
  replaceIdxWithItem,
  removeIdx,
  appendItem,
} from '../../services/Utilities';

const default_run_step_code = `def run_step(states, params, utils):
`;

const initialState = {
  // For listing model classes per project for new instance
  modelClasses: [],
  // For new model class form
  name: '',
  description: '',
  parameters: [],
  states: [],
  run_step_code: default_run_step_code,
  status: '',
  error: null,
};

const emptyItem = {
  key: '',
  label: '',
  units: '',
  is_private: false,
  value: '',
  dtype: 'float',
  source: '',
  notes: '',
};

export default function reduce(state = initialState, action = {}) {
  switch (action.type) {

    case 'SET_MODEL_CLASSES_FOR_PROJECT': {
      return {
        ...state,
        modelClasses: action.modelClasses,
      };
    }

    case 'UPDATE_DEFAULT_ATTRIBUTE_FIELD': {
      const item = { ...state[action.attrType][action.idx] };
      item[action.field] = action.value;
      return {
        ...state,
        [action.attrType]: replaceIdxWithItem(
          state[action.attrType],
          action.idx,
          item,
        ),
      };
    }

    case 'NEW_DEFAULT_ATTRIBUTE': {
      return {
        ...state,
        [action.attrType]: appendItem(state[action.attrType], emptyItem),
      };
    }
    case 'RESET_MODEL_CLASS_FORM': {
      return {
        ...state,
        name: '',
        description: '',
        parameters: [],
        states: [],
        run_step_code: default_run_step_code,
      };
    }

    case 'SET_MODEL_CLASS_FORM': {
      return {
        ...state,
        name: action.name,
        description: action.description,
        parameters: action.parameters,
        states: action.states,
        run_step_code: action.run_step_code,
        error: action.error,
      };
    }

    case 'SET_MODEL_CLASS_FORM_STATUS': {
      return {
        ...state,
        status: action.status,
        error: action.error,
      };
    }

    case 'REMOVE_DEFAULT_ATTRIBUTE': {
      return {
        ...state,
        [action.attrType]: removeIdx(state[action.attrType], emptyItem),
      };
    }

    case 'UPDATE_MODEL_CLASS_FIELD': {
      return {
        ...state,
        [action.field]: action.value,
      };
    }
    default:
      return state;
  }
}
