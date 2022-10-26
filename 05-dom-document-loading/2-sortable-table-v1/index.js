export default class SortableTable {

 element;
 subElement = {};

  constructor(headerConfig = [], data = []) {
    this.headerConfig = headerConfig;
    this.data = data;

    this.render();
  }

  
  render() {
    const element = document.createElement('div');

    element.innerHTML = this.getTable();

    this.element = element.firstElementChild;
    this.subElements = this.getSubElements(element);

  }

  getTable() {
// HEADER
    return /*html*/ `
    <div class="sortable-table">

    <div data-element="header" class="sortable-table__header sortable-table__row">
    ${this.headerConfig.map( item => this.getHeader(item) ).join('')}
    </div>
    ${this.getBody(this.data)}
    </div>`

  }

  getHeader({id, title, sortable, sortType} = {}){
    return /*html*/ `
    <div class="sortable-table__cell" data-id="${id}" data-sortable="${sortable}" data-order="asc">
    <span>${title}</span>
    <span data-element="arrow" class="sortable-table__sort-arrow">
    <span class="sort-arrow"></span>
  </span>
  </div>
    `
  }

  getBody(data) {
    return /*html */ `<div data-element="body" class="sortable-table__body">
    ${data.map( item => this.getBodyRow(item)).join('')}
    
    </div>`
  }

  getBodyRow(item) {
    return /*html */ `
    <a href="/products/${item.id}" class="sortable-table__row">

    ${ this.headerConfig.map( ({id, template}) => {
      return template 
        ? template(item.images)
        : `<div class="sortable-table__cell">${item[id]}</div>`
      }).join('')}
    </a>
    `
  }

  sort(field, order) {
    const sortData = this.sortStrings(field, order)
    const allColumns = document.querySelectorAll('.sortable-table__cell[data-id]')
    const currentColumn = this.element.querySelector(`.sortable-table__cell[data-id="${field}"]`);

    allColumns.forEach(column => {
      column.dataset.order = '';
    });

    currentColumn.dataset.order = order
    this.subElements.body.innerHTML = this.getBody(sortData);

  }

  sortStrings(field, param = 'asc') {
    const arr = [...this.data]
    const {sortType} = this.headerConfig.find( item => item.id === field)
    
    
    const directions = {
      asc: 1,
      desc: -1
    };
  
    const direction = directions[param]; 
  
    return arr.sort((a, b) => {
      switch(sortType) {
      case 'string': 
      return direction * a[field].localeCompare(b[field], ['ru', 'en'])
      case 'number':
        return direction * a[field] - b[field]
      default:
          return direction * (a[field] - b[field]);
    }})
  }
  
  getSubElements(element) {
    const result = {};
    const elements = element.querySelectorAll('[data-element]');

    for (const subElement of elements) {
      const name = subElement.dataset.element;

      result[name] = subElement;
    }

    return result;
  }

  remove() {
    if (this.element) this.element.remove();
  }

  destroy() {
    this.remove();
    this.element = null;
    this.subElements = {};
  }
}

