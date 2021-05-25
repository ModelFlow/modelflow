from django.http import JsonResponse
from ..models import Template, Scenario

# NOTE: I think this can be deleted and be replaced by django rest framework

def get_templates_metadata(request):
    """
    Get the templates for a project from a lookup on the scenario id. This 
    is because we only have access to the scenario id param from the sim page.
    """
    scenario_id = request.GET.get('scenario_id', None)
    if not scenario_id:
        return JsonResponse({'error': 'Need to provide scenario_id'})

    scenario = Scenario.objects.filter(id=int(scenario_id)).first()
    if scenario is None:
        return JsonResponse({'error': f'Could not find scenario with id {scenario_id}'})
    
    project = scenario.project
    if project is None:
        return JsonResponse({'error': 'Project for scenario was none'})

    templates = []
    show_hidden = int(request.GET.get('show_hidden', 0)) == 1
    for template in Template.objects.filter(project=project, is_hidden=show_hidden):
        templates.append(dict(name=template.name, id=template.id))
    return JsonResponse({'templates': templates})
