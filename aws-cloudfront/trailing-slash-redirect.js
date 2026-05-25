// CloudFront Function (viewer-request) for www.mekra.pl
// If the URI has no trailing slash AND no file extension, 301 → URI + '/'.
// Keeps query string intact. Skips root '/'.
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri !== '/' && !uri.endsWith('/') && uri.lastIndexOf('.') < uri.lastIndexOf('/')) {
    var qs = request.querystring && Object.keys(request.querystring).length
      ? '?' + Object.keys(request.querystring)
          .map(function (k) {
            var v = request.querystring[k];
            return v.value === '' ? k : k + '=' + v.value;
          })
          .join('&')
      : '';
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: {
        'location': { value: uri + '/' + qs },
        'cache-control': { value: 'public, max-age=3600' }
      }
    };
  }

  return request;
}
