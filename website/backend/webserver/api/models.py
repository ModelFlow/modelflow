from django.db import models
from django.utils import timezone

# Create your models here.
# python manage.py createsuperuser

class BaseModel(models.Model):
    user = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        abstract = True


class Project(BaseModel):
    name = models.CharField(max_length=80, unique=True)
    description = models.TextField(null=True, blank=True)
    is_hidden = models.BooleanField(default=False, blank=True)

    # Note: scenario_views, scenarios, and model_classes should be automatically accesible

    def __str__(self):
        return f"{self.name}"


class Scenario(BaseModel):
    # TODO: Consider making a new scenario upon every save
    # instead of just re-writing old scenarios.
    name = models.CharField(max_length=80)
    is_hidden = models.BooleanField(default=False, blank=True)
    max_steps = models.IntegerField(null=True, blank=True)

    default_template = models.ForeignKey('Template', on_delete=models.SET_NULL, null=True)
    project = models.ForeignKey('Project', on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"{self.name}"

    class Meta:
        unique_together = ('project', 'name',)

class Template(BaseModel):
    # The results layout etc
    name = models.CharField(max_length=80)
    json_data = models.TextField(null=True, blank=True)
    is_hidden = models.BooleanField(default=False, blank=True)
    project = models.ForeignKey('Project', on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"{self.name}"

    class Meta:
        unique_together = ('project', 'name',)

SCENARIO_RUN_STATUSES = (
    ('queued', 'queued'),
    ('running', 'running'),
    ('success', 'success'),
    ('error', 'error')
)

class ScenarioRun(BaseModel):
    # Note: This is mostly used for getting cached results
    # Note: This probably won't work for "unsaved" scenarios
    scenario = models.ForeignKey('Scenario', on_delete=models.SET_NULL, null=True)

    status = models.CharField(default='queued', choices=SCENARIO_RUN_STATUSES, max_length=8)
    results_path = models.TextField(null=True, blank=True)
    duration = models.FloatField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.scenario.name} {self.status}"


class ModelInstance(models.Model):
    key = models.CharField(max_length=80)
    label = models.CharField(max_length=80)
    scenario = models.ForeignKey('Scenario', on_delete=models.SET_NULL, null=True, related_name='model_instances')
    model_class = models.ForeignKey('ModelClass', on_delete=models.SET_NULL, null=True)
    # Note: While this is inefficient it avoids the annoyance of needing to 
    # create ModelInstances in hierarchical order
    initial_parent_key = models.CharField(max_length=80)

    class Meta:
        unique_together = ('scenario', 'key',)


class ModelClass(models.Model):
    key = models.CharField(max_length=80)
    label = models.CharField(max_length=80)
    description = models.TextField(null=True, blank=True)
    # TODO: handle imports
    run_step_code  = models.TextField(null=True, blank=True)
    is_hidden = models.BooleanField(default=False, blank=True)
    project = models.ForeignKey('Project', on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"{self.key}"

    def name_to_classname(self):
        return self.key.replace('-',' ').replace('_',' ').lower().title().replace(' ', '')

    def name_to_modulename(self):
        return self.key.replace('-','_').replace(' ','_').lower()


    class Meta:
        unique_together = ('project', 'key',)

ATTRIBUTE_TYPES = (
    ('param', 'param'),
    ('state', 'state'),
)

class DefaultAttribute(models.Model):
    key = models.CharField(max_length=80)
    label = models.CharField(max_length=80)
    kind = models.CharField(default='param', choices=ATTRIBUTE_TYPES, max_length=6)
    units = models.CharField(max_length=64, null=True, blank=True)
    is_private = models.BooleanField(default=False, blank=True)
    value = models.CharField(max_length=64)
    dtype = models.CharField(max_length=32)  # Needed to convert the variety of data in attribute

    confidence = models.IntegerField(null=True, blank=True)

    notes = models.TextField(null=True, blank=True)
    source = models.TextField(null=True, blank=True)

    model_class = models.ForeignKey('ModelClass', on_delete=models.SET_NULL, null=True, related_name='default_attributes')

    class Meta:
        unique_together = ('model_class', 'key',)


class InstanceAttributeOverride(models.Model):
    value = models.CharField(max_length=64)
    default_attribute = models.ForeignKey('DefaultAttribute', on_delete=models.SET_NULL, null=True)
    model_instance = models.ForeignKey('ModelInstance', on_delete=models.SET_NULL, null=True, related_name='attribute_overrides')

    class Meta:
        unique_together = ('default_attribute', 'model_instance',)

class ClassAttributeOverride(models.Model):
    value = models.CharField(max_length=64)
    default_attribute = models.ForeignKey('DefaultAttribute', on_delete=models.SET_NULL, null=True)
    model_instance = models.ForeignKey('ModelClass', on_delete=models.SET_NULL, null=True, related_name='attribute_overrides')

    class Meta:
        unique_together = ('default_attribute', 'model_instance',)


# class AttributeSuggestion(models.Model):
#     TODO


# class AttributeSuggestionComment(models.Model):
#     TODO
