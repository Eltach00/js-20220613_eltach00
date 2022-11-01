import RangePicker from './components/range-picker/src/index.js';
import SortableTable from './components/sortable-table/src/index.js';
import ColumnChart from './components/column-chart/src/index.js';
import header from './bestsellers-header.js';

import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru/';

export default class Page {
    element
    subElements
    url = new URL ('api/dashboard/bestsellers', BACKEND_URL)

    render() {
        const div = document.createElement('div')
        div.innerHTML = this.getTemplate()
        this.element = div.firstElementChild
        this.subElements = this.getSubElements(this.element)
        this.insertComponents(this.element)
        this.addEvents()
        return this.element
    }

    addEvents() {
        this.components.rangePicker.element.addEventListener('date-select', event => {
            const selected = event.detail
            this.updateComponents(selected)
        })
    }

    async updateComponents({from, to}) {
        const data = await this.loadData(from, to)
        console.log(data)
        this.components.sortableTable.update(data)
        this.components.ordersChart.update(from, to)
        this.components.salesChart.update(from, to)
        this.components.customersChart.update(from, to)
    }

    async loadData(from, to) {
        this.url.searchParams.set('_end', 20)
        this.url.searchParams.set('_start', 1)
        this.url.searchParams.set('order', 'asc')
        this.url.searchParams.set('_sort', 'title')
        this.url.searchParams.set('from', from.toISOString())
        this.url.searchParams.set('to', to.toISOString())

        return await fetchJson(this.url)
    }

    insertComponents() {
        const now = new Date();
        const to = new Date();
        const from = new Date(now.setMonth(now.getMonth() - 1));
    
        const rangePicker = new RangePicker({
          from,
          to
        });

        const ordersChart = new ColumnChart({
          url: 'api/dashboard/orders',
          range: {
            from,
            to
          },
          label: 'orders',
          link: '#'
        });

        const salesChart = new ColumnChart({
            url: 'api/dashboard/sales',
            formatHeading: data => `$${data}`,
            range: {
              from,
              to
            },
            label: 'sales',
          })

          const customersChart = new ColumnChart({
            url: 'api/dashboard/customers',
            range: {
              from,
              to
            },
            label: 'customers',
          })

          const sortableTable = new SortableTable(header, {
            url: `api/dashboard/bestsellers?_start=1&_end=20&from=${from.toISOString()}&to=${to.toISOString()}`,
            isSortLocally: true
          })

        this.components = {
            rangePicker,
            ordersChart,
            sortableTable,
            customersChart,
            salesChart
        }


        Object.keys(this.subElements).forEach( component => {
            this.subElements[component].append(this.components[component].element)
            })
    }

    getTemplate() {
        return /*html */`
        <div class="dashboard">
        <div class="content__top-panel">
          <h2 class="page-title">Dashboard</h2>
          <!-- RangePicker component -->
          <div data-element="rangePicker"></div>
        </div>
        <div data-elementa="chartsRoot" class="dashboard__charts">
          <!-- column-chart components -->
          <div data-element="ordersChart" class="dashboard__chart_orders"></div>
          <div data-element="salesChart" class="dashboard__chart_sales"></div>
          <div data-element="customersChart" class="dashboard__chart_customers"></div>
        </div>
  
        <h3 class="block-title">Best sellers</h3>
  
        <div data-element="sortableTable">
          <!-- sortable-table component -->
        </div>
      </div>`
    }

    getSubElements(element) {
        const elements = element.querySelectorAll('[data-element]')

        return [...elements].reduce((acc, item)=>{
            acc[item.dataset.element] = item
            return acc
        } ,{})
    }

    remove () {
        if (this.element) {
          this.element.remove();
        }
      }
    
      destroy () {
        this.remove();
        this.subElements = {};
        this.element = null;
    
        for (const component of Object.values(this.components)) {
          component.destroy();
        }
    
        this.components = {};
      }
}
