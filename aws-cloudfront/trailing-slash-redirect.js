// CloudFront Function (viewer-request) for www.mekra.pl
// 1. Stałe przekierowania 301 dla adresów, które zmieniły slug (REDIRECTS).
// 2. If the URI has no trailing slash AND no file extension, 301 → URI + '/'.
// Keeps query string intact. Skips root '/'.
// 3. Kreator /zamowienie/ jest jeszcze niepubliczny — chroni go HTTP Basic Auth.
//    Repo jest publiczne, więc w kodzie zostaje placeholder; prawdziwe
//    login:hasło (SSM /mekra/ZAMOWIENIE_BASIC_AUTH) wstawia publish.sh.
var REDIRECTS = {
  '/oferta/ramka-7mm/': '/oferta/ramka-12mm/',
  '/realizacje/ramka-7mm/': '/realizacje/ramka-12mm/'
};

var PROTECTED_PREFIX = '/zamowienie';
var BASIC_AUTH = 'Basic __ZAMOWIENIE_BASIC_AUTH__';

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

function unauthorized() {
  return {
    statusCode: 401,
    statusDescription: 'Unauthorized',
    headers: {
      'www-authenticate': { value: 'Basic realm="Mekra", charset="UTF-8"' },
      'cache-control': { value: 'no-store' },
      'x-robots-tag': { value: 'noindex' }
    }
  };
}

function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri === PROTECTED_PREFIX || uri.indexOf(PROTECTED_PREFIX + '/') === 0) {
    var auth = request.headers.authorization;
    if (!auth || auth.value !== BASIC_AUTH) {
      return unauthorized();
    }
  }

  var key = uri.endsWith('/') ? uri : uri + '/';
  if (REDIRECTS[key]) {
    return redirect(REDIRECTS[key] + buildQs(request.querystring));
  }

  if (uri !== '/' && !uri.endsWith('/') && uri.lastIndexOf('.') < uri.lastIndexOf('/')) {
    return redirect(uri + '/' + buildQs(request.querystring));
  }

  return request;
}
