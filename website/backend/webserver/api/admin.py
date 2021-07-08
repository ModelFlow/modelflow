from django.contrib import admin
from .models import Project, Scenario, Template, ScenarioRun, ModelInstance
from .models import ModelClass, DefaultAttribute, InstanceAttributeOverride, ClassAttributeOverride

# Register your models here.

admin.site.register(Project)
admin.site.register(Scenario)
admin.site.register(Template)
admin.site.register(ScenarioRun)
admin.site.register(ModelInstance)
admin.site.register(ModelClass)
admin.site.register(DefaultAttribute)
admin.site.register(InstanceAttributeOverride)
admin.site.register(ClassAttributeOverride)
