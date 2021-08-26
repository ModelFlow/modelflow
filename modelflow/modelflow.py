import os
import sys
import copy
import time
from pprint import pprint
from types import SimpleNamespace
from treelib import Node, Tree
import importlib
import traceback


class SimulationError(Exception):
    pass

class SimStoppingError(Exception):
    pass

DEFAULT_MAX_STEPS = 1000

# Prep data for Plotly TreeView component
# NOTE: Ideally just have create_tree() return treeview data,
# but unfortunatley I didn't have time getting recursion changes 
# # to stick, so that's why using global var in meantime... -HH
TREEVIEW_DATA = [[], []]

class Utils:

    step_num = 0

    def __init__(self, instance_info, model_instance_map, private_states_map, tree, params, scenario_runner):
        self.instance_info = instance_info
        self.model_instance_map = model_instance_map
        self.tree = tree
        self.private_states_map = private_states_map
        self.params = params
        self.scenario_runner = scenario_runner

    def log(self, msg):
        # TODO: Implement log properly
        print(msg)
        pass

    def log_event(self, msg):
        # TODO: Implement log event properly
        print(msg)
        pass

    def log_warning(self, msg):
        # TODO: Implement log warning properly
        print(msg)
        pass

    def terminate_sim_with_error(self, msg):
        # TODO: Implement terminate sim properly
        print(msg)
        raise SimulationError(msg)

    def log_metric(self, name="", value=0, units=""):
        # TODO: Implement log metric properly
        # print("Logging metrics not implemented yet")
        return

    def get_instance_key(self):
        return self.instance_info["key"]

    def change_parent_to(self, new_parent_key):
        from_key = self.instance_info["key"]
        if new_parent_key not in self.model_instance_map:
            raise SimulationError(f"Cannot move '{from_key}' since destination key '{new_parent_key}' does not exist")

        self.tree.move_node(from_key, new_parent_key)

        # After a move we need to reset the key lookup cache
        # so we don't incorrectly change some other state
        self.scenario_runner.key_lookup_cache = {}

    def sum_children_attribute(self, field_key):
        tree = self.tree.subtree(self.instance_info["key"])
        the_sum = 0
        for node in tree.expand_tree():
            # Add the attribute whether it is a private state or param
            the_sum += self.private_states_map[tree[node].tag].get(field_key, 0)
            the_sum += getattr(self.params[tree[node].tag], field_key, 0)

        return the_sum

    def has_a_parent_instance_named(self, name):
        node = self.tree.get_node(self.instance_info["key"])
        while not node.is_root():
            parent_id = node.predecessor(self.tree.identifier)
            node = self.tree.get_node(parent_id)
            if node.tag == name:
                return True
        return False

    def parent_is(self, name):
        node = self.tree.get_node(self.instance_info["key"])
        parent_id = node.predecessor(self.tree.identifier)
        node = self.tree.get_node(parent_id)
        if node.tag == name:
            return True
        return False


class StateFetcher:
    def __init__(self, key, tree, shared_states_map, private_state_map, scenario_runner, old_map):
        # Set the instance dictionary directly to avoid calls to __setattr__ during initialization
        self.__dict__["_key"] = key
        self.__dict__["_tree"] = tree
        self.__dict__["_shared_states_map"] = shared_states_map
        self.__dict__["_private_state_map"] = private_state_map
        self.__dict__["_scenario_runner"] = scenario_runner
        self.__dict__["_old_map"] = old_map

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
        if (instance_key, name) not in self._old_map:
            self._old_map[(instance_key, name)] = copy.deepcopy(self._shared_states_map[instance_key][name])
        self._shared_states_map[instance_key][name] = value

    def get_closest_instance_key(self, name):
        if (self._key, name) in self._scenario_runner.key_lookup_cache:
            return self._scenario_runner.key_lookup_cache[(self._key, name)]

        node = self._tree.get_node(self._key)
        while not node.is_root():
            parent_id = node.predecessor(self._tree.identifier)
            node = self._tree.get_node(parent_id)
            tree = self._tree.subtree(node.tag)
            for key in tree.expand_tree():
                if key in self._shared_states_map:
                    for state_name in self._shared_states_map[key]:
                        if state_name == name:
                            self._scenario_runner.key_lookup_cache[(self._key, name)] = key
                            return key
        all_states = []
        for info in self._shared_states_map.values():
            for key in info:
                all_states.append(key)
        all_states += list(self._private_state_map.keys())
        print("List of all states:")
        print(sorted(all_states))
        raise Exception(f"No state exists with the key '{name}'. You probably have a typo. Check out the above list of states.")

class ScenarioRunner():
    def __init__(self):
        self.key_lookup_cache = {}

    def setup_and_run_sim(self, scenario, model_library_path='', outputs_filter=[]):
        # Add the unique from the model_instances map to the values
        # if the format is a dictionary. Note on the web the format is a list.
        if isinstance(scenario['model_instances'], dict):
            for key, value in scenario["model_instances"].items():
                value["key"] = key
            scenario["model_instances"] = scenario["model_instances"].values()

        validate_scenario(scenario)
        setup_scenario_classes(scenario, model_library_path)

        max_steps = setup_global_sim_params(scenario)
        print(f'using max steps: {max_steps}')

        model_instance_map = {x['key']: x for x in scenario['model_instances']}

        tree = create_tree(model_instance_map)
        print(tree)
        # NOTE: Expect TREEVIEWDATA to be updated at this point
        shared_states_map, private_states_map, params, utils_map = setup_vars_and_utils(model_instance_map, tree, self)
        # shared_states_map:
        # - the instance name
        # -- the state key
        states_output, tree_outputs = init_outputs(shared_states_map, private_states_map)
        sim_error = None
        # Using the try/catch instead of a return to break loop
        # TODO: Differentiate between simulation errors and other errors
        ith_iter = 0
        delta_outputs = {}
        try:        
            for ith_iter in range(max_steps):
                # t1 = time.time()
                # print(f"ITERATION NUMBER: {ith_iter}")
                for instance_info in scenario["model_instances"]:
                    if not hasattr(instance_info["model_class"], "run_step"):
                        continue

                    key = instance_info["key"]
                    # TODO: as a performance optimization we probably don't need to instantiate this every time
                    old_map = {}
                    state_fetcher = StateFetcher(key, tree, shared_states_map, private_states_map[key], self, old_map)
                    
                    # if outputs_filter is not None:
                    # state_map_copy = copy.deepcopy(shared_states_map)
                    try:
                        util_instance = utils_map[key]
                        util_instance.step_num = ith_iter
                        instance_info["model_class"].run_step(state_fetcher, params[key], util_instance)
                    except SimulationError as e:
                        raise SimStoppingError(e)
                    except Exception as e:
                        tstr = traceback.format_exc()
                        print(f"Model: '{instance_info['model_class'].__name__}' encountered an error!\n{tstr}")
                        raise SimStoppingError(e)
                    
                    # goal: human1___indoor1___atmo_o2_delta
                    # if ith_iter > 0:
                    for instance_key in shared_states_map:
                        for field_key in shared_states_map[instance_key]:
                            new = shared_states_map[instance_key][field_key]
                            # old = states_output[instance_key][field_key][-1]
                            if (instance_key, field_key) in old_map:
                                old = old_map[(instance_key, field_key)]
                                #old = old_map[]
                                # if new != old:
                                # print(key, instance_key, field_key, new, old, new-old)
                                # TODO: Handle case that this may not change every timestamp or start at t0
                                delta_key = f'{key}___{instance_key}__{field_key}_deltas'
                                if delta_key not in delta_outputs:
                                    delta_outputs[delta_key] = []
                                delta_outputs[delta_key].append(new - old)
                    
                    # NOTE: This works because the shared state is only incremented once per timestamp
                    # because there is only one unique instance where the state can live.
                    for field_key in private_states_map[key]:
                        states_output[key][field_key].append(private_states_map[key][field_key])

                    for field_key in shared_states_map[key]:
                        states_output[key][field_key].append(shared_states_map[key][field_key])

                tree_out = tree.to_dict(with_data=False)
                tree_outputs.append(tree_out)
                # print(f"Took {time.time()-t1}")
        except SimStoppingError as e:
            sim_error = e

        final_output = dict(states=states_output, trees=tree_outputs, treeview_data = TREEVIEW_DATA, delta_outputs=delta_outputs)
        if sim_error is not None:
            print("GOT ERROR:")
            print(sim_error)
            final_output['error'] = f"Got to step { ith_iter } out of { max_steps }. {str(sim_error)}"
        return final_output
    

def run_scenario(scenario, model_library_path=''):
    return ScenarioRunner().setup_and_run_sim(scenario, model_library_path)

# I think this method is deprecated
def get_params(scenario, model_library_path):
    setup_scenario_classes(scenario, model_library_path)

    params = []
    index = 0
    for info in scenario["model_instances"]:
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


def setup_scenario_classes(scenario, model_library_path):
    if len(model_library_path) > 0:
        sys.path.insert(0, model_library_path)

    for info in scenario["model_instances"]:
        if 'model_class' in info and isinstance(info['model_class'], dict):
            if 'key' not in info['model_class']:
                raise Exception("model_class does not have a key")

            key = info['model_class']['key']
            info["model_class"] = getattr(importlib.import_module(key), key)


def setup_global_sim_params(scenario):
    max_steps = DEFAULT_MAX_STEPS
    if "max_steps" in scenario:
        try:
            max_steps = int(scenario['max_steps'])
        except:
            pass

        if max_steps < 2:
            max_steps = DEFAULT_MAX_STEPS

    return max_steps


def setup_vars_and_utils(model_instance_map, tree, scenario_runner):
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

        utils_map[instance_key] = Utils(info, model_instance_map, private_states_map, tree, params, scenario_runner)

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
    global TREEVIEW_DATA
    TREEVIEW_DATA = [[], []] # Reset TreeView arrays
    tree.create_node(tag='root', identifier='root', parent=None)
    # This ensures that when the tree is created, children always have a parent to reference
    add_child_to_tree('root', model_instance_map, tree)

    # At this point TreeView data should be updated
    # print("--- NEW TREEVIEW LABELS " + str(len(TREEVIEW_DATA[0])) + ": " + str(TREEVIEW_DATA[0]))
    # print("--- NEW TREEVIEW PARENTS " + str(len(TREEVIEW_DATA[1])) + ": " + str(TREEVIEW_DATA[1]))
    return tree

# Update arrays (declared at top of this file) for Plotly TreeView
def add_child_to_tree(key, model_instance_map, tree):
    print('------------- HELLO! About to update tree, here is current tree... -------------')
    global TREEVIEW_DATA
    print(str(TREEVIEW_DATA))
    for info in model_instance_map.values():
        print('CURRENT INFO:')
        print(info)
        
        # TreeView CASE 1: Just root, so no parent
        if ("initial_parent_key" not in info) or (info['initial_parent_key'] is None) or (info['initial_parent_key'] == ""):
            info['initial_parent_key'] = 'root'

            TREEVIEW_DATA[0].append('root') # Label
            TREEVIEW_DATA[1].append("") # Parent

        # TreeView CASE 2: Add child and parent
        if info["initial_parent_key"] == key:
            parent = info["initial_parent_key"]
            tree.create_node(tag=info["key"], identifier=info["key"], parent=parent)
            
            TREEVIEW_DATA[0].append(info["key"]) # Label
            TREEVIEW_DATA[1].append(info["initial_parent_key"]) # Parent

            add_child_to_tree(info["key"], model_instance_map, tree) # Recurse

        

