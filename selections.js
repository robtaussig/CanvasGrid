export class Selections {
  constructor() {
    this.minRow = null;
    this.minCol = null;
    this.maxRow = null;
    this.maxCol = null;
  }

  get selectionCorners() {

    return [this.minRow, this.maxRow, this.minCol, this.maxCol];
  }

  flush() {
    this.minRow = null;
    this.minCol = null;
    this.maxRow = null;
    this.maxCol = null;
  }

  updateSelections(selectionStart, selectionEnd) {
    const minRow = Math.min(selectionStart.row, selectionEnd.row);
    const minCol = Math.min(selectionStart.col, selectionEnd.col);
    const maxRow = Math.max(selectionStart.row, selectionEnd.row);
    const maxCol = Math.max(selectionStart.col, selectionEnd.col);
    
    this.minRow = minRow;
    this.minCol = minCol;
    this.maxRow = maxRow;
    this.maxCol = maxCol;
  }
}