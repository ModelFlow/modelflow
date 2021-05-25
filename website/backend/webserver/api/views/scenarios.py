from django.http import JsonResponse
from ..models import ModelInstance, Template, Scenario
import json
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from pprint import pprint


@csrf_exempt
@require_POST
def save_as_scenario(request):
    body = json.loads(request.body)
    scenario = Scenario.objects.filter(id=int(body['scenario_id'])).first()
    if scenario is None:
        return JsonResponse({'error': 'Could not find scenario with id'})
    
    project = scenario.project
    if project is None:
        return JsonResponse({'error': 'Project for scenario was none'})

    # This is the django recommended method of copying an object
    scenario.name = body['name']
    scenario.max_steps = body['current_scenario']['max_steps']
    scenario.pk = None
    scenario.save()

    for model_instance_info in body['current_scenario']['model_instances']:
        model_instance = ModelInstance.objects.filter(id=model_instance_info['id']).first()
        model_instance.pk = None
        model_instance.scenario = scenario
        model_instance.save()

    return JsonResponse({'id': scenario.pk})
