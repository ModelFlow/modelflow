import React, { Component } from "react";
import { connect } from "react-redux";

class Grid extends Component {

  componentDidMount() {
  }

  render() {
    const { results } = this.props;
    const r = JSON.stringify(results)
    return (
      <>
        <h1>Results</h1>
        {r}
      </>
    )
  }
}

const mapDispatchToProps = {}

const mapStateToProps = (state) => ({
  results: state.sim.results
});

export default connect(mapStateToProps, mapDispatchToProps)(Grid);