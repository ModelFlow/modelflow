import React, { Component } from 'react';
import { connect } from 'react-redux';
import actions from '../../state/actions';

import Plotly from 'plotly.js-strict-dist';
import createPlotlyComponent from 'react-plotly.js/factory';

import Card from '../Card/Card'; // Not necessary, delete line
import CardSimple from '../CardSimple/CardSimple';

import './TreeView.css';
import styled from '@emotion/styled';
import { isElementOfType } from '@blueprintjs/core/lib/esm/common/utils';

const Plot = createPlotlyComponent(Plotly);
let treeLabels = ['time'];
let treeParents = [''];

class TreeView extends Component {
  render() {
    // Get data for tree graph
    const { results } = this.props;
    console.log('🌴')
    console.log(results)
    if(!results.tree_changes){ // Make sure "results" actually has results first
      return null
    }
    let tree = results.tree_changes[0].tree
    console.log(tree)

    treeToArrays(tree) // For treeLabels and treeParents, uses recursion! Hope there's a more efficient way...

    // If array lengths aren't same, something's off :/
    console.log("tree label array length: " + treeLabels.length)
    console.log("tree parents array elngth: " + treeParents.length)

    // TODO: WAIT until plot array size > 1

    // Set up plot
    let plot = null;

    let treeData = [{
      type: "treemap",
      labels: treeLabels, // ["Eve", "Cain", "Seth", "Enos", "Noam", "Abel", "Awan", "Enoch", "Azura"],
      parents: treeParents, // ["", "Eve", "Eve", "Seth", "Seth", "Eve", "Eve", "Awan", "Eve" ]
    }]

    let treeLayout = {
      autosize: true,
      margin: 10
    }

    plot = ( 
      <Plot
        data = {treeData}
        layout = {treeLayout}
      />
    );
      
    return (
        <CardSimple 
          uuid="test" 
          item="test" 
          content={plot} 
          cardTitle="Overall system tree 🌲" 
        />
    );
  }
}

const mapDispatchToProps = {
  requestForceUpdate: actions.sim.requestForceUpdate,
};

const mapStateToProps = (state) => ({
  results: state.sim.results,
  forceUpdateCounter: state.sim.forceUpdateCounter,
});

const treeToArrays = (treeObj) => {
  console.log('🥴 recursive on...')
  console.log(treeObj)

  if(Object.keys(treeObj).length !== 0) {
    for (const [key, value] of Object.entries(treeObj)) {
      console.log(`${key}: ${value}`) 
      console.log(value)
      if(value.children !== null) {
        console.log("value has children")
        console.log(value.children)

        value.children.forEach(element => {
          // 2 possible data formats for a child...
          // "name" OR...
          // ... { "name", {children} }
          
          console.log('👇 on this child element:')
          console.log(element)

          if(typeof element === 'object') { // 1) Child is Object format => { "NAME", {more children} }
            console.log("child is Obj")
            console.log(Object.keys(element)[0])
            let childKey = Object.keys(element)[0]
            treeLabels.push(childKey) // Add child
            treeParents.push(key) // Add parent

            // Some console stuff
            console.log("CURR TREE LABELS: " + treeLabels)
            console.log("CURR TREE PARENTS: " + treeParents)
            
            // Recursion
            treeToArrays(element)
          } else { // 2) If child is just string
            console.log("child not an Obj, so prolly just a string")
            console.log(element)

            treeLabels.push(element) // Add child
            treeParents.push(key) // Add parent

            // Some console stuff
            console.log("CURR TREE LABELS: " + treeLabels)
            console.log("CURR TREE PARENTS: " + treeParents)
          }
        })
      }
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(TreeView);
