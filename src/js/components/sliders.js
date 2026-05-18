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

window.addEventListener("DOMContentLoaded", () => {
  const resizableSwiper = (
    breakpoint,
    swiperClass,
    swiperSettings,
    callback,
  ) => {
    let swiper;

    breakpoint = window.matchMedia(breakpoint);

    const enableSwiper = function (className, settings) {
      swiper = new Swiper(className, settings);

      if (callback) {
        callback(swiper);
      }
    };

    const checker = function () {
      if (breakpoint.matches) {
        return enableSwiper(swiperClass, swiperSettings);
      } else {
        if (swiper !== undefined) swiper.destroy(true, true);
        return;
      }
    };

    breakpoint.addEventListener("change", checker);
    checker();
  };

  const someFunc = (instance) => {
    if (instance) {
      instance.on("slideChange", function (e) {
        console.log("*** mySwiper.activeIndex", instance.activeIndex);
      });
    }
  };

  resizableSwiper("(max-width: 576px)", ".services-extra__items", {
    slidesPerView: 1.2,
    spaceBetween: 20,
  });
});
