import { insertItem, removeIdx } from '../../services/Utilities';

const initialState = {
  templates: [],
  currentTemplateMetadata: {
    id: 0,
    name: '',
  },
};

export default function reduce(state = initialState, action = {}) {
  switch (action.type) {
    case 'SET_ALL_TEMPLATES': {
      return {
        ...state,
        templates: action.templates,
      };
    }
    case 'SET_CURRENT_TEMPLATE_METADATA': {
      return {
        ...state,
        currentTemplateMetadata: {
          id: action.id,
          name: action.name,
        },
      };
    }
    case 'ADD_TEMPLATE': {
      return {
        ...state,
        templates: insertItem(state.templates, {
          id: action.id,
          name: action.name,
          // created_at: '',  // TODO
        }),
      };
    }
    case 'REMOVE_TEMPLATE': {
      const toDeleteIdx = state.templates.findIndex((x) => x.id === action.id);
      return {
        ...state,
        templates: removeIdx(state.templates, toDeleteIdx),
      };
    }
    default:
      return state;
  }
}
