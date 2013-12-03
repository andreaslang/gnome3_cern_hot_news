const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const MessageTray = imports.ui.messageTray;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Lang = imports.lang;

const Extension = imports.misc.extensionUtils.getCurrentExtension();

const RssLocal = Extension.imports.rssLocal;
const RssItemStore = RssLocal.RssItemStore;

const RssRemote = Extension.imports.rssRemote;
const RssLoader = RssRemote.RssLoader;
const RssConverter = RssRemote.RssConverter;

function init() {
  return new CernHotNewsExtension();
}

const CernHotNewsExtension = new Lang.Class({
  Name: 'CernHotNewsExtension',

  FEED_URL: 'http://cernalerts.web.cern.ch/cernalerts/?feed=cern%20hot%20news',
  STORE_LOCATION: '.cern_hot_news',
  REFRESH_TIME: 900,
  MAX_NEW_ITEMS: 3,

  _init: function() {
    let theme = Gtk.IconTheme.get_default();
    theme.append_search_path(Extension.path + '/icons');
    this._newsStore = new RssItemStore(this.STORE_LOCATION);
    this._newsLoader = new RssLoader(this.FEED_URL);
    this._newsLoader.onSuccess = Lang.bind(this, function(newsXML) {
      var news = new RssConverter(newsXML).extractRSSItems();
      this._onNewsLoaded(news)
    });
  },

  enable: function() {
    this._loadNews();
  },

  disable: function() {
    if (this._newsNotificationSource)
      this._newsNotificationSource._remove();
    Mainloop.source_remove(this._timeoutSourceId);
  },

  _loadNews: function() {
    this._newsLoader.load();
    this._scheduleNextLoad();
  },

  _scheduleNextLoad: function () {
    if (this._timeoutSourceId != null)
      Mainloop.source_remove(this._timeoutSourceId);
    this._timeoutSourceId = Mainloop.timeout_add_seconds(this.REFRESH_TIME, Lang.bind(this, this._loadNews));
  },

  _onNewsLoaded: function(loadedNews) {
    if (loadedNews.length > 0)
    {
      var newsNotInStore = this._newsStore.compareAndGetNewsNotInStore(loadedNews);
      this._newsStore.storeNews(loadedNews);
      if (newsNotInStore.length > 0)
      {
        this._createAndAttachNewsNotificationSourceIfRequired();
        for (let index = 0; index < newsNotInStore.length && index < this.MAX_NEW_ITEMS; index++) {
          this._newsNotificationSource.sendNewsNotification(newsNotInStore[index]);
        }
      }
    }
  },

  _createAndAttachNewsNotificationSourceIfRequired: function() {
    if (!this._newsNotificationSource)
    {
      this._newsNotificationSource = new NewsNotificationSource();
      this._newsNotificationSource.onRemove = Lang.bind(this, function() {
        this._newsNotificationSource = null
      });
      Main.messageTray.add(this._newsNotificationSource);
    }
  }

});

const NewsNotificationSource = new Lang.Class({
  Name: 'NewsNotificationSource',
  Extends: MessageTray.Source,

  _init: function() {
    this.parent('CERN Hot News', 'cern-white');
    this.setTransient(true);
    this.onRemove = function() {};
  },

  sendNewsNotification: function(newsItem) {
    var notification = new MessageTray.Notification(
      this,
      newsItem.title,
      newsItem.description + '\n' + newsItem.link,
      {gicon: Gio.icon_new_for_string('c-white')}
    );
    this.notify(notification);
  },

  buildRightClickMenu: function() {
    let item;
    let rightClickMenu = new St.BoxLayout({
      name: 'summary-right-click-menu',
      vertical: true
    });

    item = new PopupMenu.PopupMenuItem(_("Remove"));
    item.connect('activate', Lang.bind(this, this._remove));
    rightClickMenu.add(item.actor);
    return rightClickMenu;
  },

  _remove: function() {
    this.destroy();
    this.emit('done-displaying-content', false);
    this.onRemove();
  }
});
