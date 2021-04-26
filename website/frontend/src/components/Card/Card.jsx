import React, { useState, Component } from 'react';
import { connect } from 'react-redux';
import Plotly from 'plotly.js-basic-dist';
import './Card.css';
import { Button, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import createPlotlyComponent from 'react-plotly.js/factory';
import actions from '../../state/actions';

const Plot = createPlotlyComponent(Plotly);

const Colors = [
  '#7e86c9',
  '#6eb47c',
  '#4652b2',
  '#705649',
  '#d47116',
  '#8eb24b',
  '#5e85f1',
  '#7c2ca7',
  '#d55a24',
  '#c2c943',
  '#589ae2',
  '#926bad',
  '#cf8074',
  '#dbc44d',
  '#539488',
  '#ae9ed9'
]

class Card extends Component {
  size = { width: 0, height: 0 };

  // For delta plot toggle
  state = {
    isDeltaPlotVisible: false,
    deltaPlotVisibility: 'none',
    plot_width: 0,
  }
  changeDeltaPlotVis = () => {
    // If plot not visible, make visible
    if(this.state.isDeltaPlotVisible == false) {
      this.setState(state => ({
        isDeltaPlotVisible: true,
        deltaPlotVisibility: 'inline'
      }))
    } else {  // If plot visible, make not visible
      this.setState(state => ({
        isDeltaPlotVisible: false,
        deltaPlotVisibility: 'none'
      }))
    }
    console.log('Delta plot visibility is now: ' + this.state.deltaPlotVisibility)
  }

  handleValueChange = (newOutputKey) => {
    // this.setState({ selectedItem });
    const { uuid, updateCardOutputKey, runSim } = this.props;
    updateCardOutputKey(uuid, newOutputKey);
    runSim();
  };

  filterItem = (query, item) =>
    item.toLowerCase().indexOf(query.toLowerCase()) >= 0;

  renderItem = (item, { handleClick, modifiers }) => {
    if (!modifiers.matchesPredicate) {
      return null;
    }
    return (
      <MenuItem
        active={modifiers.active}
        key={item}
        onClick={handleClick}
        text={item.replace('state_', '')}
      />
    );
  };

  deleteClicked = () => {
    const { uuid, removeCard } = this.props;
    removeCard(uuid);
  };

  render() {
    const { results, tabsContent, uuid, tabId } = this.props;
    const { cards } = tabsContent[tabId];
    const selectedOutputKey = cards[uuid].outputKey;
    const { output_states, all_output_states_keys } = results;

    if (this.contentRef) {
      const { width, height } = this.contentRef.getBoundingClientRect();
      this.size.width = width;
      this.size.height = height;
    } else {
      // NOTE THIS IS ULTRA SKETCH
      // However it currently fixes an issue that causes the graphs to not show up
      // when switching between the flow and results views.
      this.forceUpdate();
    }
    let plot = null;
    let plot_componentDeltas = null;;
    let plot_height = this.size.height * 0.9;
    this.state.plot_width = this.size.width * 0.97;
    let plot_margins = {
      t: 60,
      b: 40,
      l: 45,
      r: 20,
    }
    let plot_xaxis = {
      title: {
        text: 'Time (hrs)',
        font: {
          size: 14,
          color: '#7f7f7f'
        }
      },
      zerolinecolor: 'black',
      zerolinewidth: 1.5,
    };
    let plot_yaxis = {
      zerolinecolor: 'black',
      zerolinewidth: 1.5,
    };

    let selector = null;
    let deleteButton = null;
    let deltaPlotButton = null;
    if (this.size.width && results && output_states) {
      selector = (
        <Select
          items={all_output_states_keys}
          activeItem={selectedOutputKey}
          noResults={<MenuItem disabled text="No results." />}
          onItemSelect={this.handleValueChange}
          itemRenderer={this.renderItem}
          itemPredicate={this.filterItem}
        >
          <Button small icon="properties" />
        </Select>
      );
      deleteButton = (
        <Button small icon="delete" onClick={this.deleteClicked} />
      );
      deltaPlotButton = (
        <Button small text={this.state.deltaPlotVisibility} onClick={this.changeDeltaPlotVis} />
      );
      if (output_states.hasOwnProperty(selectedOutputKey)) {
        // HH: Some printing for dev purposes
        console.log("📈 CURRENTLY VIZ-ING: " + output_states[selectedOutputKey].label)
        console.log("COMPONENT DELTAS: ")
        Object.entries(output_states[selectedOutputKey].componentDeltas).forEach(([key,value]) => {
          console.log(key,value)
        })

        // Create overall delta line on graph, helpful for viz purposes (prolly temporary)
        let overall_delta_y = new Array(results.time.length - 2)
        for(var i = 0; i < overall_delta_y.length; i++) overall_delta_y[i] = 0 // Fill w 0s

        for(var i = 1; i <= results.time.length - 1; i++) {
          let x1 = i - 1
          let x2 = i + 1
          let y1 = output_states[selectedOutputKey].data[x1]
          let y2 = output_states[selectedOutputKey].data[x2]
          let delta = (y2 - y1) / (x2 - x1)
          overall_delta_y[i - 1] = delta
        } 
        let overall_delta_trace = {
          x: results.time,
          y: overall_delta_y,
          name: 'CALCD DELTA',
          type: 'line',
          mode: 'lines',
          line: {
            color: 'gray',
            width: 3
          },
          hoverinfo:"all",
        }

        // Finalize data for quantity plot
        let plot_data = []
        let quantity_trace = {
            x: results.time,
            y: output_states[selectedOutputKey].data,
            name: 'quantity',
            type: 'line',
            mode: 'lines',
            marker: { color: '#137cbd', width: 3 },
        }
        
        plot_data.push(quantity_trace)
        plot_data.push(overall_delta_trace)

        // Plot for quantity
        plot = (
          <Plot
            data={plot_data}
            layout={{
              width: this.state.plot_width,
              height: plot_height,
              margin: plot_margins,
              title: {
                text:'Quantity over mission run',
                font: {
                  size: 24
                }
              },
              xaxis: plot_xaxis,
              yaxis: plot_yaxis,
              showlegend: false,
            }}
          />
        );

        // Plot for component deltas
        if(this.state.isDeltaPlotVisible == true){ // Check if user wants to see delta plots
          if(Object.keys(output_states[selectedOutputKey].componentDeltas).length > 0) { // Check if component has delta plot
            console.log("👀 " + selectedOutputKey + " has " + Object.keys(output_states[selectedOutputKey].componentDeltas).length + " component deltas");
            
            // Update plot widths
            this.state.plot_width = this.size.width * 0.48
            plot = ( // Need more efficient way to update!
              <Plot
                data={plot_data}
                layout={{
                  width: this.state.plot_width,
                  height: plot_height,
                  margin: plot_margins,
                  title: {
                    text:'Quantity over mission run',
                    font: {
                      size: 24
                    }
                  },
                  xaxis: plot_xaxis,
                  yaxis: plot_yaxis,
                  showlegend: false,
                }}
              />
            );

            // Turn component deltas into more JS-friendly form
            let componentDeltas_data = []

            i = 0 // Just for tracking purposes
            Object.entries(output_states[selectedOutputKey].componentDeltas).forEach(([key,value]) => {
              let temp_trace = {
                x: results.time,
                y: value.delta_data,
                name: value.delta_label,
                type: 'line',
                mode: 'lines',
                line: {
                  width: 0
                },
                marker: { color: Colors[i] },
                hoverinfo:"all",
                stackgroup: 'one'
              }
              componentDeltas_data.push(temp_trace) // Add to array
              i++
            })

            // Create aggregate line on graph too, helpful for viz purposes
            let aggregate_trace = {}
            let aggregate_y = new Array(results.time.length)
            for(var i = 0; i < aggregate_y.length; i++) aggregate_y[i] = 0 // Fill w 0s

            for(var i = 0; i < aggregate_y.length; i++) {
              let sum = 0
              for(var o = 0; o < componentDeltas_data.length; o++) {
                let value = componentDeltas_data[o].y[i]
                if(value != undefined) {
                  sum += value 
                }
              }
              console.log("Sum at " + i + " is " + sum)
              aggregate_y[i] = sum 
            } 
            aggregate_trace = {
              x: results.time,
              y: aggregate_y,
              name: 'AGGREGATE SUM',
              type: 'line',
              mode: 'lines',
              line: {
                color: 'gray',
                width: 3
              },
              hoverinfo:"all",
              hoverlabel: {
                bgcolor: 'black',
                font: {color: 'white', size: 23}
              },
              opacity: 1
            }
            componentDeltas_data.push(aggregate_trace)

            // Now create actual delta plot
            plot_componentDeltas = (
              <Plot
                data={componentDeltas_data}
                layout={{
                  width: this.state.plot_width,
                  height: plot_height,
                  margin: plot_margins,
                  title: {
                    text:'Quantity deltas breakdown',
                    font: {
                      size: 18
                    }
                  },
                  showlegend: false, // For now
                  xaxis: plot_xaxis,
                  yaxis: plot_yaxis,
                }}
              />
            );
          } else {
            console.log(selectedOutputKey + ' has no delta values');
            plot_componentDeltas = (
              <Plot
                layout={{
                  width: this.state.plot_width,
                  height: plot_height,
                  margin: plot_margins,
                  title: {
                    text: selectedOutputKey + ' has no component deltas',
                    font: {
                      size: 18
                    }
                  }
                }}
              />
            );
          }
        }

      }
      if (selectedOutputKey === 'none') {
        plot = (
          <div style={{ textAlign: 'center' }}>
            <br />
            Select a signal from the dropdown
          </div>
        );
      }
    }
    return (
      <>
        <div
          style={{
            background: 'white',
            height: '100%',
            borderRadius: 5,
            overflow: 'hidden',
            borderWidth: '1px',
            borderColor: 'lightgray',
            borderStyle: 'solid',
          }}
          ref={(mount) => {
            this.contentRef = mount;
          }}
        >
          <div className="card_header">
            <span className="chart_title">
              {selectedOutputKey.replace('state_', '')}
            </span>
            <span
              style={{ float: 'right', marginTop: '5px', marginLeft: '20px' }}
            >
              {deleteButton}
            </span>
            <span
              style={{ float: 'right', marginTop: '5px', marginLeft: '20px' }}
            >
              {selector}
            </span>
            <span
              style={{ float: 'right', marginTop: '5px', marginLeft: '20px', display: 'inline' }}
            >
              Delta breakdown: {deltaPlotButton}
            </span>
          </div>
          <div style={{ display: 'table-row' }}>
            {plot}
            <div style={{ display: this.state.deltaPlotVisibility }}>
              {plot_componentDeltas}
            </div>
          </div>
        </div>
      </>
    );
  }
}

const mapDispatchToProps = {
  removeCard: actions.resultViews.removeCard,
  updateCardOutputKey: actions.resultViews.updateCardOutputKey,
  runSim: actions.sim.runSim,
};

const mapStateToProps = (state) => ({
  tabsContent: state.resultViews.tabsContent,
  results: state.sim.results,
});

export default connect(mapStateToProps, mapDispatchToProps)(Card);
