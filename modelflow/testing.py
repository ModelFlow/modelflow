from types import SimpleNamespace

class SimulationError(Exception):
    pass

class Utils:
    
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
        raise Exception("NOT YET TESTABLE IN UNIT TESTS")

    def sum_children_attribute(self, field_key):
        raise Exception("NOT YET TESTABLE IN UNIT TESTS")

class ModelUnitTest():
    def setup_model(self, model, shared_states={}):
        self.model = model

        params = {}
        if hasattr(model, 'params'):
            for p in model.params:
                params[p['key']] = p['value']
        self.params = SimpleNamespace(**params)

        tmp_shared_states = {}
        if hasattr(model, 'shared_states'):
            for state in model.shared_states:
                tmp_shared_states[state['key']] = state['value']
        # Override any initial passed in shared states
        for key in shared_states:
            tmp_shared_states[key] = shared_states[key]

        self.shared_states = SimpleNamespace(**tmp_shared_states)

        private_states = {}
        if hasattr(model, 'private_states'):
            for state in model.private_states:
                private_states[state['key']] = state['value']
        self.private_states = SimpleNamespace(**private_states)

        self.data = []

    def run_step(self):
        self.model.run_step(self.shared_states, self.private_states, self.params, self.data, Utils())
