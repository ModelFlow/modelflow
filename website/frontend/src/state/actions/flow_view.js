// import createEngine, {
//   DiagramModel,
//   DefaultNodeModel,
//   DefaultPortModel,
//   NodeModel,
//   DagreEngine,
//   DiagramEngine,
//   PathFindingLinkFactory,
// } from '@projectstorm/react-diagrams';

// const initialState = {
//   results: {},
//   flowEngine: null,
//   flowModel: null,
//   forceUpdateCounter: 0,
// };

// function createNode(name) {
//   return new DefaultNodeModel(name, 'rgb(0,192,255)');
// }

// let count = 0;

// function connectNodes(nodeFrom, nodeTo) {
//   //just to get id-like structure
//   count++;
//   const portOut = nodeFrom.addPort(
//     new DefaultPortModel(true, `${nodeFrom.name}-out-${count}`, 'Out'),
//   );
//   const portTo = nodeTo.addPort(
//     new DefaultPortModel(false, `${nodeFrom.name}-to-${count}`, 'IN'),
//   );
//   return portOut.link(portTo);

//   // ################# UNCOMMENT THIS LINE FOR PATH FINDING #############################
//   // return portOut.link(portTo, engine.getLinkFactories().getFactory(PathFindingLinkFactory.NAME));
//   // #####################################################################################
// }

// export default function reduce(state = initialState, action = {}) {
//   switch (action.type) {
//     case 'SIM_UPDATE_RESULTS': {
//       let flowEngine = createEngine();

//       //2) setup the diagram model
//       let flowModel = new DiagramModel();

//       //3) create a default nodes
//       let nodesFrom = [];
//       let nodesTo = [];

//       nodesFrom.push(createNode('from-1'));
//       nodesFrom.push(createNode('from-2'));
//       nodesFrom.push(createNode('from-3'));

//       nodesTo.push(createNode('to-1'));
//       nodesTo.push(createNode('to-2'));
//       nodesTo.push(createNode('to-3'));

//       //4) link nodes together
//       let links = nodesFrom.map((node, index) => {
//         return connectNodes(node, nodesTo[index], flowEngine);
//       });

//       // more links for more complicated diagram
//       links.push(connectNodes(nodesFrom[0], nodesTo[1], flowEngine));
//       links.push(connectNodes(nodesTo[0], nodesFrom[1], flowEngine));
//       links.push(connectNodes(nodesFrom[1], nodesTo[2], flowEngine));

//       // initial random position
//       nodesFrom.forEach((node, index) => {
//         node.setPosition(index * 70, index * 70);
//         flowModel.addNode(node);
//       });

//       nodesTo.forEach((node, index) => {
//         node.setPosition(index * 70, 100);
//         flowModel.addNode(node);
//       });

//       links.forEach((link) => {
//         flowModel.addLink(link);
//       });

//       flowEngine.setModel(flowModel);

//       // this.engine = new DagreEngine({
//       //   graph: {
//       //     rankdir: 'RL',
//       //     ranker: 'longest-path',
//       //     marginx: 25,
//       //     marginy: 25,
//       //   },
//       //   includeLinks: true,
//       // });

//       // this.forceUpdate();

//       // setTimeout(() => {
//       //   this.autoDistribute();
//       // }, 10);


//       return {
//         ...state,
//         results: action.results,
//         flowEngine: flowEngine,
//         flowModel: flowModel,
//       };
//     }
//     case 'INCREMENT_FORCE_UPDATE_COUNTER': {
//       return {
//         ...state,
//         forceUpdateCounter: state.forceUpdateCounter++,
//       };
//     }
//     default:
//       return state;
//   }
// }
