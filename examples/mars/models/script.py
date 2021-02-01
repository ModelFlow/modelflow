def main():
    root = model_library.Universe
    starship = model_library.Starship
    starship.parent = root

    # Note: You can either describe schema one and two, or describe changes to get from one to two
    # Isn't this as easy as just saying starship.parent => mars_surface

def run_step(io, utils):
    # Once 180 days have passed, change to mars schema
    seconds_passed = io.current_utc - global_vars.start_time
    days_passed = seconds_passed / 60 / 60 / 24
    if days_passed == 180:
        utils.trigger_event("land_on_mars")