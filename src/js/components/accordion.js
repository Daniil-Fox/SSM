export function mountAccordions(parent = document) {
  const accordions = parent.querySelectorAll(".accordeon");

  accordions.forEach((accordion) => {
    const trigger = accordion.querySelector(".accordeon__trigger");

    const body = accordion.querySelector(".accordeon__body");

    if (!trigger || !body) return;

    // защита от двойного mount

    if (accordion.dataset.accordionReady) {
      return;
    }

    accordion.dataset.accordionReady = "true";

    // mobile default collapsed

    if (window.innerWidth <= 768) {
      body.style.height = "0px";
    } else {
      accordion.classList.add("active");

      body.style.height = "auto";
    }

    trigger.addEventListener("click", () => {
      // desktop disabled

      if (window.innerWidth > 768) return;

      const isOpen = accordion.classList.contains("active");

      accordion.classList.toggle("active", !isOpen);

      if (isOpen) {
        body.style.height = "0px";
      } else {
        body.style.height = body.scrollHeight + "px";
      }
    });
  });
}
