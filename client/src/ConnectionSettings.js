import * as React from 'react';
import { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { FormControl } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useTranslation } from 'react-i18next';

const Mode = {
  New : 0, Modify : 1
};
export {Mode};
export default function ConnectionSettings(props) {
  const [mode, setMode] = React.useState(null);
  const [name, setName] = React.useState(null);
  const [userid, setUserId] = React.useState(null);
  const [password, setPassword] = React.useState(null);
  const [dbname, setDbname] = React.useState(null);
  const [nameerr, setNameErr] = React.useState(false);
  const [useriderr, setUserIdErr] = React.useState(false);
  const [passworderr, setPasswordErr] = React.useState(false);
  const [dbnameerr, setDbnameErr] = React.useState(false);
  const [message, setMessage] = React.useState(null);
  const { t, i18n } = useTranslation();
  useEffect(() => {
    setMode(props.mode || '');
    setName(props.name || '');
    setUserId(props.userid || '');
    setPassword(props.password || '');
    setDbname(props.dbname || '');
    setNameErr(false);
    setUserIdErr(false);
    setPasswordErr(false);
    setDbnameErr(false);
    setMessage(null);
  }, [props]);

  const handleCancelDialog = () => {
    props.close()
  };

  function handleSubmit(e) {
    e.preventDefault();
    let iserr = false;
    setNameErr((!name || !name.trim()) && (iserr = true));
    setUserIdErr((!userid || !userid.trim()) && (iserr = true));
    setPasswordErr((!password || !password.trim()) && (iserr = true));
    setDbnameErr((!dbname || !dbname.trim()) && (iserr = true));
    if (iserr) {
      setMessage(t("Enter connection information"));
      return;
    }
    const ret = props.submit({mode: mode, currentname: props.name, name: name, userid: userid, password: password, dbname: dbname});
    if (ret) {
      setMessage(ret);
    }
  }

  function handleChange(e) {
    switch (e.target.id) {
      case 'name':
        setName(e.target.value);
        break;
      case 'userid':
        setUserId(e.target.value);
        break;
      case 'password':
        setPassword(e.target.value);
        break;
      case 'dbname':
        setDbname(e.target.value);
        break;
    }
  }

  return (
    <Dialog onClose={handleCancelDialog} open={props.open}>
        <DialogTitle>{mode == Mode.New ? t("New Connection Settings") : t("Connection Settings")}</DialogTitle>
        <FormControl required onSubmit={handleSubmit}>
          <DialogContent>
              <DialogContentText style={{color: 'red'}}>
                {message}
              </DialogContentText>
              <Grid container spacing={2} columns={8}>
                <Grid xs={8}>
                  <TextField id="name" label={t("Connection Name")} variant="standard" size="small" fullWidth required value={name} color={nameerr ? 'error' : 'primary'} onChange={handleChange}/>
                </Grid>
                <Grid xs={8}>
                  <TextField id="userid" label={t("User Id")} variant="standard" size="small" fullWidth required value={userid} color={useriderr ? 'error' : 'primary'} style={{imeMode: 'inactive'}} onChange={handleChange}/>
                </Grid>
                <Grid xs={8}>
                  <TextField id="password" label={t("Password")} variant="standard" size="small" fullWidth required type="password" value={password} color={passworderr ? 'error' : 'primary'} onChange={handleChange}/>
                </Grid>
                <Grid xs={8}>
                  <TextField id="dbname" label={t("DataBase Name")} variant="standard" size="small" fullWidth required value={dbname} color={dbnameerr ? 'error' : 'primary'} style={{imeMode: 'inactive'}} onChange={handleChange}/>
                </Grid>
              </Grid>
          </DialogContent>
          <DialogActions>
              <Button onClick={handleCancelDialog}>{t("Cancel")}</Button>
              <Button onClick={handleSubmit}>{mode == Mode.New ? t("Add") : t("Apply")}</Button>
          </DialogActions>
        </FormControl>
    </Dialog>
  );
}