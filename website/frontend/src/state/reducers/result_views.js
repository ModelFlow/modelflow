const initialState = {
  cards: {
    initial1: {
      outputKey: 'state_enrg_kwh',
    },
    initial2: {
      outputKey: 'state_dc_kwh',
    },
  },
  layout: {
    lg: [
      {
        i: 'initial1',
        x: 0,
        y: 0,
        w: 6,
        h: 8,
      },
      {
        i: 'initial2',
        x: 6,
        y: 0,
        w: 6,
        h: 6,
      },
    ],
  },
};

function insertItem(array, item) {
  const newArray = array.slice();
  newArray.splice(0, 0, item);
  return newArray;
}

function removeItem(array, idx) {
  const newArray = array.slice();
  newArray.splice(idx, 1);
  return newArray;
}

export default function reduce(state = initialState, action = {}) {
  switch (action.type) {

    case 'UPDATE_LAYOUT_AND_CARDS': {
      return {
        ...state,
        layout: { lg: action.layout },
        cards: action.cards,
      };
    }

    case 'UPDATE_RESULT_VIEW_LAYOUT': {
      return {
        ...state,
        layout: { lg: action.layout },
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
