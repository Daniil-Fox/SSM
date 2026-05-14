const fields = document.querySelectorAll(".form__field");

if (fields.length > 0) {
  fields.forEach((field) => {
    const input = field.querySelector(".form__input");
    const label = field.querySelector(".form__label");

    if (input && label) {
      input.addEventListener("focus", (e) => {
        field.classList.add("focus");
      });
      input.addEventListener("input", () => {
        field.classList.add("filled");

        if (input.value === "") {
          field.classList.remove("filled");
        }
      });

      input.addEventListener("blur", () => {
        field.classList.remove("focus");
        if (input.value === "") {
          field.classList.remove("filled");
        }
      });
    }
  });
}

export const clearFields = () => {
  fields.forEach((field) => {
    field.classList.remove("filled");
  });
};
