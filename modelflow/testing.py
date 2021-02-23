from types import SimpleNamespace

class SimulationError(Exception):
    pass

class MockUtils:
    
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
    def setup_model(self, model, states={}):
        self.model = model

        params = {}
        if hasattr(model, 'params'):
            for p in model.params:
                params[p['key']] = p['value']
        self.params = SimpleNamespace(**params)

        tmp_states = {}
        if hasattr(model, 'states'):
            for state in model.states:
                tmp_states[state['key']] = state['value']
        
        print(tmp_states)
        # Override any initial passed in shared states
        for key in states:
            tmp_states[key] = states[key]

        self.states = SimpleNamespace(**tmp_states)

    def run_step(self):
        self.model.run_step(self.states, self.params, MockUtils())
