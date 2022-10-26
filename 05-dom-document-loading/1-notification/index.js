export default class NotificationMessage {
  static NotificationActive
  element

  constructor( message, { duration, type = ''} = {}) {
    this.message = message
    this.duration = duration
    this.type = type
    this.render()
  }

  render() {
    const div = document.createElement('div')

    div.innerHTML = this.getTemplate()

    this.element = div.firstElementChild
  }

  getTemplate() {
    return `  <div class="notification success" style="--value:${this.duration}ms">
    <div class="timer"></div>
    <div class="inner-wrapper">
      <div class="notification-header">${this.type}</div>
      <div class="notification-body">
        ${this.message}
      </div>
    </div>
  </div>`
  }

  show(parent = document.body) {
    if (NotificationMessage.NotificationActive) {
      NotificationMessage.NotificationActive.remove()
    } 
    parent.append(this.element)
    setTimeout(() => {
      this.remove()
    }, this.duration);

    NotificationMessage.NotificationActive = this
  }
   
  remove() {
    if (this.element) {
      this.element.remove()
    }
  }
}
