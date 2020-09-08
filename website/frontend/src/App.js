import React from 'react';
import './App.css';
import ParamInputs from './components/ParamInputs/ParamInputs'
import ResultsGrid from './components/ResultsGrid/ResultsGrid'
// import Grid from '@material-ui/core/Grid';

function App() {
  // return (
  //   <div className="App">
  //     <ParamInputs></ParamInputs>
  //     <ResultsGrid></ResultsGrid>
  //   </div>
  // );

  return (
    <div className="grid-container">
      <div className="grid-item">
        <ParamInputs></ParamInputs>
      </div>
      <div className="grid-item">
        <ResultsGrid></ResultsGrid>
      </div>
    </div>
  )
  // return (
  //   <div className="App">
  //     <Grid container spacing={2} alignItems="center">
  //       <Grid item>
  //         <ParamInputs></ParamInputs>
  //       </Grid>
  //       <Grid item>
  //         <ResultsGrid></ResultsGrid>
  //       </Grid>
  //     </Grid>
  //   </div>
  // );
}

export default App;
