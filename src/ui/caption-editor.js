import { MAX_CAPTIONS, restoreCaptions } from '../captions.js';

export function createCaptionEditor(canvas, list, add, render) {
  let layers = [];
  let bounds = [];
  let drag;
  const positionInputs = [];

  function setPosition(index, x, y) {
    const layer = layers[index];
    layer.x = Math.min(1, Math.max(0, x));
    layer.y = Math.min(1, Math.max(0, y));
    render();
  }

  function rebuild() {
    positionInputs.length = 0;
    const fields = layers.map((layer, index) => {
      const field = document.createElement('div');
      field.className = 'caption-field';
      const label = document.createElement('label');
      label.textContent = ['Горен надпис', 'Долен надпис'][index] ?? 'Надпис ' + (index + 1);
      const input = document.createElement('input');
      input.className = 'form-control';
      input.maxLength = 140;
      input.value = layer.text;
      input.addEventListener('input', () => {
        layer.text = input.value;
        render();
      });
      label.append(input);
      field.append(label);

      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = 'Позиция';
      details.append(summary);
      const controls = [['Хоризонтално', 'x'], ['Вертикално', 'y']].map(([name, axis]) => {
        const label = document.createElement('label');
        label.textContent = name;
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.max = 100;
        slider.className = 'form-range';
        slider.addEventListener('input', () => {
          const box = bounds.find(item => item.index === index);
          const x = layer.x ?? (box ? box.x / canvas.width : .5);
          const y = layer.y ?? (box ? box.y / canvas.height : .5);
          setPosition(index, axis === 'x' ? slider.valueAsNumber / 100 : x,
            axis === 'y' ? slider.valueAsNumber / 100 : y);
        });
        label.append(slider);
        details.append(label);
        return slider;
      });
      positionInputs.push(controls);
      field.append(details);

      if (index >= 2) {
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'quiet';
        remove.textContent = 'Премахни';
        remove.setAttribute('aria-label', 'Премахни надпис ' + (index + 1));
        remove.addEventListener('click', () => {
          drag = null;
          layers.splice(index, 1);
          rebuild();
          render();
          add.focus();
        });
        field.append(remove);
      }
      return field;
    });
    list.replaceChildren(...fields);
    add.disabled = layers.length >= MAX_CAPTIONS;
  }

  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * canvas.width / rect.width,
      y: (event.clientY - rect.top) * canvas.height / rect.height };
  }

  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    const { x, y } = point(event);
    const box = bounds.findLast(item => Math.abs(x - item.x) <= item.halfWidth + 5 &&
      Math.abs(y - item.y) <= item.halfHeight + 5);
    if (!box) return;
    drag = { id: event.pointerId, index: box.index, dx: x - box.x, dy: y - box.y };
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('dragging');
  });
  canvas.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const { x, y } = point(event);
    setPosition(drag.index, (x - drag.dx) / canvas.width, (y - drag.dy) / canvas.height);
  });
  canvas.addEventListener('lostpointercapture', () => {
    drag = null;
    canvas.classList.remove('dragging');
  });
  add.addEventListener('click', () => {
    if (layers.length >= MAX_CAPTIONS) return;
    layers.push({ text: '', x: null, y: null });
    rebuild();
    render();
    list.lastElementChild.querySelector('input').focus();
  });

  return {
    get layers() { return layers; },
    load(layout) {
      layers = restoreCaptions(layout).layers;
      rebuild();
    },
    updateBounds(next) {
      bounds = next;
      const byIndex = new Map(bounds.map(box => [box.index, box]));
      positionInputs.forEach(([horizontal, vertical], index) => {
        const box = byIndex.get(index);
        const layer = layers[index];
        horizontal.value = Math.round(100 * (layer.x ?? (box ? box.x / canvas.width : .5)));
        vertical.value = Math.round(100 * (layer.y ?? (box ? box.y / canvas.height : .5)));
      });
    },
  };
}
