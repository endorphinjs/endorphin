import {renderProps} from "endorphin/ssr";
export default function render(name, props) {
  let out = "";
  out += "<" + name + renderProps(props) + "><h1>Hello world</h1>";
  if (props.expr1) {
    out += "<p><strong>top 1</strong></p>";
    if (props.expr2) {
      out += "<div>top 2</div>";
    }
    if (props.expr3) {
      out += "<div>top 3</div>top 3.1";
    }
  }
  out += "<blockquote><p>Lorem ipsum 1</p>";
  if (props.expr1 === 1) {
    out += "<div>sub 1</div>";
  } else if (props.expr1 === 2) {
    out += "<div>sub 2</div>";
  } else {
    out += "<div>sub 3</div>";
  }
  out += "<p>Lorem ipsum 2</p></blockquote></" + name + ">";
  return out;
}