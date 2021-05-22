# <project>/<app>/management/commands/seed.py
import os
import sys
import json
import inspect
import importlib
import pathlib
from django.core.management.base import BaseCommand
from api.models import Project, Scenario, ModelClass, DefaultAttribute, ModelInstance, AttributeOverride
# python manage.py seed --mode=refresh

class Command(BaseCommand):
    help = "seed database for testing and development."

    def add_arguments(self, parser):
        # parser.add_argument('--path', type=str, help="Path", required=True)
        pass

    def handle(self, *args, **options):
        self.stdout.write('Importing project...')
        # load_mars_project(self, options['path'])
        load_mars_project(self)
        self.stdout.write('Done')

def flush_db():
    Project.objects.all().delete()
    Scenario.objects.all().delete()
    ModelInstance.objects.all().delete()
    AttributeOverride.objects.all().delete()
    DefaultAttribute.objects.all().delete()
    ModelClass.objects.all().delete()

def load_mars_project(self):

    # DEBUG
    flush_db()
    modelflow_root = pathlib.Path(__file__).parents[6]
    print(f'modelflow: {modelflow_root}')

    project_name = os.path.basename('mars')
    project = Project.objects.create(name=project_name)

    projects_dir = os.path.join(modelflow_root, 'projects')
    if not os.path.exists(projects_dir):
        os.mkdir(projects_dir)
    project_dir = os.path.join(projects_dir, project_name)
    if not os.path.exists(project_dir):
        os.mkdir(project_dir)
    model_classes_dir = os.path.join(project_dir, 'model_classes')
    if not os.path.exists(model_classes_dir):
        os.mkdir(model_classes_dir)

    scenarios_dir = os.path.join(project_dir, 'scenarios')
    if not os.path.exists(scenarios_dir):
        os.mkdir(scenarios_dir)

    # Add to the python path so we can import the classes
    print(project_dir)
    sys.path.insert(0, project_dir)

    print("Loading classes...")
    for filename in os.listdir(os.path.join(project_dir, 'model_classes')):
        module = importlib.import_module(f"model_classes.{filename.replace('.py', '')}")
        for key in dir(module):
            # Skip builtin methods
            if key[0] == '_':
                continue
            instance = getattr(module, key)
            name = getattr(instance, 'name', key)
            notes = getattr(instance, 'notes', '')
            if notes == '':
                notes = getattr(instance, 'description', '')
            params = getattr(instance, 'params', [])
            states = getattr(instance, 'states', [])
            run_step_code = ''
            if hasattr(instance, 'run_step'):
                run_step_code = inspect.getsource(instance.run_step)

            should_make_class_file = False
            model_class = ModelClass.objects.filter(key=key, project=project).first()
            if model_class is None:
                model_class = ModelClass.objects.create(
                    key=key,
                    label=name,
                    description=notes,
                    project=project,
                    run_step_code=run_step_code)
                should_make_class_file = True

            # print(f"Processing {key}")

            for param in params:
                param['kind'] = 'param'
            for state in states:
                state['kind'] = 'state'
            for item in params + states:
                if not 'key' in item or not 'value' in item:
                    print("invalid param no key or value")
                    continue
                # print(f"saving default attribute {item['key']} {item['kind']}")
                DefaultAttribute.objects.create(
                    key=item['key'],
                    label=item.get('label'),
                    dtype=type(item['value']).__name__,
                    units=item.get('units'),
                    kind=item['kind'],
                    is_private=item.get('private', False),
                    value=str(item['value']),
                    confidence=item.get('confidence', 0),
                    notes=item.get('notes', ''),
                    source=item.get('source', ''),
                    model_class=model_class
                )

            if should_make_class_file:
                write_file_from_model_class_id(model_classes_dir, model_class.id)

    print("Loading scenarios...")
    for filename in os.listdir(os.path.join(project_dir, 'scenarios')):
        if '.json' not in filename:
            continue

        scenario_json = None
        with open(os.path.join(project_dir, 'scenarios', filename), 'r') as f:
            scenario_json = json.load(f)

        name = filename.replace('.json', '')
        print('------------------------')
        print(filename)
        scenario = Scenario.objects.filter(name=name, project=project).first()
        if scenario is None:
            scenario = Scenario.objects.create(name=name, project=project)
            print(scenario.id)
        for info in scenario_json['model_instances']:
            model_class = ModelClass.objects.get(
                project=project,
                key=info['model_class_meta']['key']
            )
            model_instance = ModelInstance.objects.create(
                key=info['key'],
                label=info['label'],
                scenario=scenario,
                initial_parent_key=info.get('initial_parent_key', 'root'),
                model_class=model_class
            )
            # print("overrides:")
            # print(info.get("overrides", {}))
            for override_key, override_value in info.get("overrides", {}).items():
                default_attribute = DefaultAttribute.objects.get(
                    key=override_key,
                    model_class=model_class,
                )
                AttributeOverride.objects.create(
                    model_instance=model_instance,
                    default_attribute=default_attribute,
                    value=str(override_value),
                )

def write_file_from_model_class_id(model_classes_dir, model_class_id):
    model_class = ModelClass.objects.filter(id=model_class_id).first()
    if model_class is None:
        raise Exception("Could not find model class!")

    model_class_text = ''
    # TODO: Handle imports

    model_class_text += f'class {model_class.key}:\n'
    model_class_text += f'    name = "{model_class.label}"\n'

    default_params = []
    default_states = []

    for attribute in DefaultAttribute.objects.filter(model_class=model_class):
        value = attribute.value
        dtype = attribute.dtype
        if dtype in ['int']:
            value = int(value)
        elif dtype in ['float']:
            value = float(value)
        obj = dict(
            key=attribute.key,
            label=attribute.label,
            units=attribute.units,
            private=attribute.is_private,
            value=value,
            confidence=attribute.confidence,
            notes=attribute.notes,
            source=attribute.source
        )
        if attribute.kind == 'param':
            default_params.append(obj)
        else:
            default_states.append(obj)

    for part in [['params', default_params], ['states', default_states]]:
        json_str = json.dumps(part[1], indent=4)
        json_str = json_str.replace(': false', ': False')
        json_str = json_str.replace(': true', ': True')
        json_str = json_str.replace(': null', ': ""')

        json_str = part[0] + ' = ' + json_str
        lines = json_str.split('\n')
        new_lines = []
        for line in lines:
            new_lines.append('    ' + line)
        model_class_text += '\n'.join(new_lines)

        model_class_text += '\n'

    model_class_text += model_class.run_step_code

    with open(os.path.join(model_classes_dir, f'{model_class.key}.py'), 'w') as f:
        f.write(model_class_text)
