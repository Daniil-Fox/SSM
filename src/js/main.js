import "./_components.js";
import { FormController } from "./functions/validate-forms.js";
import { ModalManager } from "./components/modal.js";
window.SERVICES = {
  commissioning: {
    title: "Пусконаладочные работы инженерных систем и оборудования",

    description: `
      <p>
        Запуск, настройка и сдача в эксплуатацию
        инженерных систем.
      </p>
    `,

    steps: ["Ревизия монтажа", "Подача напряжения", "Поузловые испытания"],

    problems: [
      "Отказ в допуске",
      "Несрабатывание автоматики",
      "Скрытые дефекты монтажа",
    ],
  },
};

document.addEventListener("DOMContentLoaded", () => {
  /* ─────────────────────────────────────────────
     FORMS
  ───────────────────────────────────────────── */

  document
    .querySelectorAll(
      "[data-js-validate-form], form.cta__form, form.modal__form",
    )
    .forEach((form) => {
      new FormController(form);
    });

  /* ─────────────────────────────────────────────
     MODALS
  ───────────────────────────────────────────── */

  new ModalManager();
});
