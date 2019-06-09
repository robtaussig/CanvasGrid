import { Selections } from './selections';
import {
  DEFAULT_FONT_SIZE,
  DEFAULT_FONT_COLOR,
} from './constants';

export class GridHeaders {
  constructor({ rowHeaderWrapper, rowHeaderCanvas }, { columnHeaderWrapper, columnHeaderCanvas }, { cornerWrapper, cornerCanvas }, gridDimensions, onSelect) {
    this.rowHeader = new RowHeader(rowHeaderWrapper, rowHeaderCanvas, gridDimensions, onSelect('row'));
    this.columnHeader = new ColumnHeader(columnHeaderWrapper, columnHeaderCanvas, gridDimensions, onSelect('column'));
    this.corner = new CornerHeader(cornerWrapper, cornerCanvas, gridDimensions, onSelect('corner'));
  }

  render(width, height) {
    this.rowHeader.render(null, height);
    this.columnHeader.render(width, null);
    this.corner.render(null, null);
  }
}

class GridHeader {
  constructor(element, canvas, gridDimensions, onSelect) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onSelect = onSelect;
    this.wrapper = element;
    this.gridDimensions = gridDimensions;
    this.selections = new Selections();
    this.attachListeners();
  }

  attachListeners() {
    let selectionStartCoords;
    let selectionEndCoords;

    const onMouseMove = ({ clientX, clientY }) => {
      const { row, col } = this.getCoords(clientX, clientY);
      if (!selectionEndCoords || selectionEndCoords.row !== row || selectionEndCoords.col !== col) {
        this.updateSelection(selectionStartCoords, { row, col });
        selectionEndCoords = { row, col };
      }
    };

    const onMouseDown = ({ clientX, clientY }) => {
      const { row, col } = this.getCoords(clientX, clientY);      
      this.updateSelection({ row, col }, { row, col });
      selectionStartCoords = { row, col };
      this.canvas.addEventListener('mousemove', onMouseMove);
      this.canvas.addEventListener('mouseup', onMouseUp);
    };

    const onMouseUp = event => {
      selectionStartCoords = undefined;
      selectionEndCoords = undefined;
      this.canvas.removeEventListener('mousemove', onMouseMove);
      this.canvas.removeEventListener('mouseup', onMouseUp);
    };

    this.canvas.addEventListener('mousedown', onMouseDown);
  }

  drawHeaders() {
    throw new Error('This should be overwritten by extending class');
  }

  render(width, height) {
    this.setWidth(width);
    this.setHeight(height);
    this.drawHeaders();
  }

  setWidth(width) {
    this.canvas.width = width || this.wrapper.clientWidth;
  }

  setHeight(height) {
    this.canvas.height = height || this.wrapper.clientHeight;
  }

  drawBackground() {
    this.ctx.fillStyle = 'gainsboro';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawCellBackground(left, width, top, height, selected) {
    const borderWidth = 1;
    if (selected) {
      this.ctx.fillStyle = 'dodgerblue';
    } else {
      this.ctx.fillStyle = 'gainsboro';
    }
    this.ctx.fillRect(left + borderWidth + 0.5, top + borderWidth + 0.5, width - (borderWidth * 2) - 1, height - (borderWidth * 2) - 1);
  }

  drawText(left, width, top, height, text) {
    const fontSize = DEFAULT_FONT_SIZE;
    const fontColor = DEFAULT_FONT_COLOR;
    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.fillStyle = fontColor;
    const textWidth = Math.ceil(this.ctx.measureText(text).width);
    
    this.ctx.fillText(text, left + ((width - textWidth) / 2), top + (height / 2) + 4);
  }

  drawBorder(leftStart, leftEnd, topStart, topEnd, lineWidth = 1, color = 'black') {
    this.ctx.beginPath();
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = color;
    this.ctx.moveTo(leftStart, topStart);
    this.ctx.lineTo(leftEnd, topEnd);
    this.ctx.stroke();
  }
}

class ColumnHeader extends GridHeader {
  constructor(wrapper, canvas, gridDimensions, onSelect) {
    super(wrapper, canvas, gridDimensions, onSelect);
  }

  getCoords(clientX) {
    const columns = this.gridDimensions.columns;

    const { offsetLeft } = this.canvas;
    const scrollLeft = this.canvas.parentElement.scrollLeft - offsetLeft;
    let columnTotal = 0;
    for (let colIdx = 0; colIdx < columns.length; colIdx++) {
      const columnWidth = columns[colIdx];
      if (columnTotal + columnWidth > clientX + scrollLeft) {
        return { row: 0, col: colIdx };
      }
      columnTotal += columnWidth;
    }

    throw new Error('Coords not found');
  }

  updateSelection(selectionStartCoords, selectionEndCoords, fromMain = false) {
    this.selections.updateSelections(selectionStartCoords, selectionEndCoords);
    const [rowStart, rowEnd, colStart, colEnd] = this.selections.selectionCorners;
    const { columns } = this.gridDimensions;
    let leftOffset = 0;

    this.drawBackground();

    columns.forEach((width, colIdx) => {
      const firstColumnBuffer = colIdx === 0 ? 1 : 0;
      const selected = colIdx >= colStart && colIdx <= colEnd;
      if (selected) {
        this.drawCellBackground(leftOffset - firstColumnBuffer, width + firstColumnBuffer, -1, this.canvas.height + 1, selected);
        this.drawBorder(leftOffset + width, leftOffset + width, 0, this.canvas.height, 2);
        this.drawBorder(leftOffset, leftOffset, 0, this.canvas.height, 2);
        this.drawBorder(leftOffset, leftOffset + width, 0, 0, 2);
        this.drawText(leftOffset, width, 0, this.canvas.height, indexToAlpha(colIdx + 1));
      } else {
        this.drawBorder(leftOffset, leftOffset, 0, this.canvas.height, 2);
        this.drawBorder(leftOffset + width, leftOffset + width, 0, this.canvas.height, 2);
        this.drawBorder(leftOffset, leftOffset + width, 0, 0, 2);
        this.drawText(leftOffset, width, 0, this.canvas.height, indexToAlpha(colIdx + 1));
      }
      leftOffset += width;
    });

    this.drawBottomBorder();

    if (!fromMain) {
      this.onSelect(selectionStartCoords, selectionEndCoords);
    }
  }

  drawCells() {
    const { columns } = this.gridDimensions;
    let leftOffset = 0;

    this.drawBackground();

    columns.forEach((width, colIdx) => {
      this.drawBorder(leftOffset + width, leftOffset + width, 0, this.canvas.height, 2);
      this.drawBorder(leftOffset, leftOffset, 0, this.canvas.height, 2);
      this.drawBorder(leftOffset, leftOffset + width, 0, 0, 2);
      this.drawText(leftOffset, width, 0, this.canvas.height, indexToAlpha(colIdx + 1));
      leftOffset += width;
    });

    this.drawBottomBorder();
  }

  drawBottomBorder() {
    this.drawBorder(0, this.canvas.width, this.canvas.height, this.canvas.height, 2);
  }

  drawHeaders() {
    this.drawBackground();
    this.drawCells();
  }
}

class RowHeader extends GridHeader {
  constructor(wrapper, canvas, gridDimensions, onSelect) {
    super(wrapper, canvas, gridDimensions, onSelect);
  }

  getCoords(clientX, clientY) {
    const rows = this.gridDimensions.rows;
    const { offsetTop } = this.canvas;
    const scrollTop = this.canvas.parentElement.scrollTop  - offsetTop;
    let rowTotal = 0;
    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const rowHeight = rows[rowIdx];
      if (rowTotal + rowHeight > clientY + scrollTop) {
        return { row: rowIdx, col: 0 };
      }
      rowTotal += rowHeight;
    }

    throw new Error('Coords not found');
  }

  updateSelection(selectionStartCoords, selectionEndCoords, fromMain) {
    this.selections.updateSelections(selectionStartCoords, selectionEndCoords);
    const [rowStart, rowEnd, colStart, colEnd] = this.selections.selectionCorners;
    const { rows } = this.gridDimensions;
    let topOffset = 0;
    this.drawBackground();
    rows.forEach((height, rowIdx) => {
      const firstRowBuffer = rowIdx === 0 ? 1 : 0;
      const selected = rowIdx >= rowStart && rowIdx <= rowEnd;
      if (selected) {
        this.drawCellBackground(0, this.canvas.width, topOffset - firstRowBuffer, height + firstRowBuffer, true);
        this.drawBorder(0, this.canvas.width, topOffset + height, topOffset + height, 2);
        this.drawBorder(0, this.canvas.width, topOffset, topOffset, 2);
        this.drawBorder(0, 0, topOffset, topOffset + height, 2);
        this.drawText(0, this.canvas.width, topOffset, height, rowIdx + 1);
      } else {
        this.drawBorder(0, this.canvas.width, topOffset + height, topOffset + height, 2);
        this.drawBorder(0, this.canvas.width, topOffset, topOffset, 2);
        this.drawBorder(0, 0, topOffset, topOffset + height, 2);
        this.drawText(0, this.canvas.width, topOffset, height, rowIdx + 1);
      }
      topOffset += height;
    });

    this.drawRightBorder();

    if (!fromMain) {
      this.onSelect(selectionStartCoords, selectionEndCoords);
    }
  }

  drawCells() {
    const { rows } = this.gridDimensions;
    let topOffset = 0;
    this.drawBackground();
    rows.forEach((height, rowIdx) => {
      this.drawBorder(0, this.canvas.width, topOffset + height, topOffset + height, 2);
      this.drawBorder(0, this.canvas.width, topOffset, topOffset, 2);
      this.drawBorder(0, 0, topOffset, topOffset + height, 2);
      this.drawText(0, this.canvas.width, topOffset, height, rowIdx + 1);
      topOffset += height;
    });

    this.drawRightBorder();
  }

  drawRightBorder() {
    this.drawBorder(this.canvas.width, this.canvas.width, 0, this.canvas.height, 2);
  }

  drawHeaders() {
    this.drawBackground();
    this.drawCells();
  }
}

class CornerHeader extends GridHeader {
  constructor(wrapper, canvas, gridDimensions, onSelect) {
    super(wrapper, canvas, gridDimensions, onSelect);
  }

  getCoords() {
    return { row: 0, col: 0 };
  }

  drawRightBorder() {
    this.ctx.beginPath();
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = 'black';
    this.ctx.moveTo(this.canvas.width, 0);
    this.ctx.lineTo(this.canvas.width, this.canvas.height);
    this.ctx.stroke();
  }

  drawLeftBorder() {
    this.ctx.beginPath();
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = 'black';
    this.ctx.moveTo(0, this.canvas.height);
    this.ctx.lineTo(this.canvas.width, this.canvas.height);
    this.ctx.stroke();
  }

  drawHeaders() {
    this.drawBackground();
    this.drawRightBorder();
    this.drawLeftBorder();
  }

  updateSelection() {

  }
}

export const alphaToIndex = letters => {
  for(var p = 0, n = 0; p < letters.length; p++){
      n = letters[p].charCodeAt() - 64 + n * 26;
  }
  return n;
};

export const indexToAlpha = num => {
  for (var ret = '', a = 1, b = 26; (num -= a) >= 0; a = b, b *= 26) {
    ret = String.fromCharCode(parseInt((num % b) / a) + 65) + ret;
  }
  return ret;
};