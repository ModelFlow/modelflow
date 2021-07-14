import React, { Component } from 'react' 
import { connect } from 'react-redux' 
import actions from '../../state/actions' 

import Plotly from 'plotly.js-strict-dist' 
import createPlotlyComponent from 'react-plotly.js/factory' 

import Card from '../Card/Card'  // Not necessary, delete line
import CardSimple from '../CardSimple/CardSimple' 

import './TreeView.css' 
import styled from '@emotion/styled' 
import { isElementOfType } from '@blueprintjs/core/lib/esm/common/utils' 

const Plot = createPlotlyComponent(Plotly) 

class TreeView extends Component {
  render() {
    // Get data for tree graph
    const { results } = this.props 
    console.log('🌴 GENERATING TREEVIEW')
    if(!results.tree_changes){ // Make sure results are ready in first place
      console.log('🛑 No simulation results to generate tree')
      return null
    }

    // Get some important tree data from backend
    let tree = results.tree_changes[0].tree
    let treeViewData = results.tree_changes[0].treeViewData
    
    if(tree === null) {
      console.log('🛑 No tree to generate tree')
      return null
    } else if(treeViewData === null) {
      console.log('🛑 No treeView data to generate tree')
      return null
    }

    console.log('✅ Tree and treeView data received:')
    console.log('🌲 Full tree: ' + String(tree))
    /* 
      ASSUMPTIONS:
      - treeViewData[0] = Plotly TreeView labels
      - treeViewData[1] = Plotly TreeView parent labels
    */
    console.log('🌲🗺 Tree graph data:')
    let treeLabels = treeViewData[0]
    console.log("Plotly labels: " + String(treeLabels))
    let treeParents = treeViewData[1]
    console.log("Plotly parents: " + String(treeParents))

    // Create plot
    let plot = null 
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
    )
      
    return (
        <CardSimple 
          uuid="test" 
          item="test" 
          content={plot} 
          cardTitle="Overall system tree" 
        />
    ) 
  }
}

const mapDispatchToProps = {
  requestForceUpdate: actions.sim.requestForceUpdate,
} 

const mapStateToProps = (state) => ({
  results: state.sim.results,
  forceUpdateCounter: state.sim.forceUpdateCounter,
}) 

/*
const treeToArrays = (treeObj) => {
  console.log('🥴 Currently starting recursion on...')
  console.log(treeObj)

  if(Object.keys(treeObj).length !== 0) {
    for (const [key, value] of Object.entries(treeObj)) {
      console.log(`${key}: ${value}`) 
      console.log(value)
      if(value.children !== null) {
        console.log("Value has children")
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
} */

export default connect(mapStateToProps, mapDispatchToProps)(TreeView) 
