from django.urls import path
from .views import simulation, templates

urlpatterns = [
    path('get_templates_metadata', templates.get_templates_metadata, name='get_templates_metadata'),
    path('run_sim', simulation.run_sim, name='run_sim'),
]