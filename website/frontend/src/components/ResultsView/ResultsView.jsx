import {
  AnchorButton,
  Button,
  Classes,
  Dialog,
  Intent,
  Tab,
  Tabs,
  Callout,
} from '@blueprintjs/core';

import React, { Component } from 'react';
import ResultsGrid from './../ResultsGrid/ResultsGrid';
import { connect } from 'react-redux';
import actions from '../../state/actions';
import './ResultsView.css';

class ResultsView extends Component {
  state = {
    isOpen: false,
  };

  handleOpen = () => {
    this.setState({ isOpen: true });
  };

  handleClose = () => {
    this.setState({ isOpen: false });
  };

  addTab = () => {
    const { addTab } = this.props;
    addTab();
  };

  removeTab = (id) => {
    const { removeTab } = this.props;
    removeTab(id);
  };

  handleTabTitleChange = (tabId, e) => {
    const { editTabTitle } = this.props;
    editTabTitle(tabId, e.target.value);
  };

  handleTabChange = (tabId) => {
    const { switchTab } = this.props;
    switchTab(tabId);
  };

  render() {
    const { isOpen } = this.state;
    const { selectedTabId, tabs, results, status } = this.props;

    let callout = null;
    if (status === 'waiting') {
      callout = (
        <Callout
          icon={'info-sign'}
          intent={''}
          title={'Waiting'}
          className="simStatusCallout"
        ></Callout>
      );
    } else if (status === 'running') {
      callout = (
        <Callout
          icon={'walk'}
          intent={'warning'}
          title={'Running'}
          className="simStatusCallout"
        ></Callout>
      );
    } else if (status === 'success') {
      callout = (
        <Callout
          icon={'tick-circle'}
          intent={'success'}
          title={'Success'}
          className="simStatusCallout"
        ></Callout>
      );
    } else if (status === 'error') {
      callout = (
        <Callout
          icon={'error'}
          intent={'danger'}
          title={'Error'}
          className="simStatusCallout"
        >
          {results.error}
        </Callout>
      );
    }
    return (
      <>
        {callout}
        <div className="tabHeader">
          <Button
            text="Edit Tabs"
            onClick={this.handleOpen}
            small={true}
            style={{ marginLeft: '10px', marginTop: '5px' }}
          />
          <Dialog
            icon="edit"
            onClose={this.handleClose}
            title="Edit Tabs"
            autoFocus={true}
            canEscapeKeyClose={true}
            canOutsideClickClose={true}
            enforceFocus={false}
            isOpen={isOpen}
            usePortal={true}
          >
            <div className={Classes.DIALOG_BODY}>
              <p>Edit, Add and Remove Tabs</p>
              {tabs.map((tab) => {
                return (
                  <div key={tab.id}>
                    <input
                      className="bp3-input"
                      type="text"
                      placeholder="name"
                      dir="auto"
                      style={{ width: '425px', marginBottom: '10px' }}
                      onChange={(e) => this.handleTabTitleChange(tab.id, e)}
                      value={tab.title}
                    />
                    <Button
                      disabled={tabs.length === 1}
                      icon="cross"
                      onClick={() => this.removeTab(tab.id)}
                      style={{ marginLeft: '5px', marginBottom: '10px' }}
                    />
                  </div>
                );
              })}
              <Button
                intent={Intent.SUCCESS}
                text="Add Tab"
                onClick={this.addTab}
              />
            </div>
            <div className={Classes.DIALOG_FOOTER}>
              <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                <AnchorButton
                  intent={Intent.PRIMARY}
                  onClick={this.handleClose}
                  target="_blank"
                >
                  Close
                </AnchorButton>
              </div>
            </div>
          </Dialog>

          <div style={{ marginLeft: '90px', marginTop: '-30px' }}>
            <Tabs
              id="TabsExample"
              onChange={this.handleTabChange}
              selectedTabId={selectedTabId}
            >
              {tabs.map((tab) => {
                return <Tab key={tab.id} id={tab.id} title={tab.title} />;
              })}
            </Tabs>
          </div>
        </div>
        <ResultsGrid tabId={selectedTabId} />
      </>
    );
  }
}

const mapDispatchToProps = {
  switchTab: actions.resultViews.switchTab,
  addTab: actions.resultViews.addTab,
  removeTab: actions.resultViews.removeTab,
  editTabTitle: actions.resultViews.editTabTitle,
};

const mapStateToProps = (state) => ({
  selectedTabId: state.resultViews.selectedTabId,
  tabs: state.resultViews.tabs,
  results: state.sim.results,
  status: state.sim.status,
});

export default connect(mapStateToProps, mapDispatchToProps)(ResultsView);
