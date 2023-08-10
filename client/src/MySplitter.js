import * as React from 'react';
import { styled } from '@mui/material/styles';

const StyledDiv = styled('div')(({theme}) => ({
  backgroundColor: theme.palette.divider,
  width: 8,
  cursor: 'col-resize',
}));

export default function MySplitter() {
  let isDrug = false;

  const handleDrug = e => {
    if (isDrug == true) {
      const target = e.target;
      const lh = target.previousSibling;
      const rh = target.nextSibling;
      let lx = lh.clientWidth;
      let rx = rh.clientWidth;
      let total = lx + rx;
      lx = e.clientX / total * 100;
      lh.style.flexBasis = `${lx}%`;
      rh.style.flexBasis = `${100 - lx}%`;
    }
  };

  return (
    <StyledDiv onPointerDownCapture={e => {e.target.setPointerCapture(e.pointerId);isDrug=true;}}
              onPointerUpCapture={e => {e.target.releasePointerCapture(e.pointerId);isDrug=false;}}
              onPointerMove={handleDrug}/>
  );
}