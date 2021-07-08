from django.urls import path
from .views import simulation, templates, scenarios, model_classes, model_instances

urlpatterns = [
    path('get_templates_metadata', templates.get_templates_metadata, name='get_templates_metadata'),
    path('save_as_scenario', scenarios.save_as_scenario, name='save_as_scenario'),
    path('run_sim', simulation.run_sim, name='run_sim'),
    path('create_or_update_model_class', model_classes.create_or_update_model_class, name='create_or_update_model_class'),
    path('new_model_instance', model_instances.new_model_instance, name='new_model_instance'),
]