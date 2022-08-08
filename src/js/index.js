import { preloadImages, preloadFonts, clamp, map } from './utils';
import Cursor from './cursor';
import LocomotiveScroll from 'locomotive-scroll';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { lerp } from './utils';

const allImages = document.querySelectorAll('.gallery__item-imginner');
const flowImages = document.querySelectorAll('.gallery__item-img--flow');

// Previous intersection ratio
let prevRatio = 0.0;

// Slide-in animation
const obsFlowCallback = (entries, _) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.firstElementChild.classList.add('flow');
    }
    if (!entry.isIntersecting)
      entry.target.firstElementChild.classList.remove('flow');
  });
};

// Image transition animation
const obsCallback = (entries, _) => {
  entries.forEach((entry) => {
    // Limit brightness and saturation at 100%
    let intersectVal = lerp(entry.intersectionRatio * 1.5, prevRatio, 0.1);
    intersectVal = intersectVal >= 1 ? 1 : intersectVal;

    // Animation
    if (entry.intersectionRatio > prevRatio) {
      entry.target.style.opacity = intersectVal;
      entry.target.style.filter = `saturate(${intersectVal}) brightness(${intersectVal})`;
    } else {
      entry.target.style.opacity = intersectVal;
      entry.target.style.filter = `saturate(${intersectVal}) brightness(${intersectVal})`;
    }

    // Make it smooth
    if (intersectVal > prevRatio * 2) return;
    prevRatio = intersectVal;
  });
};

// Observer settings
function buildThresholdList() {
  let thresholds = [];
  let numSteps = 100;

  for (let i = 1; i <= numSteps; i++) {
    let ratio = i / numSteps;
    thresholds.push(ratio);
  }

  thresholds.push(0);
  return thresholds;
}

const obsOptions = {
  root: null,
  rootMargin: '0px',
  threshold: buildThresholdList(),
};

const obs = new IntersectionObserver(obsCallback, obsOptions);
const obsFlow = new IntersectionObserver(obsFlowCallback, obsOptions);

allImages.forEach((img) => obs.observe(img));
flowImages.forEach((img) => obsFlow.observe(img));

// Register ScrollTrigger for horizontal scroll
gsap.registerPlugin(ScrollTrigger);
let horizontalGalLength;

// Initialize Locomotive Scroll
const pageContainer = document.querySelector('[data-scroll-container]');
const lscroll = new LocomotiveScroll({
  el: pageContainer,
  smooth: true,
  mobile: {
    breakpoint: 0,
    smooth: true,
  },
  tablet: {
    breakpoint: 0,
    smooth: true,
  },
});

// Update Trigger manually
lscroll.on('scroll', ScrollTrigger.update);

// If horizontal scroll is enabled, update the length of the scroll
ScrollTrigger.scrollerProxy(pageContainer, {
  scrollTop(value) {
    return arguments.length
      ? lscroll.scrollTo(value, 0, 0)
      : lscroll.scroll.instance.scroll.y;
  },
  getBoundingClientRect() {
    return {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  },
  pinType: pageContainer.style.transform ? 'transform' : 'fixed',
});

// Preload images and fonts
Promise.all([
  preloadImages('.gallery__item-imginner'),
  preloadFonts('vxy2fer'),
]).then(() => {
  // When everything is loaded, calculate total width of the gallery for scrollTrigger to work correctly
  // Calculate total width of the first section (horizontal)
  const pinWrap = document.querySelector('.gallery');
  const pinWrapWidth = pinWrap.offsetWidth;
  const horizontalScrollLength = pinWrapWidth - window.innerWidth;

  // Pinning and horizontal scrolling
  horizontalGalLength = horizontalScrollLength;

  // Trigger that makes the gallery scroll horizontally
  gsap.to('.gallery', {
    scrollTrigger: {
      scroller: pageContainer, //locomotive-scroll
      scrub: true,
      trigger: '.content',
      pin: true,
      // anticipatePin: 1,
      start: 'top top',
      end: pinWrapWidth,
    },
    x: -horizontalScrollLength,
    ease: 'none',
  });

  ScrollTrigger.addEventListener('refresh', () => lscroll.update()); //locomotive-scroll
  ScrollTrigger.refresh();

  // Add Clones for background
  const mql = window.matchMedia('(min-width: 999px)');

  // Desktop only (blurred background causes lag on mobile)
  if (mql.matches) {
    allImages.forEach((img) => {
      if (img.parentNode.classList.value !== 'cover-img') {
        // skip 2 images
        if (
          img.style.backgroundImage ===
            'url("/pexels-loc-dang-8433972.101d1a23.jpg")' ||
          img.style.backgroundImage ===
            'url("/pexels-loc-dang-1648023.45153c83.jpg")'
        )
          return;

        const imgClone = document.createElement('div');
        imgClone.classList.add('gallery__item-imginner');
        imgClone.classList.add('gallery__item-imginner--clone');

        if (
          img.style.backgroundImage ===
          'url("/pexels-loc-dang-2421375.17b2c728.jpg")'
        ) {
          // we want to display a darker image as the last image
          imgClone.style.backgroundImage = `url(
        '/pexels-loc-dang-1600128.ce33984a.jpg'
      )`;
        } else {
          imgClone.style.backgroundImage = img.style.backgroundImage;
        }
        const vgal = img.parentNode.parentNode.parentNode.parentNode.childNodes;

        vgal.forEach((node) => {
          if (node.className === 'vgalleryclone') {
            node.appendChild(imgClone);
          }
        });
      }
    });
  }
  // Remove loader (loading class)
  document.body.classList.add('start');
  document.body.classList.remove('loading');

  // Initialize custom cursor
  const cursor = new Cursor(document.querySelector('.cursor'));

  // Mouse effects on all links and others
  [...document.querySelectorAll('a')].forEach((link) => {
    link.addEventListener('mouseenter', () => cursor.enter());
    link.addEventListener('mouseleave', () => cursor.leave());
  });
});
