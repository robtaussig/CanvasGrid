import {
  DEFAULT_FONT_SIZE,
  DEFAULT_CELL_PADDING,
} from './constants';

export class GridDimensions {
  constructor() {
    this.rowHeights = {};
    this.columnWidths = {};
    this.columnsCache = null;
    this.rowsCache = null;
  }

  get columns() {
    if (this.columnsCache) return this.columnsCache;
    this.columnsCache = new Array(Object.keys(this.columnWidths).length).fill(null).map((el, idx) => this.columnWidths[idx]);

    return this.columnsCache;
  }

  get rows() {
    if (this.rowsCache) return this.rowsCache;
    this.rowsCache = new Array(Object.keys(this.rowHeights).length).fill(null).map((el, idx) => this.rowHeights[idx]);

    return this.rowsCache;
  }

  calculateDimensions(data, boundaries) {
    data.forEach((row, rowIdx) => this.calculateRowDimensions(row, rowIdx, boundaries));
    const totalHeight = this.getTotalHeight();
    const totalWidth = this.getTotalWidth();
    return { totalHeight, totalWidth };
  }

  calculateRowDimensions(row, rowIdx, boundaries) {
    row.forEach(this.calculateColumnDimensions(rowIdx, boundaries));
  }

  calculateColumnDimensions(row, boundaries) {
    return (cell, colIdx) => {
      if (this.isWithinBoundaries(boundaries, row, colIdx)) {
        const width = this.calculateCellWidth(cell);
        const height = this.calculateCellHeight(cell);
        this.recordDimensions(row, colIdx, width, height);
      }
    };
  }

  calculateCellWidth({ value, config }) {
    const width = Math.ceil(this.ctx.measureText(value).width);
    const borderSpace = config.borderStyle === 'bold' ? 2: 1;

    return (width + borderSpace > 50 ? width + borderSpace : 50) + DEFAULT_CELL_PADDING;
  }

  calculateCellHeight({ value, config }) {
    const fontSize = config.fontSize || DEFAULT_FONT_SIZE;
    const height = Math.ceil(fontSize * 2);
    const borderSpace = config.borderStyle === 'bold' ? 2: 1;

    return height + borderSpace;
  }

  getTotalHeight() {
    return Object.values(this.rowHeights).reduce((acc, val) => {
      acc += val;
      return acc;
    }, 0);
  }

  getTotalWidth() {
    return Object.values(this.columnWidths).reduce((acc, val) => {
      acc += val;
      return acc;
    }, 0);
  }

  calculateCellDimensions(inputRow, inputCol) {
    const rows = this.rows;
    const columns = this.columns;
    let top = 0;
    let left = 0;
    for (let row = 0; row < rows.length; row++) {
      if (row === inputRow) {
        for (let col = 0; col < columns.length; col++) {
          if (col === inputCol) {
            return { top, left, height: rows[row], width: columns[col] };
          } else {
            left += columns[col];
          }
        }
      } else {
        top += rows[row];
      }
    }

    throw new Error('Cell dimensions not found');
  }

  flush() {
    this.rowHeights = {};
    this.columnWidths = {};
    this.columnsCache = null;
    this.rowsCache = null;
  }

  isWithinBoundaries(boundaries, row, col) {
    if (boundaries) {
      return row >= boundaries.rowTop &&
        row <= boundaries.rowBottom &&
        col >= boundaries.colLeft &&
        col <= boundaries.colRight;
    }

    return true;
  }

  maxWidthByColumn(col) {
    return this.columnWidths[col];
  }

  maxHeightByRow(row) {
    return this.rowHeights[row];
  }

  recordHeight(row, height) {
    if (!this.rowHeights[row] || height > this.rowHeights[row]) {
      this.rowHeights[row] = height;
    }
  }

  recordWidth(col, width) {
    if (!this.columnWidths[col] || width > this.columnWidths[col]) {
      this.columnWidths[col] = width;
    }
  }

  recordDimensions(row, col, width, height) {
    this.recordHeight(row, height);
    this.recordWidth(col, width);
  }

  setContext(ctx) {
    this.ctx = ctx;
  }

  willRequireResize(row, col, value, data) {
    const columns = this.columns;
    const nextWidth = this.calculateCellWidth({ value, config: data[row][col].config });
    const previousWidth = columns[col];

    if (nextWidth > columns[col]) return true;
    if (previousWidth < columns[col]) return false;
    for (let i = 0; i < data.length; i++) {
      if (i !== row) {
        const width = this.calculateCellWidth({ value: data[i][col].value, config: data[i][col].config });
        if (width === previousWidth) return false;
      }
    }
    return true;
  }
}