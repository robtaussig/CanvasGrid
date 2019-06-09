import { GridHeaders } from './grid-headers';
import {
  DEFAULT_FONT_SIZE,
} from './constants';

export class Container {
  constructor(element, gridDimensions, onSelectHeaders) {
    this.createCanvases(element, gridDimensions, onSelectHeaders);
  }

  createCanvases(element, gridDimensions, onSelectHeaders) {
    this.wrapper = element;
    this.generateContainerStyling(element);
    this.createHeaders(element, gridDimensions, onSelectHeaders);
    this.createBody(element, gridDimensions);
    this.syncScrolling();
  }

  generateContainerStyling(container) {
    container.style.display = 'grid';
    container.style.gridTemplateRows = '[column-header] 30px [main] 1fr';
    container.style.gridTemplateColumns = '[row-header] 50px [main] 1fr';
    container.style.overflow = 'hidden';
  }

  createHeaders(container, gridDimensions, onSelectHeaders) {
    const columnHeader = this.createColumnHeader(container);
    const rowHeader = this.createRowHeader(container);
    const corner = this.createHeaderCorner(container);
    this.headers = new GridHeaders(rowHeader, columnHeader, corner, gridDimensions, onSelectHeaders);
    this.headers.rowHeader.ctx.font = `${DEFAULT_FONT_SIZE}px Arial`;
    this.headers.columnHeader.ctx.font = `${DEFAULT_FONT_SIZE}px Arial`;
  }

  createBody(container, gridDimensions) {
    const bodyWrapper = document.createElement('div');
    const bodyCanvas = document.createElement('canvas');
    bodyWrapper.append(bodyCanvas);
    container.append(bodyWrapper);
    this.mainElement = bodyWrapper;
    this.canvas = bodyCanvas;
    this.ctx = this.canvas.getContext('2d');
    gridDimensions.setContext(this.ctx);
    this.ctx.font = `${DEFAULT_FONT_SIZE}px Arial`;
    this.generateBodyStyling(bodyWrapper);
  }

  createHeaderCorner(container) {
    const cornerWrapper = document.createElement('div');
    const cornerCanvas = document.createElement('canvas');
    cornerWrapper.append(cornerCanvas);
    container.append(cornerWrapper);
    this.generateCornerStyling(cornerWrapper);

    return { cornerWrapper, cornerCanvas };
  }

  syncScrolling() {
    const syncHeaders = (e) => {
      const { scrollTop, scrollLeft } = e.target;
      this.headers.rowHeader.wrapper.scrollTop = scrollTop;
      this.headers.columnHeader.wrapper.scrollLeft = scrollLeft;
    };
  
    this.mainElement.addEventListener('scroll', syncHeaders);
  }

  generateCornerStyling(corner) {
    corner.style.gridRow = 'column-header';
    corner.style.gridColumn = 'row-header';
  }

  generateBodyStyling(body) {
    body.style.gridRow = 'main';
    body.style.gridColumn = 'main';
    body.style.overflow = 'auto';
    body.style.position = 'relative';
  }

  createRowHeader(container) {
    const rowHeaderWrapper = document.createElement('div');
    const rowHeaderCanvas = document.createElement('canvas');
    rowHeaderWrapper.append(rowHeaderCanvas);
    container.append(rowHeaderWrapper);
    this.generateRowHeaderStyling(rowHeaderWrapper);

    return { rowHeaderWrapper, rowHeaderCanvas };
  }

  generateRowHeaderStyling(rowHeader) {
    rowHeader.style.gridRow = 'main';
    rowHeader.style.gridColumn = 'row-header';
    rowHeader.style.overflow = 'hidden';
  }

  createColumnHeader(container) {
    const columnHeaderWrapper = document.createElement('div');
    const columnHeaderCanvas = document.createElement('canvas');
    columnHeaderWrapper.append(columnHeaderCanvas);
    container.append(columnHeaderWrapper);
    this.generateColumnHeaderStyling(columnHeaderWrapper);

    return { columnHeaderWrapper, columnHeaderCanvas };
  }

  generateColumnHeaderStyling(columnHeader) {
    columnHeader.style.gridRow = 'column-header';
    columnHeader.style.gridColumn = 'main';
    columnHeader.style.overflow = 'hidden';
  }
}