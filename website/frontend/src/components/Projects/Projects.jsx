import React, { Component } from 'react';
import './Projects.css';
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
  NonIdealState,
  Menu,
  MenuDivider,
} from '@blueprintjs/core';
import Header from '../Header/Header.jsx';
import { AppToaster } from '../Toaster.jsx';

class Projects extends Component {
  state = {
    newProjectDialogIsOpen: false,
    newProjectName: '',
    nonIdealState: null,
  };

  handleNewProjectOpen = () => {
    this.setState({ newProjectDialogIsOpen: true });
  };

  handleNewProjectClose = () => {
    this.setState({ newProjectDialogIsOpen: false });
  };

  handleNewProjectNameInput = (e) => {
    this.setState({ newProjectName: e.target.value });
  };

  componentDidMount() {
    this.getData();
  }

  getData = async () => {
    const { getProjects } = this.props;
    const data = await getProjects();
    console.log('inside got projects');
    console.log(data);
    // NOTE: This should be a global check instead of just here
    if (data.error) {
      this.setState({ nonIdealState: data.error });
    }
  };

  handleSaveNewProject = async () => {
    const { createProject, getProjects } = this.props;
    const { newProjectName } = this.state;
    console.log('inside save');
    await createProject(newProjectName);
    getProjects();

    AppToaster.show({
      message: `Created new project: ${newProjectName}`,
      intent: Intent.SUCCESS,
      icon: 'tick',
    });

    this.setState({ newProjectName: '', newProjectDialogIsOpen: false });
  };

  render() {
    const {
      newProjectDialogIsOpen,
      newProjectName,
      nonIdealState,
    } = this.state;
    const { projects } = this.props;
    console.log(projects)
    if (nonIdealState) {
      return (
        <NonIdealState icon="error" title="Error" description={nonIdealState} />
      );
    }

    const projectItems = projects.map((project) => {
      return (
        <>
          <li key={project.id}>
            <a href={`/projects/${project.id}`}>{project.name}</a>
          </li>
        </>
      );
    });

    const newProjectDialog = (
      <Dialog
        icon="info-sign"
        onClose={this.handleNewProjectClose}
        title="New Project"
        autoFocus={true}
        canEscapeKeyClose={true}
        canOutsideClickClose={true}
        enforceFocus={false}
        isOpen={newProjectDialogIsOpen}
        usePortal={true}
      >
        <div className={Classes.DIALOG_BODY}>
          <p>Project Name:</p>
          <input
            className="bp3-input"
            type="text"
            placeholder="name"
            dir="auto"
            style={{ width: '100%' }}
            onChange={this.handleNewProjectNameInput}
            value={newProjectName}
          />
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Tooltip content="This button closes the dialog.">
              <Button onClick={this.handleNewProjectClose}>Cancel</Button>
            </Tooltip>
            <AnchorButton
              intent={Intent.PRIMARY}
              onClick={this.handleSaveNewProject}
              target="_blank"
            >
              Create
            </AnchorButton>
          </div>
        </div>
      </Dialog>
    );

    return (
      <>
        <Header title="Projects" />

        <div>
          <ul>{projectItems}</ul>
        </div>
        <Button onClick={this.handleNewProjectOpen}>Create New Project</Button>

        {newProjectDialog}
      </>
    );
  }
}

const mapDispatchToProps = {
  getProjects: actions.projects.getProjects,
  createProject: actions.projects.createProject,
};

const mapStateToProps = (state) => ({
  projects: state.projects.projects,
});

export default connect(mapStateToProps, mapDispatchToProps)(Projects);
