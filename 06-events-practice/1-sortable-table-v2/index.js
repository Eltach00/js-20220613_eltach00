
export default class SortableTable {

    element;
    subElements = {};
  
    constructor( headerConfig = [], {
      data = [],
      sorted = {
        id: headerConfig.find(item => item.sortable).id,
        order: 'asc'
      }
    } = {} ) {
      this.headerConfig = headerConfig;
      this.data = data;
      this.sorted = sorted;
  
      this.render();
      this.initEventListeners()
    }

    render() {
        const div = document.createElement('div')
        div.innerHTML = this.getTable()
        this.element = div.firstElementChild

        this.subElements = this.getSubElements(this.element)
    }
    
    getSubElements(element) {
        const elements = element.querySelectorAll('[data-element]')

        return [...elements].reduce((s, item) => {
            s[item.dataset.element] = item
            return s
        } ,{})
    }

    getTable() {
        return /*html */ `
        <div class="sortable-table">
        <div data-element="header" class="sortable-table__header sortable-table__row">
        ${this.getHeader()}
        </div>
    
        <div data-element="body" class="sortable-table__body">
         ${this.getBody(this.data)}
          </div>
          </div>`
    }

    getHeader() {
        return this.headerConfig.map( item => {
            const order = this.sorted.id === item.id ? this.sorted.order : 'asc'
            return /*html */`<div class="sortable-table__cell" data-id="${item.id}" data-sortable="${item.sortable}" data-order="${order}">
            <span>${item.title}</span>
            ${this.addArrow(item.id)}
          </div>`
        }).join('')
    }

    addArrow(id) {
        const arrowExist = this.sorted.id === id ? this.sorted.order : ''
        return arrowExist
        ? ` <span data-element="arrow" class="sortable-table__sort-arrow">
        <span class="sort-arrow"></span>
        </span>
        `
        : ''
    }

    getBody(data) {
        return data.map( item => {
            return /*html */ `
            <div  class="sortable-table__row">
            ${this.getBodyRow(item)}
      </div>
            `
        }).join('')
    }

    getBodyRow(obj) {
        return this.headerConfig.map( ({id, template}) => {
            return template 
            ? template(obj[id])
            : `<div class="sortable-table__cell">${obj[id]}</div>`
        }).join('')
    }

    initEventListeners() {
        this.subElements.header.addEventListener('pointerdown', this.onClick)
        
    }

    onClick = (event) => {
        const target = event.target.closest('[data-sortable="true"]')

        const toggleOrder = order => {
            const orders = {
                asc: 'desc',
                desc: 'asc'
            }

            return orders[order]
        }
        
        if (target) {
            const {id, order} = target.dataset
            const newOrder = toggleOrder(order)
            const sortedData = this.sortData(id, newOrder)

            const arrow = target.querySelector('.sortable-table__sort-arrow')
            
            target.dataset.order = newOrder

            if(!arrow) {
                target.append(this.subElements.arrow)
            }

            this.subElements.body.innerHTML = this.getBody(sortedData)

        }
    }

    sortData(id, order) {
        const arr = [...this.data]
        const {sortType} = this.headerConfig.find( item => item.id === id)
        const directions = {
            asc: 1,
            desc: -1
        }

        const direction = directions[order]
        return arr.sort( (a,b) => {
            switch(sortType) {
                case 'number': 
                return direction * (a[id] - b[id])
                case 'string': 
                return direction * a[id].localeCompare(b[id], ['ru', 'en'])
                default: 
                return direction * (a[id] - b[id])
            }
        })


    }

    remove() {
        if (this.element) {
            this.element.remove()
        }
    }

    destroy() {
        this.remove()
        this.element = null 
        this.subElements = {}
    }


}