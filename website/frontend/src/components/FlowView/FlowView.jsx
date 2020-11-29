import React, { Component } from 'react';
import { connect } from 'react-redux';
import actions from '../../state/actions';

// import { DemoButton, DemoWorkspaceWidget } from '../helpers/DemoWorkspaceWidget';
import { CanvasWidget } from '@projectstorm/react-canvas-core';
// import { DemoCanvasWidget } from '../helpers/DemoCanvasWidget';
import './FlowView.css';
import styled from '@emotion/styled';

import { DagreEngine } from '@projectstorm/react-diagrams';

export const Container = styled.div`
		height: 100%;
		background-color: red
		background-size: 50px 50px;
		display: flex;
		> * {
			height: 100%;
			min-height: 100%;
			width: 100%;
		}
	`;

class FlowView extends Component {
  autoDistribute = () => {
    this.engine.redistribute(this.props.flowModel);
    // only happens if pathfing is enabled (check line 25)
    // this.reroute();

    // this.props.flowEngine
    //   .getLinkFactories()
    //   .getFactory(PathFindingLinkFactory.NAME)
    //   .calculateRoutingMatrix();

    // this.props.flowEngine.repaintCanvas();
  };

  // reroute() {
  //   this.propsflowEngine
  //     .getLinkFactories()
  //     .getFactory(PathFindingLinkFactory.NAME)
  //     .calculateRoutingMatrix();
  // }

  render() {
    if (!this.props.flowEngine) {
      return <div>Loading...</div>;
    } else {
      this.engine = new DagreEngine({
        graph: {
          // rankdir: 'RL',
          // ranker: 'longest-path',
          // marginx: 25,
          // marginy: 25,

          rankdir: 'TB',
          ranker: 'tight-tree',
          marginx: 25,
          marginy: 25,
        },
        includeLinks: false,
      });
      // this.autoDistribute();
      // this.forceUpdate();

      setTimeout(() => {
        this.autoDistribute();
      }, 25);
    }
    return (
      <Container>
        <CanvasWidget engine={this.props.flowEngine} />
      </Container>
    );
  }
}

const mapDispatchToProps = {
  removeCard: actions.resultViews.removeCard,
  updateCardOutputKey: actions.resultViews.updateCardOutputKey,
  requestForceUpdate: actions.sim.requestForceUpdate,
};

const mapStateToProps = (state) => ({
  tabsContent: state.resultViews.tabsContent,
  results: state.sim.results,
  flowEngine: state.sim.flowEngine,
  flowModel: state.sim.flowModel,
  forceUpdateCounter: state.sim.forceUpdateCounter,
});

export default connect(mapStateToProps, mapDispatchToProps)(FlowView);
