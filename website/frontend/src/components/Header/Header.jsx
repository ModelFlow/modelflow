import React, { Component } from 'react';
import './Header.css';
import { connect } from 'react-redux';
import actions from '../../state/actions';
import {
  AnchorButton,
  ButtonGroup,
  Button,
  Classes,
  Dialog,
  Intent,
  Tooltip,
  MenuItem,
  Navbar,
  NavbarDivider,
  NavbarGroup,
  NavbarHeading,
  Alignment,
  Menu,
  MenuDivider,
  H4
} from '@blueprintjs/core';

class Header extends Component {
  render() {
    const { title } = this.props;
    return (
      <>
        <Navbar style={{ padding: '0px 10px' }}>
          <Navbar.Group align={Alignment.LEFT}>
            <a href="/">
              <img alt="logo" src="/model_flow_horizontal.png" height="24" />
            </a>
            <MenuDivider />
            <H4>{title}</H4>
          </Navbar.Group>
        </Navbar>
      </>
    );
  }
}


const mapDispatchToProps = {
};

const mapStateToProps = (state) => ({
});

export default connect(mapStateToProps, mapDispatchToProps)(Header);
