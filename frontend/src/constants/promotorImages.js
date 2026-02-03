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

export const PROMOTOR_IMAGES = {
    "FLORES JOSE": floresjose,
    "MUSRI DIEGO": musri,
    "SEVILLA FIORELLA":sevilla,
    "TORO FRANCO":toro,
    "ORTIZ PABLO":ortiz,
    "SANCHEZ RONALDO LUCAS PITON":piton,
    "RIOS MAXIMILIANO":rios,
    "MONTES GABRIEL":montes,
    "CAMARGO MOIRA":camargo,
    "BARLOTTA MARTIN":barlotta,
    "VILLEGAS SEBASTIAN":villegas,
    "FLORES JOAQUIN":floresjoaquin,
    "ROJOS YUNES JUAN JOSE":rojos,
    "ANTIPAN JESUS JUAN ANTONIO":antipan,
    "VILCHEZ MARIO":vilchez,
    "JUAN PAULO":juanpa,
    "LLANES JUAN PABLO":llanes,
    "COLOMBO RENZO":colombo,
    "GRILLO GIULIANO":grillo,
    "GRISOLIA FRANCO":grisolia,
};

export function getPromotorImage(nombre) {
  return PROMOTOR_IMAGES[nombre] || "/default-avatar.png";
}

const normalize = (str = "") =>
  str
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");

export function getPromotorImageByUser(user) {
  if (!user?.nombre_promotor) return "/default-avatar.png";

  const key = normalize(user.nombre_promotor);

  return PROMOTOR_IMAGES[key] || "/default-avatar.png";
}