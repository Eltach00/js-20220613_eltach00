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
    const getCategories = fetchJson(`${BACKEND_URL}/api/rest/categories?_sort=weight&_refs=subcategory`)

    const getData = this.productId
    ? fetchJson (`${BACKEND_URL}/api/rest/products?id=${this.productId}`)
    : Promise.resolve(this.defaultFormData)

    const [categories, data] = await Promise.all([getCategories, getData])
    if (Array.isArray(data)) {  
    const [productData] = data
    this.formData = productData
    } 

    this.categories = categories
    this.renderForm()

    if (this.formData) {
        this.setData()
    }
        this.initEvents()

    return this.element
  }

  initEvents() {
    const {productForm, uploadImage, imageListContainer} = this.subElements

    productForm.addEventListener('submit', this.onSubmit)
    uploadImage.addEventListener('click', this.onUploadImage)
    imageListContainer.addEventListener('click', event => {
        if ('deleteHandle' in event.target.dataset) {
            event.target.closest('li').remove()
        }
    })


  }

  onUploadImage = event => {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'image/*'

    fileInput.addEventListener('change', async () => {
        const [file] = fileInput.files
        if (file) {
            const {uploadImage, imageListContainer} = this.subElements
            const formData = new FormData()
            formData.append('image', file)

            uploadImage.classList.add('is-loading')
            uploadImage.disabled = true
            const result = await fetchJson('https://api.imgur.com/3/image', {
                method: 'POST',
                headers: { 
                    Authorization: `Client-ID ${IMGUR_CLIENT_ID}`
                },
                body: formData
            })

            imageListContainer.insertAdjacentHTML('beforeend', this.makeImageHtml(result.data.link, file.name))
            uploadImage.classList.remove('is-loading')
            uploadImage.disabled = false

            fileInput.remove()
        }
    })

    fileInput.hidden = true
    document.body.append(fileInput)

    fileInput.click()
  }

  onSubmit = event => {
    event.preventDefault()
    this.save()
  }

  async save() {
    const product = this.getFormData()

    try {
        const result = await fetchJson(BACKEND_URL + '/api/rest/products', {
            method: this.productId ? 'PATCH' : 'PUT',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(product)
        })
        this.dispatchEvent(result.id)
    } catch (error) {
        console.log(error)
    }
  }

  dispatchEvent(id) {
    const event = this.productId 
    ? new CustomEvent('product-updated', {detail: id})
    : new CustomEvent('product-saved', {detail: id})

    this.element.dispatchEvent(event)
  }

  getFormData() {
    const {productForm, imageListContainer} = this.subElements
    const excludedFields = ['images']
    const formatToNumber = ['price', 'discount', 'quantity', 'status']
    const fields = Object.keys(this.defaultFormData).filter( item => !excludedFields.includes(item)) 
    const product = {}

    fields.forEach(field => {
        const value = productForm.querySelector(`[name='${field}']`).value
        product[field] = formatToNumber.includes(field) 
        ? parseInt(value)
        : value
    })

    const imageList = imageListContainer.querySelectorAll(".sortable-table__cell-img")

    product.images = [...imageList].map( item => {
        return {
            source: item.alt,
            url: item.src
        }
    })

    return product
  }

  setData() {
    const {productForm} = this.subElements
    const excludeItem = ['images']

    const fields = Object.keys(this.defaultFormData).filter( item => !excludeItem.includes(item) )

    fields.forEach( field => {
        const element = productForm.querySelector(`[name='${field}']`)

        element.value = this.formData[field] || this.defaultFormData[field]
    })

  }

  renderForm() {
    const div = document.createElement('div')
    div.innerHTML = this.getTemplate()

    this.element = div.firstElementChild
    this.subElements = this.getSubElements(this.element)
  }

  getTemplate() {
    return /*html */ `
    <div class="product-form">
    <form data-element="productForm" class="form-grid">
      <div class="form-group form-group__half_left">
        <fieldset>
          <label class="form-label">Название товара</label>
          <input required="" type="text" name="title" class="form-control" placeholder="Название товара">
        </fieldset>
      </div>
      <div class="form-group form-group__wide">
        <label class="form-label">Описание</label>
        <textarea required="" class="form-control" name="description" data-element="productDescription" placeholder="Описание товара"></textarea>
      </div>
      <div class="form-group form-group__wide">
      <label class="form-label">Фото</label>
      <div data-element="imageListContainer"><ul class="sortable-list">
      ${this.productId ? this.createImageHtml() : ''}
      </ul></div>
      <button type="button" data-element="uploadImage" class="button-primary-outline"><span>Загрузить</span></button>
    </div>
    <div class="form-group form-group__half_left">
    <label class="form-label">Категория</label>
    <select class="form-control" name="subcategory">
    ${this.createSelectHtml(this.categories)}
    </select>
    </div>
    <div class="form-group form-group__half_left form-group__two-col" data-element="priceAndDiscount">
    <fieldset>
      <label class="form-label">Цена ($)</label>
      <input required="" type="number" name="price" class="form-control" placeholder="${this.defaultFormData.price}">
    </fieldset>
    <fieldset>
      <label class="form-label">Скидка ($)</label>
      <input required="" type="number" name="discount" class="form-control" placeholder="${this.defaultFormData.discount}">
    </fieldset>
    </div>
    <div class="form-group form-group__part-half">
    <label class="form-label">Количество</label>
    <input required="" type="number" class="form-control" name="quantity" placeholder="${this.defaultFormData.quantity}">
  </div>
  <div class="form-group form-group__part-half">
  <label class="form-label">Статус</label>
  <select class="form-control" name="status">
    <option value="1">Активен</option>
    <option value="0">Неактивен</option>
  </select>
</div>
<div class="form-buttons">
  <button type="submit" name="save" class="button-primary-outline">
    ${this.productId ? 'Сохранить товар' : 'Добавить товар' }
  </button>
</div>
      </form>
      </div>
    `
  }

  createSelectHtml(categories) {
    return categories.map((cat) => {
        return cat.subcategories.map(item => {
            return new Option(`${cat.title} > ${item.title}`, item.id).outerHTML
        }).join('')
    }).join('')
  }

  createImageHtml() {
    return this.formData.images.map( item => {
       return this.makeImageHtml(item.url, item.source)
    }).join('')
  }

  makeImageHtml(url, source) {
    return /*html */ `
    <li class="products-edit__imagelist-item sortable-list__item" >
    <span>
  <img src="icon-grab.svg" data-grab-handle="" alt="grab">
  <img class="sortable-table__cell-img" alt="${escapeHtml( source )}" src="${escapeHtml(url)}">
  <span>${escapeHtml( source )}</span>
</span>
    <button type="button">
      <img src="icon-trash.svg" data-delete-handle="" alt="delete">
    </button></li>
    `
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]')

    return [...elements].reduce((acc, item) => {
        acc[item.dataset.element] = item
        
        return acc
    }, {})

  }


}
