import React from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
// import debounce from "lodash.debounce";

export default function WidthProvider(ComposedComponent) {
  return class WidthProvider extends React.Component {
    static defaultProps = {
      measureBeforeMount: false
    }

    static propTypes = {
      measureBeforeMount: PropTypes.bool
    }

    state = {
      width: 1280
    }
    
    mounted = false;

    componentDidMount() {
      this.mounted = true

      window.addEventListener("resize", this.onWindowResize);

      this.onWindowResize();
    }

    componentWillUnmount() {
      this.mounted = false;
      window.removeEventListener("resize", this.onWindowResize);
    }

    // onWindowResize = debounce(() => {
    //   if (!this.mounted) return;

    //   const node = ReactDOM.findDOMNode(this);
    //   if (node instanceof HTMLElement) this.setState({width: node.offsetWidth});
    // }, 200);

    onWindowResize() {
      if (!this.mounted) return;

      const node = ReactDOM.findDOMNode(this);
      if (node instanceof HTMLElement) this.setState({width: node.offsetWidth});
    }

    render() {
      const { measureBeforeMount, ...rest} = this.props;
      if (measureBeforeMount && !this.mounted) {
        return (
          <div className={this.props.className} style={this.props.style} />
        )
      }
      return <ComposedComponent {...rest} {...this.state} />
    }
  }
}