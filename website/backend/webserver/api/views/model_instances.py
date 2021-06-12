from django.http import JsonResponse
from ..models import ModelInstance, Template, Scenario, Project, ModelClass, DefaultAttribute
import json
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
@require_POST
def new_model_instance(request):
    body = json.loads(request.body)
    scenario = Scenario.objects.filter(id=int(body['scenarioId'])).first()
    if scenario is None:
        return JsonResponse({'error': 'scenario could not be found'})
    
    model_class = ModelClass.objects.filter(id=int(body['modelClassId'])).first()
    if model_class is None:
        return JsonResponse({'error': 'model_class could not be found'})

    # Note it is ok if it is None that means it is root level
    parent_instance = ModelInstance.objects.filter(id=int(body['parentInstanceId'])).first()
    initial_parent_key = ''
    if parent_instance is not None:
        initial_parent_key = parent_instance.key

    existing_instance_count = ModelInstance.objects.filter(
        model_class=model_class,
        scenario=scenario).count()

    key = model_class.key.lower()
    if existing_instance_count > 0:
        key += f'{existing_instance_count + 1}'
    model_instance = ModelInstance.objects.create(
        key=key,
        label=key,
        scenario=scenario,
        model_class=model_class,
        initial_parent_key=initial_parent_key,
    )
    return JsonResponse(dict(id=model_instance.id))
