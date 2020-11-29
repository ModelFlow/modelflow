const initialState = {
  mainViewType: 'model',
};

export default function reduce(state = initialState, action = {}) {
  switch (action.type) {
    case 'UPDATE_MAIN_VIEW_TYPE': {
      return {
        ...state,
        mainViewType: action.mainViewType,
      };
    }
    default:
      return state;
  }
}
