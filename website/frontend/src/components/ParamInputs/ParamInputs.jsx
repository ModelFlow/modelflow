import React, {Component} from "react";
import { connect } from "react-redux";
import actions from "../../state/actions";
import ParamInput from "./ParamInput/ParamInput";

class ParamInputs extends Component {

  componentDidMount() {
    this.fetchData()
  }

  fetchData = async () => {
    const { getParams, runSim } = this.props;
    const params = await getParams();
    runSim(params)
  }

  paramDidUpdate = async (index, value) => {
    const { updateParam, runSim } = this.props;
    const params = await updateParam(index, value)
    runSim(params)
    // return (e, newValue) => {
    //   console.log(newValue)
    //   // console.log(e.target.value)
    //   // console.log("inside param did update")
    //   // console.log(index)
    //   // const { updateParam, runSim } = this.props;
    //   // const params = await updateParam(param)
    //   // runSim(params)
    // }
  }

  render() {
    const { params } = this.props;
    return (
      <>
        {params.map((param) => {
          if (param.max) {
            return <ParamInput key={param.index} param={param} paramDidUpdate={this.paramDidUpdate}></ParamInput>
          }
          return null;
        })}
      </>
    )
  }
}

const mapDispatchToProps = {
  updateParam: actions.params.updateParam,
  getParams: actions.params.getParams,
  runSim: actions.sim.runSim
}

const mapStateToProps = (state) => ({
  params: state.params.params
});

export default connect(mapStateToProps, mapDispatchToProps)(ParamInputs);