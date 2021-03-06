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

export const addTab = () => async (dispatch) => {
  const tab = {
    id: makeUUID(),
    title: '',
  };
  dispatch({
    type: 'ADD_TAB',
    tab,
  });
};

export const removeTab = (id) => async (dispatch) => {
  dispatch({
    type: 'REMOVE_TAB',
    id,
  });
};

export const switchTab = (selectedTabId) => async (dispatch) => {
  dispatch({
    type: 'SWITCH_TAB',
    selectedTabId,
  });
};

export const editTabTitle = (id, title) => async (dispatch) => {
  dispatch({
    type: 'EDIT_TAB_TITLE',
    id,
    title,
  });
};
