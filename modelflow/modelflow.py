from pprint import pprint
from types import SimpleNamespace 
from treelib import Node, Tree


class SimulationError(Exception):
    pass

DEFAULT_MAX_STEPS = 1000

class Utils:

    def __init__(self, instance_info, model_instance_map, tree, private_states, params):
        self.instance_info = instance_info
        self.model_instance_map = model_instance_map
        self.tree = tree
        self.private_states = private_states
        self.params = params
    
    def log_event(self, msg):
        # TODO: Implement log event properly
        print(msg)

    def log_warning(self, msg):
        # TODO: Implement log warning properly
        print(msg)

    def terminate_sim_with_error(self, msg):
        # TODO: Implement terminate sim properly
        print(msg)
        raise SimulationError(msg)

    def log_metric(self, name="", value=0, units=""):
        # TODO: Implement log metric properly
        print("Logging metrics not implemented yet")
        return

    def change_parent_to(self, new_parent_key):
        from_key = self.instance_info['key']
        if new_parent_key not in self.model_instance_map:
            raise SimulationError(f"Cannot move '{from_key}' since destination key '{new_parent_key}' does not exist")

        self.tree.move_node(from_key, new_parent_key)

    def sum_children_attribute(self, field_key):
        tree = self.tree.subtree(self.instance_info['key'])
        the_sum = 0
        for node in tree.expand_tree():
            # Add the attribute whether it is a private state or param
            the_sum += getattr(self.private_states[tree[node].tag], field_key, 0)
            the_sum += getattr(self.params[tree[node].tag], field_key, 0)
        
        return the_sum

def run_scenario(scenario):

    validate_scenario(scenario)

    # Add the unique from the model_instances map to the values
    for key, value in scenario['model_instances'].items():
        value['key'] = key
    model_instances_values = scenario['model_instances'].values()

    max_steps = setup_global_sim_params(scenario)

    tree = create_tree(scenario['model_instances'])
    
    shared_states_map, shared_states, private_states_map, private_states, _, params, utils_map = \
        setup_vars_and_utils(scenario['model_instances'], tree)

    shared_states_output, private_states_output, tree_outputs = init_outputs(shared_states_map, private_states_map)
    try:
        for _ in range(max_steps):
            for instance_info in model_instances_values:            
                key = instance_info['key']

                instance_info['model_class'].run_step(
                    shared_states, private_states[key], params[key], "TODO", utils_map[key])

                for field_key in private_states_map[key]:
                    private_states_output[key][field_key].append(getattr(private_states[key], field_key))

            for key in shared_states_map:
                shared_states_output[key].append(getattr(shared_states, key))

            tree_out = tree.to_dict(with_data=False)
            tree_outputs.append(tree_out)
    except SimulationError as e:
        return dict(error=str(e))

    return dict(shared_states=shared_states_output, private_states=private_states_output, trees=tree_outputs)

def setup_global_sim_params(scenario):
    max_steps = DEFAULT_MAX_STEPS
    if "simulation_params" in scenario:
        if  "max_num_steps" in scenario["simulation_params"]:
            max_steps = scenario["simulation_params"]["max_num_steps"]
    return max_steps


def setup_vars_and_utils(model_instance_map, tree):
    shared_states_map = {}
    private_states_map = {}
    private_states = {}
    params_map = {}
    params = {}
    utils_map = {}
    for info in model_instance_map.values():

        actual_instance = info['model_class']
        class_name = actual_instance.__class__.__name__
        instance_key = info['key']

        param_map = {}
        if hasattr(actual_instance, 'params'):
            for param in actual_instance.params:
                if not 'key' in param:
                    raise Exception(f"A parameter in {class_name} has no key")

                if not 'value' in param:
                    raise Exception(f"Parameter {param['key']} in {class_name} has no value")

                param_map[param['key']] = param['value']

        shared_state_map = {}
        if hasattr(actual_instance, 'shared_states'):
            for shared_state in actual_instance.shared_states:
                if not 'key' in shared_state:
                    raise Exception(f"A shared_state in {class_name} has no key")

                if not 'value' in shared_state:
                    raise Exception(f"shared_state {param['key']} in {class_name} has no value")

                shared_state_map[shared_state['key']] = shared_state['value']

        private_state_map = {}
        if hasattr(actual_instance, 'private_states'):
            for private_state in actual_instance.private_states:
                if not 'key' in private_state:
                    raise Exception(f"A private_state in {class_name} has no key")

                if not 'value' in private_state:
                    raise Exception(f"private_state {param['key']} in {class_name} has no value")

                private_state_map[private_state['key']] = private_state['value']

        intersection = param_map.keys() & shared_state_map.keys() & private_state_map.keys()
        if len(intersection) > 0:
            raise Exception(f"Duplicate keys currently not supported. Found in {class_name}: {intersection}")

        for override_key, value in info.get("overrides", {}).items():
            if override_key in param_map:
                param_map[override_key] = value

            if override_key in shared_state_map:
                shared_state_map[override_key] = value

            if override_key in private_state_map:
                print("inside overriding private state")
                print(override_key, value)
                private_state_map[override_key] = value

        params_map[instance_key] = param_map
        params[instance_key] = SimpleNamespace(**param_map)
        private_states_map[instance_key] = private_state_map
        private_states[instance_key] = SimpleNamespace(**private_state_map)

        for state_key, value in shared_state_map.items():
            shared_states_map[state_key] = value

        print(tree)
        utils_map[instance_key] = Utils(info, model_instance_map, tree, private_states, params_map)

    shared_states = SimpleNamespace(**shared_states_map)

    return shared_states_map, shared_states, private_states_map, private_states, params_map, params, utils_map

def init_outputs(shared_states_map, private_states_map):
    shared_states_output = {}
    for key in shared_states_map:
        shared_states_output[key] = []

    private_states_output = {}
    for instance_key, inner_map in private_states_map.items():
        private_states_output[instance_key] = {}
        for key in inner_map:
            private_states_output[instance_key][key] = []

    tree_outputs = []
    return shared_states_output, private_states_output, tree_outputs

def validate_scenario(scenario):
    if not "model_instances" in scenario:
        raise Exception("No model_instances key in scenario")

    for info in scenario:
        pass


def create_tree(model_instance_map):
    tree = Tree()
    # This ensures that when the tree is created, children always have a parent to reference
    add_child_to_tree(None, model_instance_map, tree)
    return tree

def add_child_to_tree(key, model_instance_map, tree):
    for info in model_instance_map.values():
        if info.get('parent_instance_key', None) == key:
            tree.create_node(tag=info['key'], identifier=info['key'], parent=info.get('parent_instance_key', None))
            add_child_to_tree(info['key'], model_instance_map, tree)
