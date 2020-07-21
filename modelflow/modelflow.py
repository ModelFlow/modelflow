from types import SimpleNamespace

def obj(**kwargs):
    return SimpleNamespace(**kwargs)

class Model():
    def __init__(self):
        self.setup()

        if hasattr(self, 'params'):
            _params = {}
            for param in self.params:
                if not isinstance(param, ModelParam):
                    raise Exception("Invalid model param")
                _params[param.key] = param.value
                if param.value is None:
                    raise Exception(f"Model {self.name} param {param.key} cannot be None")
            self._params = SimpleNamespace(**_params)
        else:
            self._params = None

        if hasattr(self, 'states'):
            for state in self.states:
                setattr(self, state.key, state.value)

    def setup():
        raise NotImplementedError("Must Override")

class ModelParam():
    def __init__(self,
                 key=None,
                 label=None,
                 description=None,
                 units=None,
                 minimum=0,
                 maximum=0,
                 value=None,
                 notes=0,
                 required=True,
                 source="",
                 default_value=None):
        self.key = key
        self.label = label
        self.description = description
        self.units = units
        self.minimum = minimum
        self.maximum = maximum
        self.value = value
        self.notes = notes
        self.source = source
        self.required = required
        self.default_value = None


class ModelState():
    def __init__(self,
                 key=None,
                 label=None,
                 description=None,
                 units=None,
                 value=0,
                 notes=0,
                 default_value=None):
        self.key = key
        self.label = label
        self.description = description
        self.units = units
        self.value = value
        self.notes = notes
        self.default_value = None


def run_simulation(scenario):
    return run_simulation_inner(scenario['models'], scenario['models'], scenario['run_for_steps'])

def run_test_step(model, inputs, outputs):

    # for state in model.states:
    #     setattr(model, state.key, state.value)

    # if hasattr(model, 'params'):
    #     _params = {}
    #     for param in model.params:
    #         _params[param.key] = param.value
    #         if param.value is None:
    #             raise Exception(f"Model {model.name} param {param.key} cannot be None")
    #     model._params = SimpleNamespace(**_params)
    # else:
    #     model._params = None

    model.run_step(inputs, outputs, model._params, model)

def setup_models(model_infos):
    all_state = {}
    for model_info in model_infos:
        model = model_info['model']
        if not issubclass(model.__class__, Model):
            raise Exception(f"{model.__class__.__name__} must be a subclass of Model")
        for state in model.states:
            all_state[state.key] = state.value
    return SimpleNamespace(**all_state)

def run_simulation_inner(model_infos, models_to_run, num_steps):

    # TODO improve speed
    all_outputs = []

    # Secretly have a dict called all states
    # where the inputs and outputs are just that
    all_state = setup_models(model_infos)

    name_model_map = {}
    for model_info in model_infos:
        model = model_info['model']
        name_model_map[model.name] = model


    for model_info in model_infos:
        model = model_info['model']



        # for links state to inputs map
        model.inputs = SimpleNamespace()

        # if hasattr(model, 'linked_input_states'):
        #     for state_name in getattr(model, 'linked_input_states'):
        #         for link_name in model_info['links']:
        #             for state in models_dict[link_name].
        #             if 
        #         for model in all_models:

        #         setattr(model.inputs, state_name, getattr(other_model_states, ))


        #     model._inputs = SimpleNamespace()
        #     for inputstr in model.inputs:
        #         model_name, state_name = inputstr.split('.')
        #         for m in scenario['models']:
        #             if m.name != model_name:
        #                 continue
        #             # _inputs[state_name] = 
        #             setattr(model._inputs,state_name,getattr(m._states, state_name))

        #     # SimpleNamespace(**_inputs)
        # else:
        #     model._inputs = None

        # if hasattr(model, 'outputs'):
        #     _outputs = {}
        #     for outputstr in model.outputs:
        #         model_name, state_name = outputstr.split('.')
        #         for m in scenario['models']:
        #             if m.name != model_name:
        #                 continue
        #             _outputs[state_name] = getattr(m._states, state_name)
        #     model._outputs = SimpleNamespace(**_outputs)
        # else:
        #     model._outputs = None
        # print(model.name, model._inputs)
    for i in range(num_steps):
        toutputs = dict(i=i)
        for model_info in model_infos:
            model = model_info['model']
            # if model not in models_to_run:
            #     continue
            if hasattr(model, 'run_step'):
                # print(all_state)
                # NOTE: This hack only works with states being different names
                model.run_step(all_state, all_state, model._params, all_state)
                # print(all_state)

        for key, value in all_state.__dict__.items():
            toutputs[key] = value
        # print(toutputs)
        all_outputs.append(toutputs)
    return all_outputs
