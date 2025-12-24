import floresjose from "../assets/floresjose.png";
import sevilla from "../assets/sevilla.png";
import musri from "../assets/musri.png";
import toro from "../assets/toro.png";
import luna from "../assets/luna.png";
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


export const PROMOTOR_IMAGES = {
    "FLORES JOSE": floresjose,
    "MUSRI DIEGO": musri,
    "LUNA GONZALO": luna,
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
    "ANTIPAN JESUS ANTONIO":antipan,
    "VILCHEZ MARIO":vilchez,
};

export function getPromotorImage(nombre) {
  return PROMOTOR_IMAGES[nombre] || "/default-avatar.png";
}