import { ServiceModal } from "./service-modal.js";

export class ModalManager {
  constructor() {
    this.activeModal = null;
    this.ctaModalElement = document.querySelector('[data-modal="cta"]');
    this.serviceModalElement = document.querySelector('[data-modal="service"]');
    if (this.serviceModalElement) {
      this.serviceModal =
        new _service_modal_js__WEBPACK_IMPORTED_MODULE_0__.ServiceModal(
          this.serviceModalElement,
        );
    }
    this.currentServiceTitle = "";
    this._bindEvents();
  }
  open(name) {
    const modal = document.querySelector(`[data-modal="${name}"]`);
    if (!modal) return;
    this.close();
    this.activeModal = modal;
    modal.classList.add("active");
    document.body.classList.add("modal-open");
  }
  close() {
    if (!this.activeModal) return;
    const isCta = this.activeModal.getAttribute("data-modal") === "cta";
    this.activeModal.classList.remove("active");
    document.body.classList.remove("modal-open");
    this.activeModal = null;
    if (isCta) {
      this._resetCtaContext();
    }
  }
  openCta(context, options = {}) {
    if (!this.ctaModalElement) return;
    const replaceTitle = options.replaceTitle !== false;
    const contextText = (context || "").trim();
    const input = this.ctaModalElement.querySelector("[data-cta-request-type]");
    const titleEl = this.ctaModalElement.querySelector(
      "[data-cta-default-title]",
    );
    if (input) {
      input.value = contextText;
    }
    if (titleEl && replaceTitle) {
      if (!titleEl.dataset.ctaTitleDefault) {
        titleEl.dataset.ctaTitleDefault = titleEl.textContent.trim();
      }
      titleEl.textContent = contextText || titleEl.dataset.ctaTitleDefault;
    }
    this.open("cta");
  }
  _resetCtaContext() {
    if (!this.ctaModalElement) return;
    const input = this.ctaModalElement.querySelector("[data-cta-request-type]");
    const titleEl = this.ctaModalElement.querySelector(
      "[data-cta-default-title]",
    );
    if (input) {
      input.value = "";
    }
    if (titleEl && titleEl.dataset.ctaTitleDefault) {
      titleEl.textContent = titleEl.dataset.ctaTitleDefault;
    }
  }
  openService(serviceKey) {
    if (!this.serviceModal) return;
    const data = window.SERVICES?.[serviceKey];
    if (!data) return;
    this.currentServiceTitle = data.title || "";
    this.serviceModal.render(data);
    this.open("service");
  }
  _bindEvents() {
    document.addEventListener("click", (e) => {
      const serviceBtn = e.target.closest("[data-service]");
      if (serviceBtn) {
        e.preventDefault();
        this.openService(serviceBtn.dataset.service);
        return;
      }
      const modalBtn = e.target.closest("[data-modal-open]");
      if (modalBtn) {
        e.preventDefault();
        const modalName = modalBtn.dataset.modalOpen;
        if (modalName === "cta") {
          const fromServiceModal = !!modalBtn.closest('[data-modal="service"]');
          let context = modalBtn.dataset.ctaContext || "";
          if (!context && fromServiceModal) {
            context = this.currentServiceTitle || "";
          }
          this.openCta(context, {
            replaceTitle: !fromServiceModal,
          });
        } else {
          this.open(modalName);
        }
        return;
      }
      const closeBtn = e.target.closest("[data-modal-close]");
      if (closeBtn) {
        this.close();
        return;
      }
      const modal = e.target.closest(".modal");
      if (modal && e.target === modal) {
        this.close();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.close();
      }
    });
  }
}
