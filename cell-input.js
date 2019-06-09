export class CellClick {
  constructor(onCreateInput) {
    this.onCreateInput = onCreateInput;
  }

  record(row, col) {
    let isDoubleClick = false;
    if (this.lastRowClick === row && this.lastColClick === col) {
      const now = new Date();
      if (now - this.lastClickTime < 500) {
        this.lastRowClick = null;
        this.lastColClick = null;
        this.onCreateInput({ row, col });
        isDoubleClick = true;
      }
    }
    this.lastRowClick = row;
    this.lastColClick = col;
    this.lastClickTime = new Date();
    return isDoubleClick;
  }
}

export class CellInput {
  constructor(row, col, gridDimensions, containers, onInput, onSubmit, onArrowKey) {
    const destroyForm = this.injectInputField(row, col, gridDimensions, containers, onInput, onSubmit, onArrowKey);
    return destroyForm;
  }

  injectInputField(row, col, gridDimensions, containers, onInput, onSubmit, onArrowKey) {
    const wrapper = containers.mainElement;
    const { rows, columns } = gridDimensions;
    const width = columns[col];
    const top = rows.reduce((total, height, idx) => {
      if (row > idx) total+= height;
      return total;
    }, 0);
    const left = columns.reduce((total, width, idx) => {
      if (col > idx) total+= width;
      return total;
    }, 0);
    
    const { form, input } = this.createInputField(top, left);
    this.handleInputs(row, col, form, input, onInput, onSubmit, onArrowKey);
    wrapper.prepend(form);
    setTimeout(() => {
      form.style.width = `${width}px`;
      input.focus();
    }, 0);

    return () => {
      form.remove();
    };
  }

  createInputField(top, left) {
    const form = document.createElement('form');
    const input = document.createElement('input');
    form.prepend(input);
    input.type = 'text';
    form.style.position = 'absolute';
    form.style.top = `${top}px`;
    form.style.left = `${left}px`;
    form.style.width = '0px';
    form.style.transition = 'all 0.1s linear';
    form.style.backgroundColor = 'gainsboro';
    form.style.display = 'flex';
    form.style.justifyContent = 'center';
    form.style.alignItems = 'center';
    input.style.border = '1px solid dodgerblue';
    input.style.width = '100%';
    input.style.backgroundColor = 'white';

    return { form, input };
  }

  handleInputs(row, col, form, input, onInput, onSubmit, onArrowKey) {
    const onFormSubmit = () => {
      onSubmit(row, col, input.value);
    };

    input.oninput = e => {
      onInput(row, col, e.target.value);
    };

    input.onkeydown = e => {
      if (/(Arrow)/.test(e.key)) {
        onArrowKey(row, col, e.key);
      }
    };

    form.onsubmit = e => {
      e.preventDefault();
      onFormSubmit();
    };
  }
}