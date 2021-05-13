const initialState = {
  projects: [],
  currentProjectMetadata: {
    name: 'No Project Set',
    id: 0,
  },
};

export default function reduce(state = initialState, action = {}) {
  switch (action.type) {
    case 'SET_PROJECTS': {
      return {
        ...state,
        projects: action.projects,
      };
    }
    case 'SET_CURRENT_PROJECT_METADATA': {
      return {
        ...state,
        currentProjectMetadata: {
          name: action.currentProjectMetadata.name,
          id: action.currentProjectMetadata.id,
        },
      };
    }
    default:
      return state;
  }
}
