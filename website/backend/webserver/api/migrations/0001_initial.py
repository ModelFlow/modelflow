# Generated by Django 3.2 on 2021-06-06 22:35

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ModelClass',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('key', models.CharField(max_length=80)),
                ('label', models.CharField(max_length=80)),
                ('description', models.TextField(blank=True, null=True)),
                ('run_step_code', models.TextField(blank=True, null=True)),
                ('is_hidden', models.BooleanField(blank=True, default=False)),
            ],
        ),
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('name', models.CharField(max_length=80, unique=True)),
                ('description', models.TextField(blank=True, null=True)),
                ('is_hidden', models.BooleanField(blank=True, default=False)),
                ('user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Scenario',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('name', models.CharField(max_length=80)),
                ('is_hidden', models.BooleanField(blank=True, default=False)),
                ('max_steps', models.IntegerField(blank=True, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='Template',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('name', models.CharField(max_length=80)),
                ('json_data', models.TextField(blank=True, null=True)),
                ('is_hidden', models.BooleanField(blank=True, default=False)),
                ('project', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.project')),
                ('user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('project', 'name')},
            },
        ),
        migrations.CreateModel(
            name='ScenarioRun',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('status', models.CharField(choices=[('queued', 'queued'), ('running', 'running'), ('success', 'success'), ('error', 'error')], default='queued', max_length=8)),
                ('results_path', models.TextField(blank=True, null=True)),
                ('duration', models.FloatField(blank=True, null=True)),
                ('finished_at', models.DateTimeField(blank=True, null=True)),
                ('scenario', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.scenario')),
                ('user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.AddField(
            model_name='scenario',
            name='default_template',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.template'),
        ),
        migrations.AddField(
            model_name='scenario',
            name='project',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.project'),
        ),
        migrations.AddField(
            model_name='scenario',
            name='user',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL),
        ),
        migrations.CreateModel(
            name='ModelInstance',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('key', models.CharField(max_length=80)),
                ('label', models.CharField(max_length=80)),
                ('initial_parent_key', models.CharField(max_length=80)),
                ('model_class', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.modelclass')),
                ('scenario', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='model_instances', to='api.scenario')),
            ],
            options={
                'unique_together': {('scenario', 'key')},
            },
        ),
        migrations.AddField(
            model_name='modelclass',
            name='project',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.project'),
        ),
        migrations.CreateModel(
            name='DefaultAttribute',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('key', models.CharField(max_length=80)),
                ('label', models.CharField(max_length=80)),
                ('kind', models.CharField(choices=[('param', 'param'), ('state', 'state')], default='param', max_length=6)),
                ('units', models.CharField(blank=True, max_length=64, null=True)),
                ('is_private', models.BooleanField(blank=True, default=False)),
                ('value', models.CharField(max_length=64)),
                ('dtype', models.CharField(max_length=32)),
                ('confidence', models.IntegerField(blank=True, null=True)),
                ('notes', models.TextField(blank=True, null=True)),
                ('source', models.TextField(blank=True, null=True)),
                ('model_class', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='default_attributes', to='api.modelclass')),
            ],
            options={
                'unique_together': {('model_class', 'key')},
            },
        ),
        migrations.AlterUniqueTogether(
            name='scenario',
            unique_together={('project', 'name')},
        ),
        migrations.AlterUniqueTogether(
            name='modelclass',
            unique_together={('project', 'key')},
        ),
        migrations.CreateModel(
            name='InstanceAttributeOverride',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('value', models.CharField(max_length=64)),
                ('default_attribute', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.defaultattribute')),
                ('model_instance', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='attribute_overrides', to='api.modelinstance')),
            ],
            options={
                'unique_together': {('default_attribute', 'model_instance')},
            },
        ),
        migrations.CreateModel(
            name='ClassAttributeOverride',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('value', models.CharField(max_length=64)),
                ('default_attribute', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.defaultattribute')),
                ('model_instance', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='attribute_overrides', to='api.modelclass')),
            ],
            options={
                'unique_together': {('default_attribute', 'model_instance')},
            },
        ),
    ]
