import {renderProps, attr} from "endorphin/ssr";
export default function render(name, props) {
  let out = "";
  out += "<" + name + renderProps(props) + "><main" + attr("a1", props.c3 ? "3" : props.id) + attr("a2", props.c3 ? 3 : props.c2 ? 2 : props.c1 ? "1" : "0") + " a3=\"4\"></main></" + name + ">";
  return out;
}