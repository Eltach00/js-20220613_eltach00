class Tooltip {

  static instance;
  element;

  constructor() {
    if (Tooltip.instance) return Tooltip.instance

    Tooltip.instance = this;


  }

  render(text) {
    this.element = document.createElement('div')

    this.element.classList.add('tooltip')

    this.element.innerHTML = text

    document.body.append(this.element)

  }

  initialize() {
    document.addEventListener('pointerover', this.onPointerOver)
    document.addEventListener('pointerout', this.onPointerOut)
  }

  onPointerOver = event => { 
    const element = event.target.closest('[data-tooltip]')

    if (element ) {
      this.render(element.dataset.tooltip)
    document.addEventListener('pointermove', this.onPointerMove)
  }
  }

  onPointerMove = event => {
    const shift = 15
    const left = event.clientX + shift
    const top = event.clientY + shift

    this.element.style.left = `${left}px`
    this.element.style.top = `${top}px`
    
  }

  onPointerOut = event => {
    document.removeEventListener('pointermove', this.onPointerMove)
      this.remove()
  }

  remove() {
    if (this.element) this.element.remove();
  }

  destroy() {
    document.removeEventListener('pointerover', this.onPointerOver);
    document.removeEventListener('pointerout', this.onPointerOut);
    document.removeEventListener('pointermove', this.onPointerMove);
    this.remove();
    this.element = null;
  }
}

export default Tooltip;
