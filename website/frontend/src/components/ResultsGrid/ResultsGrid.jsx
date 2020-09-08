import React, { Component } from "react";
import { connect } from "react-redux";
// import GridLayout from 'react-grid-layout';
// import { Responsive as ResponsiveGridLayout } from 'react-grid-layout';
import './ResultsGrid.css'; 

import { Responsive, WidthProvider } from 'react-grid-layout';
// import WidthProvider from './WidthProvider'
const ResponsiveGridLayout = WidthProvider(Responsive);


// import { Responsive, WidthProvider } from 'react-grid-layout';
 
// const ResponsiveGridLayout = WidthProvider(Responsive);
 

// import 'react-grid-layout/css/styles.css' 
// import 'react-resizable/css/styles.css' 
// /node_modules/react-grid-layout/css/styles.css
// /node_modules/react-resizable/css/styles.css 

class ResultsGrid extends Component {

  componentDidMount() {
  }

  render() {
    const { results } = this.props;
    // const r = JSON.stringify(results)

    const layouts =  {
      lg: [
        {i: 'a', x: 0, y: 0, w: 1, h: 2, static: true},
        {i: 'b', x: 1, y: 0, w: 3, h: 2, minW: 2, maxW: 4},
        {i: 'c', x: 4, y: 0, w: 1, h: 2}
      ]
    }

    // const layouts = [
    //   {i: 'a', x: 0, y: 0, w: 1, h: 2, static: true},
    //   {i: 'b', x: 1, y: 0, w: 3, h: 2, minW: 2, maxW: 4},
    //   {i: 'c', x: 4, y: 0, w: 1, h: 2}
    // ];
    // cols={12} 
    //  measureBeforeMount={false} 
    return (
      <ResponsiveGridLayout layouts={layouts} className="layoutsss" rowHeight={30} isResizable={true} breakpoints={{lg: 1200}}
      cols={{lg: 12}} compactType={"vertical"}>
        <div key="a" style={{background: "blue"}}>a</div>
        <div key="b" style={{background: "green"}}>b</div>
        <div key="c" style={{background: "gray"}}>c</div>
      </ResponsiveGridLayout>
    )

    // const layout = [
    //   {i: 'a', x: 0, y: 0, w: 1, h: 2, static: true},
    //   {i: 'b', x: 1, y: 0, w: 3, h: 2, minW: 2, maxW: 4},
    //   {i: 'c', x: 4, y: 0, w: 1, h: 2}
    // ];
    // return (
    //   <GridLayout className="layout" layout={layout} cols={12} rowHeight={30} width={1200}>
        // <div key="a" style={{background: "blue"}}>a</div>
        // <div key="b" style={{background: "green"}}>b</div>
        // <div key="c"style={{background: "gray"}} >c</div>
        // <div key="a" data-grid={{x: 0, y: 0, w: 1, h: 2, static: true}} style={{background: "blue"}}>a</div>
        // <div key="b" data-grid={{x: 1, y: 0, w: 3, h: 2, minW: 2, maxW: 4}} style={{background: "blue"}}>b</div>
        // <div key="c" data-grid={{x: 4, y: 0, w: 1, h: 2}} style={{background: "blue"}}>c</div>

    //   </GridLayout>
    // )
  }
}

const mapDispatchToProps = {}

const mapStateToProps = (state) => ({
  results: state.sim.results
});

export default connect(mapStateToProps, mapDispatchToProps)(ResultsGrid);