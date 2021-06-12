from django.http import JsonResponse
from ..models import Project, ModelClass, DefaultAttribute
import json
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from pprint import pprint
import pathlib
import os


@csrf_exempt
@require_POST
def new_model_class(request):
    body = json.loads(request.body)
    project = Project.objects.filter(id=int(body['project'])).first()
    if project is None:
        return JsonResponse({'error': 'project could not be found'})
    
    key = body['name'].replace(' ', '_').replace('-','_')
    model_class = ModelClass.objects.filter(key=key, project=project).first()
    if model_class is None:
        model_class = ModelClass.objects.create(
            key=key,
            label=body['name'],
            description=body['description'],
            project=project,
            run_step_code=body['code'])
    else:
        raise Exception("ModelClass already exists. TODO")

    for param in body['parameters']:
        param['kind'] = 'param'

    for state in body['states']:
        state['kind'] = 'state'
    for item in body['parameters'] + body['states']:
        DefaultAttribute.objects.create(
            key=item['key'],
            label=item['label'],
            dtype=item['dtype'],
            units=item.get('units'),
            kind=item['kind'],
            is_private=item.get('private', False),
            value=str(item['value']),
            confidence=item.get('confidence', 0),
            notes=item.get('notes', ''),
            source=item.get('source', ''),
            model_class=model_class
        )

    # https://stackoverflow.com/questions/5362771/how-to-load-a-module-from-code-in-a-string
    # Note: we probably want to save the code file here as that can then help with local iteration... but then we risk getting out of sync with the database...
    # Note: We could check to see when running whether the code is equal to the file!
    # Then ask the user to either upload or overwrite.

    modelflow_root = pathlib.Path(__file__).parents[5]
    projects_folder = os.path.join(modelflow_root, 'projects')
    if not os.path.exists(projects_folder):
        os.mkdir(projects_folder)
    project_folder = os.path.join(projects_folder, project.name) 
    if not os.path.exists(project_folder):
        os.mkdir(project_folder)

    model_classes_dir = os.path.join(project_folder, 'model_classes')
    if not os.path.exists(model_classes_dir):
        os.mkdir(model_classes_dir)
    
    write_file_for_model_class(model_classes_dir, model_class)

    return JsonResponse({'id': model_class.id})

def write_file_for_model_class(model_classes_dir, model_class):
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

    model_class_text += '    @staticmethod\n'
    for line in model_class.run_step_code.split('\n'):
        model_class_text += '    ' + line + '\n'

    with open(os.path.join(model_classes_dir, f'{model_class.key}.py'), 'w') as f:
        f.write(model_class_text)
