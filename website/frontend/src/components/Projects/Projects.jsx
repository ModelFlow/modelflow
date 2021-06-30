import React, { Component } from 'react';
import './Projects.css';
import { connect } from 'react-redux';
import actions from '../../state/actions';

class Projects extends Component {
  componentDidMount() {
    const { getProjects } = this.props;
    getProjects();
  }

  render() {
    const { projects } = this.props;
    const projectItems = projects.map((project) => {
      return (
        <li key={project.id}>
          <a href={`/projects/${project.id}`}>{project.name}</a>
        </li>
      );
    });

    return (
      <>
        <h1>Projects</h1>
        <div>
          <ul>{projectItems}</ul>
        </div>
        <hr />
        <a href="/todo">New</a>
      </>
    );
  }
}

const mapDispatchToProps = {
  getProjects: actions.projects.getProjects,
};

const mapStateToProps = (state) => ({
  projects: state.projects.projects,
});

export default connect(mapStateToProps, mapDispatchToProps)(Projects);
