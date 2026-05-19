import { mountAccordions } from "./accordion.js";

export class ServiceModal {
  constructor(modalElement) {
    this.modal = modalElement;

    this.content = this.modal.querySelector(".modal__body");
  }

  render(serviceData) {
    if (!serviceData) return;

    this.content.innerHTML = this._template(serviceData);

    // IMPORTANT
    // после вставки HTML
    // монтируем аккордеоны

    mountAccordions(this.modal);
  }

  clear() {
    this.content.innerHTML = "";
  }

  _template(data) {
    return `
      <div class="modal__header">
        <div class="modal__title h3">
          ${data.title}
        </div>

        <button
          class="btn-reset modal__close"
          data-modal-close
        >
          <svg width="26" height="26">
            <use xlink:href="img/sprite.svg#cross"></use>
          </svg>
        </button>
      </div>

      <div class="modal__content">
        <div class="modal__desc">
          ${data.description}
        </div>

        <div class="modal__cols">

          ${this._accordion("Этапы работ", this._orderedList(data.steps))}

          ${this._accordion(
            "Закрываем типичные проблемы",
            this._unorderedList(data.problems),
          )}

        </div>
      </div>

      <div class="modal__bottom">
        <button
          class="btn btn_tri modal__btn"
          data-modal-open="cta"
        >
          оставить заявку
        </button>
      </div>
    `;
  }

  _accordion(title, content) {
    return `
      <div class="modal__step accordeon">

        <div class="accordeon__trigger">
          <p class="h4 accordeon__title">
            ${title}
          </p>
        </div>

        <div class="accordeon__body">
          <div class="accordeon__content">
            ${content}
          </div>
        </div>

      </div>
    `;
  }

  _orderedList(items = []) {
    return `
      <ol>
        ${items.map((item) => `<li>${item}</li>`).join("")}
      </ol>
    `;
  }

  _unorderedList(items = []) {
    return `
      <ul>
        ${items.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    `;
  }
}
