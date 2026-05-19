document.addEventListener("DOMContentLoaded", () => {
  // Находим все элементы с дата-атрибутом data-toggle-text
  const toggleContainers = document.querySelectorAll("[data-toggle-text]");

  toggleContainers.forEach((container) => {
    // Получаем настройки из дата-атрибутов
    const textSelector = container.dataset.textSelector || "p"; // селектор текстового блока
    const toggleBtnTextExpand =
      container.dataset.toggleTextExpand || "Читать далее";
    const toggleBtnTextCollapse =
      container.dataset.toggleTextCollapse || "Свернуть";
    const breakpoint = parseInt(container.dataset.breakpoint) || 576; // брейкпоинт в px
    const lineClamp = parseInt(container.dataset.lineClamp) || 6; // количество строк до обрезки
    const animationDuration =
      parseInt(container.dataset.animationDuration) || 300; // длительность анимации

    let paragraph = null;
    let toggleBtn = null;
    let isExpanded = false;

    // Находим текстовый элемент внутри контейнера
    if (container.dataset.textElement) {
      // Если указан конкретный элемент
      paragraph = container.querySelector(container.dataset.textElement);
    } else {
      // Иначе ищем по селектору
      paragraph = container.querySelector(textSelector);
    }

    if (!paragraph) return;

    // Плавное сворачивание
    async function collapseText() {
      const currentHeight = container.clientHeight;
      container.style.maxHeight = currentHeight + "px";

      // Добавляем класс с ограничением строк
      container.classList.add("is-clamped");

      await new Promise(requestAnimationFrame);
      const collapsedHeight = container.clientHeight;
      container.style.maxHeight = collapsedHeight + "px";

      const onTransitionEnd = () => {
        container.style.maxHeight = "";
        container.removeEventListener("transitionend", onTransitionEnd);
      };
      container.addEventListener("transitionend", onTransitionEnd, {
        once: true,
      });

      isExpanded = false;
      if (toggleBtn) toggleBtn.textContent = toggleBtnTextExpand;
    }

    // Переключение состояния
    function toggleText() {
      if (isExpanded) {
        collapseText();
      } else {
        expandText();
      }
    }
    function isTextOverflowing() {
      // Временно убираем transition, чтобы измерить точно
      const originalTransition = container.style.transition;
      container.style.transition = "none";

      // Применяем класс, как на мобильных
      container.classList.add("is-clamped");
      const isClamped = paragraph.scrollHeight > container.clientHeight;

      container.style.transition = originalTransition;
      return isClamped;
    }

    async function expandText() {
      const currentHeight = container.clientHeight;
      container.style.maxHeight = currentHeight + "px";

      // Убираем класс с ограничением строк
      container.classList.remove("is-clamped");

      // Ждём перерисовки, чтобы получить полную высоту
      await new Promise(requestAnimationFrame);
      const fullHeight = paragraph.scrollHeight;
      container.style.maxHeight = fullHeight + "px";

      // После завершения анимации убираем inline max-height
      const onTransitionEnd = () => {
        container.style.maxHeight = "";
        container.removeEventListener("transitionend", onTransitionEnd);
      };
      container.addEventListener("transitionend", onTransitionEnd, {
        once: true,
      });

      isExpanded = true;
      if (toggleBtn) toggleBtn.textContent = toggleBtnTextCollapse;
    }
    // Инициализация для мобильной версии
    function initMobile() {
      const isMobile = window.innerWidth <= breakpoint;

      if (isMobile) {
        // Если кнопки ещё нет — создаём
        if (!toggleBtn) {
          toggleBtn = document.createElement("button");
          toggleBtn.className = "toggle-btn-universal";
          // Добавляем пользовательские классы из дата-атрибута
          if (container.dataset.btnClass) {
            toggleBtn.classList.add(...container.dataset.btnClass.split(" "));
          }
          container.insertAdjacentElement("afterend", toggleBtn);
          toggleBtn.addEventListener("click", toggleText);
        }

        // Применяем класс для обрезки (если текст длинный)
        container.classList.add("is-clamped");
        // Показываем кнопку только если текст реально обрезается
        if (isTextOverflowing()) {
          toggleBtn.style.display = "block";
          toggleBtn.textContent = isExpanded
            ? toggleBtnTextCollapse
            : toggleBtnTextExpand;
        } else {
          toggleBtn.style.display = "none";
          container.classList.remove("is-clamped");
        }
      } else {
        container.classList.remove("is-clamped");
        container.style.maxHeight = "";
        if (toggleBtn) {
          toggleBtn.remove();
          toggleBtn = null;
        }
        isExpanded = false;
      }
    }

    window.addEventListener("resize", () => {
      container.style.maxHeight = "";
      isExpanded = false;
      initMobile();
    });

    initMobile();
  });
});
