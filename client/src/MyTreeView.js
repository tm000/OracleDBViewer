import * as React from 'react';
import { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import TreeView from '@mui/lab/TreeView';
import TreeItem, { treeItemClasses } from '@mui/lab/TreeItem';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import DatasetIcon from '@mui/icons-material/Dataset';
import ViewListIcon from '@mui/icons-material/ViewList';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import {Mode as ConnectionSettingsMode, default as ConnectionSettings} from './ConnectionSettings';

const StyledTreeItemRoot = styled(TreeItem)(({ theme }) => ({
  color: theme.palette.text.secondary,
  [`& .${treeItemClasses.content}`]: {
    color: theme.palette.text.secondary,
    /*borderTopRightRadius: theme.spacing(2),
    borderBottomRightRadius: theme.spacing(2),*/
    paddingRight: theme.spacing(1),
    fontWeight: theme.typography.fontWeightMedium,
    '&.Mui-expanded': {
      fontWeight: theme.typography.fontWeightRegular,
    },
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '&.Mui-focused, &.Mui-selected, &.Mui-selected.Mui-focused': {
      backgroundColor: `var(--tree-view-bg-color, ${theme.palette.action.selected})`,
      color: 'var(--tree-view-color)',
    },
    [`& .${treeItemClasses.label}`]: {
      fontWeight: 'inherit',
      color: 'inherit',
      width: 'auto',
    },
  },
  [`& .${treeItemClasses.group}`]: {
    marginLeft: theme.spacing(2),
    [`& .${treeItemClasses.content}`]: {
      paddingLeft: theme.spacing(2),
      width: 'calc(100% - ' + theme.spacing(1) + ')',
    },
  },
}));

function StyledTreeItem(props) {
  const theme = useTheme();
  const {
    labelIcon: LabelIcon,
    labelText,
    ...other
  } = props;

  const styleProps = {
    // '--tree-view-color': theme.palette.mode !== 'dark' ? color : colorForDarkMode,
    // '--tree-view-bg-color':
    //   theme.palette.mode !== 'dark' ? bgColor : bgColorForDarkMode,
  };

  return (
    <StyledTreeItemRoot
      label={
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 0.5,
            pr: 0,
          }}
        >
          <Box component={LabelIcon} color="inherit" sx={{ mr: 1 }} />
          <Typography variant="body" sx={{ fontWeight: 'inherit', flexGrow: 1, wordBreak: 'keep-all' }}>
            {labelText}
          </Typography>
          <Typography variant="caption" color="inherit">
            
          </Typography>
        </Box>
      }
      style={styleProps}
      {...other}
    />
  );
}

StyledTreeItem.propTypes = {
  labelIcon: PropTypes.elementType.isRequired,
  labelText: PropTypes.string.isRequired,
};

const MENU_ITEM_HEIGHT = 48;

export default function MyTreeView(props) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [menuItems, setMenuItems] = React.useState([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogprops, setDialogProps] = React.useState({});
  const [schemasRefresh, setSchemasRefresh] = React.useState(false);
  const open = Boolean(anchorEl);
  const schemas = props.schemas;

  const handlePopup = (event) => {
    event.preventDefault();
    let e = event.target;
    while (e && e.nodeName.toUpperCase() != 'LI') e = e.parentNode;
    switch (e.getAttribute('aria-controls')) {
      case 'connect-menu' :
        setMenuItems([{name:'追加', func: () => {handleClickOpen(ConnectionSettingsMode.New)}}]);
        setAnchorEl(e.children[0] || e);
        break;
      case 'schema-menu' :
        const connname = e.getAttribute('data-connname');
        setMenuItems([{name:'変更', func: () => {handleClickOpen(ConnectionSettingsMode.Modify, connname);}},
                    {name:'削除', func: () => {if (window.confirm('本当に削除してよろしいですか？')) {
                      for (let i = 0; i < schemas.length; i++) {
                        if (schemas[i].name === connname) {
                          schemas.splice(i, 1)
                          props.updateSchema(schemas);
                          saveSchemas();
                          break;
                        }
                      }
                    };}}]);
        setAnchorEl(e.children[0] || e);
        break;
    }
  };
  const handlePopupClose = () => {
    setAnchorEl(null);
  };

  const handleSchemaClick = async (event) => {
    event.preventDefault();
    let e = event.target;
    while (e && e.nodeName.toUpperCase() != 'LI') e = e.parentNode;
    const connname = e.getAttribute('data-connname');
    const schema = schemas.find(s => s.name == connname);
    if (schema.tables.length > 0) return;

    try {
      const response = await fetch(process.env.REACT_APP_API_URL, {
        method: 'POST',
        body: JSON.stringify({
          sql: 'SELECT TABLE_NAME FROM USER_TABLES',
          username: schema.userid,
          password: schema.password,
          dbname: schema.dbname
        })
      });
      let resjson = await response.json();
      if (!response.ok) {
        alert("エラーが発生しました。\n" + resjson['error']);
        return;
      }
      resjson['body'].forEach(data => {
        schema.tables.push({name: data[0]});
      });
    } catch (e) {
      alert('テーブル一覧の取得に失敗しました。');
      console.error(e);
    }
    props.updateSchema(schemas);
    setSchemasRefresh(!schemasRefresh);
  };

  const handleTableDblClick = (event) => {
    event.preventDefault();
    let e = event.target;
    while (e && e.nodeName.toUpperCase() != 'LI') e = e.parentNode;
    props.appendSql(e.textContent);
  };

  const handleClickOpen = (mode, connname) => {
    if (mode == ConnectionSettingsMode.New) {
      setDialogProps({mode: mode, name: '', userid: '', password: '', dbname: ''});
    } else {
      const schema = schemas.find(s => s.name == connname);
      setDialogProps({mode: mode, name: connname, userid: schema.userid, password: schema.password, dbname: schema.dbname});
    }
    setDialogOpen(true);
  };

  const handleSettingSubmit = (setting) => {
    if (setting.mode == ConnectionSettingsMode.New) {
      const exists = schemas.find(s => s.name == setting.name);
      if (exists) {
        return `接続名'${setting.name}'はすでに存在します。`;
      } else {
        schemas.push({name: setting.name, userid: setting.userid, password: setting.password, dbname: setting.dbname, tables: []});
        props.updateSchema(schemas);
      }
    } else {
      const schema = schemas.find(s => s.name == setting.currentname);
      schema.name = setting.name;
      schema.userid = setting.userid;
      schema.password = setting.password;
      schema.dbname = setting.dbname;
      props.updateSchema(schemas);
    }

    saveSchemas();
    setDialogOpen(false);
  };

  function saveSchemas() {
    // store schemas exclude tables
    localStorage.schemas = JSON.stringify(schemas.map(s => {return {name: s.name, userid: s.userid, password: s.password, dbname: s.dbname, tables: []};}));
  }

  return (
    <TreeView
      aria-label="connection"
      defaultExpanded={['3']}
      defaultCollapseIcon={<ArrowDropDownIcon />}
      defaultExpandIcon={<ArrowRightIcon />}
      defaultEndIcon={<div style={{ width: 24 }} />}
      sx={{ flexGrow: 1, maxWidth: 280 }}
    >
      <StyledTreeItem nodeId="root" labelText="接続" labelIcon={MenuIcon}
          aria-controls="connect-menu"
          aria-expanded={open ? 'true' : undefined} aria-haspopup="true"
          onContextMenu={handlePopup}>
        {schemas.map((schema) => (
          <StyledTreeItem key={schema.name} nodeId={schema.name} labelText={schema.name} labelIcon={PersonIcon}
                          aria-controls="schema-menu"
                          aria-expanded={open ? 'true' : undefined} aria-haspopup="true"
                          data-connname={schema.name}
                          onClick={handleSchemaClick}
                          onContextMenu={handlePopup}>
            <StyledTreeItem nodeId={`${schema.name}-#tables`} labelText="テーブル" labelIcon={DatasetIcon}>
              {schema.tables.map((table) => (
                <StyledTreeItem key={`${schema.name}-${table.name}`} nodeId={`${schema.name}-${table.name}`} labelText={table.name} labelIcon={ViewListIcon}
                                dummy={schemasRefresh ? '1' : ''}
                                onDoubleClick={handleTableDblClick}>
                </StyledTreeItem>
              ))}
            </StyledTreeItem>
          </StyledTreeItem>
        ))}
      </StyledTreeItem>
      <Menu
        id="popup-menu"
        MenuListProps={{
          'aria-labelledby': 'long-button',
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handlePopupClose}
        PaperProps={{
          style: {
            maxHeight: MENU_ITEM_HEIGHT * 4.5,
            width: '20ch',
            position: 'absolute',
            top: 0
          },
        }}
      >
        {menuItems.map((item) => (
          <MenuItem key={item.name} onClick={() => {item.func(); handlePopupClose();}}>
            {item.name}
          </MenuItem>
        ))}
      </Menu>
      <ConnectionSettings open={dialogOpen} close={() => setDialogOpen(false)} submit={handleSettingSubmit} {...dialogprops} />
   </TreeView>
  );
}