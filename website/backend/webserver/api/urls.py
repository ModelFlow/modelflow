from django.urls import path
from .views import simulation, templates, scenarios

urlpatterns = [
    path('get_templates_metadata', templates.get_templates_metadata, name='get_templates_metadata'),
    path('save_as_scenario', scenarios.save_as_scenario, name='save_as_scenario'),
    path('run_sim', simulation.run_sim, name='run_sim'),
]