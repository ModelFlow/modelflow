const initialState = {
  params: [],
};

export default function reduce(state = initialState, action = {}) {
  switch (action.type) {
    case 'PARAMS_SET_PARAMS': {
      return {
        ...state,
        params: action.params,
      };
    }
    default:
      return state;
  }
};