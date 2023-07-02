import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.module.min.js';
import Projects from './projects.json' assert { type: 'json' };
import Swiper from 'https://cdn.jsdelivr.net/npm/swiper@9/swiper-bundle.esm.browser.min.js';

const magicFrame = document.getElementById('magicFrame');
const styling = magicFrame.contentDocument.createElement('style');
const vertexShader = magicFrame.contentDocument.createElement('script');
const fragmentShader = magicFrame.contentDocument.createElement('script');
const magicContainer = magicFrame.contentDocument.createElement('div');
const magicParent = magicFrame.contentDocument.createElement('div');

magicContainer.setAttribute('id', 'mContainer');
magicParent.setAttribute('id', 'magic');

vertexShader.setAttribute('type', 'x-shader/x-vertex');
fragmentShader.setAttribute('type', 'x-shader/x-fragment');
vertexShader.setAttribute('id', 'vertexshader');
fragmentShader.setAttribute('id', 'fragmentshader');

vertexShader.innerHTML = `
attribute float size;
attribute vec3 customColor;
varying vec3 vColor;

void main() {

  vColor = customColor;
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  gl_PointSize = size * ( 300.0 / -mvPosition.z );
  gl_Position = projectionMatrix * mvPosition;

}`;
fragmentShader.innerHTML = `
uniform vec3 color;
uniform sampler2D pointTexture;

varying vec3 vColor;

void main() {

  gl_FragColor = vec4( color * vColor, 1.0 );
  gl_FragColor = gl_FragColor * texture2D( pointTexture, gl_PointCoord );

}
`;

styling.innerHTML = `
html,
body {
  margin: 0 auto;
  font-family: 'Montserrat' !important;
  color: white;
  background-color: #000;
  scroll-behavior: smooth;
  overflow-x: hidden;
  height: 100%;
  user-select: none;
}

body {
  max-width: 1500px;
}
#mContainer {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

#magic {
  position: relative;
  width: 100%;
  height: 100%;
  display: block;
  top: 0;
  left: 0;
  z-index: 0;
}`;

magicFrame.contentDocument.head.appendChild(vertexShader);
magicFrame.contentDocument.head.appendChild(fragmentShader);
magicFrame.contentDocument.head.appendChild(styling);
magicFrame.contentDocument.body.appendChild(magicContainer);
magicFrame.contentDocument.getElementById('mContainer').appendChild(magicParent);

const preload = () => {
  let manager = new THREE.LoadingManager();
  manager.onLoad = function () {
    const environment = new Environment(typo, particle);
  };

  var typo = null;
  const loader = new THREE.FontLoader(manager);
  const font = loader.load(
    'https://res.cloudinary.com/dydre7amr/raw/upload/v1612950355/font_zsd4dr.json',
    function (font) {
      typo = font;
    }
  );
  const particle = new THREE.TextureLoader(manager).load(
    'https://res.cloudinary.com/dfvtkoboz/image/upload/v1605013866/particle_a64uzf.png'
  );
};

if (
  magicFrame.contentDocument.readyState === 'complete' ||
  (magicFrame.contentDocument.readyState !== 'loading' &&
    !magicFrame.contentDocument.documentElement.doScroll)
)
  preload();
else magicFrame.contentDocument.addEventListener('DOMContentLoaded', preload);

class Environment {
  constructor(font, particle) {
    this.font = font;
    this.particle = particle;
    this.container = magicFrame.contentDocument.getElementById('magic');
    this.scene = new THREE.Scene();
    this.createCamera();
    this.createRenderer();
    this.setup();
    this.bindEvents();
  }

  bindEvents() {
    magicFrame.contentWindow.addEventListener('resize', this.onWindowResize.bind(this));
  }

  setup() {
    this.createParticles = new CreateParticles(
      this.scene,
      this.font,
      this.particle,
      this.camera,
      this.renderer
    );
  }

  render() {
    this.createParticles.render();
    this.renderer.render(this.scene, this.camera);
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      65,
      this.container.clientWidth / this.container.clientHeight,
      1,
      10000
    );
    this.camera.position.set(0, 0, 100);
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

    this.renderer.setPixelRatio(Math.min(magicFrame.contentWindow.devicePixelRatio, 2));

    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.append(this.renderer.domElement);

    this.renderer.setAnimationLoop(() => {
      this.render();
    });
  }

  onWindowResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }
}

class CreateParticles {
  constructor(scene, font, particleImg, camera, renderer) {
    this.scene = scene;
    this.font = font;
    this.particleImg = particleImg;
    this.camera = camera;
    this.renderer = renderer;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-200, 200);

    this.colorChange = new THREE.Color();

    this.buttom = false;

    this.data = {
      text: 'Abdullah Mohammed \n   Software Engineer',
      amount: 1200,
      particleSize: 1,
      particleColor: 0x000,
      textSize: magicFrame.contentWindow.innerWidth >= 1200 ? 8 : 7,
      area: 100,
      ease: 0.25
    };

    this.setup();
    this.bindEvents();
  }

  setup() {
    const geometry = new THREE.PlaneGeometry(
      this.visibleWidthAtZDepth(100, this.camera),
      this.visibleHeightAtZDepth(100, this.camera)
    );
    const material = new THREE.MeshBasicMaterial({ color: 0x000, transparent: true });
    this.planeArea = new THREE.Mesh(geometry, material);
    this.planeArea.visible = false;
    this.createText();
  }

  bindEvents() {
    magicFrame.contentDocument.addEventListener('mousedown', this.onMouseDown.bind(this));
    magicFrame.contentDocument.addEventListener('mousemove', this.onMouseMove.bind(this));
    magicFrame.contentDocument.addEventListener('mouseup', this.onMouseUp.bind(this));

    magicFrame.contentDocument.addEventListener('touchstart', this.onTouchStart.bind(this), {
      passive: false
    });
    magicFrame.contentDocument.addEventListener(
      'touchmove',
      (e) => e.preventDefault(),
      this.onTouchMove.bind(this),
      {
        passive: false
      }
    );
    magicFrame.contentDocument.addEventListener('touchend', this.onTouchEnd.bind(this), {
      passive: false
    });
  }

  onMouseDown() {
    this.mouse.x = (event.clientX / magicFrame.contentWindow.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / magicFrame.contentWindow.innerHeight) * 2 + 1;

    const vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5);
    vector.unproject(this.camera);
    const dir = vector.sub(this.camera.position).normalize();
    const distance = -this.camera.position.z / dir.z;
    this.currenPosition = this.camera.position.clone().add(dir.multiplyScalar(distance));

    const pos = this.particles.geometry.attributes.position;
    this.buttom = true;
    this.data.ease = 0.01;
  }

  onMouseUp() {
    this.buttom = false;
    this.data.ease = 0.25;
  }

  onMouseMove() {
    this.mouse.x = (event.clientX / magicFrame.contentWindow.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / magicFrame.contentWindow.innerHeight) * 2 + 1;
  }

  onTouchStart() {
    this.mouse.x = (event.targetTouches[0].pageX / magicFrame.contentWindow.innerWidth) * 2 - 1;
    this.mouse.y = -(event.targetTouches[0].pageY / magicFrame.contentWindow.innerHeight) * 2 + 1;

    const vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5);
    vector.unproject(this.camera);
    const dir = vector.sub(this.camera.position).normalize();
    const distance = -this.camera.position.z / dir.z;
    this.currenPosition = this.camera.position.clone().add(dir.multiplyScalar(distance));

    const pos = this.particles.geometry.attributes.position;
    this.buttom = true;
    this.data.ease = 0.01;
  }

  onTouchEnd() {
    this.buttom = false;
    this.data.ease = 0.25;
  }

  onTouchMove() {
    this.mouse.x = (event.targetTouches[0].pageX / magicFrame.contentWindow.innerWidth) * 2 - 1;
    this.mouse.y = -(event.targetTouches[0].pageY / magicFrame.contentWindow.innerHeight) * 2 + 1;
  }

  render(level) {
    const time = ((0.001 * performance.now()) % 12) / 12;
    const zigzagTime = (1 + Math.sin(time * 2 * Math.PI)) / 6;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObject(this.planeArea);

    if (intersects.length > 0) {
      const pos = this.particles.geometry.attributes.position;
      const copy = this.geometryCopy.attributes.position;
      const coulors = this.particles.geometry.attributes.customColor;
      const size = this.particles.geometry.attributes.size;

      const mx = intersects[0].point.x;
      const my = intersects[0].point.y;
      const mz = intersects[0].point.z;

      for (var i = 0, l = pos.count; i < l; i++) {
        const initX = copy.getX(i);
        const initY = copy.getY(i);
        const initZ = copy.getZ(i);

        let px = pos.getX(i);
        let py = pos.getY(i);
        let pz = pos.getZ(i);

        this.colorChange.setHSL(0.5, 1, 1);
        coulors.setXYZ(i, this.colorChange.r, this.colorChange.g, this.colorChange.b);
        coulors.needsUpdate = true;

        size.array[i] = this.data.particleSize;
        size.needsUpdate = true;

        let dx = mx - px;
        let dy = my - py;
        const dz = mz - pz;

        const mouseDistance = this.distance(mx, my, px, py);
        let d = (dx = mx - px) * dx + (dy = my - py) * dy;
        const f = -this.data.area / d;

        if (this.buttom) {
          const t = Math.atan2(dy, dx);
          px -= f * Math.cos(t);
          py -= f * Math.sin(t);

          this.colorChange.setHSL(0.5 + zigzagTime, 1.0, 0.5);
          coulors.setXYZ(i, this.colorChange.r, this.colorChange.g, this.colorChange.b);
          coulors.needsUpdate = true;

          if (px > initX + 70 || px < initX - 70 || py > initY + 70 || py < initY - 70) {
            this.colorChange.setHSL(0.15, 1.0, 0.5);
            coulors.setXYZ(i, this.colorChange.r, this.colorChange.g, this.colorChange.b);
            coulors.needsUpdate = true;
          }
        } else {
          if (mouseDistance < this.data.area) {
            if (i % 5 == 0) {
              const t = Math.atan2(dy, dx);
              px -= 0.03 * Math.cos(t);
              py -= 0.03 * Math.sin(t);

              this.colorChange.setHSL(0.15, 1.0, 0.5);
              coulors.setXYZ(i, this.colorChange.r, this.colorChange.g, this.colorChange.b);
              coulors.needsUpdate = true;

              size.array[i] = this.data.particleSize / 1.2;
              size.needsUpdate = true;
            } else {
              const t = Math.atan2(dy, dx);
              px += f * Math.cos(t);
              py += f * Math.sin(t);

              pos.setXYZ(i, px, py, pz);
              pos.needsUpdate = true;

              size.array[i] = this.data.particleSize * 1.3;
              size.needsUpdate = true;
            }

            if (px > initX + 10 || px < initX - 10 || py > initY + 10 || py < initY - 10) {
              this.colorChange.setHSL(0.15, 1.0, 0.5);
              coulors.setXYZ(i, this.colorChange.r, this.colorChange.g, this.colorChange.b);
              coulors.needsUpdate = true;

              size.array[i] = this.data.particleSize / 1.2;
              size.needsUpdate = true;
            }
          }
        }

        px += (initX - px) * this.data.ease;
        py += (initY - py) * this.data.ease;
        pz += (initZ - pz) * this.data.ease;

        pos.setXYZ(i, px, py, pz);
        pos.needsUpdate = true;
      }
    }
  }

  createText() {
    let thePoints = [];

    let shapes = this.font.generateShapes(this.data.text, this.data.textSize);
    let geometry = new THREE.ShapeGeometry(shapes);
    geometry.computeBoundingBox();

    const xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
    const yMid = (geometry.boundingBox.max.y - geometry.boundingBox.min.y) / 2.85;

    geometry.center();

    let holeShapes = [];

    for (let q = 0; q < shapes.length; q++) {
      let shape = shapes[q];

      if (shape.holes && shape.holes.length > 0) {
        for (let j = 0; j < shape.holes.length; j++) {
          let hole = shape.holes[j];
          holeShapes.push(hole);
        }
      }
    }
    shapes.push.apply(shapes, holeShapes);

    let colors = [];
    let sizes = [];

    for (let x = 0; x < shapes.length; x++) {
      let shape = shapes[x];

      const amountPoints = shape.type == 'Path' ? this.data.amount / 2 : this.data.amount;

      let points = shape.getSpacedPoints(amountPoints);

      points.forEach((element, z) => {
        const a = new THREE.Vector3(element.x, element.y, 0);
        thePoints.push(a);
        colors.push(this.colorChange.r, this.colorChange.g, this.colorChange.b);
        sizes.push(1);
      });
    }

    let geoParticles = new THREE.BufferGeometry().setFromPoints(thePoints);
    geoParticles.translate(xMid, yMid, 0);

    geoParticles.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3));
    geoParticles.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0x100589) },
        pointTexture: { value: this.particleImg }
      },
      vertexShader: magicFrame.contentDocument.getElementById('vertexshader').textContent,
      fragmentShader: magicFrame.contentDocument.getElementById('fragmentshader').textContent,

      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true
    });

    this.particles = new THREE.Points(geoParticles, material);
    this.scene.add(this.particles);

    this.geometryCopy = new THREE.BufferGeometry();
    this.geometryCopy.copy(this.particles.geometry);
  }

  visibleHeightAtZDepth(depth, camera) {
    const cameraOffset = camera.position.z;
    if (depth < cameraOffset) depth -= cameraOffset;
    else depth += cameraOffset;

    const vFOV = (camera.fov * Math.PI) / 180;

    return 2 * Math.tan(vFOV / 2) * Math.abs(depth);
  }

  visibleWidthAtZDepth(depth, camera) {
    const height = this.visibleHeightAtZDepth(depth, camera);
    return height * camera.aspect;
  }

  distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  }
}

document.body.oncontextmenu = () => {
  return false;
};
magicFrame.contentDocument.oncontextmenu = () => {
  return false;
};
var sections = document.querySelectorAll('section');
var options = {
  rootMargin: '0px',
  threshold: 0.25
};
var callback = (entries) => {
  entries.forEach((entry) => {
    var target = entry.target;
    if (entry.intersectionRatio >= 0.25) {
      target.classList.add('inview');
    } else {
      // target.classList.remove('inview');
    }
  });
};
var sectionsObserver = new IntersectionObserver(callback, options);
sections.forEach((section, index) => {
  sectionsObserver.observe(section);
});

// window.requestAnimationFrame =
//   window.requestAnimationFrame ||
//   window.mozRequestAnimationFrame ||
//   window.webkitRequestAnimationFrame ||
//   window.msRequestAnimationFrame ||
//   function (f) {
//     setTimeout(f, 1000 / 60);
//   };

// document.addEventListener('DOMContentLoaded', function () {
//   Timeline();
// });

// function Timeline() {
//   requestAnimationFrame(animateLine);

//   function convertRange(value, r1, r2) {
//     return ((value - r1[0]) * (r2[1] - r2[0])) / (r1[1] - r1[0]) + r2[0];
//   }

//   function animateLine() {
//     var offset = window.scrollY;
//     var wheight = window.innerHeight;
//     var timeline = document.querySelector('.steps');
//     var theight = timeline.getBoundingClientRect().top - wheight;

//     if (theight < 0) {
//       var timelineMin = timeline.offsetHeight;
//       var objectMin = timeline.offsetTop;
//       var objectMax = timeline.offsetTop + timeline.offsetHeight;

//       document
//         .querySelector('.timeline svg')
//         .setAttribute(
//           'style',
//           'transform: scaleY(' +
//             Math.floor(convertRange(offset + wheight, [objectMin, objectMax], [0, 1.0]) * 100) /
//               100 +
//             ')'
//         );
//     }
//   }

//   window.addEventListener('scroll', function () {
//     requestAnimationFrame(animateLine());
//   });
// }

// var steps = document.querySelector('.steps');
// var stepsOptions = {
//   rootMargin: '0px',
//   threshold: 1
// };
// var stepsCallback = (entry) => {
//   var target = entry.target;
//   console.log(entry.intersectionRatio);
// };
// var stepsObserver = new IntersectionObserver(stepsCallback, stepsOptions);
// steps.forEach((section, index) => {
//   stepsObserver.observe(section);
// });

// Projects Load

const projectsContainer = document.getElementById('projectsContainer');
Projects.forEach((project) => {
  const projectDiv = document.createElement('div');
  projectDiv.classList.add('project');
  projectDiv.setAttribute('description', project.description);
  projectDiv.setAttribute('comment', project.comment);
  projectDiv.setAttribute('dateStart', project.dateStart);
  projectDiv.setAttribute('dateEnd', project.dateEnd);
  projectDiv.setAttribute('images', JSON.stringify(project.images));
  projectDiv.setAttribute('name', project.name);
  projectDiv.setAttribute('url', project.url);
  projectDiv.setAttribute('github', project.github);
  projectDiv.setAttribute('skills', JSON.stringify(project.skills));

  projectDiv.innerHTML = `
  <div class="card" onclick="openModal(this)">
  <div class="front">
    <img src="${project.images[0]}" alt="Project 1" />
    <div class="content">
      <h3>${project.name}</h3>
      <p><small>Click for details</small></p>
    </div>
  </div>
</div>`;
  projectsContainer.appendChild(projectDiv);
});

const openModal = (card) => {
  const cardParent = card.parentNode;
  // Show modal with card info
  const modal = document.getElementById('modal');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalHeader = document.getElementById('modalHeader');
  const modalCarousel = document.getElementsByClassName('swiper-wrapper')[0];
  const modalDescription = document.getElementById('modalDescription');
  const modalComment = document.getElementById('modalComment');
  const modalDate = document.getElementById('modalDate');
  const modalSkills = document.getElementById('modalSkills');
  const modalLink = document.getElementById('modalLink');
  const modalGithub = document.getElementById('modalGithub');

  // project data
  let images = cardParent.getAttribute('images').split(',');
  const name = cardParent.getAttribute('name');
  const url = cardParent.getAttribute('url');
  const github = cardParent.getAttribute('github');
  const description = cardParent.getAttribute('description');
  const comment = cardParent.getAttribute('comment');
  const date =
    cardParent.getAttribute('dateStart') === cardParent.getAttribute('dateEnd')
      ? cardParent.getAttribute('dateStart')
      : `${cardParent.getAttribute('dateStart')} ~ ${
          cardParent.getAttribute('dateEnd') !== 'null'
            ? cardParent.getAttribute('dateEnd')
            : 'Present'
        }`;
  const skills = cardParent.getAttribute('skills').split(',');

  modalComment.innerHTML = comment;
  modalDescription.innerHTML = description;
  modalDate.innerHTML = `Date: ${date}`;
  modalSkills.innerHTML = `${JSON.parse(skills)
    .map((skill) => `<li>${skill.name}</li>`)
    .toString()
    .replaceAll(',', '')}`;
  modalCarousel.innerHTML = `${JSON.parse(images)
    .map(
      (image) =>
        `<div class="swiper-slide">
            <img src="${image}" alt="${name}">
        </div>`
    )
    .toString()
    .replaceAll(',', '')}`;
  url ? (modalLink.onclick = () => window.open(url, '_blank')) : (modalLink.style.display = 'none');
  github !== 'null'
    ? (modalGithub.onclick = () => window.open(github, '_blank'))
    : (modalGithub.style.display = 'none');

  modal.classList.add('show');
  modal.classList.add('inview');

  modalBackdrop.classList.add('show');

  modalHeader.getElementsByTagName('h3')[0].innerHTML = name;

  modal.querySelector('.close').addEventListener('click', () => {
    modal.classList.remove('show');
    modalBackdrop.classList.remove('show');
  });

  modalBackdrop.addEventListener('click', () => {
    modal.classList.remove('show');
    modalBackdrop.classList.remove('show');
  });

  new Swiper('.swiper', {
    loop: true,
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev'
    }
  });
};

window.openModal = openModal;
