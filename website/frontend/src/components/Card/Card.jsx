import React, { useState, Component } from 'react';
import { connect } from 'react-redux';
import Plotly from 'plotly.js-basic-dist';
import './Card.css';
import { Button, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import createPlotlyComponent from 'react-plotly.js/factory';
import actions from '../../state/actions';
import TreeView from '../TreeView/TreeView';

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
  '#ae9ed9',
];

class Card extends Component { // Renders 1 card for 1 sim component
  size = { width: 0, height: 0 };
  // xScale = [];

  scrolledIn = () => {
    const { setSelectedUUID, uuid } = this.props;
    setSelectedUUID(uuid);
  };

  scrolledOut = (e) => {
    const target = e.relatedTarget || e.toElement;
    // Make sure that when you click and drag inside plotly it doesn't
    // falsely say that your mouse is leaving.
    if (target && target.getAttribute('class') === 'dragcover') {
      return;
    }
    const { setSelectedUUID } = this.props;
    setSelectedUUID('');
  };

  setScrollListeners = (element) => {
    element.addEventListener('mouseenter', this.scrolledIn);
    element.addEventListener('mouseleave', this.scrolledOut);
  };

  removeScrollListeners = (element) => {
    element.removeEventListener('mouseenter');
    element.removeEventListener('mouseleave');
  };

  // componentWillUnmount() {
  //   this.removeScrollListeners();
  // }

  shouldComponentUpdate = (newProps) => {
    const newXrange = newProps.xrange || [];
    const newResults = newProps.results || {};
    const newTabsContent = newProps.tabsContent || {};
    const { xrange, results, tabsContent, uuid, selectedUUID } = this.props;
    // Update the card if the data is different
    let shouldUpdate = false;
    if (results != newResults) {
      shouldUpdate = true;
    }

    // Update the card if the selected key is different
    if (tabsContent != newTabsContent) {
      shouldUpdate = true;
    }

    if (
      newXrange.length &&
      (newXrange[0] != xrange[0] || newXrange[1] != xrange[1])
    ) {
      shouldUpdate = true;
      if (uuid === selectedUUID) {
        shouldUpdate = false;
      }
    }
    return shouldUpdate;
  };

  // For delta plot toggle
  state = {
    isDeltaPlotVisible: false,
    deltaPlotVisibility: 'none',
    plot_width: 0,
  };
  changeDeltaPlotVis = () => {
    // If plot not visible, make visible
    if (this.state.isDeltaPlotVisible == false) {
      this.setState((state) => ({
        isDeltaPlotVisible: true,
        deltaPlotVisibility: 'inline',
      }));
    } else {
      // If plot visible, make not visible
      this.setState((state) => ({
        isDeltaPlotVisible: false,
        deltaPlotVisibility: 'none',
      }));
    }
    console.log(
      'Delta plot visibility is now: ' + this.state.deltaPlotVisibility,
    );
  };

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

  onPlotUpdate = (figure) => {
    const { setXrange, xrange, uuid, selectedUUID } = this.props;
    if (
      uuid === selectedUUID &&
      figure.layout.xaxis.range &&
      figure.layout.xaxis.range != xrange
    ) {
      setXrange(figure.layout.xaxis.range);
    }

    // if (figure.layout.xaxis.range) {
    //   setXrange(figure.layout.xaxis.range);
    // }
  };

  render() {
    const { results, tabsContent, uuid, tabId, xrange } = this.props;
    const { cards } = tabsContent[tabId];

    // NOTE: only USER-ADDED cards will have cardType property, not default
    let cardType = 'None'
    if(cards[uuid].cardType) {
      cardType = cards[uuid].cardType
    }

    console.log('🃏 Card received in Card.jsx: ' + cardType + '...')
    console.log(cards[uuid])
    console.log()

    // Regardless of card type, all share these properties...
    let plot = null;
    let plot_componentDeltas = null;
    let plot_title = null;
    let selector = null;
    let deleteButton = null;
    let deltaPlotButton = null;
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

    ////////////////////////////////////////////////////////////////
    // 1️⃣ PLOT TYPE 1: Treeview ///////////////////////////////////
    ///////////////////////////////////////////////////////////////
    if(cardType == 'TREEVIEW') {
      console.log('... creating TreeView card');
      plot_title = "Mission components hierarchy"
      plot = (<TreeView />)
      // Additional card features
      /*deleteButton = (
        <Button small icon="delete" onClick={this.deleteClicked} />
      ); */
    } else { //  if(cardType == 'COMPONENT')
      ////////////////////////////////////////////////////////////////
      // 2️⃣ PLOT TYPE 2: Component viz //////////////////////////////
      ///////////////////////////////////////////////////////////////
      console.log('... creating Component card');
      const selectedOutputKey = cards[uuid].outputKey;
      plot_title = selectedOutputKey;
      const { output_states, all_output_states_keys } = results;

      let plot_height = this.size.height * 0.87;
      this.state.plot_width = this.size.width * 0.97;
      let plot_margins = {
        t: 10,
        b: 40,
        l: 45,
        r: 20,
      };
      let plot_xaxis = {
        title: {
          text: 'Time (hrs)',
          font: {
            size: 14,
            color: '#7f7f7f',
          },
        },
        zerolinecolor: 'black',
        zerolinewidth: 1.5,
      };
      let plot_yaxis = {
        zerolinecolor: 'black',
        zerolinewidth: 1.5,
      };

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
          <Button
            small
            text={this.state.deltaPlotVisibility}
            onClick={this.changeDeltaPlotVis}
          />
        );
        if (output_states.hasOwnProperty(selectedOutputKey)) {
          let actualXscale = [
            results.time[0],
            results.time[results.time.length - 1],
          ];
          if (xrange.length) {
            actualXscale = [xrange[0], xrange[1]];
          }

          // console.log(
          //   '📈 CURRENTLY VIZ-ING: ' + output_states[selectedOutputKey].label,
          // );

          // Finalize data for quantity plot
          let plot_data = [];
          let quantity_trace = {
            x: results.time,
            y: output_states[selectedOutputKey].data,
            name: 'Quantity',
            type: 'line',
            mode: 'lines',
            marker: { color: '#137cbd', width: 3 },
          };

          plot_data.push(quantity_trace);

          if (results.time.length) {
            // Create OVERALL delta line on graph, helpful for viz purposes (prolly temp, NOT made from delta components)
            let overall_delta_y = new Array(results.time.length - 2);
            for (var i = 0; i < overall_delta_y.length; i++) overall_delta_y[i] = 0; // Fill w 0s
            for (var i = 1; i <= results.time.length - 1; i++) {
              let x1 = i - 1;
              let x2 = i + 1;
              let y1 = output_states[selectedOutputKey].data[x1];
              let y2 = output_states[selectedOutputKey].data[x2];
              let delta = (y2 - y1) / (x2 - x1);
              overall_delta_y[i - 1] = delta;
            }
            let overall_delta_trace = {
              x: results.time,
              y: overall_delta_y,
              name: 'Delta',
              type: 'line',
              mode: 'lines',
              line: {
                color: 'gray',
                width: 3,
              },
              hoverinfo: 'all',
            };

            plot_data.push(overall_delta_trace);
          }

          // Plot for quantity
          plot_xaxis['range'] = actualXscale;
          plot = (
            <Plot
              onInitialized={(figure, graphDiv) => {
                this.setScrollListeners(graphDiv);
              }}
              data={plot_data}
              onUpdate={this.onPlotUpdate}
              layout={{
                width: this.state.plot_width,
                height: plot_height,
                margin: plot_margins,
                xaxis: plot_xaxis,
                yaxis: plot_yaxis,
                showlegend: false,
              }}
            />
          );

          // Plot for component deltas
          if (this.state.isDeltaPlotVisible == true) {
            // TODO: May need to do some CSS sizing here to fit addit plots

            // TODO: Uncomment below if needed
            /*
            // Now check if component has delta plot
            if (
              output_states[selectedOutputKey].componentDeltas != null &&
              Object.keys(output_states[selectedOutputKey].componentDeltas)
                .length > 0
            ) {
              // Printing for dev purposes
              // console.log(
              //   selectedOutputKey +
              //   ' has ' +
              //   Object.keys(output_states[selectedOutputKey].componentDeltas)
              //     .length +
              //   ' component deltas',
              // );
              console.log('AVAILABLE COMPONENT DELTAS: ');
              Object.entries(
                output_states[selectedOutputKey].componentDeltas,
              ).forEach(([key, value]) => {
                console.log(key, value);
              });

              // Turn component deltas into more JS-friendly form
              let componentDeltas_data = [];

              i = 0; // Variable just for tracking purposes
              Object.entries(
                output_states[selectedOutputKey].componentDeltas,
              ).forEach(([key, value]) => {
                let temp_trace = {
                  x: results.time,
                  y: value.delta_data,
                  name: value.delta_label,
                  type: 'line',
                  mode: 'lines',
                  line: {
                    width: 0,
                  },
                  marker: { color: Colors[i] },
                  hoverinfo: 'all',
                  stackgroup: 'one',
                };
                componentDeltas_data.push(temp_trace); // Add to array
                i++;
              });

              // Create aggregate line on graph too, helpful for viz purposes
              let aggregate_trace = {};
              let aggregate_y = new Array(results.time.length);
              for (var i = 0; i < aggregate_y.length; i++) aggregate_y[i] = 0; // Fill w 0s

              for (var i = 0; i < aggregate_y.length; i++) {
                let sum = 0;
                for (var o = 0; o < componentDeltas_data.length; o++) {
                  let value = componentDeltas_data[o].y[i];
                  if (value != undefined) {
                    sum += value;
                  }
                }
                console.log('Sum at ' + i + ' is ' + sum);
                aggregate_y[i] = sum;
              }
              aggregate_trace = {
                x: results.time,
                y: aggregate_y,
                name: 'AGGREGATE SUM',
                type: 'line',
                mode: 'lines',
                line: {
                  color: 'gray',
                  width: 3,
                },
                hoverinfo: 'all',
                hoverlabel: {
                  bgcolor: 'black',
                  font: { color: 'white', size: 23 },
                },
                opacity: 1,
              };
              componentDeltas_data.push(aggregate_trace);

              // Now create actual delta plot
              plot_componentDeltas = (
                <Plot
                  data={componentDeltas_data}
                  layout={{
                    width: this.state.plot_width,
                    height: plot_height,
                    margin: plot_margins,
                    title: {
                      text: 'Quantity deltas breakdown',
                      font: {
                        size: 15,
                      },
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
                <span>{selectedOutputKey} has no component deltas</span>
              );
            } */

            plot_componentDeltas = (
              <span>👀 Delta breakdown plots coming soon...</span>
            );
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
    }

    // TODO: Bring back delta button
    const deltaBreakdownButton = null;
    /*
                <span
              style={{
                float: 'right',
                marginTop: '5px',
                marginLeft: '20px',
                display: 'inline',
              }}
            >
              Delta breakdown: {deltaPlotButton}
            </span>
    */

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
            <span className="chart_name">
              {plot_title}
            </span>
            <span
              style={{ float: 'right', marginTop: '5px', marginLeft: '5px', marginRight: '5px' }}
            >
              {deleteButton}
            </span>
            <span
              style={{ float: 'right', marginTop: '5px', marginLeft: '0px' }}
            >
              {selector}
            </span>
            {deltaBreakdownButton}
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
  runSim: actions.sim.runSim,
  updateCardOutputKey: actions.resultsView.updateCardOutputKey,
  removeCard: actions.resultsView.removeCard,
  setXrange: actions.resultsView.setXrange,
  setSelectedUUID: actions.resultsView.setSelectedUUID,
};

const mapStateToProps = (state) => ({
  tabsContent: state.resultsView.tabsContent,
  selectedUUID: state.resultsView.selectedUUID,
  results: state.sim.results,
  xrange: state.resultsView.xrange
});

export default connect(mapStateToProps, mapDispatchToProps)(Card);
