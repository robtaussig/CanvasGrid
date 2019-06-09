import { GridDimensions } from './grid-dimensions';
import { Selections } from './selections';
import { History } from './history';
import { Container } from './container';
import { CellInput, CellClick } from './cell-input';
import {
  DEFAULT_FONT_SIZE,
  DEFAULT_FONT_COLOR,
} from './constants';

export class CanvasGrid {
  constructor(settings = {}) {
    this.settings = settings;
    this.lastClick = new CellClick(this.createCellInput.bind(this));
  }

  initialize(element) {
    this.gridDimensions = new GridDimensions();
    this.createContainer(element);
    this.createHistories();
    this.createSelections();
    this.attachListeners();
  }

  createCellInput({ row, col }) {
    if (this.destroyCellInput) {
      this.destroyCellInput();
    }

    const onEscape = e => {
      if (e.key === 'Escape') {
        if (this.destroyCellInput) this.destroyCellInput();
        this.destroyCellInput = null;
      }
    };

    const removeInput = new CellInput(
      row, col, 
      this.gridDimensions, this.containers, 
      this.handleCellInput.bind(this), 
      this.handleCellInputSubmit.bind(this), 
      this.handleCellInputArrowNavigation.bind(this)
    );

    window.addEventListener('keydown', onEscape);
    this.destroyCellInput = () => {
      removeInput();
      window.removeEventListener('keydown', onEscape);
    };
  }

  createContainer(element) {
    this.containers = new Container(element, this.gridDimensions, this.handleSelectHeaders.bind(this));
  }

  createHistories() {
    this.history = new History();
    this.future = new History();
  }

  createSelections() {
    this.selections = new Selections();
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
      const isDoubleClick = this.lastClick.record(row, col);
      if (isDoubleClick) {
        onMouseUp();
      } else {
        this.updateSelection({ row, col }, { row, col });
        selectionStartCoords = { row, col };
        this.containers.canvas.addEventListener('mousemove', onMouseMove);
        this.containers.canvas.addEventListener('mouseup', onMouseUp);
      }
    };

    const onMouseUp = event => {
      selectionStartCoords = undefined;
      selectionEndCoords = undefined;
      this.containers.canvas.removeEventListener('mousemove', onMouseMove);
      this.containers.canvas.removeEventListener('mouseup', onMouseUp);
    };

    this.containers.canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('resize', this.render.bind(this));
    window.addEventListener('keydown', this.handleKeyUp.bind(this));
  }

  drawBackground(boundaries) {

  }

  drawBorders(boundaries) {
    this.drawRows(boundaries);
    this.drawColumns(boundaries);
  }

  drawRows(boundaries) {
    const data = this.history.head.data;
    const getHorizontalBorderDimensions = (row, col, top, height) => {
      const cellBottom = this.getBorderWidth(data[row][col]);
      const bottomCellTop = this.getBorderWidth(data[row + 1] ? data[row + 1][col] : {});
      return {
        top: top + height - cellBottom,
        topLineWidth: cellBottom,
        topBorderColor: data[row][col].borderColor || 'gainsboro',
        bottomTop: top + height + cellBottom,
        bottomLineWidth: bottomCellTop,
        bottomBorderColor: data[row + 1] ? data[row + 1][col].borderColor : 'gainsboro',
      };
    };

    const { rows, columns } = this.gridDimensions;
    let topOffset = 0;
    rows.forEach((height, rowIdx) => {
      let leftOffset = 0;
      columns.forEach((width, colIdx) => {
        if (this.gridDimensions.isWithinBoundaries(boundaries, rowIdx, colIdx)) {
          const { top, topLineWidth, topBorderColor, bottomTop, bottomLineWidth, bottomBorderColor } = getHorizontalBorderDimensions(rowIdx, colIdx, topOffset, height);
          this.drawBorder(leftOffset, leftOffset + width, top, top, topLineWidth, topBorderColor);
          this.drawBorder(leftOffset, leftOffset + width, bottomTop, bottomTop, bottomLineWidth, bottomBorderColor);
        }
        leftOffset += width;
      });
      topOffset += height;
    });
  }

  drawColumns(boundaries) {
    const data = this.history.head.data;
    const getVerticalBorderDimensions = (row, col, left, width) => {
      const cellLeft = this.getBorderWidth(data[row][col]);
      const rightCellLeft = this.getBorderWidth(data[row][col + 1] || {});
      return {
        left: left + width - cellLeft,
        leftLineWidth: cellLeft,
        leftBorderColor: data[row][col].borderColor || 'gainsboro',
        rightLeft: left + width + cellLeft,
        rightLeftLineWidth: rightCellLeft,
        rightBorderColor: data[row][col + 1] ? data[row][col + 1].borderColor : 'gainsboro',
      };
    };

    const { rows, columns } = this.gridDimensions;
    let leftOffset = 0;
    columns.forEach((width, colIdx) => {
      let topOffset = 0;
      rows.forEach((height, rowIdx) => {
        if (this.gridDimensions.isWithinBoundaries(boundaries, rowIdx, colIdx)) {
          const { left, leftLineWidth, leftBorderColor, rightLeft, rightLeftLineWidth, rightBorderColor } = getVerticalBorderDimensions(rowIdx, colIdx, leftOffset, width);
          this.drawBorder(left, left, topOffset, topOffset + height, leftLineWidth, leftBorderColor);
          this.drawBorder(rightLeft, rightLeft, topOffset, topOffset + height, rightLeftLineWidth, rightBorderColor);
        }
        topOffset += height;
      });
      leftOffset += width;
    });
  }

  drawBorder(leftStart, leftEnd, topStart, topEnd, lineWidth, borderColor) {
    this.containers.ctx.beginPath();
    this.containers.ctx.lineWidth = lineWidth;
    this.containers.ctx.strokeStyle = borderColor;
    this.containers.ctx.moveTo(leftStart, topStart);
    this.containers.ctx.lineTo(leftEnd, topEnd);
    this.containers.ctx.stroke();
  }

  drawCells(boundaries) {
    const data = this.history.head.data;
    this.preprocessDimensions(data, boundaries);
    const { rows, columns } = this.gridDimensions;
    let topOffset = 0;

    rows.forEach((height, rowIdx) => {
      let leftOffset = 0;
      columns.forEach((width, colIdx) => {
        const cell = data[rowIdx][colIdx];
        if (this.gridDimensions.isWithinBoundaries(boundaries, rowIdx, colIdx)) {
          this.drawCell(rowIdx, colIdx, cell, topOffset, leftOffset, height, width);
        }
        leftOffset+= width;
      });
      topOffset += height;
    });
  }

  drawCell(row, col, { value, config}, top, left, height, width, selected = false) {
    this.drawCellBackground(config, top, left, height, width, selected);
    this.drawCellText(value, config, top, left, height, width);
  }

  drawCellBackground(config, top, left, height, width, selected) {
    const borderWidth = this.getBorderWidth(config);
    if (selected) {
      this.containers.ctx.fillStyle = 'dodgerblue';
    } else {
      this.containers.ctx.fillStyle = config.fillColor || '#FFFFFF';
    }
    this.containers.ctx.fillRect(left + borderWidth + 0.5, top + borderWidth + 0.5, width - (borderWidth * 2) - 1, height - (borderWidth * 2) - 1);
  }

  drawCellText(value, config, top, left, height, width) {
    const fontSize = config.fontSize || DEFAULT_FONT_SIZE;
    const fontColor = config.fontColor || DEFAULT_FONT_COLOR;
    this.containers.ctx.font = `${fontSize}px Arial`;
    this.containers.ctx.fillStyle = fontColor;
    const textWidth = Math.ceil(this.containers.ctx.measureText(value).width);
    
    this.containers.ctx.fillText(value, left + ((width - textWidth) / 2), top + (height / 2) + 4);
  }

  drawHeaders(boundaries) {
    this.containers.headers.render(this.containers.canvas.width, this.containers.canvas.height);
  }

  preprocessDimensions(data, boundaries) {
    const { totalHeight, totalWidth } = this.gridDimensions.calculateDimensions(data, boundaries);

    if (this.containers.canvas.height !== totalHeight) this.containers.canvas.height = totalHeight;
    if (this.containers.canvas.width !== totalWidth) this.containers.canvas.width = totalWidth;

    return { totalHeight, totalWidth };
  }

  getBorderWidth(cell) {
    return cell.borderStyle === 'bold' ? 1 : 0.5;
  }

  onDataUpdate(data, addToHistory = true, render = true, boundaries) {
    if (addToHistory) {
      this.history.addData(data);
      this.future.flush();
    }
    if (render) {
      this.gridDimensions.flush();
      this.render(boundaries);
    }
  }

  setValueOfCell(row, col, value, updateHistory = true, withSelect = true) {    
    const nextData = this.history.head.data.reduce((acc, val, rowIdx) => {
      acc[rowIdx] = [...val].map((cell, colIdx) => {
        if (rowIdx === row && colIdx === col) {
          return Object.assign({}, cell, {
            value
          });
        }
        return cell;
      });

      return acc;
    }, []);

    if (this.gridDimensions.willRequireResize(row, col, value, nextData)) {
      this.onDataUpdate(nextData, updateHistory, true);
    } else {
      this.onDataUpdate(nextData, updateHistory, false);
    }
    
    const { top, left, height, width } = this.gridDimensions.calculateCellDimensions(row, col);
    this.drawCell(row, row, nextData[row][col], top, left, height, width, withSelect);
  }

  getCoords(clientX, clientY) {
    const columns = this.gridDimensions.columns;
    const rows = this.gridDimensions.rows;
    const columnHeaderHeight = this.containers.headers.columnHeader.wrapper.clientHeight;
    const rowHeaderWidth = this.containers.headers.rowHeader.wrapper.clientWidth;
    const { offsetTop, offsetLeft } = this.containers.wrapper;
    const scrollTop = this.containers.mainElement.scrollTop - columnHeaderHeight - offsetTop;
    const scrollLeft = this.containers.mainElement.scrollLeft - rowHeaderWidth - offsetLeft;
    let rowTotal = 0;
    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const rowHeight = rows[rowIdx];
      if (rowTotal + rowHeight > clientY + scrollTop) {
        let columnTotal = 0;
        for (let colIdx = 0; colIdx < columns.length; colIdx++) {
          const columnWidth = columns[colIdx];
          if (columnTotal + columnWidth > clientX + scrollLeft) {
            return { row: rowIdx, col: colIdx };
          }
          columnTotal += columnWidth;
        }
      }
      rowTotal += rowHeight;
    }

    throw new Error('Coords not found');
  }

  getDimensions(row, col) {
    const columns = this.gridDimensions.columns;
    const rows = this.gridDimensions.rows;
    let rowTotal = 0;
    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const rowHeight = rows[rowIdx];
      if (rowIdx === row) {
        let columnTotal = 0;
        for (let colIdx = 0; colIdx < columns.length; colIdx++) {
          const columnWidth = columns[colIdx];
          if (colIdx === col) {
            const height = rows[rowIdx];
            const width = columns[colIdx];
            return { top: rowTotal, left: columnTotal, height, width };
          }
          columnTotal += columnWidth;
        }
      }
      rowTotal += rowHeight;
    }

    throw new Error('Dimensions not found');
  }

  updateSelection(selectionStartCoords, selectionEndCoords, updateHeaders = true) {
    const [previousRowStart, previousRowEnd, previousColStart, previousColEnd] = this.selections.selectionCorners;
    this.selections.updateSelections(selectionStartCoords, selectionEndCoords);
    const [rowStart, rowEnd, colStart, colEnd] = this.selections.selectionCorners;
    const previousBoundaries = { colLeft: previousColStart, colRight: previousColEnd, rowTop: previousRowStart, rowEnd: previousRowEnd };
    const nextoundaries = { colLeft: colStart, colRight: colEnd, rowTop: rowStart, rowEnd: rowEnd };

    if (previousRowStart !== null) {
      for (let row = previousRowStart; row <= previousRowEnd; row++) {
        for (let col = previousColStart; col <= previousColEnd; col++) {
          if (!this.gridDimensions.isWithinBoundaries(nextoundaries, row, col)) {
            const { top, left, height, width } = this.getDimensions(row, col);
            const data = this.history.head.data;
            const cell = data[row][col];
  
            this.drawCell(row, row, cell, top, left, height, width, false);
          }
        }
      }
    }

    for (let row = rowStart; row <= rowEnd; row++) {
      for (let col = colStart; col <= colEnd; col++) {
        if (!this.gridDimensions.isWithinBoundaries(previousBoundaries, row, col)) {
          const { top, left, height, width } = this.getDimensions(row, col);
          const data = this.history.head.data;
          const cell = data[row][col];
    
          this.drawCell(row, row, cell, top, left, height, width, true);
        }
      }
    }

    if (updateHeaders) {
      this.updateHeaderSelections();
    }
  }

  updateHeaderSelections() {
    const [rowStart, rowEnd, colStart, colEnd] = this.selections.selectionCorners;
    this.containers.headers.rowHeader.updateSelection({ row: rowStart, col: 0 }, { row: rowEnd, col: 0 }, true);
    this.containers.headers.columnHeader.updateSelection({ row: 0, col: colStart }, { row: 0, col: colEnd }, true);
  }

  updateSelectionsFromRow(start, end) {
    const { columns } = this.gridDimensions;

    this.updateSelection({ row: start.row, col: 0 }, { row: end.row, col: columns.length - 1 }, false);
  }

  updateSelectionsFromColumn(start, end) {
    const { rows } = this.gridDimensions;

    this.updateSelection({ row: 0, col: start.col }, { row: rows.length - 1, col: end.col }, false);
  }

  handleSelectHeaders(type) {
    return (start, end) => {
      switch (type) {
        case 'row':
          this.updateSelectionsFromRow(start, end);
          break;
        case 'column':
          this.updateSelectionsFromColumn(start, end);
          break;
      
        default:
          break;
      }
    };
  }

  handleCellInput(row, col, value) {
    //TODO: formulas
  }

  handleCellInputSubmit(row, col, value) {
    if (this.destroyCellInput) this.destroyCellInput();
    this.destroyCellInput = null;
    this.setValueOfCell(row, col, value);
  }

  handleCellInputArrowNavigation(row, col, key) {
    //TODO
  }

  handleKeyUp(e) {
    if (e.metaKey || e.ctrlKey) {
      if (e.key === 'z') {
        this.rewindHistory();
      } else if (e.key === 'y') {
        e.preventDefault();
        this.fastForwardHistory();
      }
    }
  }

  rewindHistory() {
    if (this.history.commits.length > 1) {
      const commit = this.history.pop();
      this.future.addCommit(commit);
      this.onDataUpdate(this.history.head.data, false, false);

      for (let [i, { row, col, from, to }] of commit.toIter()) {
        if (Object.keys(to.config).length > 0) {
          //TODO Handle formatting change
        }
  
        this.setValueOfCell(row, col, from.value, false, false);
      }
    }
  }

  fastForwardHistory() {
    //TODO: Use diffs instead of rewriting all data
    if (this.future.head) {
      const commit = this.future.pop();
      this.history.addCommit(commit);
      this.onDataUpdate(this.history.head.data.data, false, false);

      for (let [i, { row, col, from, to }] of commit.toIter()) {
        if (Object.keys(from.config).length > 0) {
          //TODO Handle formatting change
        }
  
        this.setValueOfCell(row, col, to.value, false, false);
      }
    }
  }

  render(boundaries) {
    this.drawBackground(boundaries);
    this.drawCells(boundaries);
    this.drawBorders(boundaries);
    this.drawHeaders(boundaries);
  }
}
