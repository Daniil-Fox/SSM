import { Swiper } from "swiper";

new Swiper(".service__slider", {
  slidesPerView: 4,
  spaceBetween: 40,

  breakpoints: {
    320: {
      slidesPerView: 1.2,
    },
    577: {
      slidesPerView: 4,
    },
  },
});

new Swiper(".trust__slider", {
  slidesPerView: "auto",
  spaceBetween: 70,

  breakpoints: {
    320: {},
    577: {},
  },
});

const sliders3 = document.querySelectorAll(".slider-3");
if (sliders3.length) {
  sliders3.forEach((slider) => {
    new Swiper(slider, {
      slidesPerView: 3,
      spaceBetween: 40,

      breakpoints: {
        320: {
          slidesPerView: 1.2,
        },
        577: {
          slidesPerView: 3,
        },
      },
    });
  });
}

const slidersAuto = document.querySelectorAll(".slider-auto");
if (slidersAuto.length) {
  slidersAuto.forEach((slider) => {
    new Swiper(slider, {
      slidesPerView: "auto",
      spaceBetween: 40,

      breakpoints: {
        320: {
          spaceBetween: 20,
        },
        577: {
          spaceBetween: 40,
        },
      },
    });
  });
}
