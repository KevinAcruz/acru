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
  pick: [
    "..kkkkkkkk..",
    ".krrrrrrrrk.",
    "krrwwrrrrrrk",
    "krwwrrrrrrrk",
    "krrrrrrrrrrk",
    "krrrrrrrrrrk",
    ".krrrrrrrrk.",
    ".krrrrrrrrk.",
    "..krrrrrrk..",
    "..krrrrrrk..",
    "...krrrrk...",
    "....krrk....",
    ".....kk....."
  ],
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
  cassette: [
    "kkkkkkkkkkkkkkkk",
    "kddddddddddddddk",
    "kdccccccccccccdk",
    "kdcrrrrrrrrrrcdk",
    "kdckkkcccckkkcdk",
    "kdckwkcccckwkcdk",
    "kdckkkcccckkkcdk",
    "kdccccccccccccdk",
    "kddddkkkkkkddddk",
    "kkkkkkkkkkkkkkkk"
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
  ],
  star: [
    "...y...",
    "...y...",
    "..yyy..",
    "yyyyyyy",
    "..yyy..",
    "...y...",
    "...y..."
  ],
  moon: [
    "...cccc.",
    "..ccc...",
    ".ccc....",
    ".cc.....",
    ".cc.....",
    ".cc.....",
    ".ccc....",
    "..ccc...",
    "...cccc."
  ],
  note: [
    ".....cc..",
    ".....ccc.",
    ".....c.cc",
    ".....c..c",
    ".....c...",
    ".....c...",
    "..cccc...",
    ".ccccc...",
    "..ccc...."
  ]
};

function draw(name, size) {
  const rows = sprites[name];
  let pixels = "";

  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (colors[ch]) pixels += `<rect x="${x}" y="${y}" width="1" height="1" fill="${colors[ch]}"/>`;
    });
  });

  const w = rows[0].length;
  const h = rows.length;
  return `<svg viewBox="0 0 ${w} ${h}" width="${w * size}" height="${h * size}" shape-rendering="crispEdges">${pixels}</svg>`;
}

document.querySelectorAll("[data-sprite]").forEach(el => {
  el.innerHTML = draw(el.dataset.sprite, 2);
});

// the stuff floating in the margins
const floaters = [
  ["pick", "left", 6],
  ["moon", "right", 4],
  ["computer", "right", 20],
  ["star", "left", 26],
  ["cassette", "left", 44],
  ["jack", "right", 42],
  ["note", "right", 63],
  ["floppy", "left", 68],
  ["star", "right", 85]
];

const layer = document.createElement("div");
layer.className = "floaters";

floaters.forEach(([name, side, top], i) => {
  const el = document.createElement("span");
  el.className = "floater " + side;
  el.style.top = top + "%";
  el.style.animationDelay = -i + "s";
  el.innerHTML = draw(name, 4);
  layer.appendChild(el);
});

document.body.appendChild(layer);
