const Soup = imports.gi.Soup;
const Lang = imports.lang;

const NewsXMLConverter = new Lang.Class({
  Name: 'NewsXMLConverter',

  _init: function(xml) {
    this._xml = xml;
  },

  convertToNewsArray: function() {
    var news = [];
    var newsItems = this._xml.channel.item;
    for (var itemIndex = 0; itemIndex < newsItems.length(); itemIndex++) {
      var newsItem = newsItems[itemIndex];
      news.push(this._createNewsItem(newsItem))
    }
    return news;
  },

  _createNewsItem: function(newsItem) {
    return {
      title: newsItem.title.toString(),
      author: newsItem.author.toString(),
      description: this._cleanDescription(newsItem.description),
      link: newsItem.link.toString(),
      pubDate: newsItem.pubDate.toString(),
      guid: newsItem.guid.toString()
    };
  },

  /**
   * Gets a clean description. This means html is removed by replacing br and p-end tags with line breaks.
   * All other tags are just removed.
   */
  _cleanDescription: function(description) {
    return description.toString()
        .replace(/<br[^>]*>/g, '\n')
        .replace(/<\/p[^>]*>/g, '\n')
        .replace(/<[^>]*>/g, '');
  }
});

const NewsLoader = new Lang.Class({
  Name: 'NewsLoader',

  _init: function() {
    this._httpSession = new Soup.SessionAsync();
    Soup.Session.prototype.add_feature.call(this._httpSession, new Soup.ProxyResolverDefault());
    this._request = Soup.Message.new('GET', 'http://cernalerts.web.cern.ch/cernalerts/?feed=cern%20hot%20news');
  },

  load: function() {
    this._httpSession.queue_message(
        this._request,
        Lang.bind(this, this._onLoad)
    );
  },

  _onLoad: function(httpSession, message)
  {
    if (message.status_code !== 200)
      this.onFailure(message);
    else
      this.onSuccess(this._getBodyXML());
  },

  onSuccess: function(xml) {},
  onFailure: function(message) { print(message); },

  _getBodyXML: function() {
    var weatherXML = this._request.response_body.data;
    return new XML(this._removeXMLVersion(weatherXML));
  },

  _removeXMLVersion: function(_xmlString) {
    return _xmlString.replace(/.*<\?xml[^>]*>/, '');
  }

});
