import './App.css';
import { DataGrid } from '@mui/x-data-grid';
import React, { useState, useRef, useEffect } from "react";
import { FormControl, TextField, Button, InputLabel, Select, MenuItem } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import MyTreeView from './MyTreeView';
import MySplitter from './MySplitter';
import { convertQuickFilterV7ToLegacy } from '@mui/x-data-grid/internals';

function App(props) {
  const [connection, setConnection] = useState('');
  const [sql, setSql] = useState(props.sql);
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [schemas, setSchemas] = useState([]);
  const [schemasRefresh, setSchemasRefresh] = useState(false);

  useEffect(() => {
    if (localStorage.schemas) {
      // load schemas in localStorge
      setSchemas(JSON.parse(localStorage.schemas));
    } else {
      setSchemas([]);
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!connection || !connection.trim()) {
      return;
    }
    if (!sql || !sql.trim()) {
      return;
    }

    const schema = schemas.find(s => s.name == connection);
    try {
      const response = await fetch('http://127.0.0.1:5555/api', {
        method: 'POST',
        body: JSON.stringify({
          sql: sql,
          username: schema.userid,
          password: schema.password,
          dbname: schema.dbname
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
    } catch (e) {
      alert('SQLの実行に失敗しました。');
      console.error(e);
    }
  }

  function handleChange(e) {
    switch (e.target.id) {
      case 'sql':
        setSql(e.target.value);
        break;
    }    
  }

  function handleConnectionChange(e) {
    setConnection(e.target.value);
  }

  return (
    <div className="App">
      <header className="App-header">
          Oracle Database Viewer
      </header>
      <nav className="App-nav">
        <MyTreeView schemas={schemas} updateSchema={s => {setSchemas(s); setSchemasRefresh(!schemasRefresh)}}/>
      </nav>
      <MySplitter/>
      <main className="App-main">
        <FormControl required fullWidth sx={{mb: 1}}>
          <InputLabel id="connection-label">接続</InputLabel>
          <Select
            labelId="connection-label"
            id="connection"
            value={connection}
            label="接続"
            onChange={handleConnectionChange}
            style={{width: "10%", minWidth: "150px", textAlign: "left"}}
          >
            {schemas.map((schema) => (
              <MenuItem key={schema.name + ' ' + new Date()} value={schema.name} dummy={schemasRefresh ? '1': ''}>{schema.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl required fullWidth sx={{mb: 1}}>
          <TextField id="sql" label="SQL" variant="outlined" multiline minRows={3} maxRows={10} fullWidth size="small" required value={sql} onChange={handleChange}/>
        </FormControl>
        <FormControl sx={{m: 1}}>
          <Button variant="contained" color="success" onClick={handleSubmit}>
            execute
          </Button>
        </FormControl>
        <FormControl fullWidth sx={{mb: 1}}>
          <DataGrid rows={rows} columns={columns}/>
        </FormControl>
      </main>
    </div>
  );
}

export default App;