import {loadFont} from "@remotion/google-fonts/Jost";

// Jost: geométrica livre, a mais próxima da Futura do banner da loja.
// Provisória até a HASAG mandar o nome e a licença da fonte oficial.
const {fontFamily} = loadFont("normal", {weights: ["400", "600", "800"], subsets: ["latin"]});
loadFont("italic", {weights: ["700"], subsets: ["latin"]});

export const FONTE = fontFamily;
