import { insertItem, removeItem } from '../../services/Utilities';

const initialState = {
  cards: {},
  layout: {
    lg: [],
  },
};

export default function reduce(state = initialState, action = {}) {
  switch (action.type) {
    case 'SET_SIM_ERROR': {
      return {
        ...state,
        simError: action.simError,
      };
    }
    case 'UPDATE_LAYOUT_AND_CARDS': {
      return {
        ...state,
        layout: action.layout,
        cards: action.cards,
        simError: null,
      };
    }

    case 'UPDATE_RESULT_VIEW_LAYOUT': {
      return {
        ...state,
        layout: action.layout,
      };
    }
    case 'ADD_CARD': {
      return {
        ...state,
        cards: {
          ...state.cards,
          [action.card.uuid]: action.card,
        },
        layout: {
          lg: insertItem(state.layout.lg, {
            i: action.card.uuid,
            x: 0,
            y: 0,
            w: 6,
            h: 6,
          }),
        },
      };
    }
    case 'REMOVE_CARD': {
      const { uuid } = action;
      const { cards, layout } = state;
      const { [uuid]: value, ...newCards } = cards;
      const toDeleteIdx = layout.lg.findIndex((x) => x.i === uuid);
      return {
        ...state,
        cards: newCards,
        layout: {
          lg: removeItem(layout.lg, toDeleteIdx),
        },
      };
    }
    case 'UPDATE_CARD_OUTPUT_KEY': {
      return {
        ...state,
        cards: {
          ...state.cards,
          [action.uuid]: {
            outputKey: action.outputKey,
          },
        },
      };
    }
    default:
      return state;
  }
}
