document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".spec__desc");
  const paragraph = container.querySelector("p");
  let toggleBtn = null;
  let isExpanded = false;

  // Функция проверки необходимости кнопки (текст обрезается)
  function isTextOverflowing() {
    // Временно убираем transition, чтобы измерить точно
    const originalTransition = paragraph.style.transition;
    paragraph.style.transition = "none";

    // Применяем класс, как на мобильных
    container.classList.add("is-clamped");
    const isClamped = paragraph.scrollHeight > paragraph.clientHeight;
    container.classList.remove("is-clamped");

    paragraph.style.transition = originalTransition;
    return isClamped;
  }

  // Плавное раскрытие
  async function expandText() {
    const currentHeight = paragraph.clientHeight;
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
      paragraph.removeEventListener("transitionend", onTransitionEnd);
    };
    paragraph.addEventListener("transitionend", onTransitionEnd, {
      once: true,
    });

    isExpanded = true;
    if (toggleBtn) toggleBtn.textContent = "Свернуть";
  }

  // Плавное сворачивание
  async function collapseText() {
    const currentHeight = paragraph.clientHeight;
    container.style.maxHeight = currentHeight + "px";

    // Добавляем класс с ограничением строк
    container.classList.add("is-clamped");

    await new Promise(requestAnimationFrame);
    const collapsedHeight = paragraph.clientHeight;
    container.style.maxHeight = collapsedHeight + "px";

    const onTransitionEnd = () => {
      container.style.maxHeight = "";
      paragraph.removeEventListener("transitionend", onTransitionEnd);
    };
    paragraph.addEventListener("transitionend", onTransitionEnd, {
      once: true,
    });

    isExpanded = false;
    if (toggleBtn) toggleBtn.textContent = "Читать далее";
  }

  // Переключение состояния
  function toggleText() {
    if (isExpanded) {
      collapseText();
    } else {
      expandText();
    }
  }

  // Инициализация для мобильной версии
  function initMobile() {
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // Если кнопки ещё нет — создаём
      if (!toggleBtn) {
        toggleBtn = document.createElement("button");
        toggleBtn.className = "spec__toggle-btn";
        container.insertAdjacentElement("afterend", toggleBtn);
        toggleBtn.addEventListener("click", toggleText);
      }

      // Применяем класс для обрезки (если текст длинный)
      container.classList.add("is-clamped");

      // Показываем кнопку только если текст реально обрезается
      if (isTextOverflowing()) {
        toggleBtn.style.display = "inline-block";
        toggleBtn.textContent = isExpanded ? "Свернуть" : "Читать далее";
      } else {
        toggleBtn.style.display = "none";
        // Если текст не обрезается, снимаем ограничение строк
        container.classList.remove("is-clamped");
      }
    } else {
      // На десктопе убираем всё ограничение и кнопку
      container.classList.remove("is-clamped");
      container.style.maxHeight = "";
      if (toggleBtn) {
        toggleBtn.remove();
        toggleBtn = null;
      }
      isExpanded = false;
    }
  }

  // Следим за изменением размера окна (переинициализация)
  window.addEventListener("resize", () => {
    // Сбрасываем состояние, чтобы анимации не мешали
    container.style.maxHeight = "";
    isExpanded = false;
    initMobile();
  });

  initMobile();
});
