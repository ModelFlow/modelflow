import { makeUUID } from '../../services/Utilities';

export const updateLayout = (newLayout) => async (dispatch) => {
  dispatch({
    type: 'UPDATE_RESULT_VIEW_LAYOUT',
    layout: {
      lg: newLayout,
    },
  });
};

export const addCard = () => async (dispatch) => {
  const card = {
    uuid: makeUUID(),
    outputKey: 'none',
  };
  dispatch({
    type: 'ADD_CARD',
    card,
  });
};

export const removeCard = (uuid) => async (dispatch) => {
  dispatch({
    type: 'REMOVE_CARD',
    uuid,
  });
};

export const updateCardOutputKey = (uuid, outputKey) => async (dispatch) => {
  dispatch({
    type: 'UPDATE_CARD_OUTPUT_KEY',
    uuid,
    outputKey,
  });
};
