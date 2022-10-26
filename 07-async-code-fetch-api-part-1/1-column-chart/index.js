import fetchJson from "./utils/fetch-json.js";

const BACKEND_URL = "https://course-js.javascript.ru";



export default class ColumnChart {
  chartHeight = 50;
  subElements = {};
  element;

  constructor({
    url = "",
    range = {
      from: new Date(),
      to: new Date(),
    },
    label = "",
    link = "",
    formatHeading = (data) => data,
  } = {}) {

    this.url = new URL(url, BACKEND_URL);
    this.range = range;
    this.label = label;
    this.link = link;
    this.formatHeading = formatHeading;

    this.render();
    this.update(this.range.from, this.range.to);

  
  }

  render() {
    const el = document.createElement("div");
    el.innerHTML = this.getTemplate();
    this.element = el.firstElementChild;

    this.subElements = this.getSubElements(this.element)
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]')

    return [...elements].reduce((accum, item) => {
      accum[item.dataset.element] = item
      return accum

    }, {})
  }

  getLink() {
    if (this.link) {
      return `
          <a href="${this.link}/" class="column-chart__link">View all</a>
          `;
    }
    return "";
  }

  getTemplate() {
    return /*html*/ `
        <div class="column-chart column-chart_loading" style="--chart-height: 50">
          <div class="column-chart__title">
            Total ${this.label}
            ${this.getLink()}
          </div>
          <div class="column-chart__container">
            <div data-element="header" class="column-chart__header"></div>
            <div data-element="body" class="column-chart__chart">
            </div>
          </div>
        </div>`;
  }

  async update(from, to) {

    const data = await this.loadData(from, to)
      if (data) {
        this.subElements.header.innerHTML = this.getHeaderValue(data)
        this.subElements.body.innerHTML = this.getBodyValue(data)
        this.element.classList.remove('column-chart_loading')
    
    }

    this.setNewRange(from, to)

  }

  setNewRange(from, to) {
    this.range.from = from
    this.range.to = to
  }

  getHeaderValue(data) {
    return this.formatHeading( Object.values(data).reduce((accum, item) => accum += item ,0))
  }

  getBodyValue(data) {
    const max = Math.max(...Object.values(data))

    const scale = this.chartHeight / max

    return Object.values(data).map( item => {
      const percent = ((item / max) * 100).toFixed(0);
      return `<div style="--value: ${Math.floor(item * scale)}" data-tooltip="${percent}%"></div>`
    }).join('')
  }

  async loadData(from, to) {
    this.url.searchParams.set('from', from.toISOString())
    this.url.searchParams.set('to', to.toISOString())
    return await fetchJson(this.url)
  }

  setNewRange(from, to) {
      this.range.from = from;
      this.range.to = to;
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
