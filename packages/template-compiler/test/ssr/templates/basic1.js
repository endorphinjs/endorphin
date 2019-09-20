import {renderProps} from "endorphin/ssr";
export default function render(name, props) {
  let out = "";
  out += "<" + name + renderProps(props) + "><h1>Hello world</h1></" + name + ">";
  return out;
}