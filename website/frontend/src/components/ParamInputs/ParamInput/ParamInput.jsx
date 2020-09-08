import React, {Component} from "react";
import { Slider } from "@blueprintjs/core";

// https://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript
function toTitleCase(str) {
  return str.replace(
      /\w\S*/g,
      function(txt) {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
  );
}

// https://dmitripavlutin.com/replace-all-string-occurrences-javascript/
function replaceAll(string, search, replace) {
  return string.split(search).join(replace);
}

class ParamInput extends Component {

  sliderDidUpdate = (newValue) => {
    const { param, paramDidUpdate } = this.props;
    paramDidUpdate(param.index, newValue)
  }
  render() {
    const { param } = this.props;
    return (
      <>
        {param.agent} {toTitleCase(replaceAll(param.key,'_', ' '))} {param.value}
        <Slider
          onChange={this.sliderDidUpdate}
          value={param.value}
          min={param.min}
          max={param.max}
          labelRenderer={false}
        />
        <br/>
      </>
    )
  }
}

export default ParamInput;