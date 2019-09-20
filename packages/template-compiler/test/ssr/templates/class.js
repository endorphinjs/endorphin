import {renderProps, attr} from "endorphin/ssr";
export default function render(name, props) {
  const scope = {};
  let out = "";
  out += "<" + name + renderProps(props) + ">";
  scope.__if0 = props.cond2 && props.cond2;
  out += "<e1" + attr("class", (props.enabled ? " foo" : "") + " bar") + "></e1><e2" + attr("class", " foo" + (props.cond ? " bar" : "")) + "></e2><e3" + attr("class", (props.cond2 ? "override" : "test") + " foo") + "></e3><e4" + attr("class", (scope.__if0 ? "override" : "test") + (props.cond1 && props.foo ? " foo" : "") + (props.cond1 ? " bar" : "")) + ">";
  if (props.cond1) {
    out += "<img />";
  }
  if (props.cond2) {
    out += "<br />";
  }
  out += "</e4><e5" + attr("class", "foo" + (" foo " + props.bar) + " bar") + "></e5></" + name + ">";
  return out;
}