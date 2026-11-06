const colors = {
  k: "#161414",
  w: "#ffffff",
  c: "#f6f3ec",
  g: "#c0c0c0",
  d: "#808080",
  r: "#c41e3a",
  y: "#e8c34a",
  b: "#2b4a9c",
  n: "#39d353"
};

const sprites = {
  jack: [
    "kkkkkkkkkkkkk",
    "kgggggggggggk",
    "kgkkkkkkkkkgk",
    "kgkykykykykgk",
    "kgkykykykykgk",
    "kgkkkkkkkkkgk",
    "kgkkkkkkkkkgk",
    "kgkkkkkkkkkgk",
    "kggggkkkggggk",
    "kggggkkkggggk",
    "kgggggggggggk",
    "kkkkkkkkkkkkk"
  ],
  floppy: [
    "kkkkkkkkkkkkkk",
    "kbbbggggggbbbk",
    "kbbbgggdggbbbk",
    "kbbbgggdggbbbk",
    "kbbbggggggbbbk",
    "kbbbbbbbbbbbbk",
    "kbbwwwwwwwwbbk",
    "kbbwddddddwbbk",
    "kbbwwwwwwwwbbk",
    "kbbwddddddwbbk",
    "kbbwwwwwwwwbbk",
    "kkkkkkkkkkkkkk"
  ],
  computer: [
    "kkkkkkkkkkkkkk",
    "kcccccccccccck",
    "kckkkkkkkkkkck",
    "kcknkkkkkkkkck",
    "kckknkkkkkkkck",
    "kcknkknnkkkkck",
    "kckkkkkkkkkkck",
    "kcccccccccccck",
    "kcccccccccrcck",
    "kkkkkkkkkkkkkk",
    "....kcccck....",
    "..kkkkkkkkkk..",
    "..kcccccccck..",
    "..kkkkkkkkkk.."
  ],
  envelope: [
    "kkkkkkkkkkkkkk",
    "kwkwwwwwwwwkwk",
    "kwwkwwwwwwkwwk",
    "kwwwkwwwwkwwwk",
    "kwwwwkwwkwwwwk",
    "kwwwwwkkwwwwwk",
    "kwwwwwwwwwwwwk",
    "kwwwwwwwwwwwwk",
    "kwwwwwwwwwwwwk",
    "kkkkkkkkkkkkkk"
  ]
};

function draw(el) {
  const rows = sprites[el.dataset.sprite];

  // whole screen pixels only, otherwise they come out uneven when the display is scaled
  const dpr = window.devicePixelRatio;
  const px = Math.round(2 * dpr);

  const canvas = document.createElement("canvas");
  canvas.width = rows[0].length * px;
  canvas.height = rows.length * px;
  canvas.style.width = canvas.width / dpr + "px";
  canvas.style.height = canvas.height / dpr + "px";

  const ctx = canvas.getContext("2d");
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (!colors[ch]) return;
      ctx.fillStyle = colors[ch];
      ctx.fillRect(x * px, y * px, px, px);
    });
  });

  el.replaceChildren(canvas);
}

function drawAll() {
  document.querySelectorAll("[data-sprite]").forEach(draw);
}

drawAll();
window.addEventListener("resize", drawAll);
