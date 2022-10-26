import escapeHtml from './utils/escape-html.js';
import fetchJson from './utils/fetch-json.js';

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ProductForm {
  element; 
  subElements;
  defaultFormData = {
    title: '',
    description: '',
    quantity: 1,
    subcategory: '',
    status: 1,
    images: [],
    price: 100,
    discount: 0
  };

  constructor (productId) {
    this.productId = productId;
  }

  async render() {
    const fetchData = this.productId 
    ? fetchJson(BACKEND_URL + `/api/rest/products?id=${this.productId}`)
    : Promise.resolve(this.defaultFormData)

    const fetchCateg = fetchJson(BACKEND_URL + `/api/rest/categories?_sort=weight&_refs=subcategory`)

    const [categories, data] = await Promise.all([fetchCateg, fetchData])
    if (Array.isArray(data) ) {
    const [productData] = data
    this.formData = productData
    } else {
      this.formData = data
    }

    this.categories = categories

    this.renderForm()

    if (this.formData) {
      this.setFormData()
      this.initEvents()
    }

  }

  initEvents() {
    const { productForm, uploadImage, imageListContainer} = this.subElements

    productForm.addEventListener('submit', this.onSubmit)
    uploadImage.addEventListener('click', this.onUploadImage)

    imageListContainer.addEventListener('click', event => {
      if ('deleteHandle' in event.target.dataset) {
        event.target.closest('li').remove();
      }
    })
  }

  onSubmit = event => {
    event.preventDefault()
    this.save()    
  }

  async save() {
    const product = this.getData()

    try {
      const result = await fetchJson( BACKEND_URL + '/api/rest/products', {
        method: this.productId ? 'PATCH' : 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(product)
      })

      this.dispatchEvent(result.id)
    } catch (error) {
      console.error('something went wrong', error);
    }
  }

  getData() {
    const {productForm, imageListContainer} = this.subElements
    const excludedFields = ['images']
    const formatToNumber = ['price', 'quantity', 'discount', 'status']
    const fields = Object.keys(this.defaultFormData).filter( item => !excludedFields.includes(item))
    const getValue = field => productForm.querySelector(`#${field}`).value
    const values = {}

    for (const field of fields) {
      const value = getValue(field)

      values[field] = formatToNumber.includes(field)
      ? parseInt(value) 
      : value
    }

    const imagesHTMLCollection = imageListContainer.querySelectorAll('.sortable-table__cell-img')

    values.images = []

    imagesHTMLCollection.forEach( item => {
      values.images.push({url: item.src,
      source: item.alt})
    })

    return values;
  }

  onUploadImage = event => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'

    input.addEventListener('change', async () =>{
      const [file] = input.files

      if (file) {
        const formData = new FormData()
        const { uploadImage, imageListContainer } = this.subElements;

        formData.append('image', file)

        uploadImage.classList.add('is-loading')
        uploadImage.disabled = true

        const result = await fetchJson('https://api.imgur.com/3/image', {
          method: 'POST',
          headers: {
            Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
          },
          body: formData,
          referrer: ''
          })

          imageListContainer.append(this.getImage(result.data.link, file.name))


        uploadImage.classList.remove('is-loading')
        uploadImage.disabled = false

        input.remove()
      }
     })

     

     input.hidden = true
     document.body.append(input)

     input.click()
  }

  dispatchEvent (id) {
    const event = this.productId
      ? new CustomEvent('product-updated', { detail: id }) // new CustomEvent('click')
      : new CustomEvent('product-saved');

    this.element.dispatchEvent(event);
  }

  setFormData(){
    const { productForm } = this.subElements
    const excludeItem = ['images']

    const fields = Object.keys(this.defaultFormData).filter( item => !excludeItem.includes(item))
    fields.forEach( item => {
      const element = productForm.querySelector(`#${item}`)
    
      element.value = this.formData[item] || this.defaultFormData[item];
    })
  }

  renderForm() {
    const div = document.createElement('div')

    div.innerHTML = this.formData ? this.template() : this.getEmptyTemplate()

    this.element = div.firstElementChild

    this.subElements = this.getSubElements(this.element)
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]')

    return [...elements].reduce((acc, item) =>{
      acc[item.dataset.element] = item
      return acc
      }, {})
  }

  getEmptyTemplate(){
    return `<div>
    <h1 class="page-title">Страница не найдена</h1>
    <p>Извините, данный товар не существует</p>
  </div>`;
  }

  template () {
    return `
      <div class="product-form">

      <form data-element="productForm" class="form-grid">
        <div class="form-group form-group__half_left">
          <fieldset>
            <label class="form-label">Название товара</label>
            <input required
              id="title"
              value=""
              type="text"
              source="title"
              class="form-control"
              placeholder="Название товара">
          </fieldset>
        </div>

        <div class="form-group form-group__wide">
          <label class="form-label">Описание</label>
          <textarea required
            id="description"
            class="form-control"
            source="description"
            data-element="productDescription"
            placeholder="Описание товара"></textarea>
        </div>

        <div class="form-group form-group__wide">
          <label class="form-label">Фото</label>

          <ul class="sortable-list" data-element="imageListContainer">
            ${this.createImagesList()}
          </ul>

          <button data-element="uploadImage" type="button" class="button-primary-outline">
            <span>Загрузить</span>
          </button>
        </div>

        <div class="form-group form-group__half_left">
          <label class="form-label">Категория</label>
            ${this.createCategoriesSelect()}
        </div>

        <div class="form-group form-group__half_left form-group__two-col">
          <fieldset>
            <label class="form-label">Цена ($)</label>
            <input required
              id="price"
              value=""
              type="number"
              source="price"
              class="form-control"
              placeholder="${this.defaultFormData.price}">
          </fieldset>
          <fieldset>
            <label class="form-label">Скидка ($)</label>
            <input required
              id="discount"
              value=""
              type="number"
              source="discount"
              class="form-control"
              placeholder="${this.defaultFormData.discount}">
          </fieldset>
        </div>

        <div class="form-group form-group__part-half">
          <label class="form-label">Количество</label>
          <input required
            id="quantity"
            value=""
            type="number"
            class="form-control"
            source="quantity"
            placeholder="${this.defaultFormData.quantity}">
        </div>

        <div class="form-group form-group__part-half">
          <label class="form-label">Статус</label>
          <select id="status" class="form-control" source="status">
            <option value="1">Активен</option>
            <option value="0">Неактивен</option>
          </select>
        </div>

        <div class="form-buttons">
          <button type="submit" source="save" class="button-primary-outline">
            ${this.productId ? "Сохранить" : "Добавить"} товар
          </button>
        </div>
      </form>
    </div>
    `;
  }

  createCategoriesSelect() {
    const div = document.createElement('div')

    div.innerHTML = `<select class="form-control"  id="subcategory" source="subcategory">
    <option value="progulki-i-detskaya-komnata">Детские товары и игрушки &gt; Прогулки и детская комната</option>
  </select>`

    const select = div.firstElementChild

    for (const obj of this.categories) {
      for (const item of obj.subcategories) {
        select.append( new Option(`${obj.title} > ${item.title}`), item.id)
      }
    }

    return select.outerHTML
  }

  createImagesList() {
    return this.formData.images.map( item => {
      return this.getImage( item.url, item.source).outerHTML
    }).join('')
  }

  getImage(url, source) {
    const div = document.createElement('div')
    div.innerHTML = `<li class="products-edit__imagelist-item sortable-list__item">
    <span>
      <img src="./icon-grab.svg" data-grab-handle alt="grab">
      <img class="sortable-table__cell-img" alt="${escapeHtml(source)}" src="${escapeHtml(url)}">
      <span>${escapeHtml(source)}</span>
    </span>

    <button type="button">
      <img src="./icon-trash.svg" alt="delete" data-delete-handle>
    </button>
  </li>`

  return div.firstElementChild
  }

  destroy () {
    this.remove();
    this.element = null;
    this.subElements = null;
  }

  remove () {
    if (this.element) {
      this.element.remove();
    }
  }
}
