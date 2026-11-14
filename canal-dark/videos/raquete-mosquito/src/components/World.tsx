import { Bedroom, JoaoGabriel } from "../world/Bedroom";
import { Hand, Mosquito } from "../world/Characters";
import { Effects } from "../world/Effects";
import { Racket } from "../world/Racket";

// O cenário persistente: o MESMO quarto, a MESMA raquete e o MESMO mosquito do começo ao fim.
// Cada objeto lê seu estado das trilhas (track) no frame GLOBAL, então nada pula de lugar entre cortes.
export const World: React.FC = () => (
  <group>
    <Bedroom />
    <JoaoGabriel />
    <Racket />
    <Hand />
    <Mosquito />
    <Effects />
  </group>
);
