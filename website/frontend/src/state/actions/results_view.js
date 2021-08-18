import { makeUUID } from '../../services/Utilities';

export const updateLayout = (newLayout) => async (dispatch) => {
  dispatch({
    type: 'UPDATE_RESULT_VIEW_LAYOUT',
    layout: {
      lg: newLayout,
    },
  });
};

export const addCard = (cardType) => async (dispatch) => {
  console.log('🃏 AddCard detected in actions/results_view.js, type: ' + cardType)
  const card = {
    uuid: makeUUID(),
    outputKey: 'none',
    cardType,
  };
  dispatch({
    type: 'ADD_CARD',
    card,
  });
};

export const setSelectedUUID = (selectedUUID) => async (dispatch) => {
  dispatch({
    type: 'SET_SELECTED_UUID',
    selectedUUID,
  });
};

export const setXrange = (xrange) => async (dispatch) => {
  dispatch({
    type: 'SET_XRANGE',
    xrange,
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
    name: '',
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

export const editTabTitle = (id, name) => async (dispatch) => {
  dispatch({
    type: 'EDIT_TAB_NAME',
    id,
    name,
  });
};
