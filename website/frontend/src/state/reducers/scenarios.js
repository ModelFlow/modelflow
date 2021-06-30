import { insertItem } from '../../services/Utilities';

const initialState = {
  scenarios: [],
  currentScenarioMetadata: {
    name: '',
    id: 0,
  },
  currentScenarioDefaultTemplateId: 0,
  currentScenario: {
    max_steps: '',
  },
};

export default function reduce(state = initialState, action = {}) {
  switch (action.type) {
    case 'SET_SCENARIOS': {
      return {
        ...state,
        scenarios: action.scenarios,
      };
    }

    case 'ADD_SCENARIO': {
      return {
        ...state,
        scenarios: insertItem(state.scenarios, {
          id: action.id,
          name: action.name,
          // created_at: '',  // TODO
        }),
      };
    }

    case 'SET_CURRENT_SCENARIO_METADATA': {
      return {
        ...state,
        currentScenarioMetadata: action.currentScenarioMetadata,
      };
    }

    case 'SET_SCENARIO_MAX_STEPS': {
      return {
        ...state,
        currentScenario: {
          ...state.currentScenario,
          max_steps: action.maxSteps,
        },
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
