export default function render(props) {
  let out = "";
  out += "<h1>Hello world</h1><p title=\"test\">foo " + props.bar + " baz</p>";
  return out;
}