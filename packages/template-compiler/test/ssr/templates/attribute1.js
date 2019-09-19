import {attr} from "endorphin/ssr";
export default function render(props) {
  let out = "";
  out += "<main" + attr("a1", props.c3 ? "3" : props.id) + attr("a2", props.c3 ? 3 : props.c2 ? 2 : props.c1 ? "1" : "0") + " a3=\"4\"></main>";
  return out;
}