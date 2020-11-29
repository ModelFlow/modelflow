export const switchMainViewType = () => async (dispatch, getState) => {
  const { mainViewType } = getState().common;
  dispatch({
    type: 'UPDATE_MAIN_VIEW_TYPE',
    mainViewType: mainViewType === 'flow' ? 'results' : 'flow',
  });
};
