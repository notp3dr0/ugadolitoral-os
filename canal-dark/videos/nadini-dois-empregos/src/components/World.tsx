import { AlineChar, Extras, MannequinChar, NadiniChar, RadarRings } from "../world/Characters";
import { Catapult, Coins, Contracts, FlyingBadge, Phones } from "../world/Props";
import { Town } from "../world/Town";

// O cenário persistente: a MESMA maquete (loja, padaria, relógio) e o MESMO elenco do começo ao fim.
// Cada objeto lê seu estado das trilhas (track) no frame GLOBAL, então nada pula de lugar entre cortes.
export const World: React.FC = () => (
  <group>
    <Town />
    <NadiniChar />
    <AlineChar />
    <RadarRings />
    <MannequinChar />
    <Extras />
    <Contracts />
    <Coins />
    <FlyingBadge />
    <Catapult />
    <Phones />
  </group>
);
