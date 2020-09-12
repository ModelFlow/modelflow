import axios from 'axios';

export const updateParam = (index, value) => async (dispatch, getState) => {
  const params = getState().params.params.map((item, idx) => {
    if (idx !== index) {
      // This isn't the item we care about - keep it as-is
      return item;
    }
    // Otherwise, this is the one we want - return an updated value
    return {
      ...item,
      value,
    };
  });

  dispatch({
    type: 'PARAMS_SET_PARAMS',
    params,
  });
  return params;
};

export const getParams = () => async (dispatch) => {
  const {
    data,
  } = await axios.get(`${process.env.REACT_APP_API_URL}/get_params`);
  const {
    params,
  } = data;

  dispatch({
    type: 'PARAMS_SET_PARAMS',
    params,
  });
  return params;
};