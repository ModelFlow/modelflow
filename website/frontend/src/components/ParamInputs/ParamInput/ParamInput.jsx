import React, {Component} from "react";
import Slider from '@material-ui/core/Slider';


class ParamInput extends Component {

  sliderDidUpdate = (e, newValue) => {
    const { param, paramDidUpdate } = this.props;
    paramDidUpdate(param.index, newValue)
  }
  render() {
    const { param } = this.props;
    return (
      <>
        {param.index} {param.agent} {param.key} {param.value}
        <Slider
          onChange={this.sliderDidUpdate}
          value={param.value}
          min={param.min}
          max={param.max} 
        />

        <br/>
      </>
    )
  }
}

export default ParamInput;