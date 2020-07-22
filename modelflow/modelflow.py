from types import SimpleNamespace
import pandas as pd

class Model():
    def __init__(self):
        self.setup()

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

    for state in model.states:
        setattr(model, state.key, state.value)

    if hasattr(model, 'params'):
        _params = {}
        for param in model.params:
            _params[param.key] = param.value
            if param.value is None:
                raise Exception(f"Model {model.name} param {param.key} cannot be None")
        model._params = SimpleNamespace(**_params)
    else:
        model._params = None

    model.run_step(inputs, outputs, model._params, model)

def setup_models(models):
    models_dict = {}
    for model in models:
        if not issubclass(model.__class__, Model):
            raise Exception(f"{model.__class__.__name__} must be a subclass of Model")
        models_dict[model.name] = model

    for model in models:
        _states = {}
        for state in model.states:
            _states[state.key] = state.value
            setattr(model, state.key, state.value)
    return SimpleNamespace(**models_dict)

def run_simulation_inner(all_models, models_to_run, num_steps):

    # TODO improve speed
    all_outputs = []

    # We must do all states first 
    other_model_states = setup_models(all_models)

    name_model_map = {}
    for model in all_models:
        name_model_map[model.name] = model

    for model in all_models:
        if hasattr(model, 'params'):
            _params = {}
            for param in model.params:
                _params[param.key] = param.value
                print(model.name, param.key, param.value)
                if param.value is None:
                    raise Exception(f"Model {model.name} param {param.key} cannot be None")
            model._params = SimpleNamespace(**_params)
        else:
            model._params = None


        # for links state to inputs map


        if hasattr(model, 'external_state_inputs'):
            for state_name in model[self.external_state_inputs]:
                setattr(models.inputs, state_name, name_model_map


            model._inputs = SimpleNamespace()
            for inputstr in model.inputs:
                model_name, state_name = inputstr.split('.')
                for m in scenario['models']:
                    if m.name != model_name:
                        continue
                    # _inputs[state_name] = 
                    setattr(model._inputs,state_name,getattr(m._states, state_name))

            # SimpleNamespace(**_inputs)
        else:
            model._inputs = None

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
    print('---------')
    for i in range(num_steps):
        toutputs = dict(i=i)
        for model in all_models:
            if model not in models_to_run:
                continue
            if hasattr(model, 'run_step'):
                model.run_step(other_model_states, model._params, model)

        for model in all_models:
            for state in model.states:
                toutputs[state.key] = getattr(model, state.key)
        print(toutputs)
        all_outputs.append(toutputs)

    df = pd.DataFrame(all_outputs)
    df.to_csv('test.csv')
