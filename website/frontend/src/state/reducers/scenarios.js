const initialState = {
  scenarios: [],
  currentScenarioMetadata: {
    name: '',
    id: 0,
  },
  currentScenario: {},
};

export default function reduce(state = initialState, action = {}) {
  switch (action.type) {
    case 'SET_SCENARIOS': {
      return {
        ...state,
        scenarios: action.scenarios,
      };
    }
    case 'SET_CURRENT_SCENARIO_METADATA': {
      return {
        ...state,
        currentScenarioMetadata: action.currentScenarioMetadata,
      };
    }
    case 'SET_CURRENT_SCENARIO': {
      return {
        ...state,
        currentScenario: action.currentScenario,
      };
    }

    default:
      return state;
  }
}
