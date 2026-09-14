// CloudFront Function (viewer-request) for www.mekra.pl
// 1. Stałe przekierowania 301 dla adresów, które zmieniły slug (REDIRECTS).
// 2. If the URI has no trailing slash AND no file extension, 301 → URI + '/'.
// Keeps query string intact. Skips root '/'.
var REDIRECTS = {
  '/oferta/ramka-7mm/': '/oferta/ramka-12mm/',
  '/realizacje/ramka-7mm/': '/realizacje/ramka-12mm/'
};

function buildQs(querystring) {
  return querystring && Object.keys(querystring).length
    ? '?' + Object.keys(querystring)
        .map(function (k) {
          var v = querystring[k];
          return v.value === '' ? k : k + '=' + v.value;
        })
        .join('&')
    : '';
}

function redirect(location) {
  return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: {
      'location': { value: location },
      'cache-control': { value: 'public, max-age=3600' }
    }
  };
}

function handler(event) {
  var request = event.request;
  var uri = request.uri;

  var key = uri.endsWith('/') ? uri : uri + '/';
  if (REDIRECTS[key]) {
    return redirect(REDIRECTS[key] + buildQs(request.querystring));
  }

  if (uri !== '/' && !uri.endsWith('/') && uri.lastIndexOf('.') < uri.lastIndexOf('/')) {
    return redirect(uri + '/' + buildQs(request.querystring));
  }

  return request;
}
