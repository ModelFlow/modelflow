import { insertItem } from '../../services/Utilities';

const initialState = {
  scenarioViews: [],
  scenarioViewMeta: {
    created_at: '',
    id: 0,
    title: '',
  },
};

export default function reduce(state = initialState, action = {}) {
  switch (action.type) {
    case 'SET_ALL_SCENARIO_VIEWS': {
      return {
        ...state,
        scenarioViews: action.scenarioViews,
      };
    }
    case 'ADD_TO_SCENARIO_VIEW_METAS': {
      return {
        ...state,
        scenarioViews: insertItem(state.scenarioViews, {
          id: action.id,
          title: action.title,
          created_at: '',
        }),
      };
    }
    case 'SCENARIO_VIEW_SET_META': {
      return {
        ...state,
        scenarioViewMeta: {
          id: action.id,
          title: action.title,
        },
      };
    }

    default:
      return state;
  }
}
