import React, {Component} from "react";
import Plotly from 'plotly.js-basic-dist'
import './Card.css'
import { Button, MenuItem } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";



import createPlotlyComponent from 'react-plotly.js/factory';
const Plot = createPlotlyComponent(Plotly);

// import { ItemRenderer, ItemPredicate, Select } from "@blueprintjs/select";
 
// const FilmSelect = Select.ofType<Film>();
 
const filterItem = (query, item) => {
    return item.toLowerCase().indexOf(query.toLowerCase()) >= 0;
};
 
const renderItem = (item, { handleClick, modifiers }) => {
    if (!modifiers.matchesPredicate) {
        return null;
    }
    return (
        <MenuItem
            active={modifiers.active}
            key={item}
            label={item}
            onClick={handleClick}
            text={item}
        />
    );
};
 

class Card extends Component {

  size = {width: 0, height: 0}

  constructor() {
    super();
    this.state = {selectedItem: null}
  }

  handleValueChange = (selectedItem) => {
    this.setState({ selectedItem });
  };


  render() {
    const { results, cardInfo } = this.props;
    // TODO: This should eventually be a prop
    const { selectedItem } = this.state;
    
    if (this.contentRef) {
      const { width, height } = this.contentRef.getBoundingClientRect();
      this.size.width = width;
      this.size.height = height
    }
    let plot = null;
    let selector = null;
    if (this.size.width && results) {
      selector = (
        <Select
          items={Object.keys(results.output_states)}
          noResults={<MenuItem disabled={true} text="No results." />}
          onItemSelect={this.handleValueChange}
          itemRenderer={renderItem}
          itemPredicate={filterItem}
        >
          <Button small icon="properties" text={selectedItem}/>
        </Select>
      )
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
              {selector}
            </span>
          </div>
          {plot}
        </div>
      </>
    )
  }
}

export default Card;