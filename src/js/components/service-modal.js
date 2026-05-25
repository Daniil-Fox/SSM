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

    (0, _accordion_js__WEBPACK_IMPORTED_MODULE_0__.mountAccordions)(this.modal);
  }
  clear() {
    this.content.innerHTML = "";
  }
  _template(data) {
    const assetsUrl =
      typeof ssmTheme !== "undefined" && ssmTheme.assetsUrl
        ? ssmTheme.assetsUrl
        : "";
    const stepsBlock = this._accordion(
      "Этапы работ",
      this._htmlList(data.steps, "ol"),
    );
    const problemsBlock = this._accordion(
      "Закрываем типичные проблемы",
      this._htmlList(data.problems, "ul"),
    );
    const cols = [stepsBlock, problemsBlock].filter(Boolean).join("");
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
            <use xlink:href="${assetsUrl}img/sprite.svg#cross"></use>
          </svg>
        </button>
      </div>

      <div class="modal__content">
        <div class="modal__desc">
          ${data.description}
        </div>

        ${cols ? `<div class="modal__cols">${cols}</div>` : ""}
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
  _htmlList(content, listType = "ul") {
    if (!content) return "";
    if (typeof content === "string") return content.trim();
    if (Array.isArray(content) && content.length) {
      return listType === "ol"
        ? this._orderedList(content)
        : this._unorderedList(content);
    }
    return "";
  }
  _accordion(title, content) {
    if (!content) return "";
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
