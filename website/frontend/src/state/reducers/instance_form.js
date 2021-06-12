const initialState = {
  modelClassId: 0,
  modelClassLabel: 'Please Select',
  parentInstanceId: 0,
  parentInstanceLabel: 'None (root level)',
  key: '',
  label: '',
  scale: 1,
};

export default function reduce(state = initialState, action = {}) {
  switch (action.type) {
    case 'SUBMITTED_INSTANCE': {
      return initialState;
    }

    case 'SET_INSTANCE_FORM_STATUS': {
      return {
        ...state,
        status: action.status,
        error: action.error,
      };
    }

    case 'UPDATE_INSTANCE_FIELD': {
      return {
        ...state,
        [action.field]: action.value,
      };
    }
    default:
      return state;
  }
}
