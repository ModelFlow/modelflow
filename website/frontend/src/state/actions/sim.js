import axios from 'axios';

export const runSim = (params) => async (dispatch) => {
  const {
    data
  } = await axios.post(`${process.env.REACT_APP_API_URL}/run_sim`, {
    params: params
  })
  dispatch({
    type: "SIM_UPDATE_RESULTS",
    results: data
  })
}