class SurfacePV:
    name = "Surface PV"
    params = [
        {
            "key": "rated_pv_kw_dc_output",
            "label": "",
            "units": "kw",
            "private": False,
            "value": 200,
            "confidence": 0,
            "notes": "",
            "source": "FAKE"
        },
        {
            "key": "degredation_per_hour",
            "label": "",
            "units": "decimal percent",
            "private": False,
            "value": 1e-05,
            "confidence": 0,
            "notes": "TODO: Create an actual degredation model",
            "source": "FAKE"
        },
        {
            "key": "hours_to_deploy",
            "label": "",
            "units": "hours",
            "private": False,
            "value": 120,
            "confidence": 0,
            "notes": "There is currently no support for partial deployments",
            "source": "FAKE"
        }
    ]
    states = [
        {
            "key": "mass",
            "label": "",
            "units": "kg",
            "private": True,
            "value": 100,
            "confidence": 0,
            "notes": "",
            "source": "fake"
        },
        {
            "key": "volume",
            "label": "",
            "units": "m3",
            "private": True,
            "value": 100,
            "confidence": 0,
            "notes": "",
            "source": "fake"
        },
        {
            "key": "status",
            "label": "",
            "units": "string",
            "private": True,
            "value": "packed",
            "confidence": 0,
            "notes": "",
            "source": ""
        },
        {
            "key": "deployed_hours",
            "label": "",
            "units": "hours",
            "private": True,
            "value": 0,
            "confidence": 0,
            "notes": "",
            "source": ""
        },
        {
            "key": "deploying_hours",
            "label": "",
            "units": "hours",
            "private": True,
            "value": 0,
            "confidence": 0,
            "notes": "",
            "source": ""
        }
    ]
    @staticmethod
    def run_step(states, params, utils):

        # TODO: Handle that an example where the parent location is outside
        # but there is a shared electrical connection
        if not utils.parent_is("mars_surface"):
            return
    
        if states.status == 'packed':
            states.status == 'deploying'
            # Assuming that as soon as you land on the surface, deployment starts

        elif states.status == 'deploying':
            states.deploying_hours += 1
            if states.deploying_hours > params.hours_to_deploy:
                states.status == 'deployed'

                instance_key = utils.get_instance_key()
                utils.log_event(f"Surface PV instance '{instance_key}' deployed")

        elif states.status == 'deployed':
            states.deployed_hours += 1

            degradation = 1 - states.deployed_hours * params.degredation_per_hour

            # Note: Assuming that we are not using the integrated starship PV on Mars to not degrade it

            # ULTRA FAKE PV MODEL...plz change
            if states.hours_since_mars_midnight > 6 and states.hours_since_mars_midnight <= 7:
                states.kwh_generated += params.rated_pv_kw_dc_output * 0.5 * degradation
            elif states.hours_since_mars_midnight > 7 and states.hours_since_mars_midnight < 17:
                states.kwh_generated += params.rated_pv_kw_dc_output * degradation
            elif states.hours_since_mars_midnight >= 17 and states.hours_since_mars_midnight < 18:
                states.kwh_generated += params.rated_pv_kw_dc_output * 0.5 * degradation
            else:
                states.kwh_generated += 0
