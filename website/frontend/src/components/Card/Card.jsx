import React, { Component } from 'react';
import { connect } from 'react-redux';
import Plotly from 'plotly.js-basic-dist';
import './Card.css';
import { Button, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import createPlotlyComponent from 'react-plotly.js/factory';
import actions from '../../state/actions';

const Plot = createPlotlyComponent(Plotly);

class Card extends Component {
  size = { width: 0, height: 0 };

  handleValueChange = (newOutputKey) => {
    // this.setState({ selectedItem });
    const { uuid, updateCardOutputKey, runSim } = this.props;
    updateCardOutputKey(uuid, newOutputKey);
    console.log("fixes y axis")
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
    let selector = null;
    let deleteButton = null;
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
      if (output_states.hasOwnProperty(selectedOutputKey)) {
        plot = (
          <Plot
            data={[
              {
                x: results.time,
                y: output_states[selectedOutputKey].data,
                type: 'line',
                mode: 'lines',
                marker: { color: '#137cbd' },
              },
            ]}
            layout={{
              width: this.size.width,
              height: this.size.height,
              margin: {
                t: 20,
                b: 55,
                l: 40,
                r: 15,
              },
            }}
          />
        );
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
              style={{ float: 'right', marginTop: '5px', marginRight: '5px' }}
            >
              {deleteButton}
            </span>
            <span
              style={{ float: 'right', marginTop: '5px', marginRight: '3px' }}
            >
              {selector}
            </span>
          </div>
          {plot}
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
