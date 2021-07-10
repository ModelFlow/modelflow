# <project>/<app>/management/commands/seed.py
from django.core.management.base import BaseCommand
from api.models import Project, Scenario
# python manage.py seed --mode=refresh

class Command(BaseCommand):
    help = "seed database for testing and development."

    def add_arguments(self, parser):
        parser.add_argument('--mode', type=str, help="Mode")

    def handle(self, *args, **options):
        self.stdout.awrite('seeding data...')
        run_seed(self, options['mode'])
        self.stdout.write('done.')

def run_seed(self, mode):
    project_id = Project.objects.create(name="Mars Sim")
    scenario_id = Scenario.objects.create(name="Solar Scenario", project=project_id)