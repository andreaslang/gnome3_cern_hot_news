const Soup = imports.gi.Soup;
const Lang = imports.lang;

const RSSConverter = new Lang.Class({
  Name: 'RSSConverter',

  _init: function(xml) {
    this._xml = xml;
  },

  extractRSSItems: function() {
    var items = [];
    var rssItems = this._xml.channel.item;
    for (let itemIndex = 0; itemIndex < rssItems.length(); itemIndex++) {
      var rssItem = rssItems[itemIndex];
      items.push(this._createItem(rssItem))
    }
    return items;
  },

  _createItem: function(item) {
    return {
      title: item.title.toString(),
      author: item.author.toString(),
      description: this._cleanDescription(item.description),
      link: item.link.toString(),
      pubDate: item.pubDate.toString(),
      guid: item.guid.toString()
    };
  },

  /**
   * The description string may contain html which we remove/replace.
   */
  _cleanDescription: function(description) {
    var descriptionHTML = description.toString();
    var descriptionHTMLWithoutBrAndPTags = this._replaceBrAndPTagsWithNewline(descriptionHTML);
    var cleanDescription = this._removeHTMLTags(descriptionHTMLWithoutBrAndPTags);
    return  cleanDescription;
  },

  _replaceBrAndPTagsWithNewline: function (html) {
    return html
        .replace(/<br[^>]*>/g, '\n')
        .replace(/<\/p[^>]*>/g, '\n');
  },

  _removeHTMLTags: function (html) {
    return html
        .replace(/<[^>]*>/g, '');
  }
});

const RSSLoader = new Lang.Class({
  Name: 'RSSLoader',

  _init: function(source) {
    this._source = source;
  },

  _initializeHTTPSession: function () {
    this._httpSession = new Soup.SessionAsync();
    Soup.Session.prototype.add_feature.call(this._httpSession, new Soup.ProxyResolverDefault());
    this._request = Soup.Message.new('GET', this._source);
  },

  load: function() {
    this._initializeHTTPSession();
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
  onFailure: function(message) {
    global.log('[CERN Hot News] Request failed with status code: ' + message.status_code);
  },

  _getBodyXML: function() {
    var newsXML = this._request.response_body.data;
    return new XML(this._removeXMLVersion(newsXML));
  },

  _removeXMLVersion: function(_xmlString) {
    return _xmlString.replace(/.*<\?xml[^>]*>/, '');
  }

});
