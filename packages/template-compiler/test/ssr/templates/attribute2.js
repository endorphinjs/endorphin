import {renderProps, attr} from "endorphin/ssr";
export default function render(name, props) {
  let out = "";
  out += "<" + name + renderProps(props) + "><main" + attr("a1", props.id) + attr("a2", props.c1 ? "1" : "0") + attr("class", (props.c3 ? 'bam' + props.id : "foo" + (props.c2 ? " foo bar" : "")) + " baz") + "></main></" + name + ">";
  return out;
}