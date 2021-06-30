# <project>/<app>/management/commands/seed.py
import os
import sys
import json
import inspect
import importlib
import pathlib
from django.core.management.base import BaseCommand
from api.models import Project, Scenario, ModelClass, DefaultAttribute, ModelInstance, InstanceAttributeOverride, Template


class Command(BaseCommand):
    help = "seed database for testing and development."

    def add_arguments(self, parser):
        # parser.add_argument('--path', type=str, help="Path", required=True)
        pass

    def handle(self, *args, **options):
        self.stdout.write('Importing project...')
        # load_mars_project(self, options['path'])
        load_project(self)
        self.stdout.write('Done')


def load_project(self):

    # DEBUG
    modelflow_root = pathlib.Path(__file__).parents[6]
    print(f'modelflow: {modelflow_root}')

    project_name = os.path.basename('test')
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

    templates_dir = os.path.join(project_dir, 'templates')
    default_template_path = os.path.join(templates_dir, 'default_template.json')
    template_obj = None
    if os.path.exists(default_template_path):
        with open(default_template_path, 'r') as f:
            template_obj = Template.objects.create(
                name='Default', 
                json_data=json.dumps(json.load(f)), 
                project=project
        )

    # Add to the python path so we can import the classes
    print(project_dir)
    sys.path.insert(0, project_dir)

    print("Loading classes...")
    for filename in os.listdir(os.path.join(project_dir, 'model_classes')):
        if filename[0] in ['.','_']:
            continue
        print(filename)
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
            print(run_step_code)
            final_run_step_code = ''
            for i, line in enumerate(run_step_code.split('\n')):
                if i == 0:
                    continue
                final_run_step_code += line[4:] + '\n'

            print(final_run_step_code)

            model_class = ModelClass.objects.filter(key=key, project=project).first()
            if model_class is None:
                model_class = ModelClass.objects.create(
                    key=key,
                    label=name,
                    description=notes,
                    project=project,
                    run_step_code=final_run_step_code)

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
            scenario = Scenario.objects.create(
                name=name, 
                project=project,
                default_template=template_obj
            )
            print(scenario.id)
        for info in scenario_json['model_instances']:
            model_class = ModelClass.objects.get(
                project=project,
                key=info['model_class']['key']
            )
            print(f"creating: {info['key']} {scenario.id}")
            model_instance = ModelInstance.objects.create(
                key=info['key'],
                label=info['key'],
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
                InstanceAttributeOverride.objects.create(
                    model_instance=model_instance,
                    default_attribute=default_attribute,
                    value=str(override_value),
                )
