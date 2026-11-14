// Ordem dos planos = ordem dos quadros 001–090 do roteiro do Pedro.
// plano(quadros, duração em s, cena, { sons: [[t local, nome, volume]], foco: x 0..1 pro 9:16 })
window.ROTEIRO = function (plano) {
  const C = CENAS;
  // 01 · O criador começa
  plano("001-002", 2.8, C.q001, { foco: 0.5, sons: [[0, "amb-noite", 0.6], [0, "teclas", 0.5], [2.1, "ideia", 0.5]] });
  plano("003", 2.3, C.q003, { vert: "ajusta", sons: [[0.15, "digita", 0.6], [0, "ui-abre", 0.4]] });
  plano("004", 0.8, C.q004, { vert: "ajusta", sons: [[0, "apaga", 0.5]] });
  plano("005", 2.1, C.q005, { vert: "ajusta", sons: [[0.1, "digita", 0.6]] });
  plano("006", 2.4, C.q006, { vert: "ajusta", foco: 0.3, sons: [[0.2, "digita", 0.5], [1.95, "enviar", 0.7]] });
  plano("007-008", 1.9, C.q007, { foco: 0.4, sons: [[0, "teclas-rapido", 0.6], [1.6, "subida", 0.6]] });
  // 02 · O universo das redes
  plano("009-010", 2.9, C.q009, { sons: [[0.25, "luz-1", 0.6], [0.75, "luz-2", 0.6], [1.25, "luz-3", 0.7], [1.5, "pop", 0.4], [1.7, "pop", 0.4], [1.9, "pop", 0.4], [2.1, "pop", 0.4]] });
  plano("011-013", 2.5, C.q011, { sons: [[0.1, "pop", 0.35], [0.22, "pop", 0.35], [0.34, "pop", 0.35], [0.46, "pop", 0.35], [0.58, "pop", 0.35], [1.2, "pao-oh", 0.8]] });
  plano("014", 1.1, C.q014, { sons: [[0.15, "pao-uau", 0.9]] });
  plano("015", 2.0, C.q015, { vert: "ajusta", foco: 0.55, sons: [[0.1, "notif", 0.4], [0.5, "notif", 0.4], [0.9, "notif", 0.4], [1.3, "notif", 0.4], [1.7, "notif", 0.4]] });
  // 03 · Ritmo de criação
  plano("016-017", 2.3, C.q016, { sons: [[0, "ponte-piano", 0.8]] });
  // 04 · Algo não responde
  plano("018", 1.5, C.q018, { sons: [[0, "amb-sala", 0.6]] });
  plano("019", 1.0, C.q019, { sons: [] });
  plano("020", 1.4, C.q020, { foco: 0.6, sons: [[0.3, "pao-hm", 0.7]] });
  plano("021", 1.5, C.q021, { sons: [[0.2, "pao-susto", 0.9], [0.5, "asas", 0.5]] });
  plano("022", 1.6, C.q022, { sons: [[0.05, "papel", 0.6]] });
  // 05 · O post teve pouco alcance
  plano("023", 2.0, C.q023, { foco: 0.55, sons: [[0.05, "ui-card", 0.5]] });
  // 06 · Possibilidades guardadas
  plano("024", 1.5, C.q024, { foco: 0.6, sons: [[0, "transicao", 0.6]] });
  if (C.ROTEIRO_B) C.ROTEIRO_B(plano);
  if (C.ROTEIRO_C) C.ROTEIRO_C(plano);
};
