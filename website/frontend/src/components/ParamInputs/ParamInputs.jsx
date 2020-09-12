import React, { Component } from 'react';
import { connect } from 'react-redux';
import actions from '../../state/actions';
import ParamInput from './ParamInput/ParamInput';

class ParamInputs extends Component {
  componentDidMount() {
    this.fetchData();
  }

  fetchData = async () => {
    const { getParams, runSim } = this.props;
    const params = await getParams();
    runSim(params);
  };

  paramDidUpdate = async (index, value) => {
    const { updateParam } = this.props;
    updateParam(index, value);
  };

  paramDidRelease = async (index, value) => {
    const { updateParam, runSim } = this.props;
    const params = await updateParam(index, value);
    runSim(params);
  };

  render() {
    const { params } = this.props;
    return (
      <>
        {params.map((param) => {
          if (param.max) {
            return (
              <ParamInput
                key={param.index}
                param={param}
                paramDidUpdate={this.paramDidUpdate}
                paramDidRelease={this.paramDidRelease}
              />
            );
          }
          return null;
        })}
      </>
    );
  }
}

const mapDispatchToProps = {
  updateParam: actions.params.updateParam,
  getParams: actions.params.getParams,
  runSim: actions.sim.runSim,
};

const mapStateToProps = (state) => ({
  params: state.params.params,
});

export default connect(mapStateToProps, mapDispatchToProps)(ParamInputs);
