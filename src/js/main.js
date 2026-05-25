import "./_components.js";
import { FormController } from "./functions/validate-forms.js";
import { ModalManager } from "./components/modal.js";

document.addEventListener("DOMContentLoaded", () => {
  /* ─────────────────────────────────────────────
     MODALS
  ───────────────────────────────────────────── */

  const modalManager = new ModalManager();
  window.modalManager = modalManager;

  /* ─────────────────────────────────────────────
     FORMS
  ───────────────────────────────────────────── */

  document
    .querySelectorAll(
      "[data-js-validate-form], form.cta__form, form.modal__form",
    )
    .forEach((form) => {
      new FormController(form, () => {
        modalManager.close();
        modalManager.open("success");
      });
    });
});
