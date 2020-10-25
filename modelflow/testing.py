from types import SimpleNamespace


class ModelUnitTest():
    def setup_model(self, model):
        self.model = model
        self.io = SimpleNamespace()
        self.params = {}
        if 'params' in model.definition:
            for params in model.definition['params']:
                self.params[params['key']] = params['value']
        self.params = SimpleNamespace(**self.params)

        self.states = {}
        if 'states' in model.definition:
            for state in model.definition['states']:
                self.states[state['key']] = state['value']
        self.states = SimpleNamespace(**self.states)
        self.data = []

    def run_step(self):
        self.model.run_step(self.io, self.params, self.states, self.data)
