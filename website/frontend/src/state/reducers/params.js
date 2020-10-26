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

    case 'PARAMS_SET_PARAM_VALUES': {
      const newArray = state.params.slice();
      const newMap = {};
      newArray.forEach((item) => {
        newMap[item.key] = item.index;
      });
      for (let [key, value] of Object.entries(action.paramValues)) {
        newArray[newMap[key]].value = value;
      }
      return {
        ...state,
        params: newArray,
      };
    }

    default:
      return state;
  }
}
