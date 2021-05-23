const initialState = {
  scenarios: [],
  currentScenarioMetadata: {
    name: 'No Scenario Set',
    id: 0,
  },
  currentScenarioDefaultTemplateId: 0,
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
    case 'SET_CURRENT_SCENARIO_DEFAULT_TEMPLATE_ID': {
      return {
        ...state,
        currentScenarioDefaultTemplateId:
          action.currentScenarioDefaultTemplateId,
      };
    }
    case 'SET_CURRENT_SCENARIO_AND_METADATA': {
      return {
        ...state,
        currentScenario: action.currentScenario,
        currentScenarioMetadata: {
          id: action.currentScenario.id,
          name: action.currentScenario.name,
        },
      };
    }

    default:
      return state;
  }
}
