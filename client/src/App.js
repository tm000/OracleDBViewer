import './App.css';
import { DataGrid } from '@mui/x-data-grid';
import React, { useState, useRef, useEffect } from "react";
import { FormControl, TextField, Button, InputLabel, Select, MenuItem } from '@mui/material';
import { useTranslation } from 'react-i18next';
import MyTreeView from './MyTreeView';
import MySplitter from './MySplitter';

function App(props) {
  const [connection, setConnection] = useState('');
  const [sql, setSql] = useState(props.sql);
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [schemas, setSchemas] = useState([]);
  const [schemasRefresh, setSchemasRefresh] = useState(false);
  const coldata = [];
  const rowdata = [];
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (localStorage.schemas) {
      // load schemas in localStorge
      setSchemas(JSON.parse(localStorage.schemas));
    } else {
      setSchemas([]);
    }
  }, []);

  let isDrug = false;
  let isDrugged = false;

  const handleColumnDrug = e => {
    if (isDrug == true) {
      // resize header column width
      let target = e.target;
      while (!target.classList.contains('MuiDataGrid-columnHeader')) target = target.parentElement;
      const colindex = target.getAttribute('aria-colindex');
      let lx = e.clientX - target.getBoundingClientRect().x;
      target.style.width = `${lx}px`;
      target.style.maxWidth = `${lx}px`;
      target.style.minWidth = `${lx}px`;
      // resize rows column width
      let headers = target.parentElement;
      while (!headers.classList.contains('MuiDataGrid-columnHeaders')) headers = headers.parentElement;
      let rowdivs = headers.nextSibling;
      while (!rowdivs.classList.contains('MuiDataGrid-virtualScrollerRenderZone')) {
        rowdivs = rowdivs.children[0];
        if (!rowdivs) break;
      }
      if (rowdivs) {
        rowdivs= rowdivs.children;
        let colindex2 = 0;
        for (let i = 0; i < rowdivs[0].children.length; i++) {
          if (colindex == rowdivs[0].children[i].getAttribute('aria-colindex')) {
            colindex2 = i;
            break;
          }
        }
        for (let i = 0; i < rowdivs.length; i++) {
          rowdivs[i].children[colindex2].style.maxWidth = `${lx}px`;
          rowdivs[i].children[colindex2].style.minWidth = `${lx}px`;
        };
      }
      coldata[parseInt(colindex) - 1].width = lx;
      isDrugged = true;
    }
  };

  const setColumnEventHandler = () => {
    // set resize event for column headers
    let colcnt = 0;
    for (let el of document.querySelectorAll('.MuiDataGrid-columnSeparator')) {
      el.style.cursor = 'col-resize';
      el.onpointerdown=(e) => {e.target.setPointerCapture(e.pointerId);isDrug=true;}
      el.onpointerup=(e) => {
        e.target.releasePointerCapture(e.pointerId);
        isDrug=false;
        if (isDrugged) handleColumnDrugged();
      }
      el.onpointermove=handleColumnDrug
      colcnt++;
    }
    // retry
    if (colcnt == 0) setTimeout(() => setColumnEventHandler(), 500);

    document.querySelectorAll('.MuiDataGrid-virtualScroller')[0].onscroll = e => setColumnEventHandler();
  }

  const handleColumnDrugged = () => {
    // refresh column header width 
    const coltmp = [];
    coldata.forEach(c => coltmp.push(c));
    coltmp.push({field: '@', headerName: ''})
    setColumns(coltmp);
    setTimeout(() => {
      setColumns(coldata);
      setTimeout(() => {
        setColumnEventHandler();
      }, 500);
    }, 0);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!connection || !connection.trim()) {
      alert(t("Select connection name"));
      return;
    }
    if (!sql || !sql.trim()) {
      alert(t("Enter SQL"));
      return;
    }

    const schema = schemas.find(s => s.name == connection);
    try {
      const response = await fetch(process.env.REACT_APP_API_URL, {
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
        if (response.status < 500) {
          alert(t("An error has occurred") + "\n" + resjson['error']);
        } else {
          alert(t("An unexpected error has occurred") + "\n" + resjson['error']);
        }
        return;
      }

      if (coldata.length > 0) coldata.splice(0, coldata.length);
      for (let col of resjson['header']) {
        coldata.push({field: col, headerName: col, width: 150});
      }
      if (rowdata.length > 0) rowdata.splice(0, rowdata.length);
      resjson['body'].forEach((data, i) => {
        let row = {}
        row['id'] = i+1;
        for (let j=0; j<data.length; j++) {
          row[resjson['header'][j]] = data[j];
        }
        rowdata.push(row);
      });
      setColumns(coldata);
      setRows(rowdata);
      setTimeout(() => setColumnEventHandler(), 500);
    } catch (e) {
      alert(t("Execution failed on sql"));
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

  function appendSql(token) {
    let newval = (sql || '') + token;
    setSql(newval);
  }

  return (
    <div className="App">
      <header className="App-header">
          Oracle Database Viewer
      </header>
      <nav className="App-nav">
        <MyTreeView schemas={schemas} updateSchema={s => {setSchemas(s); setSchemasRefresh(!schemasRefresh)}}
                    appendSql={appendSql}/>
      </nav>
      <MySplitter/>
      <main className="App-main">
        <FormControl required fullWidth sx={{mb: 1}}>
          <InputLabel id="connection-label">{t("connections")}</InputLabel>
          <Select
            labelId="connection-label"
            id="connection"
            value={connection}
            label={t("connections")}
            onChange={handleConnectionChange}
            style={{width: "10%", minWidth: "150px", textAlign: "left"}}
          >
            {schemas.map((schema) => (
              <MenuItem key={schema.name} value={schema.name} dummy={schemasRefresh ? '1': ''}>{schema.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl required fullWidth sx={{mb: 1}}>
          <TextField id="sql" label="SQL" variant="outlined" multiline minRows={3} maxRows={10} fullWidth size="small" required value={sql} onChange={handleChange}/>
        </FormControl>
        <FormControl sx={{m: 1}}>
          <Button variant="contained" color="success" onClick={handleSubmit}>
          {t("execute")}
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