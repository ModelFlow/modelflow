# Mars Base Simulation
System Simulations of Mars Habitats and Missions


# Visualizing Results
Download Tableau. Open one of the workbooks and link to a CSV output.
Example: https://public.tableau.com/profile/adam.raudonis#!/vizhome/test_no_life_support/Dashboard?publish=yes

# TODO
- Figure out why heat flows are not working
- Get all unit tests passing
- Actually leverage subsystem tests
- Actually add integration tests
- Create Tableau dashboard demo of eclyss + human
- Add realistic masses and volumes to all components
- Add sources for all constants
- Way to get mass/volume inventory from all objects
- Categorization of models into detail levels. Ex: rough, maximum fidelity
- Consider attempting to assign costs for elements

## Agents/Subsystems TODO

### Location
- Allow for location specific features to affect entire simulation.

### ISRU
- Create plant agents and unit tests for ISRU fuel plants, etc.

### Battery Storage
- See if the hacks to make battery storage work are ok, add more tests

### PV Inverter
- Get realistic numbers for inverter efficiency.
- Determine proper scaling and clipping of pv generation

### Nuclear
- Create the nuclear power system based on kilopower http://large.stanford.edu/courses/2017/ph240/black1/docs/nasa-tm-2017-219467.pdf
- Create a realistic solar model based on actual planet

### Indoor Air
- Once supported, perhaps make atmosphere dependent on volume etc
- Ensure that air pressure is taken into account
- See if there are any problems with the heat kwh diff to temp hack

### Structures
- Consider a separate greenhouse structure with different psi, etc
- Consider different thermal losses above and below ground https://en.wikipedia.org/wiki/Heat_flux
- Ensure that leaks are supported https://ntrs.nasa.gov/archive/nasa/casi.ntrs.nasa.gov/20110012997.pdf

### Plants
- Create plant agents and unit tests for plants. Use data from SIMOC: https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf

### Humans
- Are there other attributes we'd want to track like happiness somehow, etc

### Lighting
- Add realistic model for lighting load and modulate usage at night

### Communications
- Model for getting the delay between Earth and Mars. Not sure how useful this would be, but interesting

### Nutrition Storage
- Consider breaking food down into nutrients and tracking each one

### Rockets
- Create models for supply ships bringing inventory etc


# Ideas
- Consider modeling radiation
- Consider creating model for managing inhabitant labor as that is one of the most valuable resources.

# Research Questions
- Trade offs between solar and nuclear powered ISRU: http://large.stanford.edu/courses/2017/ph240/black1/docs/nasa-tm-2017-219467.pdf
- What would the first Starship landing actually look like?
- Reliability studies with randomly introduced failures of ECLSS systems
- Was Paragon's Mars One ECLSS report realistic? http://www.mars-one.com/images/uploads/Mars_One_Habitat_ECLSS_Conceptual_Design_Assessment.pdf
- What systems are most well understood and which are rougher?
- What control of these systems can be optimized? Ex: seek to reduce throughput on carbon capture system
