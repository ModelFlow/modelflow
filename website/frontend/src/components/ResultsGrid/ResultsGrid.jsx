import React, { Component } from 'react';
import { connect } from 'react-redux';
import './ResultsGrid.css';
import { Responsive, WidthProvider } from 'react-grid-layout';
import Card from '../Card/Card';
import actions from '../../state/actions';

const ResponsiveGridLayout = WidthProvider(Responsive);

class ResultsGrid extends Component {
  onLayoutChange = (newLayout) => {
    const { updateLayout } = this.props;
    updateLayout(newLayout);
  };

  render() {
    const { layout, cards } = this.props;
    // Note: Although not used, passing in item to Card is needed
    // to trigger a rerender when the card is resized
    return (
      <ResponsiveGridLayout
        layouts={layout}
        rowHeight={30}
        measureBeforeMount
        isResizable
        breakpoints={{ lg: 1200 }}
        cols={{ lg: 12 }}
        onLayoutChange={this.onLayoutChange}
        compactType="vertical"
      >
        {layout.lg.map((item) => (
          <div key={item.i}>
            <Card uuid={item.i} item={item} />
          </div>
        ))}
      </ResponsiveGridLayout>
    );
  }
}

const mapDispatchToProps = {
  updateLayout: actions.resultViews.updateLayout,
};

const mapStateToProps = (state) => ({
  results: state.sim.results,
  cards: state.resultViews.cards,
  layout: state.resultViews.layout,
});

export default connect(mapStateToProps, mapDispatchToProps)(ResultsGrid);
