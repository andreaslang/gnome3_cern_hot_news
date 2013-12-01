const Soup = imports.gi.Soup;

function loadNews(newsCallback) {
  var newsLoader = new NewsLoader();
  newsLoader.onSuccess = function(newsXML) {
    var news = _createNewsObjects(newsXML);
    newsCallback(news)
  };
  newsLoader.load();
}

function _createNewsObjects(newsXML) {
  var news = [];
  var items = newsXML.channel.item;
  for (var itemIndex = 0; itemIndex < items.length(); itemIndex++) {
    var item = items[itemIndex];
    news.push({
      "title": item.title.toString(),
      "author": item.author.toString(),
      "description": item.description.toString()
        .replace(/<br[^>]*>/g, '\n')
        .replace(/<\/p[^>]*>/g, '\n')
        .replace(/<[^>]*>/g, ''),
      "link": item.link.toString(),
      "pubDate": item.pubDate.toString(),
      "guid": item.guid.toString()
    })
  }
  return news;
}

function NewsLoader() {
  const httpSession =  new Soup.SessionAsync();
  const request = Soup.Message.new('GET', 'http://cernalerts.web.cern.ch/cernalerts/?feed=cern%20hot%20news');

  Soup.Session.prototype.add_feature.call(httpSession, new Soup.ProxyResolverDefault());

  this.load = function() {
    var loader = this;
    httpSession.queue_message(
      request,
      function(httpSession, message) { loader._onLoad(httpSession, message) }
    );
  };

  this._onLoad = function(httpSession, message)
  {
    if (message.status_code !== 200)
      this.onFailure(message);
    else
      this.onSuccess(getBodyXML());
  };

  this.onSuccess = function(xml) {};
  this.onFailure = function(message) { print(message); };

  var getBodyXML = function() {
    var weatherXML = request.response_body.data;
    return new XML(removeXMLVersion(weatherXML));
  };

  var removeXMLVersion = function(_xmlString) {
    return _xmlString.replace(/.*<\?xml[^>]*>/, '');
  };

}
