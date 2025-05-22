// import { login, watchUser } from './auth.js';

// document.querySelector('#loginBtn').addEventListener('click', () => {
//   const email = document.querySelector('#email').value;
//   const password = document.querySelector('#password').value;
//   login(email, password)
//     .then(() => alert('Logged in!'))
//     .catch(err => alert(err.message));
// });

// watchUser((user) => {
//   if (user) {
//     document.querySelector('#adminPanel').style.display = 'block';
//     console.log("Logged in as:", user.email);
//   } else {
//     document.querySelector('#adminPanel').style.display = 'none';
//   }
// });

// Dynamic year
document.getElementById("year").textContent = new Date().getFullYear();

window.addEventListener("load", () => {
  const loader = document.getElementById("preloader");
  loader.classList.add("opacity-0", "transition-opacity", "duration-700");
  setTimeout(() => (loader.style.display = "none"), 700);
});

const slides = document.querySelectorAll(".carousel-slide");
let currentSlide = 0;
let slideInterval;

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle("opacity-100", i === index);
    slide.classList.toggle("z-10", i === index);
    slide.classList.toggle("opacity-0", i !== index);
    slide.classList.toggle("z-0", i !== index);
  });
  dots.forEach((dot, i) => {
    dot.classList.toggle("bg-white", i === index);
    dot.classList.toggle("bg-white/50", i !== index);
    dot.classList.toggle("scale-125", i === index);
  });
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % slides.length;
  showSlide(currentSlide);
}

function prevSlide() {
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  showSlide(currentSlide);
}

document.getElementById("nextSlide").addEventListener("click", () => {
  nextSlide();
  resetInterval();
});

document.getElementById("prevSlide").addEventListener("click", () => {
  prevSlide();
  resetInterval();
});

function startInterval() {
  slideInterval = setInterval(nextSlide, 5000); // 5 seconds
}

function resetInterval() {
  clearInterval(slideInterval);
  startInterval();
}

startInterval();
const dotContainer = document.getElementById("carouselDots");

slides.forEach((_, i) => {
  const dot = document.createElement("button");
  dot.className =
    "w-3 h-3 rounded-full bg-white/50 hover:bg-white transition-colors duration-300";
  dot.addEventListener("click", () => {
    currentSlide = i;
    showSlide(currentSlide);
    resetInterval();
  });
  dotContainer.appendChild(dot);
});
const dots = dotContainer.querySelectorAll("button");

let startX = 0;

document.getElementById("carouselSlides").addEventListener(
  "touchstart",
  (e) => {
    startX = e.touches[0].clientX;
  },
  { passive: true }
);

document.getElementById("carouselSlides").addEventListener(
  "touchend",
  (e) => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide(); // Swipe left
      else prevSlide(); // Swipe right
      resetInterval();
    }
  },
  { passive: true }
);
window.addEventListener("load", () => {
  const preloader = document.getElementById("preloader");
  preloader.classList.add("fade-out");

  // After animation ends, remove it from the DOM
  setTimeout(() => {
    preloader.style.display = "none";
  }, 500);
});

const heroImages = [
  "./IMG/home-one.jpg",
  "./IMG/home-two.jpg",
  "./IMG/home-three.jpg",
];

const heroImageElement = document.getElementById("hero-carousel-img");
let heroCurrentIndex = 0;

setInterval(() => {
  // Fade out
  heroImageElement.classList.add("opacity-0");

  setTimeout(() => {
    // Change image
    heroCurrentIndex = (heroCurrentIndex + 1) % heroImages.length;
    heroImageElement.src = heroImages[heroCurrentIndex];

    // Fade in
    heroImageElement.classList.remove("opacity-0");
  }, 400); // timing matches fade duration
}, 3500); // 3.5 seconds interval
// main.js
