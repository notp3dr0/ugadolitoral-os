// PAÓ · "um balão". Durações em tempos de música (1 tempo = 0,6 s a 100 BPM): os cortes caem no tempo.
// mus = seção da trilha que começa no plano (o mix lê isso).
window.ROTEIRO = function (plano) {
  const C = CENAS, b = BATIDA;
  const p = (nome, tempos, cena, sons = [], mus) => plano(nome, tempos * b, cena, { sons, mus });
  p("01 adesivo", 7, C.adesivo, [[0, "amb-noite", 0.7], [1.8, "teclas", 0.5]], "noite");
  p("02 criando", 8, C.criando, [[0, "teclas", 0.5], [2.4, "pao-oh", 0.9], [2.4, "ideia", 0.4], [2.7, "teclas-rapido", 0.5]]);
  p("03 postar", 6, C.postar, [[0, "ui-abre", 0.4], [1.58, "postar", 1.0]]);
  p("04 sala apagada", 8, C.salaApagada, [[0, "amb-sala", 0.6], [1.4, "espiar", 0.5], [3.2, "pao-hnn", 0.8], [3.2, "asas", 0.4]], "sala");
  p("05 tentativa 1", 8, C.tentativa1, [[0, "amb-noite", 0.6], [0, "teclas", 0.5], [2.4, "clique-macio", 0.6], [3.3, "ui-card", 0.5]], "tenta1");
  p("06 tentativa 2", 6, C.tentativa2, [[0, "teclas-rapido", 0.5], [1.5, "clique-macio", 0.6], [2.4, "ui-card", 0.4], [2.7, "pao-suspiro", 0.7]], "tenta2");
  p("07 tentativa 3", 5, C.tentativa3, [[0.6, "clique-macio", 0.5], [1.6, "ui-card", 0.3]], "tenta3");
  p("08 balão cinza", 3, C.balaoCinza, [[0, "amb-sala", 0.4]], "vazio");
  p("09 cansaço", 16, C.cansaco, [[0, "amb-noite", 0.5], [0.4, "pao-suspiro", 0.6], [2.2, "oculos", 0.7], [3.25, "oculos-mesa", 0.8], [3.8, "pao-choro", 0.35], [4.2, "afunda", 0.4]], "silencio");
  p("10 por gostar", 9, C.porGostar, [[2.85, "vira-cel", 0.8], [3.8, "teclas", 0.4], [4.2, "pao-riso", 0.45]], "tema");
  p("11 adesivo acende", 4, C.adesivoAcende, [[0.6, "comentario-acende", 0.9]]);
  p("12 celular vibra", 3, C.celVibra, [[0.2, "vibra", 0.8], [0.75, "vibra", 0.8], [1.25, "vibra", 0.8]]);
  p("13 sala acende", 6, C.salaAcende, [[0.3, "acende", 1.0], [0.9, "rede-acende", 0.9]], "virada");
  p("14 percebe", 4, C.percebe, [[0.3, "pao-surpresa", 0.8], [1.6, "vira-cel", 0.7]]);
  p("15 comentário", 4, C.comentario, [[0.2, "notif", 0.6], [0.9, "likes", 0.6]]);
  p("16 alívio", 5, C.alivio, [[0.6, "pao-riso", 0.6]]);
  p("17 para quem ama", 8, C.frase1, [], "fim");
  p("18 independente", 8, C.frase2, []);
  p("19 assinatura", 7, C.assinatura, [[0.5, "assinatura", 1.0]]);
};
