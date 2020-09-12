import React, { Component } from 'react';
import { connect } from 'react-redux';
import './ResultsGrid.css';
import { Responsive, WidthProvider } from 'react-grid-layout';
import Card from '../Card/Card';

const ResponsiveGridLayout = WidthProvider(Responsive);

class ResultsGrid extends Component {
  constructor() {
    super();
    this.state = {
      cardInfos: {
        a: {
          type: 'state_enrg_kwh',
        },
        b: {
          type: 'state_dc_kwh',
        },
      },
      layout: {
        lg: [
          { i: 'a', x: 0, y: 0, w: 6, h: 8 },
          { i: 'b', x: 6, y: 0, w: 6, h: 6 },
        ],
      },
    };
  }

  componentDidMount() {}

  onLayoutChange = (newLayout) => {
    this.setState({ layout: { lg: newLayout } });
  };

  render() {
    const { results } = this.props;
    const { layout, cardInfos } = this.state;

    return (
      <ResponsiveGridLayout
        layouts={layout}
        className="layoutsss"
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
            <Card item={item} cardInfo={cardInfos[item.i]} results={results} />
          </div>
        ))}
      </ResponsiveGridLayout>
    );
  }
}

const mapDispatchToProps = {};

const mapStateToProps = (state) => ({
  results: state.sim.results,
});

export default connect(mapStateToProps, mapDispatchToProps)(ResultsGrid);
