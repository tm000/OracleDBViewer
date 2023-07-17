import logo from './logo.svg';
import './App.css';
import { DataGrid } from '@mui/x-data-grid';
import React, { useState, useRef, useEffect } from "react";
import { FormControl, TextField, Button } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';

function App(props) {
  const [userId, setUserId] = useState(props.userId);
  const [password, setPassword] = useState(props.password);
  const [dbname, setDbname] = useState(props.dbname);
  const [sql, setSql] = useState(props.sql);
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
    
  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId || !userId.trim()) {
      return;
    }
    if (!password || !password.trim()) {
      return;
    }
    if (!dbname || !dbname.trim()) {
      return;
    }
    if (!sql || !sql.trim()) {
      return;
    }

    const response = await fetch('http://127.0.0.1:5555/api', {
      method: 'POST',
      body: JSON.stringify({
        sql: sql,
        username: userId,
        password: password,
        dbname: dbname
      })
    });
    let resjson = await response.json();
    if (!response.ok) {
      alert("An error occurs!\n" + resjson['error']);
      return;
    }

    let columns = [];
    for (let col of resjson['header']) {
      columns.push({field: col, headerName: col, width: 150});
    }
    let rows = [];
    resjson['body'].forEach((data, i) => {
      let row = {}
      row['id'] = i+1;
      for (let j=0; j<data.length; j++) {
        row[resjson['header'][j]] = data[j];
      }
      rows.push(row);
    });
    setColumns(columns);
    setRows(rows);
  }

  function handleChange(e) {
    switch (e.target.id) {
      case 'userId':
        setUserId(e.target.value);
        break;
      case 'password':
        setPassword(e.target.value);
        break;
      case 'dbname':
        setDbname(e.target.value);
        break;
      case 'sql':
        setSql(e.target.value);
        break;
    }    
  }

  return (
    <div className="App">
      <header className="App-header">
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
            <TextField id="dbname" label="DataBase Name" variant="outlined" size="small" required value={dbname} onChange={handleChange}/>
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
