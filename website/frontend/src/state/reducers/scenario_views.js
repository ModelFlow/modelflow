const initialState = {
  allScenarioViews: [],
  scenarioView: {
    cards: [],
    layout: {},
    parameters: [],
  },
};

export default function reduce(state = initialState, action = {}) {
  switch (action.type) {
    case 'SET_ALL_SCENARIO_VIEWS': {
      return {
        ...state,
        allScenarioViews: action.views,
      };
    }
    case 'SET_SCENARIO_VIEW': {
      return {
        ...state,
        scenarioView: action.data,
      };
    }

    default:
      return state;
  }
}
