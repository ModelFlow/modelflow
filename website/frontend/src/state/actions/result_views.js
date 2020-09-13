export const updateLayout = (layout) => async (dispatch) => {
  dispatch({
    type: 'UPDATE_RESULT_VIEW_LAYOUT',
    layout,
  });
};

export const addCard = () => async (dispatch) => {
  function make_uuid() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  const card = {
    uuid: make_uuid(),
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
