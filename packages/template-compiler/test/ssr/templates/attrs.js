import {renderProps, attr} from "endorphin/ssr";
export default function render(name, props) {
  let out = "";
  out += "<" + name + renderProps(props) + "><e1 foo=\"bar1\" enabled=\"\"></e1><e2 foo=\"bar2\">";
  if (props.cond) {
    out += "aaa";
  }
  out += "</e2><e3" + attr("foo", props.bar3) + "></e3><e4" + attr("foo", props.bar4) + ">";
  if (props.cond) {
    out += "aaa";
  }
  out += "</e4><e5" + attr("foo", props.cond ? props.baz : props.bar4) + "></e5><e6" + attr("foo", props.cond ? props.baz : props.bar4) + ">";
  if (props.cond) {
    out += "<br />";
  }
  out += "</e6><e7" + attr("foo", props.cond ? props.baz : "a " + props.bar4 + " b") + "></e7><e8" + attr("foo", props.cond ? props.baz : null) + "></e8></" + name + ">";
  return out;
}