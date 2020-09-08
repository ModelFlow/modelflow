import React, {Component} from "react";
import Plotly from 'plotly.js-basic-dist'
import './Card.css'
import { Button } from "@blueprintjs/core";


import createPlotlyComponent from 'react-plotly.js/factory';
const Plot = createPlotlyComponent(Plotly);

class Card extends Component {

  size = {width: 0, height: 0}
  render() {
    const { results, cardInfo } = this.props;
    
    if (this.contentRef) {
      const { width, height } = this.contentRef.getBoundingClientRect();
      this.size.width = width;
      this.size.height = height
    }
    let plot = null;
    if (this.size.width) {
      plot = (
        <Plot
            data={[
              {
                x: results.time,
                y: results.output_states[cardInfo.type].data,
                type: 'line',
                mode: 'lines',
                marker: {color: '#137cbd'},
              },
            ]}
            layout={{width: this.size.width, height: this.size.height, margin: {t: 20, b: 55, l: 40, r: 15}}}
          />
      )
    }
    return (
      <>
        <div 
          style={{ background: 'white', height: '100%', borderRadius: 5, overflow: 'hidden',
                   borderWidth: '1px', borderColor: 'lightgray', borderStyle: 'solid'}}
          ref={(mount)=>{
            this.contentRef = mount
          }}
        >
          <div className="card_header">
            <span className="chart_title">
              {cardInfo.type}
            </span>
            <span style={{float: 'right', margin: '5px'}}>
              <Button small icon="properties"/>
            </span>
          </div>
          {plot}
        </div>
      </>
    )
  }
}

export default Card;