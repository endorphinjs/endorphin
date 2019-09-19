import {attr} from "endorphin/ssr";
export default function render(props) {
  let out = "";
  out += "<main" + attr("a1", props.id) + attr("a2", props.c1 ? "1" : "0") + attr("class", (props.c3 ? 'bam' + props.id : "foo" + (props.c2 ? " foo bar" : "")) + " baz") + "></main>";
  return out;
}