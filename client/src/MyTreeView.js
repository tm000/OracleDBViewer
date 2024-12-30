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
import { useTranslation } from 'react-i18next';
import { Schema } from './Schema';

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
  const { t, i18n } = useTranslation();

  const handlePopup = (event) => {
    event.preventDefault();
    let e = event.target;
    while (e && e.nodeName.toUpperCase() != 'LI') e = e.parentNode;
    switch (e.getAttribute('aria-controls')) {
      case 'connect-menu' :
        setMenuItems([{name:t("Add"), func: () => {handleClickOpen(ConnectionSettingsMode.New)}}]);
        setAnchorEl(e.children[0] || e);
        break;
      case 'schema-menu' :
        const connname = e.getAttribute('data-connname');
        setMenuItems([{name:t("Edit"), func: () => {handleClickOpen(ConnectionSettingsMode.Modify, connname);}},
                    {name:t("Delete"), func: () => {if (window.confirm(t("Delete confirm message"))) {
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

  const handleObjectClick = async (event) => {
    event.preventDefault();
    let menuObjElm = new MenuObjectElement(event.target);
    const schema = schemas.find(s => s.name == menuObjElm.parent.getAttribute('data-connname'));
    const schemaObject = schema[menuObjElm.objectName];
    if (schemaObject.length > 0) return;

    try {
      const response = await fetch(process.env.REACT_APP_API_URL, {
        method: 'POST',
        body: JSON.stringify({
          sql: schemaObject.selectSql,
          username: schema.userid,
          password: schema.password,
          dbname: schema.dbname,
          role: schema.role
        })
      });
      let resjson = await response.json();
      if (!response.ok) {
        alert(t("An error has occurred") + "\n" + resjson['error']);
        return;
      }
      resjson['body'].forEach(data => {
        schemaObject.push({name: data[0]});
      });
    } catch (e) {
      alert(t("Failed to get table list"));
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
      setDialogProps({mode: mode, name: '', userid: '', password: '', dbname: '', role: ''});
    } else {
      const schema = schemas.find(s => s.name == connname);
      setDialogProps({mode: mode, name: connname, userid: schema.userid, password: schema.password, dbname: schema.dbname, role: schema.role});
    }
    setDialogOpen(true);
  };

  const handleSettingSubmit = (setting) => {
    let schema;
    if (setting.mode == ConnectionSettingsMode.New) {
      const exists = schemas.find(s => s.name == setting.name);
      if (exists) {
        return `${t("Connection Name")}'${setting.name}'${t("Already exists")}`;
      } else {
        schema = new Schema();
        schemas.push(schema);
      }
    } else {
      schema = schemas.find(s => s.name == setting.currentname);
    }
    schema.name = setting.name;
    schema.userid = setting.userid;
    schema.password = setting.password;
    schema.dbname = setting.dbname;
    schema.role = setting.role;
    props.updateSchema(schemas);

    saveSchemas();
    setDialogOpen(false);
  };

  function MenuObjectElement(element) {
    while (element && element.nodeName.toUpperCase() != 'LI') element = element.parentNode;
    const elmId = element.getAttribute('id');
    this.objectName = elmId.match(/#(?<key>\w+)/)[1];

    element = element.parentNode;
    while (element && element.nodeName.toUpperCase() != 'LI') element = element.parentNode;
    this.parent = element;
  }

  function saveSchemas() {
    // store schemas excluding elements belonging to database
    localStorage.schemas = JSON.stringify(schemas.map(s => {return {name: s.name, userid: s.userid, password: s.password, dbname: s.dbname, role: s.role};}));
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
      <StyledTreeItem nodeId="root" labelText={t("connections")} labelIcon={MenuIcon}
          aria-controls="connect-menu"
          aria-expanded={open ? 'true' : undefined} aria-haspopup="true"
          onContextMenu={handlePopup}>
        {schemas.map((schema) => (
          <StyledTreeItem key={schema.name} nodeId={schema.name} labelText={schema.name} labelIcon={PersonIcon}
                          aria-controls="schema-menu"
                          aria-expanded={open ? 'true' : undefined} aria-haspopup="true"
                          data-connname={schema.name}
                          onContextMenu={handlePopup}>
            {schema.objects.map(([key, values]) => (
                <StyledTreeItem key={`${schema.name}-#${key}`} nodeId={`${schema.name}-#${key}`} labelText={t(key)} labelIcon={DatasetIcon}
                          aria-controls="object-menu"
                          aria-expanded={open ? 'true' : undefined} aria-haspopup="true"
                          onClick={handleObjectClick}>
                  {values.map((value) => (
                    <StyledTreeItem key={`${schema.name}-${value.name}`} nodeId={`${schema.name}-${value.name}`} labelText={value.name} labelIcon={ViewListIcon}
                                    dummy={schemasRefresh ? '1' : ''}
                                    onDoubleClick={handleTableDblClick}>
                    </StyledTreeItem>
                  ))}
                </StyledTreeItem>
              ))}
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