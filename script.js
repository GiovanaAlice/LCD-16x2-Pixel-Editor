/* Editor LCD 16x2 - script.js */
const lcdDiv = document.getElementById("lcd");
const codigoDiv = document.getElementById("codigo");
const copyBtn = document.getElementById("copyBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const exportBtn = document.getElementById("exportBtn");

const ROWS = 8, COLS = 5;
const CHARS = 16 * 2; // 32 células (16x2)
const matriz = [];

// estado para pintar arrastando
let isMouseDown = false;
let paintValue = 1; // valor que será pintado ao arrastar (1 = ligar, 0 = apagar)

document.addEventListener("mouseup", () => isMouseDown = false);
document.addEventListener("mouseleave", () => isMouseDown = false);

// cria os caracteres e pixels
for (let ch = 0; ch < CHARS; ch++) {
  matriz[ch] = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  const charDiv = document.createElement("div");
  charDiv.className = "char";
  charDiv.dataset.index = ch;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const pixel = document.createElement("div");
      pixel.className = "pixel";
      pixel.dataset.ch = ch;
      pixel.dataset.r = r;
      pixel.dataset.c = c;

      // mousedown: define paintValue baseado no estado atual (toggle) e aplica
      pixel.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const chI = Number(pixel.dataset.ch);
        const rI = Number(pixel.dataset.r);
        const cI = Number(pixel.dataset.c);
        const current = matriz[chI][rI][cI];
        paintValue = current ? 0 : 1;
        setPixel(chI, rI, cI, paintValue);
        isMouseDown = true;
      });

      // mouseover: se estiver com mouse pressionado, pinta
      pixel.addEventListener("mouseover", (e) => {
        if (!isMouseDown) return;
        const chI = Number(pixel.dataset.ch);
        const rI = Number(pixel.dataset.r);
        const cI = Number(pixel.dataset.c);
        setPixel(chI, rI, cI, paintValue);
      });

      // desabilita o menu de contexto (botão direito)
      pixel.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const chI = Number(pixel.dataset.ch);
        const rI = Number(pixel.dataset.r);
        const cI = Number(pixel.dataset.c);
        setPixel(chI, rI, cI, 0);
      });

      charDiv.appendChild(pixel);
    }
  }
  lcdDiv.appendChild(charDiv);
}

// funçao para setar pixel (atualiza matriz + DOM)
function setPixel(ch, r, c, val) {
  matriz[ch][r][c] = val ? 1 : 0;
  const selector = `.pixel[data-ch="${ch}"][data-r="${r}"][data-c="${c}"]`;
  const pixel = document.querySelector(selector);
  if (pixel) {
    pixel.classList.toggle("on", !!val);
  }
  gerarCodigo();
}

// gera o código (apenas para caracteres que tiverem pixels diferentes de zero)
function gerarCodigo() {
  let codigo = "";
  for (let ch = 0; ch < CHARS; ch++) {
    const any = matriz[ch].some(row => row.some(bit => bit));
    if (!any) continue; // pula caracteres vazios
    codigo += `byte char${ch}[8] = {\n`;
    for (let r = 0; r < ROWS; r++) {
      const bin = matriz[ch][r].join("").padStart(COLS, "0"); // 5 bits
      codigo += `  B${bin}, // ${parseInt(bin, 2)}\n`;
    }
    codigo += "};\n\n";
  }
  if (!codigo) codigo = "// Nenhum caractere desenhado ainda.\n";
  codigoDiv.textContent = codigo;
}

// copiar código
copyBtn.addEventListener("click", () => {
  const texto = codigoDiv.textContent;
  navigator.clipboard.writeText(texto).then(() => {
    alert("Código copiado");
  }).catch(() => {
    alert("Ops — não foi possível copiar automaticamente. Selecione o texto e pressione Ctrl+C.");
  });
});

// limpar tudo
clearAllBtn.addEventListener("click", () => {
  if (!confirm("Limpar todos os caracteres?")) return;
  for (let ch = 0; ch < CHARS; ch++) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        matriz[ch][r][c] = 0;
        const selector = `.pixel[data-ch="${ch}"][data-r="${r}"][data-c="${c}"]`;
        const pixel = document.querySelector(selector);
        if (pixel) pixel.classList.remove("on");
      }
    }
  }
  gerarCodigo();
});

// exportar .txt
exportBtn.addEventListener("click", () => {
  const text = codigoDiv.textContent;
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "lcd_chars.txt";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});
