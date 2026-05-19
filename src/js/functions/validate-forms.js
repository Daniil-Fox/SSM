import JustValidate from "just-validate";
import Inputmask from "../../../node_modules/inputmask/dist/inputmask.es6.js";
import { clearFields } from "../components/inputs.js";

/* ─────────────────────────────────────────────────────────────
   УТИЛИТЫ ВАЛИДАЦИИ
───────────────────────────────────────────────── */

/**
 * Определяет тип валидации для поля по его атрибутам.
 * @returns {'email'|'tel'|'text'|'emailOrPhone'}
 */
function getFieldValidationType(input) {
  if (
    input.dataset.validate === "email-or-phone" ||
    input.dataset.validate === "phone-or-email"
  ) {
    return "emailOrPhone";
  }

  if (input.type === "email" || input.dataset.validate === "email") {
    return "email";
  }

  if (input.type === "tel" || input.dataset.validate === "phone") {
    return "tel";
  }

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
        validator: (elemValue) => {
          const str = String(elemValue ?? "");

          if (str.includes("_")) return false;

          return str.replace(/\D/g, "").length >= 11;
        },
        errorMessage: "Введите корректный номер телефона",
      },
    ];
  }

  /* ── EMAIL ИЛИ ТЕЛЕФОН ── */

  if (type === "emailOrPhone") {
    return [
      {
        rule: "required",
        errorMessage: "Введите email или телефон",
      },
      {
        rule: "function",
        validator: (value) => {
          const str = String(value ?? "").trim();

          if (!str) return false;

          // PHONE
          if (/^[\d+]/.test(str)) {
            if (str.includes("_")) return false;

            return str.replace(/\D/g, "").length >= 11;
          }

          // EMAIL
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
        },
        errorMessage: "Введите корректный email или телефон",
      },
    ];
  }

  // TEXT / TEXTAREA

  const rules = [];

  const minLen = parseInt(input.dataset.minLength ?? input.minLength, 10);

  if (minLen > 0) {
    rules.push({
      rule: "minLength",
      value: minLen,
      errorMessage: `Минимум ${minLen} символа`,
    });
  }

  rules.push({
    rule: "required",
    errorMessage: "Это поле обязательно!",
  });

  return rules;
}

/* ─────────────────────────────────────────────────────────────
   FormController
───────────────────────────────────────────────── */

export class FormController {
  /**
   * @param {HTMLFormElement} form
   * @param {Function|null} afterSend
   */
  constructor(form, afterSend = null) {
    this.form = form;
    this.afterSend = afterSend;

    this.select = form.querySelector("select.select-contact");
    this.submitBtn = form.querySelector(".form__btn");

    this.dynContainer =
      form.querySelector(".js-dynamic-contact") ?? this._createDynContainer();

    this.dynInput = null;
    this.dynMask = null;

    this.validator = null;

    if (this.submitBtn) {
      this.submitBtn.disabled = true;
    }

    this._applySelectLongClass();
    this._applyStaticMasks();
    this._rebuildValidation();
    this._bindEvents();
  }

  /* ──────────────────────────────────────────────────────────
     STATIC MASKS
  ───────────────────────────────────────────────── */

  _applyStaticMasks() {
    this.form
      .querySelectorAll("input[type='tel'][required]")
      .forEach((input) => {
        if (input === this.dynInput) return;

        if (input.dataset.masked) return;

        input.dataset.masked = "1";

        new Inputmask({
          mask: "+7 (999) 999-99-99",
          showMaskOnHover: false,
          showMaskOnFocus: true,
        }).mask(input);
      });
  }

  /* ──────────────────────────────────────────────────────────
     HYBRID EMAIL / PHONE
  ───────────────────────────────────────────────── */

  _detectEmailOrPhoneMode(value) {
    const trimmed = String(value ?? "").trim();

    if (!trimmed) return null;

    // начинается с цифры или +
    if (/^[\d+]/.test(trimmed)) {
      return "tel";
    }

    return "email";
  }

  _toggleHybridMask(input) {
    if (!input) return;

    const type = getFieldValidationType(input);

    if (type !== "emailOrPhone") return;

    const value = input.value.trim();

    const isPhone = /^[\d+]/.test(value);

    // PHONE
    if (isPhone) {
      if (!input.inputmask) {
        new Inputmask({
          mask: "+7 (999) 999-99-99",
          showMaskOnHover: false,
          showMaskOnFocus: true,
        }).mask(input);

        // если пользователь начал с 9
        if (/^\d/.test(value)) {
          input.inputmask.setValue(`+7 ${value}`);
        }
      }
    } else {
      // EMAIL
      if (input.inputmask) {
        input.inputmask.remove();
      }
    }
  }

  /* ──────────────────────────────────────────────────────────
     DYNAMIC FIELD
  ───────────────────────────────────────────────── */

  _createDynContainer() {
    const div = document.createElement("div");

    div.className = "js-dynamic-contact";

    const anchor = this.select?.closest(".form__field");

    if (anchor) {
      anchor.after(div);
    } else {
      this.form.insertBefore(
        div,
        this.submitBtn?.closest(".form__row") ?? this.submitBtn,
      );
    }

    return div;
  }

  _applySelectLongClass() {
    const selectField = this.select?.closest(".form__field");

    if (!selectField) return;

    selectField.classList.toggle("form__field--long", !this.select.value);
  }

  _getContactType() {
    const val = this.select?.value ?? "";

    if (!val) return null;

    return /mail/i.test(val) ? "email" : "tel";
  }

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

    if (!isEmail) {
      this.dynMask = new Inputmask({
        mask: "+7 (999) 999-99-99",
        showMaskOnHover: false,
        showMaskOnFocus: true,
      });

      this.dynMask.mask(input);
    }
  }

  _destroyDynField() {
    if (this.dynMask) {
      this.dynMask.remove();
      this.dynMask = null;
    }

    this.dynInput = null;

    this.dynContainer.innerHTML = "";
  }

  /* ──────────────────────────────────────────────────────────
     VALIDATION
  ───────────────────────────────────────────────── */

  _uniqueSelector(el) {
    if (el.id) {
      return `#${el.id}`;
    }

    if (el.name) {
      const formId = this.form.id;

      return formId ? `#${formId} [name="${el.name}"]` : `[name="${el.name}"]`;
    }

    const id = `jv-${Math.random().toString(36).slice(2, 8)}`;

    el.id = id;

    return `#${id}`;
  }

  _rebuildValidation() {
    if (this.validator) {
      try {
        this.validator.destroy();
      } catch (_) {}

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

    const staticInputs = Array.from(
      this.form.querySelectorAll("input[required], textarea[required]"),
    ).filter((el) => el !== this.dynInput);

    for (const input of staticInputs) {
      validator.addField(
        this._uniqueSelector(input),
        buildRulesForField(input),
      );
    }

    if (this.select) {
      validator.addField(this._uniqueSelector(this.select), [
        {
          rule: "required",
          errorMessage: "Выберите способ связи!",
        },
      ]);
    }

    if (this.dynInput) {
      validator.addField(
        this._uniqueSelector(this.dynInput),
        buildRulesForField(this.dynInput),
      );
    }

    validator.onValidate(({ isValid, fields }) => {
      for (const fieldState of Object.values(fields)) {
        const wrapper = fieldState.elem?.closest(".form__field");

        if (!wrapper) continue;

        wrapper.classList.toggle("error", !fieldState.isValid);
      }

      if (this.submitBtn) {
        this.submitBtn.disabled = !isValid;
      }
    });

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

      this.form.classList.add("form--sending");

      if (this.submitBtn) {
        this.submitBtn.disabled = true;
      }

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
          console.error("[Form] MaxFormCollector не найден");

          phpResult = {
            status: "fulfilled",
            value: { ok: false },
          };
        }

        if (phpResult.status === "fulfilled" && phpResult.value?.ok) {
          if (this.afterSend) {
            this.afterSend();
          }
        }
      } catch (err) {
        console.error("[Form] Ошибка отправки:", err);
      } finally {
        this.form.classList.remove("form--sending");

        this.form.querySelectorAll(".filled, .error").forEach((el) => {
          el.classList.remove("filled", "error");
        });

        formEl.reset();

        setTimeout(() => {
          const modal = document.querySelector(".modal.active");

          if (modal) {
            modal.classList.remove("active");
          }

          clearFields();
        }, 0);

        this._handleSelectChange();
      }
    });

    this.validator = validator;

    this._checkButtonState();
  }

  /* ──────────────────────────────────────────────────────────
     BUTTON STATE
  ───────────────────────────────────────────────── */

  _checkButtonState() {
    if (!this.submitBtn) return;

    this.submitBtn.disabled = !this._allRequiredValid();
  }

  _allRequiredValid() {
    if (this.select && !this.select.value) {
      return false;
    }

    const staticOk = Array.from(
      this.form.querySelectorAll("input[required], textarea[required]"),
    )
      .filter((el) => el !== this.dynInput)
      .every((el) => this._isValueValid(el));

    const dynOk = this.dynInput ? this._isValueValid(this.dynInput) : true;

    return staticOk && dynOk;
  }

  _isValueValid(input) {
    const type = getFieldValidationType(input);

    const value = input.value ?? "";

    if (type === "email") {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    if (type === "tel") {
      const str = String(value ?? "");

      if (str.includes("_")) return false;

      return str.replace(/\D/g, "").length >= 11;
    }

    if (type === "emailOrPhone") {
      const mode = this._detectEmailOrPhoneMode(value);

      // EMAIL
      if (mode === "email") {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      }

      // PHONE
      if (mode === "tel") {
        const str = String(value ?? "");

        if (str.includes("_")) return false;

        return str.replace(/\D/g, "").length >= 11;
      }

      return false;
    }

    const minLen =
      parseInt(input.dataset.minLength ?? input.minLength, 10) || 1;

    return value.trim().length >= minLen;
  }

  /* ──────────────────────────────────────────────────────────
     UI
  ───────────────────────────────────────────────── */

  _updateFilled(input) {
    const wrapper = input.closest(".form__field");

    if (!wrapper) return;

    wrapper.classList.toggle("filled", input.value.length > 0);
  }

  _handleSelectChange() {
    this._applySelectLongClass();

    this._buildDynamicField(this._getContactType());

    this._rebuildValidation();
  }

  /* ──────────────────────────────────────────────────────────
     EVENTS
  ───────────────────────────────────────────────── */

  _bindEvents() {
    const onInput = (e) => {
      const el = e.target;

      if (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA") {
        return;
      }

      // HYBRID EMAIL/PHONE
      this._toggleHybridMask(el);

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
