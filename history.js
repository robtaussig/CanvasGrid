import { DEFAULT_FILL_COLOR } from './constants';

const DEFAULT_CELL = {
  config: {
    fillColor: DEFAULT_FILL_COLOR,
    fontSize: 11,
  },
  value: '',
};

const DEFAULT_HISTORY_LENGTH = 10;

export class History {
  constructor(settings = {}) {
    this.commits = [];
    this.length = settings.length || DEFAULT_HISTORY_LENGTH;
  }

  get head() {
    return this.commits[this.commits.length - 1] ? this.commits[this.commits.length - 1] : undefined;
  }

  get tail() {
    return this.commits[0];
  }

  flush() {
    const commits = [...this.commits];
    this.commits = [];

    return commits;
  }

  shift() {
    return this.commits.shift();
  }

  pop() {
    if (this.commits.length > 0) {
      return this.commits.pop();
    }
  }

  addCommit(commit) {
    if (commit) {
      this.commits.push(commit);
    }
  }

  addData(data) {
    if (this.commits.length === this.length) {
      this.shift();
    }
    this.commits.push(new Commit(this.head, data));
  }
}

class Commit {
  constructor(previous, next) {
    this.data = next;
    if (previous) {
      this.diffs = this.generateDiffs(previous, next);
    } else {
      this.diffs = this.generateOrigin(next);
    }
  }

  generateOrigin(next) {
    const diffs = [];
    next.forEach((row, rowIdx) => {
      row.forEach((col, colIdx) => {
        const diff = Diff.createDiffFromOrigin(rowIdx, colIdx, col);
        diffs.push(diff);
      });
    });

    return diffs;
  }

  generateDiffs(head, next) {
    const diffs = [];
    next.forEach((row, rowIdx) => {
      row.forEach((col, colIdx) => {
        const { from, to } = Diff.getDiff(head.data[rowIdx][colIdx], col);
        if (from && to) {
          diffs.push(new Diff(rowIdx, colIdx, from, to));
        }
      });
    });

    return diffs;
  }

  * toIter() {
    for (let i = 0; i < this.diffs.length; i++) {
      yield [i, this.diffs[i]];
    }
  }
}


class Diff {
  constructor(row, col, from, to) {
    this.row = row;
    this.col = col;
    this.from = from;
    this.to = to;
  }

  static getDiff(previous, { config, value }) {
    const from = { config: {} };
    const to = { config: {} };
    let hasDiff = false;
    if (previous.value !== value) {
      from.value = previous.value;
      to.value = value;
      hasDiff = true;
    }
    for (let prop in config) {
      if (config.hasOwnProperty(prop)) {
        if (config[prop] !== previous.config[prop]) {
          to.config[prop] = config[prop];
          from.config[prop] = previous.config[prop];
          hasDiff = true;
        }
      }
    }

    if (hasDiff) return { from, to };
    return { from: false, to: false };
  }

  static createDiffFromOrigin(row, col, { config, value }) {
    const to = { config: {}, value };
    const from = DEFAULT_CELL;
    for (let prop in config) {
      if (config.hasOwnProperty(prop)) {
        if (config[prop] !== from.config[prop]) {
          to.config[prop] = config[prop];
        }
      }
    }

    return new Diff(row, col, from, to);
  }
}