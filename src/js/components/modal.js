import { ServiceModal } from "./service-modal.js";

export class ModalManager {
  constructor() {
    this.activeModal = null;

    this.serviceModalElement = document.querySelector('[data-modal="service"]');

    this.serviceModal = new ServiceModal(this.serviceModalElement);

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

    this.activeModal.classList.remove("active");

    document.body.classList.remove("modal-open");

    this.activeModal = null;
  }

  openService(serviceKey) {
    const data = window.SERVICES?.[serviceKey];

    if (!data) return;

    this.serviceModal.render(data);

    this.open("service");
  }

  _bindEvents() {
    document.addEventListener("click", (e) => {
      const serviceBtn = e.target.closest("[data-service]");

      if (serviceBtn) {
        e.preventDefault();
        console.log("data");
        this.openService(serviceBtn.dataset.service);

        return;
      }

      const modalBtn = e.target.closest("[data-modal-open]");

      if (modalBtn) {
        e.preventDefault();

        this.open(modalBtn.dataset.modalOpen);

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
