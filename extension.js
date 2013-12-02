const St = imports.gi.St;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const PopupMenu = imports.ui.popupMenu;
const Lang = imports.lang;

const Extension = imports.misc.extensionUtils.getCurrentExtension();

const NewsStorageModule = Extension.imports.newsStorageModule;
const NewsStore = NewsStorageModule.NewsStore;

const NewsImportModule = Extension.imports.newsImportModule;
const NewsLoader = NewsImportModule.NewsLoader;
const NewsXMLConverter = NewsImportModule.NewsXMLConverter;

const STORE_LOCATION = '.cern_hot_news';
const MAX_NEW_ITEMS = 5;

let button, newsStore, newsNotificationSource;

function init() {
  let theme = Gtk.IconTheme.get_default();
  theme.append_search_path(Extension.path + "/icons");
  button = new St.Bin({
    style_class: 'panel-button',
    reactive: true,
    can_focus: true,
    x_fill: true,
    y_fill: false,
    track_hover: true
  });
  let icon = new St.Icon({ icon_name: 'c-white', style_class: 'system-status-icon' });
  button.set_child(icon);
  button.connect('button-press-event', _loadNews);
  newsStore = new NewsStore(STORE_LOCATION);
}

function _loadNews() {
  var newsLoader = new NewsLoader();
  newsLoader.onSuccess = function(newsXML) {
    var news = new NewsXMLConverter(newsXML).convertXMLToNewsItems();
    _onNewsLoaded(news)
  };
  newsLoader.load();
}

function _onNewsLoaded(loadedNews) {
  if (loadedNews.length > 0)
  {
    var newsNotInStore = newsStore.compareAndGetNewsNotInStore(loadedNews);
    newsStore.storeNews(loadedNews);
    if (newsNotInStore.length > 0)
    {
      _createAndAttachNewsNotificationSourceIfRequired();
      for (let index = 0; index < newsNotInStore.length && index < MAX_NEW_ITEMS; index++) {
        newsNotificationSource.sendNewsNotification(newsNotInStore[index]);
      }
    }
  }
}

function _createAndAttachNewsNotificationSourceIfRequired() {
  if (!newsNotificationSource)
  {
    newsNotificationSource = new NewsNotificationSource();
    Main.messageTray.add(newsNotificationSource);
  }
}

function enable() {
  Main.panel._rightBox.insert_child_at_index(button, 0);
}

function disable() {
  Main.panel._rightBox.remove_child(button);
  if (newsNotificationSource)
    newsNotificationSource.remove();
}

const NewsNotificationSource = new Lang.Class({
  Name: 'NewsNotificationSource',
  Extends: MessageTray.Source,

  _init: function() {
    this.parent('CERN Hot News', 'cern-white');
    this.setTransient(true);
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
    item.connect('activate', Lang.bind(this, this.remove));
    rightClickMenu.add(item.actor);
    return rightClickMenu;
  },

  remove: function() {
    this.destroy();
    this.emit('done-displaying-content', false);
    newsNotificationSource = null;
  }
});
