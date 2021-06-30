const initialState = {
  modelClassDialogIsOpen: false,
};

export default function reduce(state = initialState, action = {}) {
  switch (action.type) {
    case 'SET_MODEL_CLASS_DIALOG_IS_OPEN': {
      return {
        ...state,
        modelClassDialogIsOpen: action.modelClassDialogIsOpen,
      };
    }
    default:
      return state;
  }
}
