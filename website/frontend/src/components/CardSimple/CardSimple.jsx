/*
import React, { useState, Component } from 'react'  
import { connect } from 'react-redux'  
import Plotly from 'plotly.js-basic-dist'  
import '../Card/Card.css'  
import { Button, MenuItem } from '@blueprintjs/core'  
import { Select } from '@blueprintjs/select'  
import createPlotlyComponent from 'react-plotly.js/factory'  
import actions from '../../state/actions'  

// Same as CardSimple.jsx, but just UI frame for static elements

class CardSimple extends Component {
  size = { width: 0, height: 0 }  

  scrolledIn = () => {
    const { setSelectedUUID, uuid } = this.props  
    setSelectedUUID(uuid)  
  }  

  scrolledOut = (e) => {
    const target = e.relatedTarget || e.toElement  
    // Make sure that when you click and drag inside plotly it doesn't
    // falsely say that your mouse is leaving.
    if (target && target.getAttribute('class') === 'dragcover') {
      return  
    }
    const { setSelectedUUID } = this.props  
    setSelectedUUID('')  
  }  

  setScrollListeners = (element) => {
    element.addEventListener('mouseenter', this.scrolledIn)  
    element.addEventListener('mouseleave', this.scrolledOut)  
  }  

  removeScrollListeners = (element) => {
    element.removeEventListener('mouseenter')  
    element.removeEventListener('mouseleave')  
  }  

  // componentWillUnmount() {
  //   this.removeScrollListeners()  
  // }

  shouldComponentUpdate = (newProps) => {
    const newXrange = newProps.xrange || []  
    const newResults = newProps.results || {}  
    const newTabsContent = newProps.tabsContent || {}  
    const { xrange, results, tabsContent, uuid, selectedUUID } = this.props  
    // Update the card if the data is different
    let shouldUpdate = false  
    if (results != newResults) {
      shouldUpdate = true  
    }

    // Update the card if the selected key is different
    if (tabsContent != newTabsContent) {
      shouldUpdate = true  
    }

    if (
      newXrange.length &&
      (newXrange[0] != xrange[0] || newXrange[1] != xrange[1])
    ) {
      shouldUpdate = true  
      if (uuid === selectedUUID) {
        shouldUpdate = false  
      }
    }
    return shouldUpdate  
  }  

  handleValueChange = (newOutputKey) => {
    // this.setState({ selectedItem })  
    const { uuid, updateCardOutputKey, runSim } = this.props  
    updateCardOutputKey(uuid, newOutputKey)  
    runSim()  
  }  

  filterItem = (query, item) =>
    item.toLowerCase().indexOf(query.toLowerCase()) >= 0  

  renderItem = (item, { handleClick, modifiers }) => {
    if (!modifiers.matchesPredicate) {
      return null  
    }
    return (
      <MenuItem
        active={modifiers.active}
        key={item}
        onClick={handleClick}
        text={item.replace('state_', '')}
      />
    )  
  }  

  deleteClicked = () => {
    const { uuid, removeCard } = this.props  
    removeCard(uuid)  
  }  

  onPlotUpdate = (figure) => {
    const { setXrange, xrange, uuid, selectedUUID } = this.props  
    if (
      uuid === selectedUUID &&
      figure.layout.xaxis.range &&
      figure.layout.xaxis.range != xrange
    ) {
      setXrange(figure.layout.xaxis.range)  
    }

    // if (figure.layout.xaxis.range) {
    //   setXrange(figure.layout.xaxis.range)  
    // }
  }  

  render() {
    const { content, cardTitle } = this.props

    // Buttons
    let selector = null;
    let deleteButton = null;

    if (this.contentRef) {
      // TODO: This good size?
      const { width, height } = this.contentRef.getBoundingClientRect()
      this.size.width = width
      this.size.height = height
    } else {
      // NOTE THIS IS ULTRA SKETCH
      // However it currently fixes an issue that causes the graphs to not show up
      // when switching between the flow and results views.
      this.forceUpdate()  
    }

    return (
      <>
        <div
          style={{
            background: 'white',
            height: '300px',
            width: '50%',
            borderRadius: 5,
            overflow: 'hidden',
            borderWidth: '1px',
            borderColor: 'lightgray',
            borderStyle: 'solid',
            margin: 10
          }}
          ref={(mount) => {
            this.contentRef = mount  
          }}
        >
          <div className="card_header">
          <span className="chart_name">
              {cardTitle}
            </span>
          </div>
          <div style={{ display: 'table-row' }}>
              {content}
          </div>
        </div>
      </>
    )  
  }
}

const mapDispatchToProps = {
  runSim: actions.sim.runSim,
  updateCardOutputKey: actions.resultsView.updateCardOutputKey,
  //removeCard: actions.resultsView.removeCard,
  //setXrange: actions.resultsView.setXrange,
  setSelectedUUID: actions.resultsView.setSelectedUUID,
}  

const mapStateToProps = (state) => ({
  tabsContent: state.resultsView.tabsContent,
  selectedUUID: state.resultsView.selectedUUID,
  results: state.sim.results,
  //xrange: state.resultsView.xrange,
})  

export default connect(mapStateToProps, mapDispatchToProps)(CardSimple)  
*/
