import createEngine, {
  DiagramModel,
  DefaultNodeModel,
  DefaultPortModel,
  // NodeModel,
  // DagreEngine,
  // DiagramEngine,
  // PathFindingLinkFactory,
} from '@projectstorm/react-diagrams';

const initialState = {
  results: {},
  flowEngine: null,
  flowModel: null,
  forceUpdateCounter: 0,
  status: 'waiting',
};

// TODO: Remove all of these flow things from sim.js and into their own file

function createNode(name) {
  return new DefaultNodeModel(name, 'rgb(0,192,255)');
}

let count = 0;

function connectNodes(nodeFrom, nodeTo, engine) {
  //just to get id-like structure
  count++;
  const portOut = nodeFrom.addPort(
    new DefaultPortModel(true, `${nodeFrom.name}-out-${count}`, 'Out'),
  );
  const portTo = nodeTo.addPort(
    new DefaultPortModel(false, `${nodeFrom.name}-to-${count}`, 'IN'),
  );
  return portOut.link(portTo);

  // ################# UNCOMMENT THIS LINE FOR PATH FINDING #############################
  // NOTE: THIS DOES NOT WORK AND IS TOO SLOW
  // return portOut.link(
  //   portTo,
  //   engine.getLinkFactories().getFactory(PathFindingLinkFactory.NAME),
  // );
  // #####################################################################################
}

export default function reduce(state = initialState, action = {}) {
  switch (action.type) {
    case 'SIM_UPDATE_RESULTS': {
      let flowEngine = null;
      let flowModel = null;
      if (action.results.flow) {
        flowEngine = createEngine();

        //2) setup the diagram model
        flowModel = new DiagramModel();

        //3) create a default nodes
        let nodeMap = {};
        action.results.flow.nodes.forEach((item) => {
          nodeMap[item.name] = createNode(item.name);
        });

        //4) link nodes together
        let links = [];
        action.results.flow.edges.forEach((tuple) => {
          links.push(
            connectNodes(nodeMap[tuple[0]], nodeMap[tuple[1]], flowEngine),
          );
        });

        // initial random position
        Object.values(nodeMap).forEach((node, index) => {
          node.setPosition(index * 70, index * 70);
          flowModel.addNode(node);
        });

        links.forEach((link) => {
          flowModel.addLink(link);
        });

        flowEngine.setModel(flowModel);
      }
      let status = 'success';
      if (action.results.error) {
        status = 'error';
      }
      return {
        ...state,
        results: action.results,
        status: status,
        flowEngine: flowEngine,
        flowModel: flowModel,
      };
    }

    case 'SET_SIM_STATUS': {
      return {
        ...state,
        status: action.status,
      };
    }

    case 'INCREMENT_FORCE_UPDATE_COUNTER': {
      return {
        ...state,
        forceUpdateCounter: state.forceUpdateCounter++,
      };
    }
    default:
      return state;
  }
}
