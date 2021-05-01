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
    const { tabId, tabsContent } = this.props;
    const { layout } = tabsContent[tabId];
    // Note: Although not used, passing in item to Card is needed
    // to trigger a rerender when the card is resized
    return (
      <ResponsiveGridLayout
        layouts={layout}
        rowHeight={50} // Card height
        measureBeforeMount
        isResizable
        breakpoints={{ lg: 1200 }}
        cols={{ lg: 6 }}
        draggableHandle=".card_header"
        onLayoutChange={this.onLayoutChange}
        compactType="vertical"
      >
        {layout.lg.map((item) => (
          <div key={item.i}>
            <Card uuid={item.i} item={item} tabId={tabId} />
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
  tabsContent: state.resultViews.tabsContent,
});

export default connect(mapStateToProps, mapDispatchToProps)(ResultsGrid);
