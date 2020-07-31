from modelflow.modelflow import Model, ModelParam, ModelState


class Battery(Model):
    def setup(self):
        self.name = "battery"

        # For now assume that this battery has an integrated inverter

        # TODO: Handle potential times scaling issues

        # Note: You could have efficiency curves in here
        self.params = [
            ModelParam(
                key="dc_capacity_kwh",
                units="kwh",
                value=4000,
                source="FAKE"
            ),
            ModelParam(
                key="ac_capacity_kw",
                units="kw",
                value=1000,
                source="FAKE"
            ),
            ModelParam(
                key="roundtrip_efficiency",
                units="decimal percent",
                value=0.95,
                source="FAKE"
            )
        ]

        # We have this weird nomenclature so that the efficiency
        # can easily be applied to the input
        self.linked_input_states = [
            "kwh_for_battery"
        ]

        # A couple ways to solve efficiency problem:
        # - Ensure a one way flow that solar always goes into battery
        # - Treat enrg_kwh as the demand for the whole system. Every step decrement
        #   the energy stored as 1 + round trip efficiency * energy demanded.
        #
        #   If energy went to 0 we could catch it the next timestamp

        self.states = [
            ModelState(
                key="enrg_kwh", # Oddly this is the AC energy available
                units="kwh",
                value=1000
            ),
            ModelState(
                key="kwh_for_battery", # Oddly this is the kwh set to be input to battery
                units="kwh",
                value=0
            )

            # TODO: perhaps have some internal state for storage
            # where we can properly handle kw max and kwh storage
        ]

    def run_step(self, inputs, outputs, params, states):
        if inputs.kwh_for_battery < 0:
            raise Exception("kwh into battery was negative")

        if states.enrg_kwh < 0:
            raise Exception("Battery energy is less than 0")

        if states.enrg_kwh == 0:
            print("Ran out of energy!")


        # Due to current limitations in modeling setup
        # Apply the full round trip battery efficiency for
        # energy added to the battery instead of part when added in
        # and part when added out
        states.enrg_kwh += inputs.kwh_for_battery * params.roundtrip_efficiency

        # TODO: This is really not great, but allos for multiple
        # inputs to battery
        inputs.kwh_for_battery = 0

        # A hack to ensure not exceeding max kw
        states.enrg_kwh = min(states.enrg_kwh, params.ac_capacity_kw)

