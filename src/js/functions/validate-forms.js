import JustValidate from "just-validate";
import Inputmask from "inputmask/dist/inputmask.es6.js";
import { clearFields } from "../components/inputs.js";

/* ─────────────────────────────────────────────────────────────
   УТИЛИТЫ ВАЛИДАЦИИ
───────────────────────────────────────────────── */

/**
 * Определяет тип валидации для поля по его атрибутам.
 * @returns {'email'|'tel'|'text'}
 */
function getFieldValidationType(input) {
  if (input.type === "email" || input.dataset.validate === "email")
    return "email";
  if (input.type === "tel" || input.dataset.validate === "phone") return "tel";
  return "text";
}

/**
 * Возвращает массив правил JustValidate для конкретного поля.
 */
function buildRulesForField(input) {
  const type = getFieldValidationType(input);

  if (type === "email") {
    return [
      { rule: "required", errorMessage: "Заполните email!" },
      { rule: "email", errorMessage: "Введите корректный email!" },
    ];
  }

  if (type === "tel") {
    return [
      { rule: "required", errorMessage: "Заполните телефон!" },
      {
        rule: "function",
        // JustValidate v4: (значение поля, совместимые поля) — не (name, value)
        validator: (elemValue) => {
          const str = String(elemValue ?? "");
          // Незаполненная позиция маски — номер неполный
          if (str.includes("_")) return false;
          // 11 цифр для +7 (XXX) XXX-XX-XX
          return str.replace(/\D/g, "").length >= 11;
        },
        errorMessage: "Введите корректный номер телефона",
      },
    ];
  }

  // текст / textarea
  const rules = [];
  const minLen = parseInt(input.dataset.minLength ?? input.minLength, 10);
  if (minLen > 0) {
    rules.push({
      rule: "minLength",
      value: minLen,
      errorMessage: `Минимум ${minLen} символа`,
    });
  }
  rules.push({ rule: "required", errorMessage: "Это поле обязательно!" });
  return rules;
}

/* ─────────────────────────────────────────────────────────────
   FormController — инкапсулирует логику одной формы
───────────────────────────────────────────────── */

class FormController {
  /**
   * @param {HTMLFormElement} form
   * @param {Function|null}   afterSend  — колбэк после успешной отправки
   */
  constructor(form, afterSend = null) {
    this.form = form;
    this.afterSend = afterSend;

    this.select = form.querySelector("select.select-contact");
    this.submitBtn = form.querySelector(".form__btn");

    // Контейнер для динамического поля
    this.dynContainer =
      form.querySelector(".js-dynamic-contact") ?? this._createDynContainer();

    // Состояние динамического поля
    this.dynInput = null;
    this.dynMask = null;

    // Экземпляр JustValidate
    this.validator = null;

    // Начальное состояние
    if (this.submitBtn) this.submitBtn.disabled = true;
    this._applySelectLongClass();
    this._applyStaticMasks();
    this._rebuildValidation();
    this._bindEvents();
  }

  /* ── Маска на статические tel-поля (уже существующие в HTML) ── */
  _applyStaticMasks() {
    this.form
      .querySelectorAll("input[type='tel'][required]")
      .forEach((input) => {
        if (input === this.dynInput) return; // динамическое поле — отдельно
        if (input.dataset.masked) return; // не накидываем повторно
        input.dataset.masked = "1";
        new Inputmask({
          mask: "+7 (999) 999-99-99",
          showMaskOnHover: false,
          showMaskOnFocus: true,
        }).mask(input);
      });
  }

  /* ── Вспомогательный: контейнер для динамического поля ── */
  _createDynContainer() {
    if (!this.form.querySelector("select")) return;
    const div = document.createElement("div");
    div.className = "js-dynamic-contact";
    const anchor = this.select?.closest(".form__field");
    if (anchor) anchor.after(div);
    else
      this.form.insertBefore(
        div,
        this.submitBtn?.closest(".form__row") ?? this.submitBtn,
      );
    return div;
  }

  /* ── form__field--long на контейнере селекта ── */
  _applySelectLongClass() {
    const selectField = this.select?.closest(".form__field");
    if (!selectField) return;
    selectField.classList.toggle("form__field--long", !this.select.value);
  }

  /* ── Тип контакта из селекта: 'email' | 'tel' | null ── */
  _getContactType() {
    const val = this.select?.value ?? "";
    if (!val) return null;
    return /mail/i.test(val) ? "email" : "tel";
  }

  /* ── Создаём динамическое поле ── */
  _buildDynamicField(contactType) {
    this._destroyDynField();
    if (!contactType) return;

    const isEmail = contactType === "email";

    const wrapper = document.createElement("div");
    wrapper.className = "form__field js-dynamic-field";

    const innerWrapper = document.createElement("label");
    innerWrapper.className = "form__field-wrapper";

    const input = document.createElement("input");
    input.type = isEmail ? "email" : "tel";
    input.className = isEmail
      ? "form__input input-email-dyn"
      : "form__input input-tel-dyn";
    input.name = isEmail ? "contact_email" : "contact_phone";
    input.required = true;
    input.autocomplete = isEmail ? "email" : "tel";
    input.dataset.validate = isEmail ? "email" : "phone";

    const labelText = document.createElement("span");
    labelText.className = "form__label";
    labelText.textContent = isEmail ? "ваш email?" : "ваш телефон?";

    innerWrapper.appendChild(input);
    innerWrapper.appendChild(labelText);
    wrapper.appendChild(innerWrapper);
    this.dynContainer.appendChild(wrapper);
    this.dynInput = input;

    // Маска только для телефона
    if (!isEmail) {
      this.dynMask = new Inputmask({
        mask: "+7 (999) 999-99-99",
        showMaskOnHover: false,
        showMaskOnFocus: true,
      });
      this.dynMask.mask(input);
    }
  }

  /* ── Уничтожаем динамическое поле ── */
  _destroyDynField() {
    if (this.dynMask) {
      this.dynMask.remove();
      this.dynMask = null;
    }
    this.dynInput = null;
    this.dynContainer.innerHTML = "";
  }

  /* ── Получить уникальный CSS-селектор для элемента (для JustValidate) ── */
  _uniqueSelector(el) {
    if (el.id) return `#${el.id}`;
    if (el.name) {
      const formId = this.form.id;
      return formId ? `#${formId} [name="${el.name}"]` : `[name="${el.name}"]`;
    }
    const id = `jv-${Math.random().toString(36).slice(2, 8)}`;
    el.id = id;
    return `#${id}`;
  }

  /* ── Пересоздать JustValidate со всеми актуальными полями ── */
  _rebuildValidation() {
    if (this.validator) {
      try {
        this.validator.destroy();
      } catch (_) {
        /* ignore */
      }
      this.validator = null;
    }

    const validator = new JustValidate(this.form, {
      validateBeforeSubmitting: true,
      lockForm: false,
      errorFieldCssClass: "error",
      successFieldCssClass: "success",
      errorLabelStyle: {},
      errorFieldStyle: {},
    });

    // 1. Статические required-поля
    const staticInputs = Array.from(
      this.form.querySelectorAll("input[required], textarea[required]"),
    ).filter((el) => el !== this.dynInput);

    for (const input of staticInputs) {
      validator.addField(
        this._uniqueSelector(input),
        buildRulesForField(input),
      );
    }

    // 2. Обязательный выбор в <select>
    if (this.select) {
      validator.addField(this._uniqueSelector(this.select), [
        { rule: "required", errorMessage: "Выберите способ связи!" },
      ]);
    }

    // 3. Динамическое поле (если создано)
    if (this.dynInput) {
      validator.addField(
        this._uniqueSelector(this.dynInput),
        buildRulesForField(this.dynInput),
      );
    }

    // 4. Обновление классов error на form__field и состояния кнопки
    validator.onValidate(({ isValid, fields }) => {
      for (const fieldState of Object.values(fields)) {
        const wrapper = fieldState.elem?.closest(".form__field");
        if (!wrapper) continue;
        wrapper.classList.toggle("error", !fieldState.isValid);
      }
      if (this.submitBtn) this.submitBtn.disabled = !isValid;
    });

    // 5. Успешная отправка
    validator.onSuccess(async (ev) => {
      const formEl = ev?.currentTarget ?? ev?.target ?? this.form;
      const formDataMax =
        typeof globalThis.MaxFormCollector !== "undefined"
          ? globalThis.MaxFormCollector.collect(this.form)
          : Object.fromEntries(new FormData(this.form).entries());
      const ts = new Date().toLocaleString("ru-RU");
      const text =
        `**Заявка с сайта Перемена**\n_${ts}_\n\n` +
        Object.entries(formDataMax)
          .map(([k, v]) => `**${k}:** ${v}`)
          .join("\n") +
        `\n\n_Сайт: ${location.hostname}_`;

      // Вешаем класс отправки — CSS покажет спиннер/блокировку
      this.form.classList.add("form--sending");
      if (this.submitBtn) this.submitBtn.disabled = true;

      try {
        let phpResult;
        if (typeof globalThis.MaxFormCollector !== "undefined") {
          [phpResult] = await Promise.allSettled([
            globalThis.MaxFormCollector.send(text, {
              proxyUrl:
                "https://proud-snow-d35a.artyushenko-frontdev.workers.dev/",
              source: "peremena",
            }),
          ]);
        } else {
          console.error(
            "[Form] MaxFormCollector не найден — заявка не отправлена (подключите скрипт темы)",
          );
          phpResult = { status: "fulfilled", value: { ok: false } };
        }

        // Колбэк afterSend — только если PHP ответил успешно
        if (phpResult.status === "fulfilled" && phpResult.value?.ok) {
          if (this.afterSend) this.afterSend();
        }
      } catch (err) {
        console.error("[Form] Ошибка отправки:", err);
      } finally {
        // Снимаем состояние загрузки в любом случае
        this.form.classList.remove("form--sending");

        // Сброс формы
        this.form.querySelectorAll(".filled, .error").forEach((el) => {
          el.classList.remove("filled", "error");
        });
        formEl.reset();

        // Закрываем модалку и чистим поля
        setTimeout(() => {
          const modal = document.querySelector(".modal.active");
          if (modal) modal.classList.remove("active");
          clearFields();
        }, 0);

        this._handleSelectChange(); // убираем динамическое поле после сброса
      }
    });

    this.validator = validator;
    this._checkButtonState();
  }

  /* ── Проверка кнопки вручную (без показа ошибок) ── */
  _checkButtonState() {
    if (!this.submitBtn) return;
    this.submitBtn.disabled = !this._allRequiredValid();
  }

  /* ── Ручная валидность всех required полей ── */
  _allRequiredValid() {
    // Если селект есть — он должен быть выбран
    if (this.select && !this.select.value) return false;

    // Статические поля
    const staticOk = Array.from(
      this.form.querySelectorAll("input[required], textarea[required]"),
    )
      .filter((el) => el !== this.dynInput)
      .every((el) => this._isValueValid(el));

    // Динамическое поле — обязательно только если оно создано
    const dynOk = this.dynInput ? this._isValueValid(this.dynInput) : true;

    return staticOk && dynOk;
  }

  _isValueValid(input) {
    const type = getFieldValidationType(input);
    const value = input.value ?? "";
    if (type === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (type === "tel") {
      const str = String(value ?? "");
      if (str.includes("_")) return false;
      return str.replace(/\D/g, "").length >= 11;
    }
    const minLen =
      parseInt(input.dataset.minLength ?? input.minLength, 10) || 1;
    return value.trim().length >= minLen;
  }

  /* ── Обновление класса filled ── */
  _updateFilled(input) {
    const wrapper = input.closest(".form__field");
    if (!wrapper) return;
    wrapper.classList.toggle("filled", input.value.length > 0);
  }

  /* ── Обработка изменения селекта ── */
  _handleSelectChange() {
    this._applySelectLongClass();
    this._buildDynamicField(this._getContactType());
    this._rebuildValidation();
  }

  /* ── Делегированные события на уровне формы ── */
  _bindEvents() {
    // input  — стандартный ввод и автозаполнение
    // keyup  — Inputmask обновляет .value до keyup, но может не стрелять input
    // paste  — вставка из буфера
    const onInput = (e) => {
      const el = e.target;
      if (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA") return;
      this._updateFilled(el);
      this._checkButtonState();
    };

    this.form.addEventListener("input", onInput);
    this.form.addEventListener("keyup", onInput);
    this.form.addEventListener("paste", onInput);

    this.form.addEventListener("change", (e) => {
      if (e.target === this.select) {
        this._handleSelectChange();
      } else {
        const el = e.target;
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
          this._updateFilled(el);
        }
        this._checkButtonState();
      }
    });
  }
}

/* ─────────────────────────────────────────────────────────────
   ТОЧКА ВХОДА
───────────────────────────────────────────────── */

document.addEventListener("DOMContentLoaded", () => {
  // Все формы на странице (не только первая по селектору)
  document
    .querySelectorAll("[data-js-validate-form], form.cta__form")
    .forEach((form) => {
      new FormController(form);
    });

  // Открытие модального окна
  document.querySelectorAll(".modal-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelector(".modal")?.classList.add("active");
    });
  });

  // Закрытие модального окна
  const modal = document.querySelector(".modal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      const content = modal.querySelector(".modal__content");
      if (e.target === modal || !content?.contains(e.target)) {
        modal.classList.remove("active");
      }
    });

    modal.querySelectorAll(".modal__close").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        modal.classList.remove("active");
      });
    });
  }
});
