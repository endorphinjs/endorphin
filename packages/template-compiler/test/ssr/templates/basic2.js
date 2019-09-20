import {renderProps, escape} from "endorphin/ssr";
export default function render(name, props) {
  let out = "";
  out += "<" + name + renderProps(props) + "><h1>Hello world</h1><p title=\"test\">foo " + escape(props.bar) + " baz</p></" + name + ">";
  return out;
}