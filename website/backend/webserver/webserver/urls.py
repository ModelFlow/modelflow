"""webserver URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from django.contrib.auth.models import User
from rest_framework import generics, routers, serializers, viewsets
from api.models import Project, Scenario, Template, ModelInstance, ModelClass, DefaultAttribute, InstanceAttributeOverride
from django_filters.rest_framework import DjangoFilterBackend


# Serializers define the API representation.
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['url', 'username', 'email', 'is_staff']


# ViewSets define the view behavior.
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class ProjectSerializer(serializers.ModelSerializer):
    user_info = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'name', 'user', 'created_at', 'user_info']

    def get_user_info(self, obj):
        return UserSerializer(obj.user, context={'request': None}).data


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer


class TemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = ['id', 'name', 'user', 'created_at', 'json_data', 'project']

# ViewSets define the view behavior.
class TemplateViewSet(viewsets.ModelViewSet):
    queryset = Template.objects.all()
    serializer_class = TemplateSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['project']


class SmallDefaultAttributeSerializer(serializers.ModelSerializer):

    class Meta:
        model = DefaultAttribute
        fields = ['id', 'key', 'value', 'dtype']


class InstanceAttributeOverrideSerializer(serializers.ModelSerializer):

    default_attribute_info = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = InstanceAttributeOverride
        fields = ['id', 'value', 'default_attribute_info', 'model_instance']

    def get_default_attribute_info(self, obj):
        return SmallDefaultAttributeSerializer(obj.default_attribute, context={'request': None}).data

class InstanceAttributeOverrideViewSet(viewsets.ModelViewSet):
    queryset = InstanceAttributeOverride.objects.all()
    serializer_class = InstanceAttributeOverrideSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['default_attribute', 'model_instance']


class ModelClassMetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelClass
        fields = ['id', 'key', 'label']


class DefaultAttributeSerializer(serializers.ModelSerializer):

    class Meta:
        model = DefaultAttribute
        fields = ['id', 'key', 'label', 'dtype', 'kind', 'notes', 'source', 'model_class', 'units', 'value', 'confidence', 'is_private']

class DefaultAttributeViewSet(viewsets.ModelViewSet):
    queryset = DefaultAttribute.objects.all()
    serializer_class = DefaultAttributeSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['key', 'model_class', 'kind']


class ModelClassMetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelClass
        fields = ['id', 'key', 'label']


class ModelClassSerializer(serializers.ModelSerializer):

    default_attributes = DefaultAttributeSerializer(many=True, read_only=True)

    class Meta:
        model = ModelClass
        fields = ['id', 'key', 'label', 'description', 'is_hidden', 'project', 'default_attributes', 'run_step_code']


class ModelClassViewSet(viewsets.ModelViewSet):
    queryset = ModelClass.objects.all()
    serializer_class = ModelClassSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['key', 'project', 'is_hidden']


class ModelInstanceSerializer(serializers.ModelSerializer):

    attribute_overrides = InstanceAttributeOverrideSerializer(many=True, read_only=True)
    model_class = ModelClassSerializer(read_only=True)

    # model_class_meta = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ModelInstance
        fields = ['id', 'key', 'label', 'scenario', 'model_class', 'initial_parent_key', 'attribute_overrides']

    # def get_model_class_meta(self, obj):
    #     return ModelClassMetaSerializer(obj.model_class, context={'request': None}).data


class ModelInstanceViewSet(viewsets.ModelViewSet):
    queryset = ModelInstance.objects.all()
    serializer_class = ModelInstanceSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['key', 'scenario', 'model_class', 'initial_parent_key']



class ModelInstanceViewSet(viewsets.ModelViewSet):
    queryset = ModelInstance.objects.all()
    serializer_class = ModelInstanceSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['key', 'scenario', 'model_class', 'initial_parent_key']


class ScenarioSerializer(serializers.ModelSerializer):
    # TODO: Create a light weight version that does not include the model_instances for all scenarios

    model_instances = ModelInstanceSerializer(many=True, read_only=True)
    project_meta = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Scenario
        fields = ['id', 'name', 'user', 'created_at', 'project', 'project_meta','default_template', 'model_instances', 'max_steps']

    def get_project_meta(self, obj):
        return ProjectSerializer(obj.project, context={'request': None}).data


class ScenarioViewSet(viewsets.ModelViewSet):
    queryset = Scenario.objects.all()
    serializer_class = ScenarioSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['project', 'is_hidden']


# Routers provide an easy way of automatically determining the URL conf.
router = routers.DefaultRouter()
router.register('projects', ProjectViewSet)
router.register('users', UserViewSet)
router.register('scenarios', ScenarioViewSet)
router.register('templates', TemplateViewSet)
router.register('model_instances', ModelInstanceViewSet)
router.register('model_classes', ModelClassViewSet)
router.register('default_attributes', DefaultAttributeViewSet)
router.register('attribute_override', InstanceAttributeOverrideViewSet)


urlpatterns = [
    path('rest/', include(router.urls)),
    path('api/', include('api.urls')),
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls'))
]
