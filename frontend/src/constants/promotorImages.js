import floresjose from "../assets/floresjose.png";
import sevilla from "../assets/sevilla.png";
import musri from "../assets/musri.png";
import toro from "../assets/toro.png";
import piton from "../assets/piton.png";
import rios from "../assets/rios.png";
import ortiz from "../assets/ortiz.png";
import montes from "../assets/montes.png";
import barlotta from "../assets/barlotta.png";
import camargo from "../assets/camargo.png";
import villegas from "../assets/villegas.png";
import floresjoaquin from "../assets/floresjoaquin.png";
import rojos from "../assets/rojos.png";
import antipan from "../assets/antipan.png";
import vilchez from "../assets/vilchez.png"
import juanpa from "../assets/paulo.png";
import llanes from "../assets/llanes.png";
import colombo from "../assets/colombo.png";
import grillo from "../assets/grillo.png";
import grisolia from "../assets/grisolia.png";
import morales from "../assets/morales.png";

export const PROMOTOR_IMAGES = {
  "FLORES JOSE": { image: floresjose, number: 1 },
  "MUSRI DIEGO": { image: musri, number: 5 },
  "SEVILLA FIORELLA": { image: sevilla, number: 4 },
  "TORO FRANCO": { image: toro, number: 11 },
  "ORTIZ PABLO": { image: ortiz, number: 23 },
  "SANCHEZ RONALDO LUCAS PITON": { image: paulo, number: 12 },
  "RIOS MAXIMILIANO": { image: rios, number: 6 },
  "MONTES GABRIEL": { image: montes, number: 10 },
  "CAMARGO MOIRA": { image: camargo, number: 25 },
  "BARLOTTA MARTIN": { image: barlotta, number: 3 },
  "FLORES JOAQUIN": { image: floresjoaquin, number: 26 },
  "VILLEGAS ALEJANDRO SEBASTIAN": { image: villegas, number: 2 },
  "ROJOS YUNES JUAN JOSE": { image: rojos, number: 6392 },
  "ANTIPAN JESUS JUAN ANTONIO": { image: antipan, number: 9 },
  "VILCHEZ MARIO": { image: vilchez, number: 7 },
  "JUAN PAULO": { image: juanpa, number: 19 },
  "LLANES JUAN PABLO": { image: llanes, number: "JEFE DE VENTAS" },
  "COLOMBO RENZO": { image: colombo, number: "LIDER NABS" },
  "GRILLO GIULIANO": { image: grillo, number: "SUPERVISOR" },
  "MORALES MAURICIO": { image: morales, number: "SUPERVISOR" },
  "GRISOLIA FRANCO": { image: grisolia, number: "SUPERVISOR DEMAND" },
};

export function getPromotorImage(nombre) {
  return PROMOTOR_IMAGES[nombre]?.image || "/default-avatar.png";
}

const normalize = (str = "") =>
  str
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");

export function getPromotorImageByUser(user) {
  if (!user?.nombre_promotor) return "/default-avatar.png";

  const key = normalize(user.nombre_promotor);

  return PROMOTOR_IMAGES[key]?.image || "/default-avatar.png";
}

export function getPromotorLabelByUser(user) {
  if (!user?.nombre_promotor) return "Promotor";

  const key = normalize(user.nombre_promotor);
  const number = PROMOTOR_IMAGES[key]?.number;
  const role = user?.role;

  if (typeof number === "string" && number.trim() !== "") {
    return number;
  }

  if (role && role !== "promotor") {
    return role;
  }

  if (!number) return "Promotor";

  return `Promotor ${number}`;
}