// Correct one malformed source link only in rendered output. Historical source
// HTML remains unchanged. The exported href lacks its HTTPS scheme.
export function rewriteEditorialLinks(html) {
  return html.replaceAll('href="beardigital.io"', 'href="https://beardigital.io"');
}
