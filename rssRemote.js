const Soup = imports.gi.Soup;
const Lang = imports.lang;

const HTTP_SESSION = new Soup.SessionAsync();
Soup.Session.prototype.add_feature.call(HTTP_SESSION, new Soup.ProxyResolverDefault());

const RssConverter = new Lang.Class({
  Name: 'RssConverter',

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

const RssLoader = new Lang.Class({
  Name: 'RssLoader',

  _init: function(source) {
    this._source = source;
    this._request = Soup.Message.new('GET', this._source);
  },

  load: function() {
    HTTP_SESSION.queue_message(
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
