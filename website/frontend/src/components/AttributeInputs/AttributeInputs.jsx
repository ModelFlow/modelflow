import React, { Component } from 'react';
import { connect } from 'react-redux';
import actions from '../../state/actions';
import AttributeInput from './AttributeInput/AttributeInput';

class AttributeInputs extends Component {
  paramDidUpdate = async (index, value) => {
    const { updateParam } = this.props;
    updateParam(index, value);
  };

  paramDidRelease = async (index, value) => {
    const { updateParam, runSim } = this.props;
    // const params = await
    updateParam(index, value);
    runSim(); // params
  };

  render() {
    const { params } = this.props;
    return (
      <>
        {params.map((param) => {
          // if (param.max) {
          return (
            <AttributeInput
              key={param.index}
              param={param}
              paramDidUpdate={this.paramDidUpdate}
              paramDidRelease={this.paramDidRelease}
            />
          );
          // }
          // return null;
        })}
      </>
    );
  }
}

const mapDispatchToProps = {
  updateParam: actions.attributesInput.updateParam,
  getParams: actions.attributesInput.getParams,
  runSim: actions.sim.runSim,
};

const mapStateToProps = (state) => ({
  params: state.attributesInput.params,
});

export default connect(mapStateToProps, mapDispatchToProps)(AttributeInputs);
