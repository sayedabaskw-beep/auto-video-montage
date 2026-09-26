const scene = document.querySelector('.scene');
const model = document.querySelector('.product-model');

if (scene && model) {
  scene.addEventListener('pointermove', (event) => {
    const rect = scene.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    model.style.transform = `rotateX(${(-y * 22).toFixed(2)}deg) rotateY(${(x * 28).toFixed(2)}deg)`;
  });

  scene.addEventListener('pointerleave', () => {
    model.style.transform = 'rotateX(-18deg) rotateY(0deg)';
  });
}

const cards = document.querySelectorAll('.product-card');

cards.forEach((card) => {
  card.addEventListener('mouseenter', () => {
    cards.forEach((item) => item.classList.remove('active'));
    card.classList.add('active');
  });
});
