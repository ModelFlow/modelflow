const initialState = {
  results: {},
};

export default function reduce(state = initialState, action = {}) {
  switch (action.type) {
    case 'SIM_UPDATE_RESULTS': {
      return {
        ...state,
        results: action.results,
      };
    }
    default:
      return state;
  }
}
