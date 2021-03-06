from pprint import pprint
from types import SimpleNamespace
from treelib import Node, Tree
import importlib


class SimulationError(Exception):
    pass


DEFAULT_MAX_STEPS = 1000


class Utils:
    def __init__(self, instance_info, model_instance_map, private_states_map, tree, params):
        self.instance_info = instance_info
        self.model_instance_map = model_instance_map
        self.tree = tree
        self.private_states_map = private_states_map
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

    def get_instance_key(self):
        return self.instance_info["key"]

    def change_parent_to(self, new_parent_key):
        from_key = self.instance_info["key"]
        if new_parent_key not in self.model_instance_map:
            raise SimulationError(f"Cannot move '{from_key}' since destination key '{new_parent_key}' does not exist")

        self.tree.move_node(from_key, new_parent_key)

    def sum_children_attribute(self, field_key):
        tree = self.tree.subtree(self.instance_info["key"])
        the_sum = 0
        for node in tree.expand_tree():
            # Add the attribute whether it is a private state or param
            the_sum += self.private_states_map[tree[node].tag].get(field_key, 0)
            the_sum += getattr(self.params[tree[node].tag], field_key, 0)

        return the_sum

    def has_parent_instance_named(self, name):
        node = self.tree.get_node(self.instance_info["key"])
        while not node.is_root():
            parent_id = node.predecessor(self.tree.identifier)
            node = self.tree.get_node(parent_id)
            if node.tag == name:
                return True
        return False


class StateFetcher:
    def __init__(self, key, tree, shared_states_map, private_state_map):
        # Set the instance dictionary directly to avoid calls to __setattr__ during initialization
        self.__dict__["_key"] = key
        self.__dict__["_tree"] = tree
        self.__dict__["_shared_states_map"] = shared_states_map
        self.__dict__["_private_state_map"] = private_state_map

    def __getattr__(self, name):
        # Check to see if it might be a private state
        # If so, then just check the private map
        if name in self._private_state_map:
            return self._private_state_map[name]

        if name in self._shared_states_map[self._key]:
            return self._shared_states_map[self._key][name]

        instance_key = self.get_closest_instance_key(name)
        return self._shared_states_map[instance_key][name]

    def __setattr__(self, name, value):
        if name in self._private_state_map:
            self._private_state_map[name] = value
            return

        if name in self._shared_states_map[self._key]:
            self._shared_states_map[self._key][name] = value
            return

        instance_key = self.get_closest_instance_key(name)
        self._shared_states_map[instance_key][name] = value

    def get_closest_instance_key(self, name):
        # TODO: Use caching when there is no state changes to make this way faster

        node = self._tree.get_node(self._key)
        while not node.is_root():
            parent_id = node.predecessor(self._tree.identifier)
            node = self._tree.get_node(parent_id)
            tree = self._tree.subtree(node.tag)
            for key in tree.expand_tree():
                for state_name in self._shared_states_map[key]:
                    if state_name == name:
                        return key
        raise Exception(f"Sim state key not found {key}")


def run_scenario(scenario):

    validate_scenario(scenario)
    setup_scenario_classes(scenario)

    # Add the unique from the model_instances map to the values
    for key, value in scenario["model_instances"].items():
        value["key"] = key
    model_instances_values = scenario["model_instances"].values()

    max_steps = setup_global_sim_params(scenario)

    tree = create_tree(scenario["model_instances"])
    shared_states_map, private_states_map, params, utils_map = setup_vars_and_utils(scenario["model_instances"], tree)

    states_output, tree_outputs = init_outputs(shared_states_map, private_states_map)

    try:
        for _ in range(max_steps):
            for instance_info in model_instances_values:
                if not hasattr(instance_info["model_class"], "run_step"):
                    continue

                key = instance_info["key"]
                # TODO: as a performance optimization we probably don't need to instantiate this every time
                state_fetcher = StateFetcher(key, tree, shared_states_map, private_states_map[key])
                instance_info["model_class"].run_step(state_fetcher, params[key], utils_map[key])

                for field_key in private_states_map[key]:
                    states_output[key][field_key].append(private_states_map[key][field_key])

                for field_key in shared_states_map[key]:
                    states_output[key][field_key].append(shared_states_map[key][field_key])

            tree_out = tree.to_dict(with_data=False)
            tree_outputs.append(tree_out)
    except SimulationError as e:
        return dict(error=str(e))

    return dict(states=states_output, trees=tree_outputs)


def get_params(scenario):
    setup_scenario_classes(scenario)

    params = []
    index = 0
    for info in scenario["model_instances"].values():
        actual_instance = info["model_class"]
        if hasattr(actual_instance, "params"):
            for param in actual_instance.params:
                if not "key" in param:
                    continue
                if not "value" in param:
                    continue
                param["agent"] = actual_instance.__name__
                param["new_key"] = f"{actual_instance.__name__}_{param['key']}"
                param["index"] = index
                params.append(param)
                index += 1
    return params


def setup_scenario_classes(scenario):
    for info in scenario["model_instances"].values():
        if isinstance(info["model_class"], str):
            path, classname = info["model_class"].split("::")
            path = path.replace('.py','').replace('/','.')
            info["model_class"] = getattr(importlib.import_module(path), classname)


def setup_global_sim_params(scenario):
    max_steps = DEFAULT_MAX_STEPS
    if "simulation_params" in scenario:
        if "max_num_steps" in scenario["simulation_params"]:
            max_steps = scenario["simulation_params"]["max_num_steps"]
    return max_steps


def setup_vars_and_utils(model_instance_map, tree):
    shared_states_map = {}
    private_states_map = {}
    params = {}
    utils_map = {}
    for info in model_instance_map.values():

        actual_instance = info["model_class"]
        class_name = actual_instance.__name__
        instance_key = info["key"]

        param_map = {}
        if hasattr(actual_instance, "params"):
            for param in actual_instance.params:
                if not "key" in param:
                    raise Exception(f"A parameter in {class_name} has no key")

                if not "value" in param:
                    raise Exception(f"Parameter {param['key']} in {class_name} has no value")

                param_map[param["key"]] = param["value"]

        if not instance_key in shared_states_map:
            shared_states_map[instance_key] = {}
            private_states_map[instance_key] = {}

        # NOTE: Another way to do this would be to have a is_private map

        if hasattr(actual_instance, "states"):

            for state in actual_instance.states:
                if not "key" in state:
                    raise Exception(f"A state in {class_name} has no key")

                if not "value" in state:
                    raise Exception(f"state {state['key']} in {class_name} has no value")

                if "private" in state and state["private"]:
                    private_states_map[instance_key][state["key"]] = state["value"]
                else:
                    shared_states_map[instance_key][state["key"]] = state["value"]

        intersection = (
            param_map.keys() & shared_states_map[instance_key].keys() & private_states_map[instance_key].keys()
        )
        if len(intersection) > 0:
            raise Exception(f"Duplicate keys currently not supported. Found in {class_name}: {intersection}")

        for override_key, value in info.get("overrides", {}).items():
            if override_key in param_map:
                param_map[override_key] = value

            if override_key in shared_states_map[instance_key]:
                shared_states_map[instance_key][override_key] = value

            if override_key in private_states_map[instance_key]:
                private_states_map[instance_key][override_key] = value

        params[instance_key] = SimpleNamespace(**param_map)

        utils_map[instance_key] = Utils(info, model_instance_map, private_states_map, tree, params)

    return shared_states_map, private_states_map, params, utils_map


def init_outputs(shared_states_map, private_states_map):
    states_output = {}
    for instance_key, inner_map in private_states_map.items():
        states_output[instance_key] = {}
        for key in inner_map:
            states_output[instance_key][key] = []

    for instance_key, inner_map in shared_states_map.items():
        if instance_key not in states_output:
            states_output[instance_key] = {}
        for key in inner_map:
            states_output[instance_key][key] = []

    tree_outputs = []
    return states_output, tree_outputs


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
        if info.get("parent_instance_key", None) == key:
            tree.create_node(tag=info["key"], identifier=info["key"], parent=info.get("parent_instance_key", None))
            add_child_to_tree(info["key"], model_instance_map, tree)
