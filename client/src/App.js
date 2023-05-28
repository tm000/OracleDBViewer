import logo from './logo.svg';
import './App.css';
import { DataGrid } from '@mui/x-data-grid';
import React, { useState, useRef, useEffect } from "react";
import { FormControl, TextField, Button } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';

function App(props) {
  const [userId, setUserId] = useState(props.userId);
  const [password, setPassword] = useState(props.password);
  const [url, setUrl] = useState(props.url);
  const [sql, setSql] = useState(props.sql);
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
    
  function handleSubmit(e) {
    e.preventDefault();
    if (!userId || !userId.trim()) {
      return;
    }
    if (!password || !password.trim()) {
      return;
    }
    if (!url || !url.trim()) {
      return;
    }
    if (!sql || !sql.trim()) {
      return;
    }

    setColumns([{ field: 'col1', headerName: 'Column 1', width: 150 },
              { field: 'col2', headerName: 'Column 2', width: 150 }]);
    setRows([{ id: 1, col1: 'Hello', col2: 'World' },
              { id: 2, col1: 'DataGridPro', col2: 'is Awesome' },
              { id: 3, col1: 'MUI', col2: 'is Amazing' }]);
  }

  function handleChange(e) {
    switch (e.target.id) {
      case 'userId':
        setUserId(e.target.value);
        break;
      case 'password':
        setPassword(e.target.value);
        break;
      case 'url':
        setUrl(e.target.value);
        break;
      case 'sql':
        setSql(e.target.value);
        break;
    }    
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
      </header>
      <FormControl required onSubmit={handleSubmit}>
        <Grid container spacing={2} columns={8}>
          <Grid xs={8}>
            <TextField id="userId" label="User Id" variant="outlined" size="small" required value={userId} onChange={handleChange}/>
          </Grid>
          <Grid xs={8}>
            <TextField id="password" label="Password" variant="outlined" size="small" required type="password" value={password} onChange={handleChange}/>
          </Grid>
          <Grid xs={8}>
            <TextField id="url" label="DataBase URL" variant="outlined" size="small" required type="url" value={url} onChange={handleChange}/>
          </Grid>
          <Grid xs={8}>
            <TextField id="sql" label="SQL" variant="outlined" multiline rows={10} fullWidth size="small" required value={sql} onChange={handleChange}/>
          </Grid>
          <Grid xs={8}>
            <Button variant="contained" color="success" onClick={handleSubmit}>
              execute
            </Button>
          </Grid>
          <Grid xs={8}>
            <DataGrid rows={rows} columns={columns} />
          </Grid>
        </Grid>
      </FormControl>
    </div>
  );
}

export default App;
